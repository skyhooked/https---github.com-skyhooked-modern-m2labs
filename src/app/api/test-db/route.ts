import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // Check if D1 database is available
    const globalAny = globalThis as any;
    
    const db = globalAny.DB || 
               globalAny.env?.DB || 
               globalAny.__env?.DB ||
               globalAny.ASSETS?.env?.DB ||
               globalAny.context?.env?.DB;
    
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'D1 Database binding not found',
        available_globals: Object.keys(globalAny).filter(key => 
          key.includes('DB') || key.includes('env') || key.includes('binding')
        ),
        globalThis_keys: Object.keys(globalAny).slice(0, 20) // First 20 keys
      });
    }
    
    // Try a simple query
    const result = await db.prepare('SELECT 1 as test').first();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      test_result: result
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
