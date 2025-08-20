import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Add the enhanced product fields to the products table
    const migrations = [
      'ALTER TABLE products ADD COLUMN youtubeVideoId TEXT',
      'ALTER TABLE products ADD COLUMN features TEXT',
      'ALTER TABLE products ADD COLUMN toggleOptions TEXT',
      'ALTER TABLE products ADD COLUMN powerConsumption TEXT',
      'ALTER TABLE products ADD COLUMN relatedProducts TEXT'
    ];
    
    const results = [];
    
    for (const migration of migrations) {
      try {
        console.log(`🔄 Running migration: ${migration}`);
        await db.prepare(migration).run();
        results.push({ migration, status: 'success' });
        console.log(`✅ Migration successful: ${migration}`);
      } catch (error) {
        // Check if error is about column already existing
        if (error instanceof Error && error.message.includes('duplicate column name')) {
          results.push({ migration, status: 'already_exists' });
          console.log(`ℹ️ Column already exists: ${migration}`);
        } else {
          results.push({ migration, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
          console.error(`❌ Migration failed: ${migration}`, error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced product fields migration completed',
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
