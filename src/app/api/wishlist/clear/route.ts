import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';
import { clearWishlist } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await clearWishlist(user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
    
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear wishlist' },
      { status: 500 }
    );
  }
}
