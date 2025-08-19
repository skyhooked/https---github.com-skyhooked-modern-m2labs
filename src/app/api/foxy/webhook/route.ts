export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { ensureUserForEmail, createOrder, initializeDatabase } from '@/libs/database-d1';
import type { Order } from '@/libs/auth';

export async function POST(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  
  try {
    const orderData = await request.json();
    console.log('Foxy webhook received:', JSON.stringify(orderData, null, 2));

    // Foxy sends transaction data - extract customer email
    const email: string = String(orderData?.customer_email || '').toLowerCase().trim();
    if (!email) {
      console.error('Order email missing from Foxy webhook');
      return NextResponse.json({ error: 'Order email missing' }, { status: 400 });
    }

    // Ensure local user exists
    const user = await ensureUserForEmail(email, {
      firstName: orderData?.customer_first_name || 'Customer',
      lastName: orderData?.customer_last_name || '',
      phone: orderData?.customer_phone || '',
    });

    // Map Foxy transaction status to our order status
    const mapFoxyStatus = (status: string): string => {
      switch (status?.toLowerCase()) {
        case 'approved':
        case 'completed':
          return 'processing';
        case 'pending':
          return 'processing';
        case 'declined':
        case 'problem':
          return 'cancelled';
        default:
          return 'processing';
      }
    };

    // Build order payload for createOrder
    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      ecwidOrderId: String(orderData?.id ?? ''), // Use Foxy transaction ID
      status: mapFoxyStatus(orderData?.status),
      total: Number(orderData?.transaction_total ?? 0),
      currency: String(orderData?.currency_code ?? 'USD'),
      items: (orderData?.items ?? []).map((item: any) => ({
        id: item.id || item.code,
        name: item.name,
        price: parseFloat(item.price || '0'),
        quantity: parseInt(item.quantity || '1'),
        sku: item.code || '',
        image: item.image || '',
        category: item.category || '',
      })),
      shippingAddress: {
        street: String(orderData?.shipping_address1 ?? ''),
        city: String(orderData?.shipping_city ?? ''),
        state: String(orderData?.shipping_state ?? ''),
        zipCode: String(orderData?.shipping_postal_code ?? ''),
        country: String(orderData?.shipping_country ?? ''),
      },
      billingAddress: {
        street: String(orderData?.billing_address1 ?? ''),
        city: String(orderData?.billing_city ?? ''),
        state: String(orderData?.billing_state ?? ''),
        zipCode: String(orderData?.billing_postal_code ?? ''),
        country: String(orderData?.billing_country ?? ''),
      },
    };

    console.log('Creating order:', JSON.stringify(order, null, 2));
    await createOrder(order);
    
    console.log('Foxy webhook processed successfully');
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Foxy webhook error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
