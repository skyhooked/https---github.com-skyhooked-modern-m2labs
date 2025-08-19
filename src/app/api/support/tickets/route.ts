import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { createSupportTicket, createSupportMessage, getSupportTickets } from '@/libs/database-ecommerce';

export const runtime = 'edge';

// GET /api/support/tickets - Get support tickets
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const url = new URL(request.url);
    
    // Admin can see all tickets, customers only see their own
    const params = user?.role === 'admin' ? {
      status: url.searchParams.get('status') || undefined,
      category: url.searchParams.get('category') || undefined,
    } : {
      userId: user?.id,
      status: url.searchParams.get('status') || undefined,
      category: url.searchParams.get('category') || undefined,
    };
    
    const tickets = await getSupportTickets(params);
    
    return NextResponse.json({
      tickets,
      count: tickets.length
    });
    
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets - Create new support ticket
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    
    const {
      email,
      name,
      subject,
      message,
      category = 'general',
      priority = 'normal',
      orderId,
      productId
    } = body;
    
    // Validate required fields
    if (!email || !name || !subject || !message) {
      return NextResponse.json(
        { error: 'email, name, subject, and message are required' },
        { status: 400 }
      );
    }
    
    // Create the ticket
    const ticket = await createSupportTicket({
      userId: user?.id,
      email,
      name,
      subject,
      category,
      priority,
      status: 'open',
      orderId,
      productId,
    });
    
    // Create the initial message
    const supportMessage = await createSupportMessage({
      ticketId: ticket.id,
      userId: user?.id,
      isInternal: false,
      message,
    });
    
    return NextResponse.json({
      ticket: {
        ...ticket,
        messages: [supportMessage]
      }
    });
    
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
