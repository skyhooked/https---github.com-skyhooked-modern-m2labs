export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { getOrdersByUserId, initializeDatabase } from '@/libs/database-d1';

export async function GET(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const orders = await getOrdersByUserId(user.id);

    return NextResponse.json({
      orders: orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
