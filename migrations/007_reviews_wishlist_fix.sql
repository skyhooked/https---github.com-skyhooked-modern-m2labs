-- Fix for reviews and wishlist functionality
-- Ensure all required tables exist with correct schema

-- Re-create product_reviews table if missing
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

-- Re-create wishlists table if missing
CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Re-create wishlist_items table if missing
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_product_reviews_productId ON product_reviews (productId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_userId ON product_reviews (userId);
CREATE INDEX IF NOT EXISTS idx_wishlists_userId ON wishlists (userId);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlistId ON wishlist_items (wishlistId);
