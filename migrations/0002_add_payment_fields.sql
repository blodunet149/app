-- Migration: Add payment fields to orders table

-- Add payment_status column with default 'unpaid'
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'pending', 'paid', 'cancelled', 'refunded', 'partial_refund'));

-- Add payment_id column
ALTER TABLE orders ADD COLUMN payment_id TEXT;

-- Add payment_token column
ALTER TABLE orders ADD COLUMN payment_token TEXT;

-- Add payment_url column
ALTER TABLE orders ADD COLUMN payment_url TEXT;