import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getAvailableDates } from '../../utils/date-utils';

const app = new Hono();

// Create a new order
app.post('/', zValidator(
  'json',
  z.object({
    menuId: z.number(),
    quantity: z.number().positive(),
    orderDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
    specialInstructions: z.string().optional(),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { menuId, quantity, orderDate, specialInstructions } = c.req.valid('json');
  
  // Check if user is authenticated
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  // Get user info
  try {
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];
    
    const userResults = await db.select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const user = userResults[0];
    
    // Validate that the user is not an admin trying to order (though admins can order too in this case)
    // Check if order date is in the available dates
    const availableDates = getAvailableDates();
    const isDateAvailable = availableDates.some(date => new Date(date).toDateString() === new Date(orderDate).toDateString());
    
    if (!isDateAvailable) {
      return c.json({ error: 'Selected date is not available for ordering' }, 400);
    }
    
    // Check if menu item exists and is available
    const menuItems = await db.select()
      .from(schema.menu)
      .where(and(
        eq(schema.menu.id, menuId),
        eq(schema.menu.available, true)
      ))
      .limit(1);
    
    if (menuItems.length === 0) {
      return c.json({ error: 'Menu item not found or not available' }, 404);
    }
    
    const menuItem = menuItems[0];
    
    // Calculate total price
    const totalPrice = menuItem.price * quantity;
    
    // Create order
    const newOrder = await db.insert(schema.orders)
      .values({
        userId: user.id,
        menuId,
        quantity,
        orderDate,
        specialInstructions: specialInstructions || '',
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return c.json({ order: newOrder[0] });
  } catch (error) {
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get user's order history
app.get('/history', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  // Check if user is authenticated
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  try {
    const sessionResults = await db.select()
      .from(schema.sessions)
      .where((sessions) => sessions.id === sessionId && sessions.expiresAt > new Date().toISOString())
      .limit(1);

    if (sessionResults.length === 0) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const session = sessionResults[0];
    
    const userResults = await db.select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where((users) => users.id === session.userId)
      .limit(1);

    if (userResults.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const user = userResults[0];
    
    // Get user's orders
    const orders = await db.select({
      id: schema.orders.id,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
      menuName: schema.menu.name,
      menuDescription: schema.menu.description,
      menuPrice: schema.menu.price,
      menuPhotoUrl: schema.menu.photoUrl,
    })
      .from(schema.orders)
      .leftJoin(schema.menu, eq(schema.orders.menuId, schema.menu.id))
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt));
    
    return c.json({ orders });
  } catch (error) {
    return c.json({ error: 'Failed to get order history' }, 500);
  }
});

// Admin: Get all orders
app.get('/all', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  // Check if user is admin
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
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
    
    // Get all orders with user and menu info
    const orders = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
      userName: schema.users.username,
      userEmail: schema.users.email,
      menuName: schema.menu.name,
      menuDescription: schema.menu.description,
      menuPrice: schema.menu.price,
      menuPhotoUrl: schema.menu.photoUrl,
    })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .leftJoin(schema.menu, eq(schema.orders.menuId, schema.menu.id))
      .orderBy(desc(schema.orders.createdAt));
    
    return c.json({ orders });
  } catch (error) {
    return c.json({ error: 'Failed to get all orders' }, 500);
  }
});

// Admin: Update order status
app.put('/:id/status', zValidator(
  'json',
  z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = parseInt(c.req.param('id'));
  
  // Check if user is admin
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
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
    
    const { status } = c.req.valid('json');
    
    const updatedOrder = await db.update(schema.orders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.orders.id, id))
      .returning();
    
    if (updatedOrder.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    return c.json({ order: updatedOrder[0] });
  } catch (error) {
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

export default app;