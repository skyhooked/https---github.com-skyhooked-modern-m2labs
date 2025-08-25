import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getOrderById } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const resolvedParams = await params;
    const orderId = resolvedParams.orderId;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Get order by ID
    const order = await getOrderById(orderId);
    
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
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
