-- E-commerce database schema for M2 Labs
-- Comprehensive product catalog, inventory, cart, and business features

-- ========================================
-- PRODUCT CATALOG TABLES
-- ========================================

-- Product categories (overdrive, delay, reverb, etc.)
CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parentId TEXT,
  sortOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  seoTitle TEXT,
  seoDescription TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (parentId) REFERENCES product_categories (id)
);

-- Brands (M2 Labs, potential future brands)
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo TEXT,
  website TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Main products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  shortDescription TEXT,
  brandId TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  basePrice REAL NOT NULL,
  compareAtPrice REAL,
  cost REAL,
  isActive BOOLEAN DEFAULT TRUE,
  isFeatured BOOLEAN DEFAULT FALSE,
  weight REAL,
  dimensions TEXT, -- JSON: {length, width, height, unit}
  powerRequirements TEXT,
  compatibility TEXT,
  technicalSpecs TEXT, -- JSON object
  seoTitle TEXT,
  seoDescription TEXT,
  metaKeywords TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (brandId) REFERENCES brands (id)
);

-- Product variants (different colors, limited editions)
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price REAL,
  compareAtPrice REAL,
  cost REAL,
  position INTEGER DEFAULT 0,
  isDefault BOOLEAN DEFAULT FALSE,
  barcode TEXT,
  trackInventory BOOLEAN DEFAULT TRUE,
  continueSellingWhenOutOfStock BOOLEAN DEFAULT FALSE,
  requiresShipping BOOLEAN DEFAULT TRUE,
  taxable BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  variantId TEXT,
  url TEXT NOT NULL,
  altText TEXT,
  position INTEGER DEFAULT 0,
  isMainImage BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE
);

-- Product categories relationship (many-to-many)
CREATE TABLE IF NOT EXISTS product_category_relations (
  productId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  PRIMARY KEY (productId, categoryId),
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES product_categories (id) ON DELETE CASCADE
);

-- Product attributes (color, size, etc.)
CREATE TABLE IF NOT EXISTS product_attributes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  displayName TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'select', 'multiselect')),
  isRequired BOOLEAN DEFAULT FALSE,
  isFilterable BOOLEAN DEFAULT TRUE,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Product attribute values
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id TEXT PRIMARY KEY,
  attributeId TEXT NOT NULL,
  value TEXT NOT NULL,
  displayValue TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  FOREIGN KEY (attributeId) REFERENCES product_attributes (id) ON DELETE CASCADE
);

-- Product variant attributes (links variants to attribute values)
CREATE TABLE IF NOT EXISTS product_variant_attributes (
  variantId TEXT NOT NULL,
  attributeId TEXT NOT NULL,
  valueId TEXT NOT NULL,
  PRIMARY KEY (variantId, attributeId),
  FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE,
  FOREIGN KEY (attributeId) REFERENCES product_attributes (id) ON DELETE CASCADE,
  FOREIGN KEY (valueId) REFERENCES product_attribute_values (id) ON DELETE CASCADE
);

-- Sound samples and demos
CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video', 'pdf', 'image')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  artistId TEXT, -- Link to artist endorsements
  position INTEGER DEFAULT 0,
  isPublic BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  FOREIGN KEY (artistId) REFERENCES artists (id)
);

-- ========================================
-- INVENTORY MANAGEMENT
-- ========================================

-- Inventory locations (warehouses, stores)
CREATE TABLE IF NOT EXISTS inventory_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  isDefault BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Inventory tracking
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  variantId TEXT NOT NULL,
  locationId TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reservedQuantity INTEGER NOT NULL DEFAULT 0,
  costPrice REAL,
  lastRestockedAt TEXT,
  lowStockThreshold INTEGER DEFAULT 5,
  updatedAt TEXT NOT NULL,
  UNIQUE(variantId, locationId),
  FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE,
  FOREIGN KEY (locationId) REFERENCES inventory_locations (id)
);

-- Inventory movements log
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  variantId TEXT NOT NULL,
  locationId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'damage', 'transfer')),
  quantity INTEGER NOT NULL,
  previousQuantity INTEGER NOT NULL,
  newQuantity INTEGER NOT NULL,
  reason TEXT,
  referenceId TEXT, -- Order ID, transfer ID, etc.
  userId TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (variantId) REFERENCES product_variants (id),
  FOREIGN KEY (locationId) REFERENCES inventory_locations (id),
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- ========================================
-- SHOPPING CART & ORDERS
-- ========================================

-- Persistent shopping carts
CREATE TABLE IF NOT EXISTS shopping_carts (
  id TEXT PRIMARY KEY,
  userId TEXT,
  sessionId TEXT,
  currency TEXT DEFAULT 'USD',
  abandonedAt TEXT,
  convertedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cartId TEXT NOT NULL,
  variantId TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice REAL NOT NULL,
  addedAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (cartId) REFERENCES shopping_carts (id) ON DELETE CASCADE,
  FOREIGN KEY (variantId) REFERENCES product_variants (id)
);

-- Updated orders table (replace ecwidOrderId with proper payment integration)
CREATE TABLE IF NOT EXISTS orders_new (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE NOT NULL,
  userId TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  paymentStatus TEXT NOT NULL CHECK (paymentStatus IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')) DEFAULT 'pending',
  
  -- Financial details
  subtotal REAL NOT NULL,
  taxAmount REAL NOT NULL DEFAULT 0,
  shippingAmount REAL NOT NULL DEFAULT 0,
  discountAmount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payment details
  stripePaymentIntentId TEXT,
  stripeChargeId TEXT,
  paymentMethod TEXT,
  
  -- Addresses (JSON objects)
  shippingAddress TEXT NOT NULL,
  billingAddress TEXT NOT NULL,
  
  -- Shipping details
  shippingMethod TEXT,
  trackingNumber TEXT,
  shippedAt TEXT,
  deliveredAt TEXT,
  
  -- Customer notes
  notes TEXT,
  adminNotes TEXT,
  
  -- Applied discounts
  couponCode TEXT,
  
  -- Timestamps
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (couponCode) REFERENCES coupons (code)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  variantId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  totalPrice REAL NOT NULL,
  productSnapshot TEXT NOT NULL, -- JSON snapshot of product/variant at time of order
  createdAt TEXT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders_new (id) ON DELETE CASCADE,
  FOREIGN KEY (variantId) REFERENCES product_variants (id)
);

-- Order status history
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  notifyCustomer BOOLEAN DEFAULT FALSE,
  userId TEXT, -- Admin who made the change
  createdAt TEXT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders_new (id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- ========================================
-- CUSTOMER FEATURES
-- ========================================

-- Customer addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shipping', 'billing', 'both')),
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  company TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postalCode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Wishlist items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  wishlistId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  addedAt TEXT NOT NULL,
  UNIQUE(wishlistId, productId, variantId),
  FOREIGN KEY (wishlistId) REFERENCES wishlists (id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  userId TEXT NOT NULL,
  orderId TEXT, -- Verified purchase
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  isVerified BOOLEAN DEFAULT FALSE,
  isPublished BOOLEAN DEFAULT TRUE,
  helpfulVotes INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders_new (id)
);

-- Recently viewed products
CREATE TABLE IF NOT EXISTS recently_viewed (
  id TEXT PRIMARY KEY,
  userId TEXT,
  sessionId TEXT,
  productId TEXT NOT NULL,
  viewedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
);

-- ========================================
-- BUSINESS FEATURES
-- ========================================

-- Coupons and discounts
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value REAL NOT NULL,
  minimumAmount REAL,
  maximumDiscount REAL,
  usageLimit INTEGER,
  usageCount INTEGER DEFAULT 0,
  perCustomerLimit INTEGER,
  isActive BOOLEAN DEFAULT TRUE,
  startsAt TEXT,
  expiresAt TEXT,
  applicableToProductIds TEXT, -- JSON array
  applicableToCategoryIds TEXT, -- JSON array
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
  id TEXT PRIMARY KEY,
  couponId TEXT NOT NULL,
  userId TEXT,
  orderId TEXT NOT NULL,
  discountAmount REAL NOT NULL,
  usedAt TEXT NOT NULL,
  FOREIGN KEY (couponId) REFERENCES coupons (id),
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (orderId) REFERENCES orders_new (id)
);

-- Shipping methods and rates
CREATE TABLE IF NOT EXISTS shipping_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  carrier TEXT,
  serviceName TEXT,
  price REAL NOT NULL,
  isFree BOOLEAN DEFAULT FALSE,
  freeShippingThreshold REAL,
  estimatedDays TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Shipping zones
CREATE TABLE IF NOT EXISTS shipping_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT NOT NULL, -- JSON array of country codes
  states TEXT, -- JSON array of state codes (for US/CA)
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Shipping zone methods (which methods available in which zones)
CREATE TABLE IF NOT EXISTS shipping_zone_methods (
  zoneId TEXT NOT NULL,
  methodId TEXT NOT NULL,
  price REAL, -- Override default price for this zone
  PRIMARY KEY (zoneId, methodId),
  FOREIGN KEY (zoneId) REFERENCES shipping_zones (id) ON DELETE CASCADE,
  FOREIGN KEY (methodId) REFERENCES shipping_methods (id) ON DELETE CASCADE
);

-- Tax rates
CREATE TABLE IF NOT EXISTS tax_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate REAL NOT NULL, -- Decimal rate (0.08 for 8%)
  country TEXT NOT NULL,
  state TEXT,
  city TEXT,
  postalCode TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- ========================================
-- CUSTOMER SUPPORT
-- ========================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  ticketNumber TEXT UNIQUE NOT NULL,
  userId TEXT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'technical', 'warranty', 'shipping', 'billing', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')) DEFAULT 'open',
  assignedTo TEXT,
  orderId TEXT,
  productId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (assignedTo) REFERENCES users (id),
  FOREIGN KEY (orderId) REFERENCES orders_new (id),
  FOREIGN KEY (productId) REFERENCES products (id)
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  userId TEXT,
  isInternal BOOLEAN DEFAULT FALSE,
  message TEXT NOT NULL,
  attachments TEXT, -- JSON array of attachment URLs
  createdAt TEXT NOT NULL,
  FOREIGN KEY (ticketId) REFERENCES support_tickets (id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- ========================================
-- ANALYTICS & REPORTING
-- ========================================

-- Product analytics
CREATE TABLE IF NOT EXISTS product_analytics (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('view', 'add_to_cart', 'remove_from_cart', 'purchase', 'wishlist_add')),
  userId TEXT,
  sessionId TEXT,
  quantity INTEGER DEFAULT 1,
  revenue REAL,
  source TEXT, -- referrer, campaign, etc.
  userAgent TEXT,
  ipAddress TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id),
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- Search analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  resultsCount INTEGER NOT NULL,
  userId TEXT,
  sessionId TEXT,
  clickedProductId TEXT,
  clickPosition INTEGER,
  noResults BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (clickedProductId) REFERENCES products (id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_brandId ON products (brandId);
CREATE INDEX IF NOT EXISTS idx_products_isActive ON products (isActive);
CREATE INDEX IF NOT EXISTS idx_products_isFeatured ON products (isFeatured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- Product variant indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_productId ON product_variants (productId);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_isDefault ON product_variants (isDefault);

-- Product image indexes
CREATE INDEX IF NOT EXISTS idx_product_images_productId ON product_images (productId);
CREATE INDEX IF NOT EXISTS idx_product_images_variantId ON product_images (variantId);
CREATE INDEX IF NOT EXISTS idx_product_images_isMainImage ON product_images (isMainImage);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_variantId ON inventory_items (variantId);
CREATE INDEX IF NOT EXISTS idx_inventory_items_locationId ON inventory_items (locationId);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variantId ON inventory_movements (variantId);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_createdAt ON inventory_movements (createdAt);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_shopping_carts_userId ON shopping_carts (userId);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_sessionId ON shopping_carts (sessionId);
CREATE INDEX IF NOT EXISTS idx_cart_items_cartId ON cart_items (cartId);
CREATE INDEX IF NOT EXISTS idx_cart_items_variantId ON cart_items (variantId);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_new_userId ON orders_new (userId);
CREATE INDEX IF NOT EXISTS idx_orders_new_status ON orders_new (status);
CREATE INDEX IF NOT EXISTS idx_orders_new_paymentStatus ON orders_new (paymentStatus);
CREATE INDEX IF NOT EXISTS idx_orders_new_orderNumber ON orders_new (orderNumber);
CREATE INDEX IF NOT EXISTS idx_orders_new_createdAt ON orders_new (createdAt);
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items (orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_variantId ON order_items (variantId);

-- Customer feature indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_userId ON user_addresses (userId);
CREATE INDEX IF NOT EXISTS idx_wishlists_userId ON wishlists (userId);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlistId ON wishlist_items (wishlistId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_productId ON product_reviews (productId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_userId ON product_reviews (userId);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_userId ON recently_viewed (userId);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_sessionId ON recently_viewed (sessionId);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewedAt ON recently_viewed (viewedAt);

-- Business feature indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_isActive ON coupons (isActive);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_couponId ON coupon_usages (couponId);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_userId ON coupon_usages (userId);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets (userId);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticketNumber ON support_tickets (ticketNumber);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticketId ON support_messages (ticketId);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_product_analytics_productId ON product_analytics (productId);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event ON product_analytics (event);
CREATE INDEX IF NOT EXISTS idx_product_analytics_createdAt ON product_analytics (createdAt);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics (query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_createdAt ON search_analytics (createdAt);
