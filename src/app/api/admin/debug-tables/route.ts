import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get all tables in the database
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();
    
    const result: any = {
      tables: tables.results?.map((row: any) => row.name) || [],
      tableDetails: {}
    };
    
    // For each table, get its schema
    for (const table of result.tables) {
      try {
        const schema = await db.prepare(`PRAGMA table_info(${table})`).all();
        result.tableDetails[table] = schema.results || [];
      } catch (error) {
        result.tableDetails[table] = `Error: ${error}`;
      }
    }
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Debug tables error:', error);
    return NextResponse.json(
      { error: `Failed to debug tables: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
