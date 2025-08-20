import { NextRequest, NextResponse } from 'next/server';
import { getAllBrands, createBrand } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const brands = await getAllBrands();

    return NextResponse.json({
      success: true,
      brands
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || !data.slug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const brand = await createBrand(data);

    return NextResponse.json({
      success: true,
      brand,
      message: 'Brand created successfully'
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    );
  }
}
