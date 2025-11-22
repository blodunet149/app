import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

// Import Midtrans client
import midtransClient from 'midtrans-client';

const app = new Hono();

// Initialize Midtrans client with sandbox configuration
let midtrans;

// Initialize Midtrans with environment variables
function initializeMidtrans(c) {
  const serverKey = c.env.MIDTRANS_SERVER_KEY;
  const clientKey = c.env.MIDTRANS_CLIENT_KEY;
  const nodeEnv = c.env.NODE_ENV || 'development';

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured in environment variables');
  }

  // Determine if production based on environment variable
  const isProduction = nodeEnv === 'production';

  midtrans = new midtransClient.Snap({
    isProduction: isProduction, // Use production mode if NODE_ENV is 'production'
    serverKey: serverKey,
    clientKey: clientKey,
  });

  return midtrans;
}

// Create a payment transaction
app.post('/create-transaction', authMiddleware, zValidator(
  'json',
  z.object({
    orderId: z.number(),
    amount: z.number().positive(),
    customerDetails: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }).optional(),
  })
), async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { orderId, amount, customerDetails } = c.req.valid('json');

  // Get user info from context set by auth middleware
  const userId = c.get('userId');

  try {
    // Verify that the order belongs to the user
    const orderResult = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      totalPrice: schema.orders.totalPrice,
      status: schema.orders.status,
    })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (orderResult.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const order = orderResult[0];
    
    // Verify that the order belongs to the current user
    if (order.userId !== userId) {
      return c.json({ error: 'Unauthorized: Order does not belong to user' }, 403);
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return c.json({ error: 'Order is already paid' }, 400);
    }

    // Initialize Midtrans client
    const snap = initializeMidtrans(c);

    // Prepare transaction details
    const transactionDetails = {
      transaction_details: {
        order_id: `order-${orderId}-${Date.now()}`, // Unique order ID
        gross_amount: amount,
      },
      customer_details: customerDetails || {
        first_name: 'Customer',
        email: 'customer@example.com',
        phone: '+6281234567890',
      },
      item_details: [
        {
          id: `item-${order.id}`,
          price: amount,
          quantity: 1,
          name: `Catering Order #${orderId}`,
        },
      ],
    };

    // Create transaction
    const transaction = await snap.createTransaction(transactionDetails);

    // Update order with payment information
    // Use transaction_id if available, otherwise use the token as ID
    await db.update(schema.orders)
      .set({
        paymentId: transaction.transaction_id || transaction.token,
        paymentToken: transaction.token,
        paymentUrl: transaction.redirect_url,
        paymentStatus: 'pending',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.orders.id, orderId));

    return c.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      transactionId: transaction.transaction_id || transaction.token
    });
  } catch (error) {
    console.error('Midtrans transaction error:', error);
    return c.json({ error: 'Failed to create payment transaction' }, 500);
  }
});

// Get payment status for an order
app.get('/status/:orderId', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const orderId = parseInt(c.req.param('orderId'));

  // Get user info from context set by auth middleware
  const userId = c.get('userId');

  try {
    // Verify that the order belongs to the user
    const orderResult = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      paymentId: schema.orders.paymentId,
      paymentStatus: schema.orders.paymentStatus,
    })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (orderResult.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const order = orderResult[0];
    
    // Verify that the order belongs to the current user
    if (order.userId !== userId) {
      return c.json({ error: 'Unauthorized: Order does not belong to user' }, 403);
    }

    // If there's no payment ID, return unpaid status
    if (!order.paymentId) {
      return c.json({ 
        orderId: order.id,
        paymentStatus: 'unpaid',
        transactionId: null
      });
    }

    // Initialize Midtrans client to check status
    const snap = initializeMidtrans(c);

    try {
      // Get transaction status from Midtrans
      const status = await snap.transaction.status(order.paymentId);
      
      // Update local order status based on Midtrans status
      let localPaymentStatus = 'unpaid';
      if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
        localPaymentStatus = 'paid';
      } else if (status.transaction_status === 'pending') {
        localPaymentStatus = 'pending';
      } else if (status.transaction_status === 'cancel' || status.transaction_status === 'expire') {
        localPaymentStatus = 'cancelled';
      } else if (status.transaction_status === 'refund' || status.transaction_status === 'partial_refund') {
        localPaymentStatus = status.transaction_status;
      }

      // Update the local order with the latest payment status
      await db.update(schema.orders)
        .set({
          paymentStatus: localPaymentStatus as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));

      return c.json({
        orderId: order.id,
        paymentStatus: localPaymentStatus,
        transactionId: order.paymentId,
        midtransStatus: status.transaction_status,
        fraudStatus: status.fraud_status,
      });
    } catch (error) {
      console.error('Midtrans status check error:', error);
      // If Midtrans API fails, return local status
      return c.json({
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        transactionId: order.paymentId,
      });
    }
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({ error: 'Failed to get payment status' }, 500);
  }
});

// Handle Midtrans payment notification (webhook)
app.post('/notification', async (c) => {
  try {
    // The request body from Midtrans webhook contains the transaction details
    const requestBody = await c.req.json();

    // Extract data directly from the webhook payload
    // Midtrans sends the order_id directly in the webhook payload
    const orderIdString = requestBody.order_id;

    if (!orderIdString) {
      console.error('Order ID not found in webhook payload:', requestBody);
      return c.json({ status: 'error', message: 'Order ID not found in payload' }, 400);
    }

    // Extract order ID using the format: "order-{orderId}-{timestamp}"
    const orderIdMatch = orderIdString.match(/^order-(\d+)-/);

    if (!orderIdMatch) {
      console.error('Invalid order ID format:', orderIdString);
      return c.json({ status: 'error', message: 'Invalid order ID format' }, 400);
    }

    const orderId = parseInt(orderIdMatch[1]);

    if (isNaN(orderId)) {
      console.error('Invalid order ID:', orderIdString);
      return c.json({ status: 'error', message: 'Invalid order ID' }, 400);
    }

    // Get the transaction status from the payload
    const transactionStatus = requestBody.transaction_status;

    const db = drizzle(c.env.DB, { schema });

    // Update order status based on Midtrans response
    let paymentStatus = 'unpaid';
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      paymentStatus = 'paid';

      // If payment is successful, update order status from 'pending' to 'confirmed'
      await db.update(schema.orders)
        .set({
          paymentStatus: paymentStatus as any,
          status: 'confirmed', // Update order status to confirmed when payment is successful
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
      await db.update(schema.orders)
        .set({
          paymentStatus: paymentStatus as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire' || transactionStatus === 'deny') {
      paymentStatus = 'cancelled';
      await db.update(schema.orders)
        .set({
          paymentStatus: paymentStatus as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
      paymentStatus = transactionStatus;
      await db.update(schema.orders)
        .set({
          paymentStatus: paymentStatus as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));
    }

    console.log(`Order #${orderId} payment status updated to: ${paymentStatus} based on webhook`);

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing Midtrans notification:', error);
    // Return 200 to prevent Midtrans from retrying the webhook request
    // This is important to avoid spam if there's a persistent error
    return c.json({ status: 'error', message: error.message }, 200);
  }
});

// Get payment status for an order
app.get('/status/:orderId', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const orderId = parseInt(c.req.param('orderId'));

  // Get user info from context set by auth middleware
  const userId = c.get('userId');

  try {
    // Verify that the order belongs to the user
    const orderResult = await db.select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      paymentId: schema.orders.paymentId,
      paymentStatus: schema.orders.paymentStatus,
    })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (orderResult.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const order = orderResult[0];

    // Verify that the order belongs to the current user
    if (order.userId !== userId) {
      return c.json({ error: 'Unauthorized: Order does not belong to user' }, 403);
    }

    // If there's no payment ID, return unpaid status
    if (!order.paymentId) {
      return c.json({
        orderId: order.id,
        paymentStatus: 'unpaid',
        transactionId: null
      });
    }

    // Initialize Midtrans client to check status
    const snap = initializeMidtrans(c);

    try {
      // Get transaction status from Midtrans
      const status = await snap.transaction.status(order.paymentId);

      // Update local order status based on Midtrans status
      let localPaymentStatus = 'unpaid';
      if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
        localPaymentStatus = 'paid';
      } else if (status.transaction_status === 'pending') {
        localPaymentStatus = 'pending';
      } else if (status.transaction_status === 'cancel' || status.transaction_status === 'expire') {
        localPaymentStatus = 'cancelled';
      } else if (status.transaction_status === 'refund' || status.transaction_status === 'partial_refund') {
        localPaymentStatus = status.transaction_status;
      }

      // Update the local order with the latest payment status
      await db.update(schema.orders)
        .set({
          paymentStatus: localPaymentStatus as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, orderId));

      return c.json({
        orderId: order.id,
        paymentStatus: localPaymentStatus,
        transactionId: order.paymentId,
        midtransStatus: status.transaction_status,
        fraudStatus: status.fraud_status,
      });
    } catch (error) {
      console.error('Midtrans status check error:', error);
      // If Midtrans API fails, return local status
      return c.json({
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        transactionId: order.paymentId,
      });
    }
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({ error: 'Failed to get payment status' }, 500);
  }
});

// Get Midtrans client configuration (only expose the client key, never the server key)
app.get('/config', async (c) => {
  const clientKey = c.env.MIDTRANS_CLIENT_KEY;

  if (!clientKey) {
    return c.json({ error: 'Midtrans client key is not configured' }, 500);
  }

  return c.json({ clientKey });
});

export default app;