import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug || !data.basePrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      brandId: data.brandId,
      basePrice: Math.round(data.basePrice),
      compareAtPrice: data.compareAtPrice ? Math.round(data.compareAtPrice) : undefined,
      isFeatured: data.isFeatured || false,
      isActive: data.isActive !== false,
      powerRequirements: data.powerRequirements,
      compatibility: data.compatibility,
      technicalSpecs: data.technicalSpecs || {}
    };

    const product = await updateProduct(params.id, updateData);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const product = await updateProduct(params.id, data);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteProduct(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
