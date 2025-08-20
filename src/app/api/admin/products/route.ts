import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllProducts, 
  createProduct, 
  createProductVariant,
  createProductImage,
  updateInventory
} from '@/libs/database-ecommerce';
import { generateId } from '@/libs/auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const products = await getAllProducts({
      search: search || undefined,
      category: category || undefined,
      brandId: brand || undefined,
      isFeatured: featured === 'true' ? true : undefined,
      isActive: active === 'true' ? true : undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug || !data.basePrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the product
    const productData = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      brandId: data.brandId || 'brand-m2labs', // Default to M2 Labs
      basePrice: Math.round(data.basePrice), // Ensure it's in cents
      compareAtPrice: data.compareAtPrice ? Math.round(data.compareAtPrice) : undefined,
      isFeatured: data.isFeatured || false,
      isActive: data.isActive !== false, // Default to true
      powerRequirements: data.powerRequirements,
      compatibility: data.compatibility,
      technicalSpecs: data.technicalSpecs || {}
    };

    const product = await createProduct(productData);

    // Create variants
    if (data.variants && data.variants.length > 0) {
      for (const variantData of data.variants) {
        if (variantData.name && variantData.sku) {
          const variant = await createProductVariant({
            productId: product.id,
            name: variantData.name,
            sku: variantData.sku,
            price: variantData.price ? Math.round(variantData.price) : undefined,
            isDefault: variantData.isDefault || false
          });

          // Set initial inventory
          if (variantData.inventory?.quantity > 0) {
            await updateInventory(variant.id, variantData.inventory.quantity);
          }
        }
      }
    } else {
      // Create default variant if none provided
      const defaultVariant = await createProductVariant({
        productId: product.id,
        name: 'Standard',
        sku: `${data.slug.toUpperCase()}-STD`,
        isDefault: true
      });

      // Set initial inventory to 0
      await updateInventory(defaultVariant.id, 0);
    }

    // Create product images (if provided)
    if (data.images && data.images.length > 0) {
      for (const [index, imageData] of data.images.entries()) {
        if (imageData.url) {
          await createProductImage({
            productId: product.id,
            url: imageData.url,
            altText: imageData.altText || `${product.name} ${index + 1}`,
            isMainImage: imageData.isMainImage || index === 0,
            position: index
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
