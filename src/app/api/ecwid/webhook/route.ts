export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { ensureUserForEmail, createOrder, initializeDatabase } from '@/libs/database-d1';
import type { Order } from '@/libs/auth';

export async function POST(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  try {
    const orderData = await request.json();

    // Require email on the order
    const email: string = String(orderData?.email || '').toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Order email missing' }, { status: 400 });
    }

    // Ensure local user exists
    const user = await ensureUserForEmail(email);

    // Build strict order payload for createOrder
    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      ecwidOrderId: String(orderData?.orderNumber ?? ''),
      status: 'processing',
      total: Number(orderData?.total ?? 0),
      currency: String(orderData?.currency ?? ''),
      items: (orderData?.items ?? []) as any[],
      shippingAddress: {
        street: String(orderData?.shippingPerson?.street ?? ''),
        city: String(orderData?.shippingPerson?.city ?? ''),
        state: String(orderData?.shippingPerson?.stateOrProvinceCode ?? ''),
        zipCode: String(orderData?.shippingPerson?.postalCode ?? ''),
        country: String(orderData?.shippingPerson?.countryCode ?? ''),
      },
      billingAddress: {
        street: String(orderData?.billingPerson?.street ?? ''),
        city: String(orderData?.billingPerson?.city ?? ''),
        state: String(orderData?.billingPerson?.stateOrProvinceCode ?? ''),
        zipCode: String(orderData?.billingPerson?.postalCode ?? ''),
        country: String(orderData?.billingPerson?.countryCode ?? ''),
      },
    };

    await createOrder(order);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Ecwid webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
