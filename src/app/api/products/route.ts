import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/libs/database-ecommerce';

export const runtime = 'edge';

// GET /api/products - Get products with filtering and search
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const params = {
      categoryId: searchParams.get('categoryId') || undefined,
      brandId: searchParams.get('brandId') || undefined,
      isActive: searchParams.get('isActive') !== null ? searchParams.get('isActive') === 'true' : true,
      isFeatured: searchParams.get('isFeatured') !== null ? searchParams.get('isFeatured') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      searchTerm: searchParams.get('search') || undefined,
    };
    
    const products = await getProducts(params);
    
    console.log('📋 Found', products.length, 'products total');
    console.log('🏷️ Product slugs:', products.map(p => p.slug));
    
    return NextResponse.json({
      products,
      count: products.length,
      params: {
        ...params,
        isActive: params.isActive,
        isFeatured: params.isFeatured
      }
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
