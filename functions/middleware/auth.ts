import { Context, Next } from 'hono';

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

// Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
  // Get cookies from request headers
  const cookie = c.req.header('Cookie');
  if (!cookie) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  // Parse token from cookie
  const token = cookie.match(/access_token=([^;]+)/)?.[1];
  if (!token) {
    return c.json({ error: 'No access token provided' }, 401);
  }

  const JWT_SECRET = c.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return c.json({ error: "JWT_SECRET not set" }, 500);
  }

  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Add user info to context for use in subsequent handlers
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    c.set('userRole', payload.role);

    // Allow credentials for response
    c.header('Access-Control-Allow-Credentials', 'true');

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};