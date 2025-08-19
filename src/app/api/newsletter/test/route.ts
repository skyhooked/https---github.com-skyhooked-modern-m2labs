// Test endpoint to verify newsletter database setup
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  getNewsletterSubscribers,
  getNewsletterCampaigns,
  getNewsletterTemplates
} from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Test basic functionality
    const subscribers = await getNewsletterSubscribers();
    const campaigns = await getNewsletterCampaigns();
    const templates = await getNewsletterTemplates();
    
    return NextResponse.json({
      status: 'success',
      message: 'Newsletter system initialized successfully',
      data: {
        subscriberCount: subscribers.length,
        campaignCount: campaigns.length,
        templateCount: templates.length,
        defaultTemplateExists: templates.some(t => t.isDefault)
      }
    });
  } catch (error: any) {
    console.error('Newsletter test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Newsletter system test failed',
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
