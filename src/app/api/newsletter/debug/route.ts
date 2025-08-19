import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getNewsletterSubscribers } from '@/libs/database-d1';

export const runtime = 'edge';

// Helper function to properly check if a subscriber is active
const isSubscriberActive = (isActive: any): boolean => {
  return isActive === true || isActive === 'true' || isActive === 1 || isActive === '1';
};

// Debug endpoint to check newsletter subscribers without auth
export async function GET() {
  try {
    await initializeDatabase();
    const subscribers = await getNewsletterSubscribers();
    
    // Return both debug format and API format for comparison
    return NextResponse.json({
      debug: {
        success: true,
        totalSubscribers: subscribers.length,
        activeSubscribers: subscribers.filter(s => isSubscriberActive(s.isActive)).length,
        subscribers: subscribers.map(s => ({
          id: s.id,
          email: s.email,
          isActive: s.isActive,
          source: s.source,
          createdAt: s.createdAt
        }))
      },
      apiFormat: {
        subscribers,
        totalCount: subscribers.length,
        activeCount: subscribers.filter(s => isSubscriberActive(s.isActive)).length
      }
    });
  } catch (error: any) {
    console.error('Error in newsletter debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error',
      details: 'Failed to fetch newsletter subscribers'
    }, { status: 500 });
  }
}

