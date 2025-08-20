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
    // Initialize e-commerce database if needed
    try {
      const { initializeEcommerceDatabase } = await import('@/libs/database-ecommerce');
      await initializeEcommerceDatabase();
    } catch (initError) {
      console.log('E-commerce database may already be initialized or init failed:', initError);
    }

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
      sku: data.sku || `M2-${Date.now()}`, // Generate SKU if not provided
      basePrice: Math.round(data.basePrice), // Ensure it's in cents
      compareAtPrice: data.compareAtPrice ? Math.round(data.compareAtPrice) : undefined,
      cost: data.cost ? Math.round(data.cost) : undefined,
      isFeatured: data.isFeatured || false,
      isActive: data.isActive !== false, // Default to true
      weight: data.weight,
      dimensions: data.dimensions,
      powerRequirements: data.powerRequirements,
      compatibility: data.compatibility,
      technicalSpecs: data.technicalSpecs || {},
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      metaKeywords: data.metaKeywords
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
            compareAtPrice: variantData.compareAtPrice ? Math.round(variantData.compareAtPrice) : undefined,
            cost: variantData.cost ? Math.round(variantData.cost) : undefined,
            position: variantData.position || 0,
            isDefault: variantData.isDefault || false,
            barcode: variantData.barcode,
            trackInventory: variantData.trackInventory !== false,
            continueSellingWhenOutOfStock: variantData.continueSellingWhenOutOfStock || false,
            requiresShipping: variantData.requiresShipping !== false,
            taxable: variantData.taxable !== false
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
        price: undefined,
        compareAtPrice: undefined,
        cost: undefined,
        position: 0,
        isDefault: true,
        barcode: undefined,
        trackInventory: true,
        continueSellingWhenOutOfStock: false,
        requiresShipping: true,
        taxable: true
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
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create product',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
