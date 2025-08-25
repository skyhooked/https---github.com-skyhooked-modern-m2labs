import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { createSupportTicket, createSupportMessage, getSupportTickets } from '@/libs/database-ecommerce';
import { mailerLiteService } from '@/libs/mailerlite';

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
    
    // Send confirmation email to customer
    try {
      await mailerLiteService.sendCampaignEmail({
        to: email,
        subject: `Support ticket created: ${subject}`,
        html: `
          <h2>Support Ticket Created</h2>
          <p>Hi ${name},</p>
          <p>We've received your support request and will get back to you as soon as possible.</p>
          <p><strong>Ticket Details:</strong></p>
          <ul>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Priority:</strong> ${priority}</li>
          </ul>
          <p>You can view and reply to this ticket in your account dashboard.</p>
          <p>Thanks,<br>M2 Labs Support Team</p>
        `,
        campaignName: `Support: ${ticket.id}`
      });
      
      console.log('✅ Support ticket confirmation sent to:', email);
    } catch (error) {
      console.error('❌ Error sending support ticket confirmation:', error);
    }

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
