// Newsletter unsubscribe API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  unsubscribeEmail,
  getSubscriberByEmail
} from '@/libs/database-d1';

export const runtime = 'edge';

// GET - Unsubscribe page (with email and optional token for security)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const campaignId = searchParams.get('campaign');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the subscriber exists
    const subscriber = await getSubscriberByEmail(email);
    if (!subscriber) {
      return NextResponse.json({ error: 'Email not found in subscribers' }, { status: 404 });
    }

    // For now, we'll trust the email parameter
    // In production, you'd want to verify the token against the email
    if (token) {
      // Simple token verification - in production use proper HMAC or JWT
      const expectedToken = Buffer.from(email).toString('base64');
      if (token !== expectedToken) {
        return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
      }
    }

    return NextResponse.json({
      email,
      subscriberName: `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || 'Subscriber',
      isActive: subscriber.isActive,
      campaignId
    });
  } catch (error) {
    console.error('Error processing unsubscribe request:', error);
    return NextResponse.json({ error: 'Failed to process unsubscribe request' }, { status: 500 });
  }
}

// POST - Process unsubscribe
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { email, reason, campaignId, token } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the subscriber exists
    const subscriber = await getSubscriberByEmail(email);
    if (!subscriber) {
      return NextResponse.json({ error: 'Email not found in subscribers' }, { status: 404 });
    }

    // Token verification (simple version)
    if (token) {
      const expectedToken = Buffer.from(email).toString('base64');
      if (token !== expectedToken) {
        return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
      }
    }

    if (!subscriber.isActive) {
      return NextResponse.json({ 
        message: 'Email is already unsubscribed',
        alreadyUnsubscribed: true 
      });
    }

    const success = await unsubscribeEmail(email, campaignId, reason);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Successfully unsubscribed from newsletter',
      email: email
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

// Helper function to generate unsubscribe token
function generateUnsubscribeToken(email: string): string {
  // Simple base64 encoding - in production use proper HMAC or JWT
  return Buffer.from(email).toString('base64');
}

// Helper function to generate unsubscribe URL
function generateUnsubscribeUrl(email: string, campaignId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m2labs.com';
  const token = generateUnsubscribeToken(email);
  const params = new URLSearchParams({
    email,
    token
  });
  
  if (campaignId) {
    params.append('campaign', campaignId);
  }
  
  return `${baseUrl}/api/newsletter/unsubscribe?${params.toString()}`;
}
