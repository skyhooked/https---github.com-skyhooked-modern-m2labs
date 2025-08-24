import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    console.log('🔧 Running reviews and wishlist migration...');

    // Create the required tables if they don't exist
    const migrations = [
      // Product reviews table
      `CREATE TABLE IF NOT EXISTS product_reviews (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        userId TEXT NOT NULL,
        orderId TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        content TEXT,
        isVerified BOOLEAN DEFAULT FALSE,
        isPublished BOOLEAN DEFAULT TRUE,
        helpfulVotes INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Wishlists table
      `CREATE TABLE IF NOT EXISTS wishlists (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'My Wishlist',
        isPublic BOOLEAN DEFAULT FALSE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Wishlist items table
      `CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        wishlistId TEXT NOT NULL,
        productId TEXT NOT NULL,
        variantId TEXT,
        addedAt TEXT NOT NULL,
        UNIQUE(wishlistId, productId, variantId),
        FOREIGN KEY (wishlistId) REFERENCES wishlists (id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_product_reviews_productId ON product_reviews (productId)`,
      `CREATE INDEX IF NOT EXISTS idx_product_reviews_userId ON product_reviews (userId)`,
      `CREATE INDEX IF NOT EXISTS idx_wishlists_userId ON wishlists (userId)`,
      `CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlistId ON wishlist_items (wishlistId)`
    ];

    const results = [];
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      
      try {
        console.log(`🔄 Running migration ${i + 1}/${migrations.length}`);
        await db.prepare(sql).run();
        
        if (sql.includes('CREATE TABLE IF NOT EXISTS product_reviews')) {
          results.push('✅ product_reviews table ready');
        } else if (sql.includes('CREATE TABLE IF NOT EXISTS wishlists')) {
          results.push('✅ wishlists table ready');
        } else if (sql.includes('CREATE TABLE IF NOT EXISTS wishlist_items')) {
          results.push('✅ wishlist_items table ready');
        } else if (sql.includes('CREATE INDEX')) {
          results.push('✅ Indexes created');
        }
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          results.push('⚠️ Already exists: ' + (sql.includes('product_reviews') ? 'product_reviews' : sql.includes('wishlists') ? 'wishlists' : 'wishlist_items'));
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Reviews and wishlist migration completed');

    return NextResponse.json({
      success: true,
      message: 'Reviews and wishlist tables migration completed successfully',
      results
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
