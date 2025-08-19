-- Migration to update M2 Labs for Foxy.io integration
-- Run this after implementing Foxy to ensure compatibility

-- Rename ecwidOrderId to foxyOrderId for clarity
-- Note: In D1, we can't directly rename columns, so we'll add the new column and migrate data

-- Add new foxy-specific columns to orders table
ALTER TABLE orders ADD COLUMN foxyOrderId TEXT;
ALTER TABLE orders ADD COLUMN foxyTransactionId TEXT;
ALTER TABLE orders ADD COLUMN paymentMethod TEXT;
ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT 'pending';

-- Create index for Foxy order lookups
CREATE INDEX IF NOT EXISTS idx_orders_foxyOrderId ON orders (foxyOrderId);
CREATE INDEX IF NOT EXISTS idx_orders_foxyTransactionId ON orders (foxyTransactionId);

-- Copy existing ecwidOrderId data to foxyOrderId (for migration compatibility)
UPDATE orders SET foxyOrderId = ecwidOrderId WHERE ecwidOrderId IS NOT NULL AND foxyOrderId IS NULL;

-- Add order status for Foxy workflow
-- Update the check constraint to include new statuses
-- Note: SQLite doesn't support modifying constraints, so this is informational
-- The application should handle these new statuses: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'

-- Create Foxy customer mapping table for SSO
CREATE TABLE IF NOT EXISTS foxy_customers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  foxyCustomerId TEXT UNIQUE,
  email TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_foxy_customers_userId ON foxy_customers (userId);
CREATE INDEX IF NOT EXISTS idx_foxy_customers_foxyCustomerId ON foxy_customers (foxyCustomerId);
CREATE INDEX IF NOT EXISTS idx_foxy_customers_email ON foxy_customers (email);

-- Create table for storing Foxy webhook events (for debugging and audit)
CREATE TABLE IF NOT EXISTS foxy_webhook_events (
  id TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  foxyOrderId TEXT,
  payload TEXT NOT NULL, -- JSON payload from Foxy
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processedAt TEXT,
  errorMessage TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foxy_webhook_events_eventType ON foxy_webhook_events (eventType);
CREATE INDEX IF NOT EXISTS idx_foxy_webhook_events_foxyOrderId ON foxy_webhook_events (foxyOrderId);
CREATE INDEX IF NOT EXISTS idx_foxy_webhook_events_processed ON foxy_webhook_events (processed);
CREATE INDEX IF NOT EXISTS idx_foxy_webhook_events_createdAt ON foxy_webhook_events (createdAt);

-- Insert initial configuration data
INSERT OR IGNORE INTO foxy_webhook_events (
  id, 
  eventType, 
  payload, 
  processed, 
  createdAt
) VALUES (
  'migration-marker',
  'migration',
  '{"message": "Foxy migration completed", "version": "003"}',
  TRUE,
  datetime('now')
);
