import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductReviews, 
  createProductReview 
} from '@/libs/database-ecommerce';
import { verifyToken } from '@/libs/auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate sortBy parameter
    const validSortOptions = ['createdAt', 'rating', 'helpfulVotes'] as const;
    const sortBy = validSortOptions.includes(sortByParam as any) 
      ? (sortByParam as 'createdAt' | 'rating' | 'helpfulVotes')
      : 'createdAt';

    const reviews = await getProductReviews(productId, {
      sortBy,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { productId, rating, title, content } = await request.json();

    if (!productId || !rating || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product
    const existingReviews = await getProductReviews(productId, { userId: decoded.sub });
    if (existingReviews.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const review = await createProductReview({
      productId,
      userId: decoded.sub,
      rating,
      title,
      content
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
