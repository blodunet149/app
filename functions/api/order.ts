import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getAvailableDates } from '../../utils/date-utils';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

// Create a new order
app.post('/', authMiddleware, zValidator(
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

  // Get user info from context set by auth middleware
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  try {
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
        userId,
        menuId,
        quantity,
        orderDate,
        specialInstructions: specialInstructions || '',
        totalPrice,
        status: 'pending',
        paymentStatus: 'unpaid', // Default payment status is unpaid
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
app.get('/history', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get user info from context set by auth middleware
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  try {
    // Get user's orders
    const orders = await db.select({
      id: schema.orders.id,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
      paymentId: schema.orders.paymentId,
      paymentToken: schema.orders.paymentToken,
      paymentUrl: schema.orders.paymentUrl,
      createdAt: schema.orders.createdAt,
      menuName: schema.menu.name,
      menuDescription: schema.menu.description,
      menuPrice: schema.menu.price,
      menuPhotoUrl: schema.menu.photoUrl,
    })
      .from(schema.orders)
      .leftJoin(schema.menu, eq(schema.orders.menuId, schema.menu.id))
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));

    return c.json({ orders });
  } catch (error) {
    return c.json({ error: 'Failed to get order history' }, 500);
  }
});

// Admin: Get all orders
app.get('/all', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
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
      paymentStatus: schema.orders.paymentStatus,
      paymentId: schema.orders.paymentId,
      paymentToken: schema.orders.paymentToken,
      paymentUrl: schema.orders.paymentUrl,
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
app.put('/:id/status', authMiddleware, zValidator(
  'json',
  z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
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

  const { status } = c.req.valid('json');

  try {
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

// Admin: Get order summary/reports
app.get('/summary', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    // Get query parameters for filtering
    const { startDate, endDate, paymentStatus } = c.req.query();

    let conditions = [];

    // Add date range filter if provided
    if (startDate) {
      conditions.push(gte(schema.orders.createdAt, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(schema.orders.createdAt, endDate as string));
    }

    // Add payment status filter if provided
    if (paymentStatus) {
      conditions.push(eq(schema.orders.paymentStatus, paymentStatus as string));
    }

    // Get orders with menu and user information
    let query = db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
      paymentId: schema.orders.paymentId,
      paymentToken: schema.orders.paymentToken,
      paymentUrl: schema.orders.paymentUrl,
      createdAt: schema.orders.createdAt,
      updatedAt: schema.orders.updatedAt,
      userName: schema.users.username,
      userEmail: schema.users.email,
      menuName: schema.menu.name,
      menuDescription: schema.menu.description,
      menuPrice: schema.menu.price,
      menuPhotoUrl: schema.menu.photoUrl,
      menuAvailable: schema.menu.available,
    })
    .from(schema.orders)
    .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .leftJoin(schema.menu, eq(schema.orders.menuId, schema.menu.id));

    // Apply filters if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orders = await query.orderBy(desc(schema.orders.createdAt));

    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalPaidOrders = orders.filter(order => order.paymentStatus === 'paid').length;
    const totalUnpaidOrders = orders.filter(order => order.paymentStatus !== 'paid').length;
    const totalRevenue = orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    return c.json({
      summary: {
        totalOrders,
        totalPaidOrders,
        totalUnpaidOrders,
        totalRevenue,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      },
      orders
    });
  } catch (error) {
    return c.json({ error: 'Failed to get order summary' }, 500);
  }
});

// Admin: Get cooking schedule - orders that need to be prepared based on order date
app.get('/for-cooking', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    // Get query parameter for date (default to today)
    const { date } = c.req.query();
    const targetDate = date ? date as string : new Date().toISOString().split('T')[0];

    // Get orders for the specific date that need cooking
    // These are orders that are confirmed/paid but not yet delivered
    const orders = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
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
    .where(and(
      eq(schema.orders.orderDate, targetDate),
      inArray(schema.orders.paymentStatus, ['paid', 'pending']), // Include both paid and pending orders
      inArray(schema.orders.status, ['pending', 'confirmed', 'preparing', 'ready']) // Orders that need attention
    ))
    .orderBy(schema.orders.createdAt); // Order by creation time

    // Group orders by menu for kitchen planning
    const menuBreakdown = orders.reduce((acc, order) => {
      const menuName = order.menuName;
      if (!acc[menuName]) {
        acc[menuName] = {
          menuName: menuName,
          totalQuantity: 0,
          orders: [],
          specialInstructions: []
        };
      }

      acc[menuName].totalQuantity += order.quantity;
      acc[menuName].orders.push({
        id: order.id,
        userId: order.userId,
        userName: order.userName,
        quantity: order.quantity,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt
      });

      if (order.specialInstructions) {
        acc[menuName].specialInstructions.push({
          userName: order.userName,
          instruction: order.specialInstructions
        });
      }

      return acc;
    }, {});

    return c.json({
      date: targetDate,
      totalOrders: orders.length,
      menuBreakdown: Object.values(menuBreakdown),
      orders
    });
  } catch (error) {
    return c.json({ error: 'Failed to get orders for cooking' }, 500);
  }
});

// Admin: Get cooking schedule - only paid orders that need to be prepared
app.get('/for-cooking-paid', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get user role from context set by auth middleware
  const userRole = c.get('userRole');
  const userId = c.get('userId');

  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    // Get query parameter for date (default to today)
    const { date } = c.req.query();
    const targetDate = date ? date as string : new Date().toISOString().split('T')[0];

    // Get only paid orders for the specific date that need cooking
    // These are orders that are confirmed and paid but not yet delivered
    const orders = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      menuId: schema.orders.menuId,
      quantity: schema.orders.quantity,
      orderDate: schema.orders.orderDate,
      specialInstructions: schema.orders.specialInstructions,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
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
    .where(and(
      eq(schema.orders.orderDate, targetDate),
      eq(schema.orders.paymentStatus, 'paid'), // Only paid orders
      inArray(schema.orders.status, ['confirmed', 'preparing', 'ready']) // Orders that need cooking
    ))
    .orderBy(schema.orders.createdAt);

    // Group orders by menu for kitchen planning
    const menuBreakdown = orders.reduce((acc, order) => {
      const menuName = order.menuName;
      if (!acc[menuName]) {
        acc[menuName] = {
          menuName: menuName,
          totalQuantity: 0,
          orders: [],
          specialInstructions: []
        };
      }

      acc[menuName].totalQuantity += order.quantity;
      acc[menuName].orders.push({
        id: order.id,
        userId: order.userId,
        userName: order.userName,
        quantity: order.quantity,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt
      });

      if (order.specialInstructions) {
        acc[menuName].specialInstructions.push({
          userName: order.userName,
          instruction: order.specialInstructions
        });
      }

      return acc;
    }, {});

    return c.json({
      date: targetDate,
      totalOrders: orders.length,
      menuBreakdown: Object.values(menuBreakdown),
      paidOrders: orders
    });
  } catch (error) {
    return c.json({ error: 'Failed to get paid orders for cooking' }, 500);
  }
});

export default app;