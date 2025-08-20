import { NextRequest, NextResponse } from 'next/server';
import { createSupportMessage } from '@/libs/database-ecommerce';

export const runtime = 'edge';

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
      userId: data.userId
    });

    return NextResponse.json({
      success: true,
      message,
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
