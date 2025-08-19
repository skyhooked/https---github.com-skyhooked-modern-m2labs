import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getNewsletterSubscribers } from '@/libs/database-d1';

export const runtime = 'edge';

// Debug endpoint to check newsletter subscribers without auth
export async function GET() {
  try {
    await initializeDatabase();
    const subscribers = await getNewsletterSubscribers();
    
    return NextResponse.json({
      success: true,
      totalSubscribers: subscribers.length,
      activeSubscribers: subscribers.filter(s => s.isActive).length,
      subscribers: subscribers.map(s => ({
        id: s.id,
        email: s.email,
        isActive: s.isActive,
        source: s.source,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Error in newsletter debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: 'Failed to fetch newsletter subscribers'
    }, { status: 500 });
  }
}

