-- Initial database schema for M2 Labs
-- Run this to set up the production database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phone TEXT,
  dateOfBirth TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
  password TEXT NOT NULL,
  isVerified BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ecwidOrderId TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
  total REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  items TEXT NOT NULL, -- JSON array
  shippingAddress TEXT NOT NULL, -- JSON object
  billingAddress TEXT NOT NULL, -- JSON object
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- Warranty claims table
CREATE TABLE IF NOT EXISTS warranty_claims (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  productName TEXT NOT NULL,
  serialNumber TEXT NOT NULL,
  issue TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'review', 'approved', 'rejected', 'resolved', 'under_review', 'completed')) DEFAULT 'submitted',
  submittedAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders (userId);
CREATE INDEX IF NOT EXISTS idx_orders_ecwidOrderId ON orders (ecwidOrderId);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_userId ON warranty_claims (userId);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_orderId ON warranty_claims (orderId);

-- Insert default admin user
INSERT OR IGNORE INTO users (
  id, 
  email, 
  firstName, 
  lastName, 
  role, 
  password, 
  isVerified, 
  createdAt, 
  updatedAt
) VALUES (
  'admin-001',
  'admin@m2labs.com',
  'Admin',
  'User',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  TRUE,
  datetime('now'),
  datetime('now')
);
