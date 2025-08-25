import { NextRequest, NextResponse } from 'next/server';
import { createSupportMessage, getSupportMessages } from '@/libs/database-ecommerce';
import { mailerLiteService } from '@/libs/mailerlite';
import { getSupportTicketById } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getSupportMessages(id);
    
    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    if (!data.message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const message = await createSupportMessage({
      ticketId: id,
      message: data.message,
      isInternal: data.isInternal || false,
      userId: data.userId || null  // Handle undefined userId for admin messages

      // Send email notification to customer when admin replies
if (!data.isInternal) {
  try {
    const ticket = await getSupportTicketById(id);
    if (ticket && ticket.email) {
      await mailerLiteService.sendCampaignEmail({
        to: ticket.email,
        subject: `New reply to your support ticket: ${ticket.subject}`,
        html: `
          <h2>New Reply to Your Support Ticket</h2>
          <p>Hi ${ticket.name},</p>
          <p>We've replied to your support ticket. Here's the latest message:</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #FF8A3D;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/support">View Full Conversation</a></p>
          <p>Thanks,<br>M2 Labs Support Team</p>
        `,
        campaignName: `Support Reply: ${ticket.id}`
      });
      
      console.log('✅ Support reply notification sent to:', ticket.email);
    }
  } catch (error) {
    console.error('❌ Error sending support reply notification:', error);
  }
}
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error creating support message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
