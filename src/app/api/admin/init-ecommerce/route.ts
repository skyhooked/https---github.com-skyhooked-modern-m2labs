import { NextResponse } from 'next/server';
import { initializeEcommerceDatabase } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function POST() {
  try {
    console.log('Initializing e-commerce database...');
    await initializeEcommerceDatabase();
    console.log('E-commerce database initialized successfully');
    
    return NextResponse.json({
      success: true,
      message: 'E-commerce database initialized successfully'
    });
  } catch (error) {
    console.error('Failed to initialize e-commerce database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize e-commerce database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
