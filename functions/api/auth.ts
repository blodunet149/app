import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { hashPassword } from 'hono/utils/crypto';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';

const app = new Hono();

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
      .where((users) => users.email === email)
      .limit(1);
    
    if (existingUser.length > 0) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Hash password
    const salt = await crypto.getRandomValues(new Uint8Array(16));
    const passwordBuffer = new TextEncoder().encode(password + salt);
    const hashedPassword = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashedPasswordArray = Array.from(new Uint8Array(hashedPassword));
    const hashedPasswordHex = hashedPasswordArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create user
    const newUser = await db.insert(schema.users)
      .values({
        username,
        email,
        passwordHash: hashedPassword,
        salt: Array.from(salt),
        role,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return c.json({ success: true, user: { id: newUser[0].id, username, email, role } });
  } catch (error) {
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
      .where((users) => users.email === email)
      .limit(1);

    if (users.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = users[0];
    
    // Verify password
    const salt = new Uint8Array(user.salt);
    const passwordBuffer = new TextEncoder().encode(password + salt);
    const hashedPassword = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashedPasswordArray = Array.from(new Uint8Array(hashedPassword));
    const hashedPasswordHex = hashedPasswordArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashedPasswordHex !== user.passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create session (simplified - in real app you'd use secure sessions)
    const sessionId = crypto.randomUUID();
    
    // Store session in database
    await db.insert(schema.sessions)
      .values({
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    // Set cookie
    c.header('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`); // 7 days

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
    return c.json({ error: 'Failed to login' }, 500);
  }
});

// Logout endpoint
app.post('/logout', async (c) => {
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  
  if (sessionId) {
    const db = drizzle(c.env.DB, { schema });
    
    // Remove session from database
    await db.delete(schema.sessions)
      .where((sessions) => sessions.id === sessionId);
  }

  // Clear cookie
  c.header('Set-Cookie', 'session_id=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  
  return c.json({ success: true });
});

// Get current user endpoint
app.get('/me', async (c) => {
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  
  try {
    // Check if session exists and is not expired
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];

    // Get user info
    const userResults = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: userResults[0] });
  } catch (error) {
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

export default app;