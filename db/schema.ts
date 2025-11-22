import { sqliteTable, text, integer, real, numeric } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(), // Store as hex string
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sessions table for authentication
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Menu table
export const menu = sqliteTable('menu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  photoUrl: text('photo_url'),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  menuId: integer('menu_id').notNull().references(() => menu.id),
  quantity: integer('quantity').notNull().default(1),
  orderDate: text('order_date').notNull(), // Store as ISO string
  specialInstructions: text('special_instructions'),
  totalPrice: real('total_price').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] })
    .notNull()
    .default('pending'),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'pending', 'paid', 'cancelled', 'refunded', 'partial_refund'] })
    .notNull()
    .default('unpaid'),
  paymentId: text('payment_id'), // Midtrans transaction ID
  paymentToken: text('payment_token'), // Token for client-side payment
  paymentUrl: text('payment_url'), // Payment URL for redirect
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Export all schema for drizzle
export const schema = {
  users,
  sessions,
  menu,
  orders,
};