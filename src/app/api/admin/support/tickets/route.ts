import { NextRequest, NextResponse } from 'next/server';
import { getSupportTickets } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    const tickets = await getSupportTickets({
      status,
      category,
      userId
    });

    return NextResponse.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}
