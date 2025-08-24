import { NextRequest, NextResponse } from 'next/server';
import { 
  updateProductReview, 
  deleteProductReview 
} from '@/libs/database-ecommerce';
import { verifyToken } from '@/libs/auth';

export const runtime = 'edge';

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from auth token
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { rating, title, content } = await request.json();
    const { id: reviewId } = await params;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate content if provided
    if (content !== undefined && !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Review content cannot be empty' },
        { status: 400 }
      );
    }

    const updatedReview = await updateProductReview(reviewId, decoded.sub, {
      rating,
      title: title?.trim(),
      content: content?.trim()
    });

    if (!updatedReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from auth token
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;

    // Check if user is admin (assuming admin flag is in token or you can check user role)
    const isAdmin = decoded.role === 'admin'; // Adjust based on your auth structure

    const success = await deleteProductReview(reviewId, decoded.sub, isAdmin);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
