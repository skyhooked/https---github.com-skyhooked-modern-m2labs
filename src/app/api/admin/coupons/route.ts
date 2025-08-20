import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCoupons, 
  createCoupon 
} from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const coupons = await getAllCoupons({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      coupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.code || !data.name || !data.type || !data.validFrom) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (data.type !== 'free_shipping' && (!data.value || data.value <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Discount value is required and must be greater than 0' },
        { status: 400 }
      );
    }

    if (data.type === 'percentage' && data.value > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    if (data.type === 'bundle_deal' && data.value < 2) {
      return NextResponse.json(
        { success: false, error: 'Bundle deals must require at least 2 items' },
        { status: 400 }
      );
    }

    // Create the coupon
    const couponData = {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      type: data.type,
      value: data.type === 'free_shipping' ? 0 : (data.type === 'fixed_amount' ? Math.round(data.value * 100) : data.value),
      minimumOrderAmount: data.minimumOrderAmount ? Math.round(data.minimumOrderAmount * 100) : null,
      maximumDiscountAmount: data.maximumDiscountAmount ? Math.round(data.maximumDiscountAmount * 100) : null,
      usageLimit: data.usageLimit || null,
      isActive: data.isActive !== false,
      validFrom: data.validFrom,
      validUntil: data.validUntil || null
    };

    const coupon = await createCoupon(couponData);

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'A coupon with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
