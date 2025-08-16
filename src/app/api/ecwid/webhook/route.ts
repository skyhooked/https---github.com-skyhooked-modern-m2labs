import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getUserByEmail } from '@/libs/database';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    
    // Verify webhook authenticity (optional but recommended)
    const signature = request.headers.get('x-ecwid-webhook-signature');
    // In production, verify the signature using your webhook secret
    
    if (webhookData.eventType === 'order.paid') {
      const orderData = webhookData.data;
      
      // Find user by email
      let userId = null;
      if (orderData.email) {
        const user = await getUserByEmail(orderData.email);
        userId = user?.id || null;
      }
      
      // Create order in our database
      const order = {
        userId: userId,
        ecwidOrderId: orderData.orderNumber,
        status: 'processing' as const,
        total: orderData.total,
        currency: orderData.currency || 'USD',
        items: orderData.items?.map((item: any) => ({
          id: item.id.toString(),
          productId: item.productId?.toString() || '',
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku
        })) || [],
        shippingAddress: {
          street: orderData.shippingAddress?.street || '',
          city: orderData.shippingAddress?.city || '',
          state: orderData.shippingAddress?.stateOrProvinceCode || '',
          zipCode: orderData.shippingAddress?.postalCode || '',
          country: orderData.shippingAddress?.countryCode || ''
        },
        billingAddress: {
          street: orderData.billingAddress?.street || orderData.shippingAddress?.street || '',
          city: orderData.billingAddress?.city || orderData.shippingAddress?.city || '',
          state: orderData.billingAddress?.stateOrProvinceCode || orderData.shippingAddress?.stateOrProvinceCode || '',
          zipCode: orderData.billingAddress?.postalCode || orderData.shippingAddress?.postalCode || '',
          country: orderData.billingAddress?.countryCode || orderData.shippingAddress?.countryCode || ''
        }
      };
      
      await createOrder(order);
      
      console.log(`Order synced: ${orderData.orderNumber} for user: ${orderData.email}`);
    }
    
    // Handle other webhook events as needed
    if (webhookData.eventType === 'order.updated') {
      // Handle order status updates
      console.log(`Order updated: ${webhookData.data.orderNumber}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
