import { NextRequest, NextResponse } from 'next/server';
import { getSupportTicketById, updateSupportTicket } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await getSupportTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const ticket = await updateSupportTicket(id, data);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
