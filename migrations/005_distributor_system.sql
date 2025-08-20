-- Distributor Management System Schema
-- This migration adds tables for distributor management, inventory requests, and order tracking

-- Distributors table
CREATE TABLE IF NOT EXISTS distributors (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  contactName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postalCode TEXT,
  country TEXT DEFAULT 'US',
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  territory TEXT, -- geographical territory assigned
  discountRate REAL DEFAULT 0.0, -- percentage discount (0.0 to 1.0)
  creditLimit REAL DEFAULT 0.0, -- credit limit in dollars
  currentBalance REAL DEFAULT 0.0, -- current outstanding balance
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'exclusive')),
  notes TEXT, -- admin notes about distributor
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt TEXT,
  createdBy TEXT, -- admin user who created the distributor
  isVerified BOOLEAN DEFAULT FALSE
);

-- Distributor inventory requests
CREATE TABLE IF NOT EXISTS distributor_inventory_requests (
  id TEXT PRIMARY KEY,
  distributorId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  requestedQuantity INTEGER NOT NULL,
  approvedQuantity INTEGER DEFAULT 0,
  unitPrice REAL, -- price at which distributor will purchase
  totalAmount REAL, -- approved quantity * unit price
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requestNotes TEXT, -- distributor's notes with the request
  adminNotes TEXT, -- admin response notes
  requestedDate TEXT DEFAULT CURRENT_TIMESTAMP,
  approvedDate TEXT,
  fulfilledDate TEXT,
  approvedBy TEXT, -- admin user who approved
  rejectionReason TEXT,
  FOREIGN KEY (distributorId) REFERENCES distributors(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Distributor orders (separate from regular customer orders)
CREATE TABLE IF NOT EXISTS distributor_orders (
  id TEXT PRIMARY KEY,
  distributorId TEXT NOT NULL,
  orderNumber TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  totalAmount REAL NOT NULL DEFAULT 0,
  discountAmount REAL DEFAULT 0,
  taxAmount REAL DEFAULT 0,
  shippingAmount REAL DEFAULT 0,
  finalAmount REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  paymentStatus TEXT DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  paymentMethod TEXT, -- net30, credit_card, wire_transfer, etc.
  paymentTerms TEXT DEFAULT 'NET30', -- payment terms
  shippingAddress TEXT,
  shippingCity TEXT,
  shippingState TEXT,
  shippingPostalCode TEXT,
  shippingCountry TEXT DEFAULT 'US',
  trackingNumber TEXT,
  estimatedDelivery TEXT,
  actualDelivery TEXT,
  orderNotes TEXT,
  adminNotes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  confirmedAt TEXT,
  shippedAt TEXT,
  deliveredAt TEXT,
  FOREIGN KEY (distributorId) REFERENCES distributors(id)
);

-- Distributor order items
CREATE TABLE IF NOT EXISTS distributor_order_items (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  quantity INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  totalPrice REAL NOT NULL,
  discountAmount REAL DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES distributor_orders(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Distributor communications/inquiries
CREATE TABLE IF NOT EXISTS distributor_inquiries (
  id TEXT PRIMARY KEY,
  distributorId TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'inventory', 'pricing', 'shipping', 'technical', 'billing', 'returns')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_distributor', 'resolved', 'closed')),
  message TEXT NOT NULL,
  distributorResponse TEXT,
  adminResponse TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TEXT,
  resolvedBy TEXT, -- admin user who resolved
  FOREIGN KEY (distributorId) REFERENCES distributors(id)
);

-- Distributor inventory allocations (track what inventory is allocated to each distributor)
CREATE TABLE IF NOT EXISTS distributor_inventory (
  id TEXT PRIMARY KEY,
  distributorId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  allocatedQuantity INTEGER NOT NULL DEFAULT 0,
  reservedQuantity INTEGER DEFAULT 0, -- reserved for pending orders
  availableQuantity INTEGER DEFAULT 0, -- allocated - reserved
  lastRestockDate TEXT,
  minStockLevel INTEGER DEFAULT 0, -- minimum stock level for auto-reorder suggestions
  maxStockLevel INTEGER DEFAULT 0, -- maximum stock level
  averageMonthlySales INTEGER DEFAULT 0, -- for forecasting
  lastSaleDate TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (distributorId) REFERENCES distributors(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  UNIQUE(distributorId, productId, variantId)
);

-- Distributor price overrides (custom pricing for specific distributors)
CREATE TABLE IF NOT EXISTS distributor_pricing (
  id TEXT PRIMARY KEY,
  distributorId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  customPrice REAL NOT NULL,
  effectiveDate TEXT DEFAULT CURRENT_TIMESTAMP,
  expiryDate TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  notes TEXT,
  createdBy TEXT, -- admin who set the pricing
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (distributorId) REFERENCES distributors(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  UNIQUE(distributorId, productId, variantId)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_distributors_email ON distributors(email);
CREATE INDEX IF NOT EXISTS idx_distributors_username ON distributors(username);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status);
CREATE INDEX IF NOT EXISTS idx_distributor_requests_distributor ON distributor_inventory_requests(distributorId);
CREATE INDEX IF NOT EXISTS idx_distributor_requests_status ON distributor_inventory_requests(status);
CREATE INDEX IF NOT EXISTS idx_distributor_orders_distributor ON distributor_orders(distributorId);
CREATE INDEX IF NOT EXISTS idx_distributor_orders_status ON distributor_orders(status);
CREATE INDEX IF NOT EXISTS idx_distributor_inquiries_distributor ON distributor_inquiries(distributorId);
CREATE INDEX IF NOT EXISTS idx_distributor_inquiries_status ON distributor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_distributor_inventory_distributor ON distributor_inventory(distributorId);
CREATE INDEX IF NOT EXISTS idx_distributor_pricing_distributor ON distributor_pricing(distributorId);
