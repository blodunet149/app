import { Context, Next } from 'hono';
import { decodeBase64Url } from '../utils/jwt-utils';

// JWT utility functions
const createHmacSha256 = async (key: string, message: string): Promise<Uint8Array> => {
  const textEncoder = new TextEncoder();
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
  const textDecoder = new TextDecoder();
  const payloadStr = textDecoder.decode(payloadBytes);
  const payload = JSON.parse(payloadStr);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) {
    return null;
  }

  return payload;
};

// Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
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

    // Add user info to context for use in subsequent handlers
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    c.set('userRole', payload.role);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};