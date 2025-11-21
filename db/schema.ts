import { sqliteTable, text, integer, real, numeric } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: numeric('salt', { mode: 'array' }).$type<number[]>().notNull(), // Store as array of numbers
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