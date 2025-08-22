import { NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';

export const runtime = 'edge';

export async function POST() {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database not available');
    }

    // Add imageStyle column if it doesn't exist
    try {
      await db.exec(`
        ALTER TABLE artists ADD COLUMN imageStyle TEXT DEFAULT 'square';
      `);
      console.log('✅ Added imageStyle column to artists table');
      
      return NextResponse.json({
        success: true,
        message: 'imageStyle column added successfully'
      });
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('✅ imageStyle column already exists');
        return NextResponse.json({
          success: true,
          message: 'imageStyle column already exists'
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
