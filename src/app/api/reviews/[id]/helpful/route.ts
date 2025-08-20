import { NextRequest, NextResponse } from 'next/server';
import { updateReviewHelpfulVotes } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await updateReviewHelpfulVotes(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Helpful vote recorded'
    });
  } catch (error) {
    console.error('Error recording helpful vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record helpful vote' },
      { status: 500 }
    );
  }
}
