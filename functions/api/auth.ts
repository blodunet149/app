import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const app = new Hono();

// JWT utility functions
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

const encodeBase64Url = (str: string): string => {
  return encodeBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const decodeBase64Url = (str: string): string => {
  // Add padding if needed
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return decodeBase64(base64);
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createHmacSha256 = async (key: string, message: string): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textEncoder.encode(message)
  );
  
  return new Uint8Array(signature);
};

const verifyHmacSha256 = async (key: string, message: string, signature: Uint8Array): Promise<boolean> => {
  const validSignature = await createHmacSha256(key, message);
  return validSignature.every((byte, i) => byte === signature[i]);
};

const createJWT = async (payload: any, secret: string, expiresIn: number): Promise<string> => {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const encodedHeader = encodeBase64Url(header);
  
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const fullPayload = { ...payload, exp };
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signatureArray = await createHmacSha256(secret, signatureInput);
  const encodedSignature = encodeBase64Url(Array.from(signatureArray).map(byte => String.fromCharCode(byte)).join(''));
  
  return `${signatureInput}.${encodedSignature}`;
};

const verifyJWT = async (token: string, secret: string): Promise<any | null> => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signatureArray = new Uint8Array(
    Array.from(decodeBase64Url(encodedSignature))
      .map(char => char.charCodeAt(0))
  );
  
  const isValid = await verifyHmacSha256(secret, signatureInput, signatureArray);
  if (!isValid) {
    return null;
  }
  
  const payload = JSON.parse(decodeBase64Url(encodedPayload));
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
    const combined = textEncoder.encode(password + saltHex);
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

    // Create JWT tokens
    const JWT_SECRET = c.env.JWT_SECRET || 'fallback-secret'; // In production, ensure this is set
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
    const combined = textEncoder.encode(password + user.salt);
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

    // Create JWT tokens
    const JWT_SECRET = c.env.JWT_SECRET || 'fallback-secret';
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
  const JWT_SECRET = c.env.JWT_SECRET || 'fallback-secret';

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

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

export default app;