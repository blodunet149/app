import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const app = new Hono();

// Get all menu items (available or not)
app.get('/', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  try {
    const menuItems = await db.select().from(schema.menu).all();
    return c.json({ menuItems });
  } catch (error) {
    return c.json({ error: 'Failed to get menu items' }, 500);
  }
});

// Get only available menu items for ordering
app.get('/available', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  try {
    // Only get items that are currently available for ordering based on available dates
    const menuItems = await db.select().from(schema.menu).where(eq(schema.menu.available, true));
    return c.json({ menuItems });
  } catch (error) {
    return c.json({ error: 'Failed to get available menu items' }, 500);
  }
});

// Admin: Create menu item
app.post('/', zValidator(
  'json',
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    price: z.number().positive(),
    photoUrl: z.string().url().optional(),
    available: z.boolean().default(true),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  // Check if user is admin (simplified - in real app you'd validate session)
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  // Validate admin role
  try {
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];
    
    const userResults = await db.select({ role: schema.users.role })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0 || userResults[0].role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
  } catch (error) {
    return c.json({ error: 'Failed to validate admin access' }, 500);
  }
  
  const { name, description, price, photoUrl, available } = c.req.valid('json');

  try {
    const newMenuItem = await db.insert(schema.menu)
      .values({
        name,
        description: description || '',
        price,
        photoUrl: photoUrl || '',
        available: available ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return c.json({ menuItem: newMenuItem[0] });
  } catch (error) {
    return c.json({ error: 'Failed to create menu item' }, 500);
  }
});

// Admin: Update menu item
app.put('/:id', zValidator(
  'json',
  z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    photoUrl: z.string().url().optional().or(z.literal('')),
    available: z.boolean().optional(),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = parseInt(c.req.param('id'));
  
  // Check if user is admin
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  // Validate admin role
  try {
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];
    
    const userResults = await db.select({ role: schema.users.role })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0 || userResults[0].role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
  } catch (error) {
    return c.json({ error: 'Failed to validate admin access' }, 500);
  }

  const { name, description, price, photoUrl, available } = c.req.valid('json');

  try {
    const updatedMenuItem = await db.update(schema.menu)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(available !== undefined && { available }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.menu.id, id))
      .returning();

    if (updatedMenuItem.length === 0) {
      return c.json({ error: 'Menu item not found' }, 404);
    }

    return c.json({ menuItem: updatedMenuItem[0] });
  } catch (error) {
    return c.json({ error: 'Failed to update menu item' }, 500);
  }
});

// Admin: Delete menu item
app.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = parseInt(c.req.param('id'));
  
  // Check if user is admin
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  // Validate admin role
  try {
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];
    
    const userResults = await db.select({ role: schema.users.role })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0 || userResults[0].role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
  } catch (error) {
    return c.json({ error: 'Failed to validate admin access' }, 500);
  }

  try {
    const deletedMenuItem = await db.delete(schema.menu)
      .where(eq(schema.menu.id, id))
      .returning();

    if (deletedMenuItem.length === 0) {
      return c.json({ error: 'Menu item not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete menu item' }, 500);
  }
});

export default app;