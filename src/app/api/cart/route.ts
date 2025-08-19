import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getCartByUserId, getCartBySessionId, createCart } from '@/libs/database-ecommerce';

export const runtime = 'edge';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    let cart = null;
    
    if (user) {
      // Try to get cart by user ID first
      cart = await getCartByUserId(user.id);
    } else if (sessionId) {
      // For guest users, get cart by session ID
      cart = await getCartBySessionId(sessionId);
    }
    
    if (!cart) {
      // Return empty cart structure
      return NextResponse.json({
        cart: {
          id: null,
          items: [],
          subtotal: 0,
          itemCount: 0,
          currency: 'USD',
        }
      });
    }
    
    // Calculate cart totals
    const subtotal = cart.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
    const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    return NextResponse.json({
      cart: {
        ...cart,
        subtotal: subtotal / 100, // Convert from cents to dollars
        itemCount,
      }
    });
    
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Create new cart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { sessionId, currency = 'USD' } = body;
    
    const cart = await createCart({
      userId: user?.id,
      sessionId: !user ? sessionId : undefined,
      currency,
    });
    
    return NextResponse.json({
      cart: {
        ...cart,
        items: [],
        subtotal: 0,
        itemCount: 0,
      }
    });
    
  } catch (error) {
    console.error('Error creating cart:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' },
      { status: 500 }
    );
  }
}
