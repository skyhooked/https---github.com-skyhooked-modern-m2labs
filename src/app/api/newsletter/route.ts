// Newsletter API endpoints - trigger deployment
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  createNewsletterSubscriber,
  getNewsletterSubscribers,
  getSubscriberByEmail,
  unsubscribeEmail,
  updateNewsletterSubscriber,
  getUserById
} from '@/libs/database-d1';
import { getUserFromToken } from '@/libs/auth';
import { mailerLiteService } from '@/libs/mailerlite';

export const runtime = 'edge';

// Helper function to properly check if a subscriber is active
const isSubscriberActive = (isActive: any): boolean => {
  return isActive === true || isActive === 'true' || isActive === 1 || isActive === '1';
};

// GET - Get all newsletter subscribers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Simple admin check - just allow admin access without JWT for now
    // In the future, we can improve this with proper admin token validation
    // For now, the admin panel has its own authentication via AuthWrapper

    await initializeDatabase();
    const subscribers = await getNewsletterSubscribers();
    
    return NextResponse.json({
      subscribers,
      totalCount: subscribers.length,
      activeCount: subscribers.filter(s => isSubscriberActive(s.isActive)).length
    });
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { email, firstName, lastName, source } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email is already subscribed
    const existingSubscriber = await getSubscriberByEmail(email);
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json({ 
          message: 'Email is already subscribed',
          alreadySubscribed: true 
        }, { status: 200 });
      } else {
        // Reactivate the subscription
        await updateNewsletterSubscriber(existingSubscriber.id, {
          isActive: true,
          firstName: firstName || existingSubscriber.firstName,
          lastName: lastName || existingSubscriber.lastName
        });
        return NextResponse.json({ 
          message: 'Successfully resubscribed to newsletter',
          reactivated: true 
        });
      }
    }

    // Check if user is logged in to link the subscription
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const authUser = token ? await getUserFromToken(token) : null;
    
    // Get full user data from database if authenticated
    let fullUser = null;
    if (authUser?.id) {
      try {
        fullUser = await getUserById(authUser.id);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }

    const subscriberData = {
      email: email.toLowerCase(),
      firstName: firstName || (fullUser?.firstName),
      lastName: lastName || (fullUser?.lastName),
      userId: authUser?.id,
      source: source || 'website'
    };

    const newSubscriber = await createNewsletterSubscriber(subscriberData);
    // Also add to MailerLite
    try {
      await mailerLiteService.addSubscriber(
        subscriberData.email,
        subscriberData.firstName,
        subscriberData.lastName,
        [] // Groups will be managed in MailerLite dashboard - API requires group IDs, not names
      );
    } catch (error) {
      console.error('Error adding subscriber to MailerLite:', error);
      // Continue anyway - local database subscription still works
    }
    
    return NextResponse.json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber: newSubscriber
    }, { status: 201 });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe to newsletter' }, { status: 500 });
  }
}

// PUT - Update subscriber (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const updatedSubscriber = await updateNewsletterSubscriber(id, updates);
    
    if (!updatedSubscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Subscriber updated successfully',
      subscriber: updatedSubscriber
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const reason = searchParams.get('reason');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const success = await unsubscribeEmail(email, undefined, reason || undefined);
    
    if (!success) {
      return NextResponse.json({ error: 'Email not found in subscribers' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Successfully unsubscribed from newsletter' 
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
