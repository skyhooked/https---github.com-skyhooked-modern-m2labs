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
    // Ensure default brand exists
    const { getDatabase } = await import('@/libs/database-d1');
    const db = await getDatabase();
    
    const brandExists = await db.prepare('SELECT COUNT(*) as count FROM brands WHERE id = ?').bind('brand-m2labs').first();
    console.log('Brand check result:', brandExists);
    
    if (brandExists && brandExists.count === 0) {
      console.log('Creating default brand...');
      await db.prepare(`
        INSERT INTO brands (id, name, slug, description, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'brand-m2labs',
        'M2 Labs',
        'm2-labs',
        'Premium guitar effects pedals with transferable lifetime warranty',
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      console.log('Default brand created successfully');
    } else {
      console.log('Brand already exists, count:', brandExists?.count);
    }

    const data = await request.json();
    console.log('Received product data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name || !data.slug || data.basePrice === undefined || data.basePrice === null) {
      console.log('Validation failed - missing required fields:', {
        name: !!data.name,
        slug: !!data.slug,
        basePrice: data.basePrice !== undefined && data.basePrice !== null
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Validation passed, creating product...');

    // Generate unique slug if needed
    let finalSlug = data.slug;
    let counter = 1;
    
    while (true) {
      const existingProduct = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(finalSlug).first();
      if (!existingProduct) {
        break; // Slug is unique
      }
      
      // Try with a number suffix
      finalSlug = `${data.slug}-${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unable to generate unique URL slug. Please choose a different product name.',
            field: 'slug'
          },
          { status: 400 }
        );
      }
    }
    
    console.log(`Using slug: ${finalSlug}${finalSlug !== data.slug ? ` (auto-generated from ${data.slug})` : ''}`);

    // Create the product
    const productData = {
      name: data.name,
      slug: finalSlug,
      description: data.description,
      shortDescription: data.shortDescription,
      brandId: data.brandId || 'brand-m2labs', // Default to M2 Labs brand
      sku: data.sku || `M2-${Date.now()}`, // Generate SKU if not provided
      basePrice: Math.round(data.basePrice || 0), // Allow 0 as valid price
      compareAtPrice: data.compareAtPrice ? Math.round(data.compareAtPrice) : undefined,
      cost: data.cost ? Math.round(data.cost) : undefined,
      isFeatured: data.isFeatured || false,
      isActive: data.isActive !== false, // Default to true
      weight: data.weight,
      dimensions: data.dimensions,
      powerRequirements: data.powerRequirements,
      compatibility: data.compatibility,
      technicalSpecs: data.technicalSpecs || {},
      // Enhanced fields
      youtubeVideoId: data.youtubeVideoId,
      features: data.features,
      toggleOptions: data.toggleOptions,
      powerConsumption: data.powerConsumption,
      relatedProducts: data.relatedProducts,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      metaKeywords: data.metaKeywords
    };

    console.log('Creating product with data:', JSON.stringify(productData, null, 2));
    const product = await createProduct(productData);
    console.log('Product created successfully:', product.id);

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
        sku: `${finalSlug.toUpperCase()}-STD`,
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
