// E-commerce database layer for M2 Labs
// Comprehensive product, cart, order, and business feature management

import { generateId } from './auth';

// ========================================
// D1 DATABASE TYPE DEFINITIONS
// ========================================

// Type for Cloudflare D1 binding
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
  raw<T = any>(): Promise<T[]>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: any;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brandId: string;
  sku: string;
  basePrice: number;
  compareAtPrice?: number;
  cost?: number;
  isActive: boolean;
  isFeatured: boolean;
  weight?: string;
  dimensions?: string; // String format like "2.6\" x 4.8\" x 1.6\""
  powerRequirements?: string;
  compatibility?: string;
  technicalSpecs?: Record<string, any>;
  // Enhanced fields inspired by JHS Pedals
  youtubeVideoId?: string;
  features?: string[];
  toggleOptions?: Record<string, string>;
  powerConsumption?: string;
  relatedProducts?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
  // Populated data
  brand?: Brand;
  variants?: ProductVariant[];
  images?: ProductImage[];
  categories?: ProductCategory[];
  defaultVariant?: ProductVariant;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price?: number;
  compareAtPrice?: number;
  cost?: number;
  position: number;
  isDefault: boolean;
  barcode?: string;
  trackInventory: boolean;
  continueSellingWhenOutOfStock: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated data
  inventory?: InventoryItem;
  attributes?: ProductVariantAttribute[];
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  position: number;
  isMainImage: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  // Populated data
  children?: ProductCategory[];
  parent?: ProductCategory;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeValue {
  id: string;
  attributeId: string;
  value: string;
  displayValue: string;
  sortOrder: number;
}

export interface ProductVariantAttribute {
  variantId: string;
  attributeId: string;
  valueId: string;
  attribute?: ProductAttribute;
  value?: ProductAttributeValue;
}

export interface ProductMedia {
  id: string;
  productId: string;
  type: 'audio' | 'video' | 'pdf' | 'image';
  title: string;
  url: string;
  description?: string;
  artistId?: string;
  position: number;
  isPublic: boolean;
  createdAt: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  costPrice?: number;
  lastRestockedAt?: string;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  locationId: string;
  type: 'restock' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  userId?: string;
  createdAt: string;
}

export interface ShoppingCart {
  id: string;
  userId?: string;
  sessionId?: string;
  currency: string;
  abandonedAt?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  addedAt: string;
  updatedAt: string;
  // Populated data
  variant?: ProductVariant & { product?: Product };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  
  // Financial details
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  
  // Payment details
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paymentMethod?: string;
  
  // Addresses
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  
  // Shipping details
  shippingMethod?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Customer notes
  notes?: string;
  adminNotes?: string;
  
  // Applied discounts
  couponCode?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Populated data
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: any; // JSON snapshot
  createdAt: string;
  // Populated data
  variant?: ProductVariant & { product?: Product };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  notes?: string;
  notifyCustomer: boolean;
  userId?: string;
  createdAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string;
  addedAt: string;
  // Populated data
  product?: Product;
  variant?: ProductVariant;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  isPublished: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  // Populated data
  user?: { firstName: string; lastName: string };
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  applicableToProductIds?: string[];
  applicableToCategoryIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  carrier?: string;
  serviceName?: string;
  price: number;
  isFree: boolean;
  freeShippingThreshold?: number;
  estimatedDays?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  email: string;
  name: string;
  subject: string;
  category: 'general' | 'technical' | 'warranty' | 'shipping' | 'billing' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo?: string;
  orderId?: string;
  productId?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  userId?: string;
  isInternal: boolean;
  message: string;
  attachments?: string[];
  createdAt: string;
}

// ========================================
// DATABASE INTERFACE
// ========================================

// Get database instance from global binding or environment
async function getDatabase(): Promise<D1Database> {
  // Import and use the working getDatabase function from database-d1
  const { getDatabase: getD1Database } = await import('./database-d1');
  return getD1Database();
}

// ========================================
// PRODUCT FUNCTIONS
// ========================================

export const getProducts = async (params?: {
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  searchTerm?: string;
}): Promise<Product[]> => {
  const db = await getDatabase();
  
  let query = `
    SELECT p.*, b.name as brand_name, b.slug as brand_slug
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
  `;
  
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.isActive !== undefined) {
    conditions.push('(p.isActive = ? OR p.isActive = ?)');
    bindings.push(params.isActive, params.isActive.toString());
  }
  
  if (params?.isFeatured !== undefined) {
    conditions.push('(p.isFeatured = ? OR p.isFeatured = ?)');
    bindings.push(params.isFeatured, params.isFeatured.toString());
  }
  
  if (params?.brandId) {
    conditions.push('p.brandId = ?');
    bindings.push(params.brandId);
  }
  
  if (params?.categoryId) {
    query += ' INNER JOIN product_category_relations pcr ON p.id = pcr.productId';
    conditions.push('pcr.categoryId = ?');
    bindings.push(params.categoryId);
  }
  
  if (params?.searchTerm) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.shortDescription LIKE ? OR p.sku LIKE ?)');
    const searchPattern = `%${params.searchTerm}%`;
    bindings.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY p.isFeatured DESC, p.name ASC';
  
  if (params?.limit) {
    query += ` LIMIT ${params.limit}`;
    if (params?.offset) {
      query += ` OFFSET ${params.offset}`;
    }
  }
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  // Fetch images for each product
  const products = await Promise.all((result.results || []).map(async row => {
    const images = await getProductImages(row.id);
    
    return {
      ...row,
      dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
      technicalSpecs: row.technicalSpecs ? JSON.parse(row.technicalSpecs) : undefined,
      features: row.features ? JSON.parse(row.features) : [],
      toggleOptions: row.toggleOptions ? JSON.parse(row.toggleOptions) : {},
      relatedProducts: row.relatedProducts ? JSON.parse(row.relatedProducts) : [],
      brand: row.brand_name ? {
        id: row.brandId,
        name: row.brand_name,
        slug: row.brand_slug
      } : undefined,
      images
    };
  }));
  
  return products;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT p.*, b.name as brand_name, b.slug as brand_slug
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
    WHERE p.slug = ? AND (p.isActive = true OR p.isActive = 'true')
  `).bind(slug).first();
  
  if (!result) return null;
  
  // Get variants, images, and categories
  const [variants, images, categories] = await Promise.all([
    getProductVariants(result.id),
    getProductImages(result.id),
    getProductCategories(result.id)
  ]);
  
  return {
    ...result,
    dimensions: result.dimensions ? JSON.parse(result.dimensions) : undefined,
    technicalSpecs: result.technicalSpecs ? JSON.parse(result.technicalSpecs) : undefined,
    features: result.features ? JSON.parse(result.features) : [],
    toggleOptions: result.toggleOptions ? JSON.parse(result.toggleOptions) : {},
    relatedProducts: result.relatedProducts ? JSON.parse(result.relatedProducts) : [],
    brand: result.brand_name ? {
      id: result.brandId,
      name: result.brand_name,
      slug: result.brand_slug
    } : undefined,
    variants,
    images,
    categories,
    defaultVariant: variants.find(v => v.isDefault) || variants[0]
  };
};

export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM product_variants
    WHERE productId = ?
    ORDER BY position ASC, isDefault DESC
  `).bind(productId).all();
  
  return (result.results || []).map(variant => ({
    ...variant,
    isDefault: variant.isDefault === true || variant.isDefault === 'true',
    trackInventory: variant.trackInventory === true || variant.trackInventory === 'true',
    continueSellingWhenOutOfStock: variant.continueSellingWhenOutOfStock === true || variant.continueSellingWhenOutOfStock === 'true',
    requiresShipping: variant.requiresShipping === true || variant.requiresShipping === 'true',
    taxable: variant.taxable === true || variant.taxable === 'true'
  }));
};

export const getProductImages = async (productId: string): Promise<ProductImage[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM product_images
    WHERE productId = ?
    ORDER BY position ASC, isMainImage DESC
  `).bind(productId).all();
  
  return (result.results || []).map(image => ({
    ...image,
    isMainImage: image.isMainImage === true || image.isMainImage === 'true'
  }));
};

export const getProductCategories = async (productId: string): Promise<ProductCategory[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT c.* FROM product_categories c
    INNER JOIN product_category_relations pcr ON c.id = pcr.categoryId
    WHERE pcr.productId = ?
    ORDER BY c.sortOrder ASC
  `).bind(productId).all();
  
  return result.results || [];
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  const product: Product = {
    id,
    ...productData,
    createdAt: now,
    updatedAt: now
  };
  
  await db.prepare(`
    INSERT INTO products (
      id, name, slug, description, shortDescription, brandId, sku, basePrice, compareAtPrice, cost,
      isActive, isFeatured, weight, dimensions, powerRequirements, compatibility, technicalSpecs,
      seoTitle, seoDescription, metaKeywords, youtubeVideoId, features, toggleOptions, powerConsumption, relatedProducts,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    product.id, 
    product.name, 
    product.slug, 
    product.description || null, 
    product.shortDescription || null,
    product.brandId, 
    product.sku, 
    product.basePrice, 
    product.compareAtPrice || null, 
    product.cost || null,
    product.isActive, 
    product.isFeatured, 
    product.weight || null,
    product.dimensions || null,
    product.powerRequirements || null, 
    product.compatibility || null,
    product.technicalSpecs ? JSON.stringify(product.technicalSpecs) : null,
    product.seoTitle || null, 
    product.seoDescription || null, 
    product.metaKeywords || null,
    product.youtubeVideoId || null,
    product.features ? JSON.stringify(product.features) : null,
    product.toggleOptions ? JSON.stringify(product.toggleOptions) : null,
    product.powerConsumption || null,
    product.relatedProducts ? JSON.stringify(product.relatedProducts) : null,
    product.createdAt, 
    product.updatedAt
  ).run();
  
  return product;
};

// ========================================
// CART FUNCTIONS
// ========================================

export const getCartByUserId = async (userId: string): Promise<ShoppingCart | null> => {
  const db = await getDatabase();
  
  const cart = await db.prepare(`
    SELECT * FROM shopping_carts
    WHERE userId = ? AND convertedAt IS NULL
    ORDER BY updatedAt DESC
    LIMIT 1
  `).bind(userId).first();
  
  if (!cart) return null;
  
  const items = await getCartItems(cart.id);
  
  return {
    ...cart,
    items
  };
};

export const getCartBySessionId = async (sessionId: string): Promise<ShoppingCart | null> => {
  const db = await getDatabase();
  
  const cart = await db.prepare(`
    SELECT * FROM shopping_carts
    WHERE sessionId = ? AND convertedAt IS NULL
    ORDER BY updatedAt DESC
    LIMIT 1
  `).bind(sessionId).first();
  
  if (!cart) return null;
  
  const items = await getCartItems(cart.id);
  
  return {
    ...cart,
    items
  };
};

export const getCartById = async (cartId: string): Promise<ShoppingCart | null> => {
  const db = await getDatabase();
  
  const cart = await db.prepare(`
    SELECT * FROM shopping_carts
    WHERE id = ? AND convertedAt IS NULL
    LIMIT 1
  `).bind(cartId).first();
  
  if (!cart) return null;
  
  const items = await getCartItems(cart.id);
  
  return {
    ...cart,
    items
  };
};

export const createCart = async (data: {
  userId?: string;
  sessionId?: string;
  currency?: string;
}): Promise<ShoppingCart> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  const cart: ShoppingCart = {
    id,
    userId: data.userId,
    sessionId: data.sessionId,
    currency: data.currency || 'USD',
    createdAt: now,
    updatedAt: now,
    items: []
  };
  
  await db.prepare(`
    INSERT INTO shopping_carts (id, userId, sessionId, currency, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(cart.id, cart.userId, cart.sessionId, cart.currency, cart.createdAt, cart.updatedAt).run();
  
  return cart;
};

export const getCartItems = async (cartId: string): Promise<CartItem[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT ci.*, 
           pv.id as variant_id, pv.productId, pv.name as variant_name, pv.sku as variant_sku, 
           pv.price as variant_price, pv.compareAtPrice as variant_compareAtPrice,
           pv.cost as variant_cost, pv.position as variant_position, pv.isDefault as variant_isDefault,
           pv.barcode as variant_barcode, pv.trackInventory as variant_trackInventory,
           pv.continueSellingWhenOutOfStock as variant_continueSellingWhenOutOfStock,
           pv.requiresShipping as variant_requiresShipping, pv.taxable as variant_taxable,
           pv.createdAt as variant_createdAt, pv.updatedAt as variant_updatedAt,
           p.id as product_id, p.name as product_name, p.slug as product_slug, 
           p.brandId as product_brandId, p.sku as product_sku, p.basePrice as product_basePrice,
           p.compareAtPrice as product_compareAtPrice, p.cost as product_cost, 
           p.isActive as product_isActive, p.isFeatured as product_isFeatured,
           p.description as product_description, p.shortDescription as product_shortDescription,
           p.weight as product_weight, p.dimensions as product_dimensions,
           p.powerRequirements as product_powerRequirements, p.compatibility as product_compatibility,
           p.technicalSpecs as product_technicalSpecs, p.seoTitle as product_seoTitle,
           p.seoDescription as product_seoDescription, p.metaKeywords as product_metaKeywords,
           p.createdAt as product_createdAt, p.updatedAt as product_updatedAt
    FROM cart_items ci
    INNER JOIN product_variants pv ON ci.variantId = pv.id
    INNER JOIN products p ON pv.productId = p.id
    WHERE ci.cartId = ?
    ORDER BY ci.addedAt ASC
  `).bind(cartId).all();
  
  // Get the cart items with product data
  const cartItems = (result.results || []).map(row => ({
    id: row.id,
    cartId: row.cartId,
    variantId: row.variantId,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    addedAt: row.addedAt,
    updatedAt: row.updatedAt,
    variant: {
      id: row.variant_id,
      productId: row.productId,
      name: row.variant_name,
      sku: row.variant_sku,
      price: row.variant_price,
      compareAtPrice: row.variant_compareAtPrice,
      cost: row.variant_cost,
      position: row.variant_position,
      isDefault: Boolean(row.variant_isDefault),
      barcode: row.variant_barcode,
      trackInventory: Boolean(row.variant_trackInventory),
      continueSellingWhenOutOfStock: Boolean(row.variant_continueSellingWhenOutOfStock),
      requiresShipping: Boolean(row.variant_requiresShipping),
      taxable: Boolean(row.variant_taxable),
      createdAt: row.variant_createdAt,
      updatedAt: row.variant_updatedAt,
      product: {
        id: row.product_id,
        name: row.product_name,
        slug: row.product_slug,
        description: row.product_description,
        shortDescription: row.product_shortDescription,
        brandId: row.product_brandId,
        sku: row.product_sku,
        basePrice: row.product_basePrice,
        compareAtPrice: row.product_compareAtPrice,
        cost: row.product_cost,
        isActive: Boolean(row.product_isActive),
        isFeatured: Boolean(row.product_isFeatured),
        weight: row.product_weight,
        dimensions: row.product_dimensions ? JSON.parse(row.product_dimensions) : undefined,
        powerRequirements: row.product_powerRequirements,
        compatibility: row.product_compatibility,
        technicalSpecs: row.product_technicalSpecs,
        seoTitle: row.product_seoTitle,
        seoDescription: row.product_seoDescription,
        metaKeywords: row.product_metaKeywords,
        createdAt: row.product_createdAt,
        updatedAt: row.product_updatedAt
      }
    }
  }));

  // Fetch images for each product
  for (const item of cartItems) {
    if (item.variant?.product?.id) {
      const images = await getProductImages(item.variant.product.id);
      (item.variant.product as any).images = images;
    }
  }

  return cartItems;
};

export const addToCart = async (data: {
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}): Promise<CartItem> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Check if item already exists in cart
  const existingItem = await db.prepare(`
    SELECT * FROM cart_items WHERE cartId = ? AND variantId = ?
  `).bind(data.cartId, data.variantId).first();
  
  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + data.quantity;
    await db.prepare(`
      UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ?
    `).bind(newQuantity, now, existingItem.id).run();
    
    return {
      ...existingItem,
      quantity: newQuantity,
      updatedAt: now
    };
  } else {
    // Create new item
    const id = generateId();
    const item: CartItem = {
      id,
      cartId: data.cartId,
      variantId: data.variantId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      addedAt: now,
      updatedAt: now
    };
    
    await db.prepare(`
      INSERT INTO cart_items (id, cartId, variantId, quantity, unitPrice, addedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      item.id, item.cartId, item.variantId, item.quantity, item.unitPrice, item.addedAt, item.updatedAt
    ).run();
    
    return item;
  }
};

export const updateCartItem = async (itemId: string, quantity: number): Promise<boolean> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  if (quantity <= 0) {
    await db.prepare('DELETE FROM cart_items WHERE id = ?').bind(itemId).run();
  } else {
    await db.prepare(`
      UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ?
    `).bind(quantity, now, itemId).run();
  }
  
  return true;
};

export const removeFromCart = async (itemId: string): Promise<boolean> => {
  const db = await getDatabase();
  
  await db.prepare('DELETE FROM cart_items WHERE id = ?').bind(itemId).run();
  return true;
};

export const clearCart = async (cartId: string): Promise<boolean> => {
  const db = await getDatabase();
  
  await db.prepare('DELETE FROM cart_items WHERE cartId = ?').bind(cartId).run();
  return true;
};

// ========================================
// ORDER FUNCTIONS
// ========================================

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  // Generate order number (e.g., M2-20240101-001)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderNumber = `M2-${date}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const order: Order = {
    id,
    orderNumber,
    ...orderData,
    createdAt: now,
    updatedAt: now
  };
  
  await db.prepare(`
    INSERT INTO orders_new (
      id, orderNumber, userId, email, status, paymentStatus, subtotal, taxAmount, shippingAmount,
      discountAmount, total, currency, stripePaymentIntentId, stripeChargeId, paymentMethod,
      shippingAddress, billingAddress, shippingMethod, trackingNumber, shippedAt, deliveredAt,
      notes, adminNotes, couponCode, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    order.id, order.orderNumber, order.userId, order.email, order.status, order.paymentStatus,
    order.subtotal, order.taxAmount, order.shippingAmount, order.discountAmount, order.total,
    order.currency, order.stripePaymentIntentId, order.stripeChargeId, order.paymentMethod,
    JSON.stringify(order.shippingAddress), JSON.stringify(order.billingAddress),
    order.shippingMethod, order.trackingNumber, order.shippedAt, order.deliveredAt,
    order.notes, order.adminNotes, order.couponCode, order.createdAt, order.updatedAt
  ).run();
  
  return order;
};

export const createOrderItem = async (data: Omit<OrderItem, 'id' | 'createdAt'>): Promise<OrderItem> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  const item: OrderItem = {
    id,
    ...data,
    createdAt: now
  };
  
  await db.prepare(`
    INSERT INTO order_items (id, orderId, variantId, quantity, unitPrice, totalPrice, productSnapshot, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    item.id, item.orderId, item.variantId, item.quantity, item.unitPrice, item.totalPrice,
    JSON.stringify(item.productSnapshot), item.createdAt
  ).run();
  
  return item;
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM orders_new WHERE userId = ? ORDER BY createdAt DESC
  `).bind(userId).all();
  
  return (result.results || []).map(order => ({
    ...order,
    shippingAddress: JSON.parse(order.shippingAddress),
    billingAddress: JSON.parse(order.billingAddress)
  }));
};

// ========================================
// SUPPORT FUNCTIONS
// ========================================

export const createSupportTicket = async (data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  // Generate ticket number
  const ticketNumber = `SUP-${Date.now().toString(36).toUpperCase()}`;
  
  const ticket: SupportTicket = {
    id,
    ticketNumber,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  await db.prepare(`
    INSERT INTO support_tickets (
      id, ticketNumber, userId, email, name, subject, category, priority, status,
      assignedTo, orderId, productId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ticket.id, 
    ticket.ticketNumber, 
    ticket.userId || null, 
    ticket.email, 
    ticket.name, 
    ticket.subject,
    ticket.category, 
    ticket.priority, 
    ticket.status, 
    ticket.assignedTo || null, 
    ticket.orderId || null,
    ticket.productId || null, 
    ticket.createdAt, 
    ticket.updatedAt
  ).run();
  
  return ticket;
};

export const createSupportMessage = async (data: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<SupportMessage> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  const message: SupportMessage = {
    id,
    ...data,
    attachments: data.attachments || [],
    createdAt: now
  };
  
  await db.prepare(`
    INSERT INTO support_messages (id, ticketId, userId, isInternal, message, attachments, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    message.id, 
    message.ticketId, 
    message.userId || null, 
    message.isInternal, 
    message.message,
    JSON.stringify(message.attachments), 
    message.createdAt
  ).run();
  
  return message;
};

export const getSupportMessages = async (ticketId: string): Promise<SupportMessage[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM support_messages 
    WHERE ticketId = ? 
    ORDER BY createdAt ASC
  `).bind(ticketId).all();
  
  return (result.results || []).map(row => ({
    ...row,
    attachments: JSON.parse(row.attachments || '[]')
  }));
};

export const getSupportTickets = async (params?: {
  userId?: string;
  status?: string;
  category?: string;
}): Promise<SupportTicket[]> => {
  const db = await getDatabase();
  
  let query = `
    SELECT 
      st.*,
      COUNT(sm.id) as messageCount
    FROM support_tickets st
    LEFT JOIN support_messages sm ON st.id = sm.ticketId
  `;
  
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.userId) {
    conditions.push('st.userId = ?');
    bindings.push(params.userId);
  }
  
  if (params?.status) {
    conditions.push('st.status = ?');
    bindings.push(params.status);
  }
  
  if (params?.category) {
    conditions.push('st.category = ?');
    bindings.push(params.category);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' GROUP BY st.id ORDER BY st.createdAt DESC';
  
  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
};

// ========================================
// ORDER FUNCTIONS
// ========================================

export const getAllOrders = async (params?: {
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<Order[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM orders_new';
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.status) {
    conditions.push('status = ?');
    bindings.push(params.status);
  }
  
  if (params?.userId) {
    conditions.push('userId = ?');
    bindings.push(params.userId);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY createdAt DESC';
  
  if (params?.limit) {
    query += ` LIMIT ?`;
    bindings.push(params.limit);
    
    if (params?.offset) {
      query += ` OFFSET ?`;
      bindings.push(params.offset);
    }
  }
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  return (result.results || []).map(order => ({
    ...order,
    shippingAddress: JSON.parse(order.shippingAddress as string),
    billingAddress: JSON.parse(order.billingAddress as string),
  })) as Order[];
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM orders_new 
    WHERE id = ?
  `).bind(id).first();
  
  if (!result) return null;
  
  // Parse JSON fields
  const order = {
    ...result,
    shippingAddress: JSON.parse(result.shippingAddress as string),
    billingAddress: JSON.parse(result.billingAddress as string),
  } as Order;
  
  // Get order items
  const itemsResult = await db.prepare(`
    SELECT oi.*, pv.name as variantName, pv.sku
    FROM order_items oi
    LEFT JOIN product_variants pv ON oi.variantId = pv.id
    WHERE oi.orderId = ?
    ORDER BY oi.createdAt
  `).bind(id).all();
  
  order.items = (itemsResult.results || []).map(item => ({
    ...item,
    productSnapshot: JSON.parse(item.productSnapshot as string)
  })) as OrderItem[];
  
  return order;
};

// ========================================
// WISHLIST FUNCTIONS
// ========================================

export const addToWishlist = async (userId: string, productId: string): Promise<WishlistItem> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Find or create default wishlist for user
  let wishlist = await db.prepare(`
    SELECT * FROM wishlists WHERE userId = ? AND name = 'My Wishlist'
  `).bind(userId).first();
  
  if (!wishlist) {
    const wishlistId = generateId();
    await db.prepare(`
      INSERT INTO wishlists (id, userId, name, isPublic, createdAt, updatedAt)
      VALUES (?, ?, 'My Wishlist', FALSE, ?, ?)
    `).bind(wishlistId, userId, now, now).run();
    wishlist = { id: wishlistId };
  }
  
  // Add item to wishlist
  const itemId = generateId();
  await db.prepare(`
    INSERT OR REPLACE INTO wishlist_items (id, wishlistId, productId, addedAt)
    VALUES (?, ?, ?, ?)
  `).bind(itemId, wishlist.id, productId, now).run();
  
  return {
    id: itemId,
    wishlistId: wishlist.id,
    productId,
    addedAt: now
  };
};

export const removeFromWishlist = async (userId: string, productId: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.prepare(`
    DELETE FROM wishlist_items 
    WHERE wishlistId IN (
      SELECT id FROM wishlists WHERE userId = ?
    ) AND productId = ?
  `).bind(userId, productId).run();
};

export const clearWishlist = async (userId: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.prepare(`
    DELETE FROM wishlist_items 
    WHERE wishlistId IN (
      SELECT id FROM wishlists WHERE userId = ?
    )
  `).bind(userId).run();
};

export const getWishlist = async (userId: string): Promise<WishlistItem[]> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT wi.*, p.name as productName, p.basePrice, p.slug
    FROM wishlist_items wi
    INNER JOIN wishlists w ON wi.wishlistId = w.id
    LEFT JOIN products p ON wi.productId = p.id
    WHERE w.userId = ?
    ORDER BY wi.addedAt DESC
  `).bind(userId).all();
  
  return (result.results || []).map(row => ({
    id: row.id,
    wishlistId: row.wishlistId,
    productId: row.productId,
    variantId: row.variantId,
    addedAt: row.addedAt,
    product: row.productName ? {
      id: row.productId,
      name: row.productName,
      slug: row.slug,
      brandId: '', // Will be populated when needed
      sku: '', // Will be populated when needed
      basePrice: row.basePrice,
      isActive: true,
      isFeatured: false,
      createdAt: '',
      updatedAt: ''
    } : undefined
  }));
};

// ========================================
// MISSING FUNCTIONS
// ========================================

export const getAllProducts = async (params?: {
  limit?: number;
  offset?: number;
  category?: string;
  brandId?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}): Promise<Product[]> => {
  return await getProducts({
    ...params,
    categoryId: params?.category,
    searchTerm: params?.search
  });
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const db = await getDatabase();
  
  const result = await db.prepare(`
    SELECT p.*, 
           b.name as brandName, 
           b.slug as brandSlug,
           b.description as brandDescription,
           b.logo as brandLogo,
           b.website as brandWebsite,
           b.isActive as brandIsActive,
           b.createdAt as brandCreatedAt,
           b.updatedAt as brandUpdatedAt
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
    WHERE p.id = ?
  `).bind(id).first();
  
  if (!result) return null;
  
  return {
    ...result,
    basePrice: Number(result.basePrice),
    compareAtPrice: result.compareAtPrice ? Number(result.compareAtPrice) : undefined,
    images: [],
    variants: [],
    technicalSpecs: result.technicalSpecs ? JSON.parse(result.technicalSpecs) : {},
    features: result.features ? JSON.parse(result.features) : [],
    toggleOptions: result.toggleOptions ? JSON.parse(result.toggleOptions) : {},
    relatedProducts: result.relatedProducts ? JSON.parse(result.relatedProducts) : [],
    brand: result.brandId ? { 
      id: result.brandId, 
      name: result.brandName || 'Unknown', 
      slug: result.brandSlug || result.brandId,
      description: result.brandDescription || '',
      logo: result.brandLogo || '',
      website: result.brandWebsite || '',
      isActive: result.brandIsActive || false,
      createdAt: result.brandCreatedAt || '',
      updatedAt: result.brandUpdatedAt || ''
    } : undefined
  } as Product;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  try {
    const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return result.meta?.changes > 0;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

export const createProductVariant = async (data: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariant> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_variants (
      id, productId, name, sku, price, compareAtPrice, cost, position, 
      isDefault, barcode, trackInventory, continueSellingWhenOutOfStock, 
      requiresShipping, taxable, createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    data.productId, 
    data.name, 
    data.sku, 
    data.price || null, 
    data.compareAtPrice || null,
    data.cost || null, 
    data.position || 0, 
    data.isDefault || false, 
    data.barcode || null, 
    data.trackInventory !== false,
    data.continueSellingWhenOutOfStock || false, 
    data.requiresShipping !== false, 
    data.taxable !== false,
    now, 
    now
  ).run();
  
  return {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
};

export const createProductImage = async (data: Omit<ProductImage, 'id' | 'createdAt'>): Promise<ProductImage> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_images (id, productId, variantId, url, altText, position, isMainImage, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    data.productId, 
    data.variantId || null, 
    data.url, 
    data.altText || null, 
    data.position || 0, 
    data.isMainImage || false, 
    now
  ).run();
  
  return {
    id,
    ...data,
    createdAt: now
  };
};

export const updateInventory = async (variantId: string, quantity: number, locationId?: string): Promise<boolean> => {
  const db = await getDatabase();
  try {
    // Get default location if none specified
    if (!locationId) {
      const defaultLocation = await db.prepare('SELECT id FROM inventory_locations WHERE (isDefault = TRUE OR isDefault = "true") LIMIT 1').first();
      locationId = defaultLocation?.id;
      
      // Create default location if none exists
      if (!locationId) {
        locationId = generateId();
        await db.prepare(`
          INSERT INTO inventory_locations (id, name, isDefault, isActive, createdAt, updatedAt)
          VALUES (?, 'Default Location', TRUE, TRUE, ?, ?)
        `).bind(locationId, new Date().toISOString(), new Date().toISOString()).run();
      }
    }
    
    const now = new Date().toISOString();
    const result = await db.prepare(`
      INSERT OR REPLACE INTO inventory_items (id, variantId, locationId, quantity, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).bind(generateId(), variantId, locationId, quantity, now).run();
    
    return result.meta?.changes > 0;
  } catch (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
};

export const getAllBrands = async (): Promise<Brand[]> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM brands ORDER BY name ASC').all();
  return result.results || [];
};

export const createBrand = async (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brand> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO brands (id, name, slug, description, logo, website, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.name, data.slug, data.description || '', 
    data.logo || '', data.website || '', now, now
  ).run();
  
  return { id, ...data, description: data.description || '', logo: data.logo || '', website: data.website || '', createdAt: now, updatedAt: now };
};

export const getAllCategories = async (): Promise<ProductCategory[]> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM product_categories ORDER BY sortOrder ASC, name ASC').all();
  return result.results || [];
};

export const createCategory = async (data: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductCategory> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_categories (id, name, slug, description, parentId, sortOrder, isActive, seoTitle, seoDescription, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.name, data.slug, data.description, data.parentId, 
    data.sortOrder, data.isActive, data.seoTitle, data.seoDescription, 
    now, now
  ).run();
  
  return {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
};

export const getAllCoupons = async (params?: {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Coupon[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM coupons';
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.isActive !== undefined) {
    conditions.push('(isActive = ? OR isActive = ?)');
    bindings.push(params.isActive, params.isActive.toString());
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY createdAt DESC';
  
  if (params?.limit) {
    query += ' LIMIT ?';
    bindings.push(params.limit);
    
    if (params?.offset) {
      query += ' OFFSET ?';
      bindings.push(params.offset);
    }
  }
  
  const result = await db.prepare(query).bind(...bindings).all();
  return result.results?.map((coupon: any) => ({
    ...coupon,
    value: Number(coupon.value),
    minimumAmount: coupon.minimumAmount ? Number(coupon.minimumAmount) : undefined,
    maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
    usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : undefined,
    usageCount: Number(coupon.usageCount || 0),
    perCustomerLimit: coupon.perCustomerLimit ? Number(coupon.perCustomerLimit) : undefined
  })) || [];
};

export const createCoupon = async (data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO coupons (
      id, code, name, description, type, value, minimumAmount, maximumDiscount, 
      usageLimit, usageCount, perCustomerLimit, isActive, startsAt, expiresAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.code, data.name || '', data.description || null, data.type, data.value, 
    data.minimumAmount || null, data.maximumDiscount || null, data.usageLimit || null, 
    0, data.perCustomerLimit || null, data.isActive !== false, 
    data.startsAt || null, data.expiresAt || null, now, now
  ).run();
  
  return { 
    id, 
    ...data, 
    name: data.name || '',
    description: data.description || undefined,
    usageCount: 0, 
    isActive: data.isActive !== false, 
    createdAt: now, 
    updatedAt: now 
  };
};

export const getProductReviews = async (
  productId: string, 
  options?: {
    sortBy?: 'createdAt' | 'rating' | 'helpfulVotes';
    limit?: number;
    offset?: number;
    userId?: string;
  }
): Promise<ProductReview[]> => {
  const db = await getDatabase();
  
  let query = `
    SELECT * FROM product_reviews 
    WHERE productId = ? AND (isPublished = true OR isPublished = 'true')
  `;
  const params = [productId];
  
  // Add user filter if provided
  if (options?.userId) {
    query += ` AND userId = ?`;
    params.push(options.userId);
  }
  
  // Add sorting
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = sortBy === 'rating' ? 'DESC' : (sortBy === 'helpfulVotes' ? 'DESC' : 'DESC');
  query += ` ORDER BY ${sortBy} ${sortOrder}`;
  
  // Add pagination
  if (options?.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit.toString());
    
    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset.toString());
    }
  }
  
  const result = await db.prepare(query).bind(...params).all();
  return result.results?.map((review: any) => ({
    ...review,
    rating: Number(review.rating),
    helpfulVotes: Number(review.helpfulVotes || 0)
  })) || [];
};

export const createProductReview = async (data: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductReview> => {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_reviews (id, productId, userId, rating, title, content, isVerified, isPublished, helpfulVotes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.productId, data.userId, data.rating, data.title, data.content, data.isVerified || false, data.isPublished || false, data.helpfulVotes || 0, now, now).run();
  
  return { id, ...data, helpfulVotes: data.helpfulVotes || 0, createdAt: now, updatedAt: now };
};

export const updateReviewHelpfulVotes = async (reviewId: string): Promise<boolean> => {
  const db = await getDatabase();
  try {
    const result = await db.prepare(`
      UPDATE product_reviews SET helpfulVotes = helpfulVotes + 1, updatedAt = ? WHERE id = ?
    `).bind(new Date().toISOString(), reviewId).run();
    return result.meta?.changes > 0;
  } catch (error) {
    console.error('Error updating review helpful votes:', error);
    return false;
  }
};

export const getSupportTicketById = async (id: string): Promise<SupportTicket | null> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(id).first();
  return result ? result as SupportTicket : null;
};

export const updateSupportTicket = async (id: string, data: Partial<SupportTicket>): Promise<SupportTicket | null> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) { updateFields.push('status = ?'); values.push(data.status); }
    if (data.priority !== undefined) { updateFields.push('priority = ?'); values.push(data.priority); }
    if (data.assignedTo !== undefined) { updateFields.push('assignedTo = ?'); values.push(data.assignedTo); }
    
    if (updateFields.length === 0) return await getSupportTicketById(id);
    
    updateFields.push('updatedAt = ?');
    values.push(now, id);
    
    await db.prepare(`UPDATE support_tickets SET ${updateFields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await getSupportTicketById(id);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return null;
  }
};

export const getWishlistItems = async (userId: string): Promise<WishlistItem[]> => {
  return await getWishlist(userId);
};

// ========================================
// UPDATE FUNCTIONS
// ========================================

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product | null> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  try {
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) { updateFields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { updateFields.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { updateFields.push('description = ?'); values.push(data.description); }
    if (data.shortDescription !== undefined) { updateFields.push('shortDescription = ?'); values.push(data.shortDescription); }
    if (data.brandId !== undefined) { updateFields.push('brandId = ?'); values.push(data.brandId); }
    if (data.basePrice !== undefined) { updateFields.push('basePrice = ?'); values.push(data.basePrice); }
    if (data.compareAtPrice !== undefined) { updateFields.push('compareAtPrice = ?'); values.push(data.compareAtPrice); }
    if (data.cost !== undefined) { updateFields.push('cost = ?'); values.push(data.cost); }
    if (data.isActive !== undefined) { updateFields.push('isActive = ?'); values.push(data.isActive); }
    if (data.isFeatured !== undefined) { updateFields.push('isFeatured = ?'); values.push(data.isFeatured); }
    if (data.weight !== undefined) { updateFields.push('weight = ?'); values.push(data.weight); }
    if (data.dimensions !== undefined) { updateFields.push('dimensions = ?'); values.push(data.dimensions); }
    if (data.powerRequirements !== undefined) { updateFields.push('powerRequirements = ?'); values.push(data.powerRequirements); }
    if (data.compatibility !== undefined) { updateFields.push('compatibility = ?'); values.push(data.compatibility); }
    if (data.technicalSpecs !== undefined) { updateFields.push('technicalSpecs = ?'); values.push(JSON.stringify(data.technicalSpecs)); }
    if (data.youtubeVideoId !== undefined) { updateFields.push('youtubeVideoId = ?'); values.push(data.youtubeVideoId); }
    if (data.features !== undefined) {
      updateFields.push('features = ?');
      values.push(data.features ? JSON.stringify(data.features) : null);
    }
    if (data.toggleOptions !== undefined) {
      updateFields.push('toggleOptions = ?');
      values.push(data.toggleOptions ? JSON.stringify(data.toggleOptions) : null);
    }
    if (data.powerConsumption !== undefined) { updateFields.push('powerConsumption = ?'); values.push(data.powerConsumption); }
    if (data.relatedProducts !== undefined) {
      updateFields.push('relatedProducts = ?');
      values.push(data.relatedProducts ? JSON.stringify(data.relatedProducts) : null);
    }
    
    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await db.prepare(query).bind(...values).run();
    
    // Return updated product
    return await getProductById(id);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const updateOrder = async (id: string, data: Partial<Order>): Promise<Order | null> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  try {
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) { updateFields.push('status = ?'); values.push(data.status); }
    if (data.paymentStatus !== undefined) { updateFields.push('paymentStatus = ?'); values.push(data.paymentStatus); }
    if (data.trackingNumber !== undefined) { updateFields.push('trackingNumber = ?'); values.push(data.trackingNumber); }
    if (data.shippingMethod !== undefined) { updateFields.push('shippingMethod = ?'); values.push(data.shippingMethod); }
    if (data.notes !== undefined) { updateFields.push('notes = ?'); values.push(data.notes); }
    if (data.adminNotes !== undefined) { updateFields.push('adminNotes = ?'); values.push(data.adminNotes); }
    if (data.stripePaymentIntentId !== undefined) { updateFields.push('stripePaymentIntentId = ?'); values.push(data.stripePaymentIntentId); }
    if (data.stripeChargeId !== undefined) { updateFields.push('stripeChargeId = ?'); values.push(data.stripeChargeId); }
    if (data.paymentMethod !== undefined) { updateFields.push('paymentMethod = ?'); values.push(data.paymentMethod); }
    
    // Handle special timestamp fields
    if (data.status === 'shipped' && !data.shippedAt) {
      updateFields.push('shippedAt = ?');
      values.push(now);
    }
    if (data.status === 'delivered' && !data.deliveredAt) {
      updateFields.push('deliveredAt = ?');
      values.push(now);
    }
    
    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    const query = `
      UPDATE orders_new 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await db.prepare(query).bind(...values).run();
    
    // Return updated order
    return await getOrderById(id);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// ========================================
// INITIALIZATION
// ========================================

export const initializeEcommerceDatabase = async (): Promise<void> => {
  const db = await getDatabase();
  
  try {
    // Execute the e-commerce schema first
    await db.exec(`
      -- Product categories (overdrive, delay, reverb, etc.)
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        parentId TEXT,
        sortOrder INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        seoTitle TEXT,
        seoDescription TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (parentId) REFERENCES product_categories (id)
      );

      -- Brands (M2 Labs, potential future brands)
      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        logo TEXT,
        website TEXT,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Main products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        shortDescription TEXT,
        brandId TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        basePrice REAL NOT NULL,
        compareAtPrice REAL,
        cost REAL,
        isActive BOOLEAN DEFAULT TRUE,
        isFeatured BOOLEAN DEFAULT FALSE,
        weight REAL,
        dimensions TEXT,
        powerRequirements TEXT,
        compatibility TEXT,
        technicalSpecs TEXT,
        youtubeVideoId TEXT,
        features TEXT,
        toggleOptions TEXT,
        powerConsumption TEXT,
        relatedProducts TEXT,
        seoTitle TEXT,
        seoDescription TEXT,
        metaKeywords TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (brandId) REFERENCES brands (id)
      );

      -- Product variants (different colors, limited editions)
      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price REAL,
        compareAtPrice REAL,
        cost REAL,
        position INTEGER DEFAULT 0,
        isDefault BOOLEAN DEFAULT FALSE,
        barcode TEXT,
        trackInventory BOOLEAN DEFAULT TRUE,
        continueSellingWhenOutOfStock BOOLEAN DEFAULT FALSE,
        requiresShipping BOOLEAN DEFAULT TRUE,
        taxable BOOLEAN DEFAULT TRUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );

      -- Product images
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        variantId TEXT,
        url TEXT NOT NULL,
        altText TEXT,
        position INTEGER DEFAULT 0,
        isMainImage BOOLEAN DEFAULT FALSE,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE
      );

      -- Persistent shopping carts
      CREATE TABLE IF NOT EXISTS shopping_carts (
        id TEXT PRIMARY KEY,
        userId TEXT,
        sessionId TEXT,
        currency TEXT DEFAULT 'USD',
        abandonedAt TEXT,
        convertedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Cart items
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cartId TEXT NOT NULL,
        variantId TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unitPrice REAL NOT NULL,
        addedAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (cartId) REFERENCES shopping_carts (id) ON DELETE CASCADE,
        FOREIGN KEY (variantId) REFERENCES product_variants (id)
      );

      -- Updated orders table
      CREATE TABLE IF NOT EXISTS orders_new (
        id TEXT PRIMARY KEY,
        orderNumber TEXT UNIQUE NOT NULL,
        userId TEXT,
        email TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
        paymentStatus TEXT NOT NULL CHECK (paymentStatus IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')) DEFAULT 'pending',
        subtotal REAL NOT NULL,
        taxAmount REAL NOT NULL DEFAULT 0,
        shippingAmount REAL NOT NULL DEFAULT 0,
        discountAmount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        stripePaymentIntentId TEXT,
        stripeChargeId TEXT,
        paymentMethod TEXT,
        shippingAddress TEXT NOT NULL,
        billingAddress TEXT NOT NULL,
        shippingMethod TEXT,
        trackingNumber TEXT,
        shippedAt TEXT,
        deliveredAt TEXT,
        notes TEXT,
        adminNotes TEXT,
        couponCode TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      );

      -- Order items
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        variantId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        productSnapshot TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders_new (id) ON DELETE CASCADE,
        FOREIGN KEY (variantId) REFERENCES product_variants (id)
      );

      -- Inventory locations
      CREATE TABLE IF NOT EXISTS inventory_locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        isDefault BOOLEAN DEFAULT FALSE,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Inventory tracking
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        variantId TEXT NOT NULL,
        locationId TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reservedQuantity INTEGER NOT NULL DEFAULT 0,
        costPrice REAL,
        lastRestockedAt TEXT,
        lowStockThreshold INTEGER DEFAULT 5,
        updatedAt TEXT NOT NULL,
        UNIQUE(variantId, locationId),
        FOREIGN KEY (variantId) REFERENCES product_variants (id) ON DELETE CASCADE,
        FOREIGN KEY (locationId) REFERENCES inventory_locations (id)
      );

      -- Support tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        ticketNumber TEXT UNIQUE NOT NULL,
        userId TEXT,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('general', 'technical', 'warranty', 'shipping', 'billing', 'other')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
        status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')) DEFAULT 'open',
        assignedTo TEXT,
        orderId TEXT,
        productId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (assignedTo) REFERENCES users (id),
        FOREIGN KEY (orderId) REFERENCES orders_new (id),
        FOREIGN KEY (productId) REFERENCES products (id)
      );

      -- Support ticket messages
      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        userId TEXT,
        isInternal BOOLEAN DEFAULT FALSE,
        message TEXT NOT NULL,
        attachments TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (ticketId) REFERENCES support_tickets (id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users (id)
      );

      -- Shipping methods
      CREATE TABLE IF NOT EXISTS shipping_methods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        carrier TEXT,
        serviceName TEXT,
        price REAL NOT NULL,
        isFree BOOLEAN DEFAULT FALSE,
        freeShippingThreshold REAL,
        estimatedDays TEXT,
        isActive BOOLEAN DEFAULT TRUE,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Product category relations (many-to-many)
      CREATE TABLE IF NOT EXISTS product_category_relations (
        productId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        PRIMARY KEY (productId, categoryId),
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES product_categories (id) ON DELETE CASCADE
      );

      -- Wishlists
      CREATE TABLE IF NOT EXISTS wishlists (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        productId TEXT NOT NULL,
        addedAt TEXT NOT NULL,
        UNIQUE(userId, productId),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_products_brandId ON products (brandId);
      CREATE INDEX IF NOT EXISTS idx_products_isActive ON products (isActive);
      CREATE INDEX IF NOT EXISTS idx_products_isFeatured ON products (isFeatured);
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
      CREATE INDEX IF NOT EXISTS idx_product_variants_productId ON product_variants (productId);
      CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants (sku);
      CREATE INDEX IF NOT EXISTS idx_product_category_relations_productId ON product_category_relations (productId);
      CREATE INDEX IF NOT EXISTS idx_product_category_relations_categoryId ON product_category_relations (categoryId);
      CREATE INDEX IF NOT EXISTS idx_shopping_carts_userId ON shopping_carts (userId);
      CREATE INDEX IF NOT EXISTS idx_shopping_carts_sessionId ON shopping_carts (sessionId);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cartId ON cart_items (cartId);
      CREATE INDEX IF NOT EXISTS idx_orders_new_userId ON orders_new (userId);
      CREATE INDEX IF NOT EXISTS idx_orders_new_status ON orders_new (status);
      CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items (orderId);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets (userId);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
    `);
    
    console.log('E-commerce schema created successfully');
    // Create default brand
    const brandExists = await db.prepare('SELECT COUNT(*) as count FROM brands WHERE slug = ?').bind('m2-labs').first();
    if (brandExists.count === 0) {
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
    }
    
    // Create default inventory location
    const locationExists = await db.prepare('SELECT COUNT(*) as count FROM inventory_locations WHERE id = ?').bind('main-warehouse').first();
    if (locationExists.count === 0) {
      await db.prepare(`
        INSERT INTO inventory_locations (id, name, isDefault, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        'main-warehouse',
        'Main Warehouse',
        true,
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }
    
    // Create default categories
    const categoryExists = await db.prepare('SELECT COUNT(*) as count FROM product_categories WHERE slug = ?').bind('overdrive').first();
    if (categoryExists.count === 0) {
      const now = new Date().toISOString();
      const categories = [
        { id: 'cat-overdrive', name: 'Overdrive', slug: 'overdrive', description: 'Warm tube-like overdrive effects' },
        { id: 'cat-distortion', name: 'Distortion', slug: 'distortion', description: 'High-gain distortion effects' },
        { id: 'cat-delay', name: 'Delay', slug: 'delay', description: 'Echo and delay effects' },
        { id: 'cat-reverb', name: 'Reverb', slug: 'reverb', description: 'Ambient reverb effects' },
        { id: 'cat-chorus', name: 'Chorus', slug: 'chorus', description: 'Modulation and chorus effects' },
        { id: 'cat-fuzz', name: 'Fuzz', slug: 'fuzz', description: 'Vintage fuzz effects' }
      ];
      
      for (const category of categories) {
        await db.prepare(`
          INSERT INTO product_categories (id, name, slug, description, sortOrder, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          category.id, category.name, category.slug, category.description, 0, true, now, now
        ).run();
      }
    }
    
    // Create default shipping method
    const shippingExists = await db.prepare('SELECT COUNT(*) as count FROM shipping_methods WHERE id = ?').bind('standard-shipping').first();
    if (shippingExists.count === 0) {
      await db.prepare(`
        INSERT INTO shipping_methods (id, name, description, price, isFree, freeShippingThreshold, estimatedDays, isActive, sortOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'standard-shipping',
        'Standard Shipping',
        'Free shipping on orders over $50',
        5.99,
        false,
        50.00,
        '3-5 business days',
        true,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }
    
    // Initialize distributor tables
    await initializeDistributorTables(db);
    
    console.log('E-commerce database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize e-commerce database:', error);
    throw error;
  }
};

// Initialize distributor-specific tables
const initializeDistributorTables = async (db: any) => {
  // Distributors table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS distributors (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      contactName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postalCode TEXT,
      country TEXT DEFAULT 'US',
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      territory TEXT,
      discountRate REAL DEFAULT 0.0,
      creditLimit REAL DEFAULT 0.0,
      currentBalance REAL DEFAULT 0.0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
      tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'exclusive')),
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt TEXT,
      createdBy TEXT,
      isVerified BOOLEAN DEFAULT FALSE
    )
  `).run();

  // Distributor inventory requests
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS distributor_inventory_requests (
      id TEXT PRIMARY KEY,
      distributorId TEXT NOT NULL,
      productId TEXT NOT NULL,
      variantId TEXT,
      requestedQuantity INTEGER NOT NULL,
      approvedQuantity INTEGER DEFAULT 0,
      unitPrice REAL,
      totalAmount REAL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      requestNotes TEXT,
      adminNotes TEXT,
      requestedDate TEXT DEFAULT CURRENT_TIMESTAMP,
      approvedDate TEXT,
      fulfilledDate TEXT,
      approvedBy TEXT,
      rejectionReason TEXT,
      FOREIGN KEY (distributorId) REFERENCES distributors(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `).run();

  // Distributor inquiries
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS distributor_inquiries (
      id TEXT PRIMARY KEY,
      distributorId TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT DEFAULT 'general' CHECK (category IN ('general', 'inventory', 'pricing', 'shipping', 'technical', 'billing', 'returns')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_distributor', 'resolved', 'closed')),
      message TEXT NOT NULL,
      distributorResponse TEXT,
      adminResponse TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      resolvedAt TEXT,
      resolvedBy TEXT,
      FOREIGN KEY (distributorId) REFERENCES distributors(id)
    )
  `).run();

  // Create indexes
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributors_email ON distributors(email)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributors_username ON distributors(username)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributor_requests_distributor ON distributor_inventory_requests(distributorId)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributor_requests_status ON distributor_inventory_requests(status)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributor_inquiries_distributor ON distributor_inquiries(distributorId)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_distributor_inquiries_status ON distributor_inquiries(status)').run();
};

// =============================================================================
// DISTRIBUTOR INTERFACES
// =============================================================================

export interface Distributor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  username: string;
  territory?: string;
  discountRate: number;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  tier: 'standard' | 'premium' | 'exclusive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
  isVerified: boolean;
}

export interface DistributorInventoryRequest {
  id: string;
  distributorId: string;
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  approvedQuantity: number;
  unitPrice?: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestNotes?: string;
  adminNotes?: string;
  requestedDate: string;
  approvedDate?: string;
  fulfilledDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface DistributorInquiry {
  id: string;
  distributorId: string;
  subject: string;
  category: 'general' | 'inventory' | 'pricing' | 'shipping' | 'technical' | 'billing' | 'returns';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_distributor' | 'resolved' | 'closed';
  message: string;
  distributorResponse?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// =============================================================================
// DISTRIBUTOR FUNCTIONS
// =============================================================================

// Create a new distributor
export const createDistributor = async (distributorData: Omit<Distributor, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<Distributor> => {
  const db = await getDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const result = await db.prepare(`
    INSERT INTO distributors (
      id, companyName, contactName, email, phone, address, city, state, 
      postalCode, country, username, passwordHash, territory, discountRate, 
      creditLimit, currentBalance, status, tier, notes, createdAt, updatedAt, 
      lastLoginAt, createdBy, isVerified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    distributorData.companyName,
    distributorData.contactName,
    distributorData.email,
    distributorData.phone || null,
    distributorData.address || null,
    distributorData.city || null,
    distributorData.state || null,
    distributorData.postalCode || null,
    distributorData.country || 'US',
    distributorData.username,
    distributorData.passwordHash,
    distributorData.territory || null,
    distributorData.discountRate,
    distributorData.creditLimit,
    distributorData.currentBalance,
    distributorData.status,
    distributorData.tier,
    distributorData.notes || null,
    now,
    now,
    distributorData.lastLoginAt || null,
    distributorData.createdBy || null,
    distributorData.isVerified
  ).run();

  if (!result.success) {
    throw new Error('Failed to create distributor');
  }

  return {
    ...distributorData,
    id,
    createdAt: now,
    updatedAt: now
  };
};

// Get all distributors with optional filtering
export const getAllDistributors = async (params?: {
  status?: string;
  tier?: string;
  territory?: string;
}): Promise<Distributor[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM distributors WHERE 1=1';
  const bindings: any[] = [];
  
  if (params?.status) {
    query += ' AND status = ?';
    bindings.push(params.status);
  }
  
  if (params?.tier) {
    query += ' AND tier = ?';
    bindings.push(params.tier);
  }
  
  if (params?.territory) {
    query += ' AND territory = ?';
    bindings.push(params.territory);
  }
  
  query += ' ORDER BY companyName ASC';
  
  const result = await db.prepare(query).bind(...bindings).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    discountRate: parseFloat(row.discountRate) || 0,
    creditLimit: parseFloat(row.creditLimit) || 0,
    currentBalance: parseFloat(row.currentBalance) || 0,
    isVerified: Boolean(row.isVerified)
  }));
};

// Get distributor by ID
export const getDistributorById = async (id: string): Promise<Distributor | null> => {
  const db = await getDatabase();
  
  const result = await db.prepare('SELECT * FROM distributors WHERE id = ?').bind(id).first();
  
  if (!result) return null;
  
  return {
    ...result,
    discountRate: parseFloat(result.discountRate) || 0,
    creditLimit: parseFloat(result.creditLimit) || 0,
    currentBalance: parseFloat(result.currentBalance) || 0,
    isVerified: Boolean(result.isVerified)
  };
};

// Get distributor by username (for login)
export const getDistributorByUsername = async (username: string): Promise<Distributor | null> => {
  const db = await getDatabase();
  
  const result = await db.prepare('SELECT * FROM distributors WHERE username = ?').bind(username).first();
  
  if (!result) return null;
  
  return {
    ...result,
    discountRate: parseFloat(result.discountRate) || 0,
    creditLimit: parseFloat(result.creditLimit) || 0,
    currentBalance: parseFloat(result.currentBalance) || 0,
    isVerified: Boolean(result.isVerified)
  };
};

// Update distributor
export const updateDistributor = async (id: string, updates: Partial<Omit<Distributor, 'id' | 'createdAt'>>): Promise<Distributor | null> => {
  const db = await getDatabase();
  
  const setClauses: string[] = [];
  const bindings: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
      setClauses.push(`${key} = ?`);
      bindings.push(value);
    }
  });
  
  if (setClauses.length === 0) {
    return getDistributorById(id);
  }
  
  setClauses.push('updatedAt = ?');
  bindings.push(new Date().toISOString());
  bindings.push(id);
  
  const result = await db.prepare(`
    UPDATE distributors 
    SET ${setClauses.join(', ')} 
    WHERE id = ?
  `).bind(...bindings).run();
  
  if (!result.success) {
    throw new Error('Failed to update distributor');
  }
  
  return getDistributorById(id);
};

// Delete distributor
export const deleteDistributor = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  
  const result = await db.prepare('DELETE FROM distributors WHERE id = ?').bind(id).run();
  return result.success;
};

// Create inventory request
export const createInventoryRequest = async (requestData: Omit<DistributorInventoryRequest, 'id' | 'requestedDate'>): Promise<DistributorInventoryRequest> => {
  const db = await getDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const result = await db.prepare(`
    INSERT INTO distributor_inventory_requests (
      id, distributorId, productId, variantId, requestedQuantity, 
      approvedQuantity, unitPrice, totalAmount, status, priority, 
      requestNotes, adminNotes, requestedDate, approvedDate, 
      fulfilledDate, approvedBy, rejectionReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    requestData.distributorId,
    requestData.productId,
    requestData.variantId || null,
    requestData.requestedQuantity,
    requestData.approvedQuantity,
    requestData.unitPrice || null,
    requestData.totalAmount || null,
    requestData.status,
    requestData.priority,
    requestData.requestNotes || null,
    requestData.adminNotes || null,
    now,
    requestData.approvedDate || null,
    requestData.fulfilledDate || null,
    requestData.approvedBy || null,
    requestData.rejectionReason || null
  ).run();

  if (!result.success) {
    throw new Error('Failed to create inventory request');
  }

  return {
    ...requestData,
    id,
    requestedDate: now
  };
};

// Get inventory requests
export const getInventoryRequests = async (params?: {
  distributorId?: string;
  status?: string;
  priority?: string;
}): Promise<DistributorInventoryRequest[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM distributor_inventory_requests WHERE 1=1';
  const bindings: any[] = [];
  
  if (params?.distributorId) {
    query += ' AND distributorId = ?';
    bindings.push(params.distributorId);
  }
  
  if (params?.status) {
    query += ' AND status = ?';
    bindings.push(params.status);
  }
  
  if (params?.priority) {
    query += ' AND priority = ?';
    bindings.push(params.priority);
  }
  
  query += ' ORDER BY requestedDate DESC';
  
  const result = await db.prepare(query).bind(...bindings).all();
  return (result.results || []).map((row: any) => ({
    ...row,
    requestedQuantity: parseInt(row.requestedQuantity) || 0,
    approvedQuantity: parseInt(row.approvedQuantity) || 0,
    unitPrice: row.unitPrice ? parseFloat(row.unitPrice) : undefined,
    totalAmount: row.totalAmount ? parseFloat(row.totalAmount) : undefined
  }));
};

// Update inventory request
export const updateInventoryRequest = async (id: string, updates: Partial<DistributorInventoryRequest>): Promise<DistributorInventoryRequest | null> => {
  const db = await getDatabase();
  
  const setClauses: string[] = [];
  const bindings: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      setClauses.push(`${key} = ?`);
      bindings.push(value);
    }
  });
  
  if (setClauses.length === 0) {
    return null;
  }
  
  bindings.push(id);
  
  const result = await db.prepare(`
    UPDATE distributor_inventory_requests 
    SET ${setClauses.join(', ')} 
    WHERE id = ?
  `).bind(...bindings).run();
  
  if (!result.success) {
    throw new Error('Failed to update inventory request');
  }
  
  const updated = await db.prepare('SELECT * FROM distributor_inventory_requests WHERE id = ?').bind(id).first();
  
  if (!updated) return null;
  
  return {
    ...updated,
    requestedQuantity: parseInt(updated.requestedQuantity) || 0,
    approvedQuantity: parseInt(updated.approvedQuantity) || 0,
    unitPrice: updated.unitPrice ? parseFloat(updated.unitPrice) : undefined,
    totalAmount: updated.totalAmount ? parseFloat(updated.totalAmount) : undefined
  };
};

// Create distributor inquiry
export const createDistributorInquiry = async (inquiryData: Omit<DistributorInquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributorInquiry> => {
  const db = await getDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const result = await db.prepare(`
    INSERT INTO distributor_inquiries (
      id, distributorId, subject, category, priority, status, message,
      distributorResponse, adminResponse, createdAt, updatedAt, 
      resolvedAt, resolvedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    inquiryData.distributorId,
    inquiryData.subject,
    inquiryData.category,
    inquiryData.priority,
    inquiryData.status,
    inquiryData.message,
    inquiryData.distributorResponse || null,
    inquiryData.adminResponse || null,
    now,
    now,
    inquiryData.resolvedAt || null,
    inquiryData.resolvedBy || null
  ).run();

  if (!result.success) {
    throw new Error('Failed to create distributor inquiry');
  }

  return {
    ...inquiryData,
    id,
    createdAt: now,
    updatedAt: now
  };
};

// Get distributor inquiries
export const getDistributorInquiries = async (params?: {
  distributorId?: string;
  status?: string;
  category?: string;
}): Promise<DistributorInquiry[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM distributor_inquiries WHERE 1=1';
  const bindings: any[] = [];
  
  if (params?.distributorId) {
    query += ' AND distributorId = ?';
    bindings.push(params.distributorId);
  }
  
  if (params?.status) {
    query += ' AND status = ?';
    bindings.push(params.status);
  }
  
  if (params?.category) {
    query += ' AND category = ?';
    bindings.push(params.category);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
};
