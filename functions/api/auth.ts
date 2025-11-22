import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// JWT utility functions for Workers Environment
const encodeBase64 = (uint8Array: Uint8Array): string => {
  const binary = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

const decodeBase64 = (str: string): Uint8Array => {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const encodeBase64Url = (input: string | Uint8Array): string => {
  let base64: string;
  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    base64 = encodeBase64(uint8Array);
  } else {
    base64 = encodeBase64(input);
  }
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const decodeBase64Url = (str: string): Uint8Array => {
  // Add padding if needed
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return decodeBase64(base64);
};

const createHmacSha256 = async (key: string, message: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const msgBuffer = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    msgBuffer
  );
  
  return new Uint8Array(signatureBuffer);
};

const verifyHmacSha256 = async (key: string, message: string, signature: Uint8Array): Promise<boolean> => {
  const validSignature = await createHmacSha256(key, message);
  if (validSignature.length !== signature.length) {
    return false;
  }
  for (let i = 0; i < validSignature.length; i++) {
    if (validSignature[i] !== signature[i]) {
      return false;
    }
  }
  return true;
};

const createJWT = async (payload: any, secret: string, expiresIn: number): Promise<string> => {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const encodedHeader = encodeBase64Url(header);
  
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const fullPayload = { ...payload, exp };
  const payloadStr = JSON.stringify(fullPayload);
  const encodedPayload = encodeBase64Url(payloadStr);
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signatureArray = await createHmacSha256(secret, signatureInput);
  const encodedSignature = encodeBase64Url(signatureArray);
  
  return `${signatureInput}.${encodedSignature}`;
};

const verifyJWT = async (token: string, secret: string): Promise<any | null> => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signatureArray = decodeBase64Url(encodedSignature);
  
  const isValid = await verifyHmacSha256(secret, signatureInput, signatureArray);
  if (!isValid) {
    return null;
  }
  
  const payloadBytes = decodeBase64Url(encodedPayload);
  const decoder = new TextDecoder();
  const payloadStr = decoder.decode(payloadBytes);
  const payload = JSON.parse(payloadStr);
  const now = Math.floor(Date.now() / 1000);
  
  if (payload.exp < now) {
    return null;
  }
  
  return payload;
};

// Register endpoint
app.post('/register', zValidator(
  'json',
  z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['user', 'admin']).default('user'),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { username, email, password, role } = c.req.valid('json');

  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Hash password using PBKDF2-like approach
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create a derived key (simplified version of PBKDF2)
    const combined = new TextEncoder().encode(password + saltHex);
    let hashBuffer = combined;
    
    // Multiple iterations for better security
    for (let i = 0; i < 10000; i++) {
      hashBuffer = await crypto.subtle.digest('SHA-256', hashBuffer);
    }
    
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create user
    const [newUser] = await db.insert(schema.users)
      .values({
        username,
        email,
        passwordHash,
        salt: saltHex,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Get JWT_SECRET from environment
    const JWT_SECRET = c.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return c.json({ error: "JWT_SECRET not set" }, 500);
    }
    
    const accessToken = await createJWT(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      3600 // 1 hour
    );
    
    const refreshToken = await createJWT(
      { userId: newUser.id, type: 'refresh' },
      JWT_SECRET,
      7 * 24 * 3600 // 7 days
    );

    // Set secure cookies
    c.header('Set-Cookie', [
      `access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`,
      `refresh_token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 3600}`
    ]);

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ 
      success: true, 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email, 
        role: newUser.role 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

// Login endpoint
app.post('/login', zValidator(
  'json',
  z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { email, password } = c.req.valid('json');

  try {
    // Find user
    const users = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (users.length === 0) {
      // Sleep to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = users[0];
    
    // Hash the provided password using the same method
    const combined = new TextEncoder().encode(password + user.salt);
    let hashBuffer = combined;
    
    // Multiple iterations to match registration
    for (let i = 0; i < 10000; i++) {
      hashBuffer = await crypto.subtle.digest('SHA-256', hashBuffer);
    }
    
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare the hashed passwords
    if (passwordHash !== user.passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Get JWT_SECRET from environment
    const JWT_SECRET = c.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return c.json({ error: "JWT_SECRET not set" }, 500);
    }
    
    const accessToken = await createJWT(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      3600 // 1 hour
    );
    
    const refreshToken = await createJWT(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      7 * 24 * 3600 // 7 days
    );

    // Set secure cookies
    c.header('Set-Cookie', [
      `access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`,
      `refresh_token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 3600}`
    ]);

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');

    return c.json({ 
      success: true, 
      user: { 
        id: user.id,
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

// Logout endpoint
app.post('/logout', async (c) => {
  // Clear cookies
  c.header('Set-Cookie', [
    'access_token=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0',
    'refresh_token=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
  ]);
  
  // Allow credentials
  c.header('Access-Control-Allow-Credentials', 'true');
  
  return c.json({ success: true });
});

// Get current user endpoint
app.get('/me', async (c) => {
  // Get tokens from cookies
  const cookies = c.req.header('Cookie');
  if (!cookies) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const accessTokenMatch = cookies.match(/access_token=([^;]+)/);
  if (!accessTokenMatch) {
    return c.json({ error: 'No access token provided' }, 401);
  }

  const token = accessTokenMatch[1];
  const JWT_SECRET = c.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return c.json({ error: "JWT_SECRET not set" }, 500);
  }

  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Fetch user info from database
    const db = drizzle(c.env.DB, { schema });
    const [user] = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

// Test endpoint to verify the app is working
app.get('/test', async (c) => {
  return c.json({
    status: 'success',
    message: 'Auth API is working properly',
    timestamp: new Date().toISOString()
  });
});

// Test login endpoint to verify login functionality without actual authentication
app.post('/test-login', zValidator(
  'json',
  z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
), async (c) => {
  const { email, password } = c.req.valid('json');

  // Log the received credentials (only for testing)
  console.log('Test login called with:', { email, password });

  // Return a mock response showing that the endpoint receives data properly
  return c.json({
    status: 'success',
    message: 'Test login endpoint received the request properly',
    received: { email, password: password ? '[HIDDEN]' : '' },
    endpoint: 'This is a test endpoint - real login would happen here'
  });
});

export default app;