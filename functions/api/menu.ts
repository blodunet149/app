import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

// Get all menu items (available or not) - requires authentication
app.get('/', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  try {
    const menuItems = await db.select().from(schema.menu).all();
    
    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ menuItems });
  } catch (error) {
    return c.json({ error: 'Failed to get menu items' }, 500);
  }
});

// Get only available menu items for ordering - requires authentication
app.get('/available', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  try {
    // Only get items that are currently available for ordering based on available dates
    const menuItems = await db.select().from(schema.menu).where(eq(schema.menu.available, true));
    
    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ menuItems });
  } catch (error) {
    return c.json({ error: 'Failed to get available menu items' }, 500);
  }
});

// Admin: Create menu item
app.post('/', authMiddleware, zValidator(
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

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
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

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ menuItem: newMenuItem[0] });
  } catch (error) {
    return c.json({ error: 'Failed to create menu item' }, 500);
  }
});

// Admin: Update menu item
app.put('/:id', authMiddleware, zValidator(
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

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
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

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ menuItem: updatedMenuItem[0] });
  } catch (error) {
    return c.json({ error: 'Failed to update menu item' }, 500);
  }
});

// Admin: Delete menu item
app.delete('/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = parseInt(c.req.param('id'));

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    const deletedMenuItem = await db.delete(schema.menu)
      .where(eq(schema.menu.id, id))
      .returning();

    if (deletedMenuItem.length === 0) {
      return c.json({ error: 'Menu item not found' }, 404);
    }

    // Allow credentials
    c.header('Access-Control-Allow-Credentials', 'true');
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete menu item' }, 500);
  }
});

export default app;