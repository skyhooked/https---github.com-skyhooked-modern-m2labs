import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getOrderByStripePaymentIntentId } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    const paymentIntentId = params.paymentIntentId;
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }
    
    // Get order by Stripe payment intent ID
    const order = await getOrderByStripePaymentIntentId(paymentIntentId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // If user is logged in, verify they own this order
    if (user && order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ order });
    
  } catch (error) {
    console.error('Error fetching order by payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
