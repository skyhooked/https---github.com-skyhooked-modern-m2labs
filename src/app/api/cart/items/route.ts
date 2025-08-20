import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { 
  getCartByUserId, 
  getCartBySessionId, 
  createCart, 
  addToCart, 
  updateCartItem,
  removeFromCart 
} from '@/libs/database-ecommerce';

export const runtime = 'edge';

// POST /api/cart/items - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { variantId, quantity, unitPrice, cartId, sessionId } = body;
    
    // Validate required fields
    if (!variantId || !quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'variantId, quantity, and unitPrice are required' },
        { status: 400 }
      );
    }
    
    let cart = null;
    
    // Get or create cart
    if (cartId) {
      // Try to use provided cart ID
      cart = user ? await getCartByUserId(user.id) : await getCartBySessionId(cartId);
    } else if (user) {
      cart = await getCartByUserId(user.id);
    } else if (sessionId) {
      cart = await getCartBySessionId(sessionId);
    }
    
    if (!cart) {
      // Create new cart
      cart = await createCart({
        userId: user?.id,
        sessionId: !user ? sessionId : undefined,
        currency: 'USD',
      });
    }
    
    // Add item to cart
    const cartItem = await addToCart({
      cartId: cart.id,
      variantId,
      quantity: parseInt(quantity.toString()),
      unitPrice: Math.round(parseFloat(unitPrice.toString()) * 100), // Convert to cents
    });
    
    // Get updated cart with items
    const updatedCart = user ? await getCartByUserId(user.id) : await getCartBySessionId(sessionId || cart.sessionId);
    
    console.log('Updated cart from DB:', updatedCart);
    
    // Calculate totals
    const subtotal = updatedCart?.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
    const itemCount = updatedCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    const responseCart = {
      ...updatedCart,
      subtotal: subtotal / 100,
      itemCount,
    };
    
    console.log('Sending cart response:', responseCart);
    
    return NextResponse.json({
      success: true,
      cartItem,
      cart: responseCart
    });
    
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart/items - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;
    
    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'itemId and quantity are required' },
        { status: 400 }
      );
    }
    
    const success = await updateCartItem(itemId, parseInt(quantity.toString()));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }
    
    const success = await removeFromCart(itemId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove cart item' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
