import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { createPaymentIntent, calculateTax, calculateShipping } from '@/libs/stripe';
import { createOrder, createOrderItem, getCartByUserId, getCartBySessionId } from '@/libs/database-ecommerce';

export const runtime = 'edge';

interface CreatePaymentIntentRequest {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variantId: string;
    image?: string;
  }>;
  subtotal: number;
  currency?: string;
  customerEmail?: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  cartId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body: CreatePaymentIntentRequest = await request.json();
    
    // Check for Stripe secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    console.log('🔑 Stripe Secret Key available:', !!stripeSecretKey);
    
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }
    
    const {
      items,
      subtotal,
      currency = 'usd',
      customerEmail,
      shippingAddress,
      billingAddress,
      sessionId
    } = body;
    
    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }
    
    if (!customerEmail && !user) {
      return NextResponse.json(
        { error: 'Customer email is required for guest checkout' },
        { status: 400 }
      );
    }
    
    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }
    
    // Calculate shipping
    const shipping = await calculateShipping({
      items: items.map(item => ({
        weight: undefined, // TODO: Get actual weight from product data
        requiresShipping: true,
      })),
      shippingAddress: {
        country: shippingAddress.country,
        state: shippingAddress.state,
        postal_code: shippingAddress.postal_code,
      },
      subtotal: subtotal * 100, // Convert to cents
    });
    
    // Calculate tax
    const tax = await calculateTax({
      amount: subtotal * 100, // Convert to cents
      currency,
      customerAddress: {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postal_code,
        country: shippingAddress.country,
      },
    });
    
    const totalAmount = (subtotal * 100) + shipping.amount + tax;
    const email = customerEmail || user?.email || '';
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for order creation' },
        { status: 400 }
      );
    }
    
    console.log('📝 Creating order with data:', {
      userId: user?.id || null,
      email,
      totalAmount,
      shippingName: shippingAddress.name,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress
    });
    
    // Create order in database first
    const orderData = {
      userId: user?.id,
      email,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      subtotal: subtotal * 100,
      taxAmount: tax,
      shippingAmount: shipping.amount,
      discountAmount: 0,
      total: totalAmount,
      currency: currency.toUpperCase(),
      stripePaymentIntentId: undefined,
      stripeChargeId: undefined,
      paymentMethod: undefined,
      shippingAddress: {
        firstName: shippingAddress.name.split(' ')[0] || '',
        lastName: shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address1: shippingAddress.line1 || '',
        address2: shippingAddress.line2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postal_code || '',
        country: shippingAddress.country || 'US',
        phone: shippingAddress.phone || '',
      },
      billingAddress: billingAddress ? {
        firstName: billingAddress.name.split(' ')[0] || '',
        lastName: billingAddress.name.split(' ').slice(1).join(' ') || '',
        address1: billingAddress.line1 || '',
        address2: billingAddress.line2 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        postalCode: billingAddress.postal_code || '',
        country: billingAddress.country || 'US',
        phone: billingAddress.phone || '',
      } : {
        firstName: shippingAddress.name.split(' ')[0] || '',
        lastName: shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address1: shippingAddress.line1 || '',
        address2: shippingAddress.line2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postal_code || '',
        country: shippingAddress.country || 'US',
        phone: shippingAddress.phone || '',
      },
      shippingMethod: shipping.method,
      trackingNumber: undefined,
      shippedAt: undefined,
      deliveredAt: undefined,
      notes: undefined,
      adminNotes: undefined,
      couponCode: undefined,
    };
    
    const order = await createOrder(orderData);
    
    // Create order items
    for (const item of items) {
      await createOrderItem({
        orderId: order.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price * 100, // Convert to cents
        totalPrice: item.price * item.quantity * 100, // Convert to cents
        productSnapshot: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        },
      });
    }
    
    // Get user's cart to clear it later
    let userCart = null;
    try {
      if (user) {
        userCart = await getCartByUserId(user.id);
      } else if (sessionId) {
        userCart = await getCartBySessionId(sessionId);
      }
    } catch (error) {
      console.log('Could not retrieve cart for clearing:', error);
    }
    
    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount: totalAmount,
      currency,
      orderId: order.id,
      customerEmail: email,
      secretKey: stripeSecretKey,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user?.id || 'guest',
        itemCount: items.length.toString(),
        subtotal: (subtotal * 100).toString(),
        shipping: shipping.amount.toString(),
        tax: tax.toString(),
        cartId: userCart?.id || '', // Add cartId for clearing after payment
      },
      shipping: {
        address: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
        name: shippingAddress.name,
        phone: shippingAddress.phone,
      },
    });
    
    // Update order with Stripe Payment Intent ID
    // TODO: Add update order function to database-ecommerce.ts
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totalAmount,
      currency: currency.toUpperCase(),
      subtotal: subtotal * 100,
      shipping: shipping.amount,
      tax,
      total: totalAmount,
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
