import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, createCategory } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
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

    const category = await createCategory(data);

    return NextResponse.json({
      success: true,
      category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
