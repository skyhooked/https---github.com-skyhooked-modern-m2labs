import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    console.log('🔧 Fixing wishlist table schema...');

    // Drop the incorrectly created tables and recreate them
    const migrations = [
      // Drop existing tables that have wrong schema
      `DROP TABLE IF EXISTS wishlists`,
      `DROP TABLE IF EXISTS wishlist_items`,
      
      // Recreate wishlists table with correct schema
      `CREATE TABLE wishlists (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'My Wishlist',
        isPublic BOOLEAN DEFAULT FALSE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Recreate wishlist_items table with correct schema  
      `CREATE TABLE wishlist_items (
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
      
      // Recreate indexes
      `CREATE INDEX IF NOT EXISTS idx_wishlists_userId ON wishlists (userId)`,
      `CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlistId ON wishlist_items (wishlistId)`
    ];

    const results = [];
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      
      try {
        console.log(`🔄 Running fix ${i + 1}/${migrations.length}: ${sql.substring(0, 50)}...`);
        await db.prepare(sql).run();
        
        if (sql.includes('DROP TABLE IF EXISTS wishlists')) {
          results.push('🗑️ Dropped incorrect wishlists table');
        } else if (sql.includes('DROP TABLE IF EXISTS wishlist_items')) {
          results.push('🗑️ Dropped incorrect wishlist_items table');
        } else if (sql.includes('CREATE TABLE wishlists')) {
          results.push('✅ Created wishlists table with correct schema');
        } else if (sql.includes('CREATE TABLE wishlist_items')) {
          results.push('✅ Created wishlist_items table with correct schema');
        } else if (sql.includes('CREATE INDEX')) {
          results.push('✅ Created indexes');
        }
      } catch (error: any) {
        results.push(`❌ Error in step ${i + 1}: ${error.message}`);
        throw error;
      }
    }

    // Verify the correct schema was created
    try {
      const wishlistSchema = await db.prepare(`PRAGMA table_info(wishlists)`).all();
      const columns = wishlistSchema.results?.map((col: any) => col.name) || [];
      results.push(`🔍 wishlists columns after fix: ${columns.join(', ')}`);
      
      const wishlistItemsSchema = await db.prepare(`PRAGMA table_info(wishlist_items)`).all();
      const itemColumns = wishlistItemsSchema.results?.map((col: any) => col.name) || [];
      results.push(`🔍 wishlist_items columns after fix: ${itemColumns.join(', ')}`);
    } catch (verifyError) {
      results.push(`⚠️ Verification error: ${verifyError}`);
    }

    console.log('✅ Wishlist schema fix completed');

    return NextResponse.json({
      success: true,
      message: 'Wishlist tables schema fixed successfully',
      results
    });

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    return NextResponse.json(
      { error: `Schema fix failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
