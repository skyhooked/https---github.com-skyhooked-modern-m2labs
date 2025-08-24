import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log('🔧 Running news custom sections migration...');

    // Read and execute the migration
    const migrations = [
      // Create news_posts table if it doesn't exist
      `CREATE TABLE IF NOT EXISTS news_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        fullContent TEXT NOT NULL,
        coverImage TEXT,
        author TEXT NOT NULL,
        publishDate TEXT NOT NULL,
        readTime TEXT,
        category TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      
      // Add custom sections columns (will fail silently if they already exist)
      `ALTER TABLE news_posts ADD COLUMN customSections TEXT DEFAULT '[]'`,
      `ALTER TABLE news_posts ADD COLUMN useCustomTemplate BOOLEAN DEFAULT FALSE`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_news_posts_publishDate ON news_posts (publishDate)`,
      `CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts (category)`,
      `CREATE INDEX IF NOT EXISTS idx_news_posts_author ON news_posts (author)`
    ];

    const results = [];
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      try {
        await db.prepare(sql).run();
        
        if (sql.includes('CREATE TABLE')) {
          results.push('✅ news_posts table ready');
        } else if (sql.includes('ADD COLUMN customSections')) {
          results.push('✅ customSections column added');
        } else if (sql.includes('ADD COLUMN useCustomTemplate')) {
          results.push('✅ useCustomTemplate column added');
        } else if (sql.includes('CREATE INDEX')) {
          results.push('✅ Indexes created');
        }
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          if (sql.includes('ADD COLUMN customSections')) {
            results.push('⚠️ customSections column already exists');
          } else if (sql.includes('ADD COLUMN useCustomTemplate')) {
            results.push('⚠️ useCustomTemplate column already exists');
          } else {
            results.push('⚠️ Already exists');
          }
        } else {
          throw error;
        }
      }
    }

    console.log('✅ News custom sections migration completed');

    return NextResponse.json({
      success: true,
      message: 'News custom sections migration completed successfully',
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
