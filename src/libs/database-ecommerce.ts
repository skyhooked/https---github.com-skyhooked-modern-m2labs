// E-commerce database layer for M2 Labs
// Comprehensive product, cart, order, and business feature management

import { generateId } from './auth';

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
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  powerRequirements?: string;
  compatibility?: string;
  technicalSpecs?: Record<string, any>;
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
function getDatabase(): D1Database {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const globalAny = globalThis as any;
  
  const db = globalAny.DB || 
             globalAny.env?.DB || 
             globalAny.__env?.DB ||
             globalAny.ASSETS?.env?.DB ||
             globalAny.context?.env?.DB;
  
  if (!db) {
    throw new Error('D1 Database binding not found');
  }
  
  return db;
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
  const db = getDatabase();
  
  let query = `
    SELECT p.*, b.name as brand_name, b.slug as brand_slug
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
  `;
  
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.isActive !== undefined) {
    conditions.push('p.isActive = ?');
    bindings.push(params.isActive);
  }
  
  if (params?.isFeatured !== undefined) {
    conditions.push('p.isFeatured = ?');
    bindings.push(params.isFeatured);
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
  
  return (result.results || []).map(row => ({
    ...row,
    dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
    technicalSpecs: row.technicalSpecs ? JSON.parse(row.technicalSpecs) : undefined,
    brand: row.brand_name ? {
      id: row.brandId,
      name: row.brand_name,
      slug: row.brand_slug
    } : undefined
  }));
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT p.*, b.name as brand_name, b.slug as brand_slug
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
    WHERE p.slug = ? AND p.isActive = true
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
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM product_variants
    WHERE productId = ?
    ORDER BY position ASC, isDefault DESC
  `).bind(productId).all();
  
  return result.results || [];
};

export const getProductImages = async (productId: string): Promise<ProductImage[]> => {
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT * FROM product_images
    WHERE productId = ?
    ORDER BY position ASC, isMainImage DESC
  `).bind(productId).all();
  
  return result.results || [];
};

export const getProductCategories = async (productId: string): Promise<ProductCategory[]> => {
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT c.* FROM product_categories c
    INNER JOIN product_category_relations pcr ON c.id = pcr.categoryId
    WHERE pcr.productId = ?
    ORDER BY c.sortOrder ASC
  `).bind(productId).all();
  
  return result.results || [];
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const db = getDatabase();
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
      seoTitle, seoDescription, metaKeywords, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    product.id, product.name, product.slug, product.description, product.shortDescription,
    product.brandId, product.sku, product.basePrice, product.compareAtPrice, product.cost,
    product.isActive, product.isFeatured, product.weight,
    product.dimensions ? JSON.stringify(product.dimensions) : null,
    product.powerRequirements, product.compatibility,
    product.technicalSpecs ? JSON.stringify(product.technicalSpecs) : null,
    product.seoTitle, product.seoDescription, product.metaKeywords,
    product.createdAt, product.updatedAt
  ).run();
  
  return product;
};

// ========================================
// CART FUNCTIONS
// ========================================

export const getCartByUserId = async (userId: string): Promise<ShoppingCart | null> => {
  const db = getDatabase();
  
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
  const db = getDatabase();
  
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

export const createCart = async (data: {
  userId?: string;
  sessionId?: string;
  currency?: string;
}): Promise<ShoppingCart> => {
  const db = getDatabase();
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
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT ci.*, 
           pv.name as variant_name, pv.sku as variant_sku, pv.price as variant_price,
           p.name as product_name, p.slug as product_slug, p.basePrice as product_basePrice
    FROM cart_items ci
    INNER JOIN product_variants pv ON ci.variantId = pv.id
    INNER JOIN products p ON pv.productId = p.id
    WHERE ci.cartId = ?
    ORDER BY ci.addedAt ASC
  `).bind(cartId).all();
  
  return (result.results || []).map(row => ({
    id: row.id,
    cartId: row.cartId,
    variantId: row.variantId,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    addedAt: row.addedAt,
    updatedAt: row.updatedAt,
    variant: {
      id: row.variantId,
      name: row.variant_name,
      sku: row.variant_sku,
      price: row.variant_price,
      product: {
        id: row.productId,
        name: row.product_name,
        slug: row.product_slug,
        basePrice: row.product_basePrice
      }
    }
  }));
};

export const addToCart = async (data: {
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}): Promise<CartItem> => {
  const db = getDatabase();
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
  const db = getDatabase();
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
  const db = getDatabase();
  
  await db.prepare('DELETE FROM cart_items WHERE id = ?').bind(itemId).run();
  return true;
};

export const clearCart = async (cartId: string): Promise<boolean> => {
  const db = getDatabase();
  
  await db.prepare('DELETE FROM cart_items WHERE cartId = ?').bind(cartId).run();
  return true;
};

// ========================================
// ORDER FUNCTIONS
// ========================================

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const db = getDatabase();
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
  const db = getDatabase();
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
  const db = getDatabase();
  
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
  const db = getDatabase();
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
    ticket.id, ticket.ticketNumber, ticket.userId, ticket.email, ticket.name, ticket.subject,
    ticket.category, ticket.priority, ticket.status, ticket.assignedTo, ticket.orderId,
    ticket.productId, ticket.createdAt, ticket.updatedAt
  ).run();
  
  return ticket;
};

export const createSupportMessage = async (data: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<SupportMessage> => {
  const db = getDatabase();
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
    message.id, message.ticketId, message.userId, message.isInternal, message.message,
    JSON.stringify(message.attachments), message.createdAt
  ).run();
  
  return message;
};

export const getSupportTickets = async (params?: {
  userId?: string;
  status?: string;
  category?: string;
}): Promise<SupportTicket[]> => {
  const db = getDatabase();
  
  let query = 'SELECT * FROM support_tickets';
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (params?.userId) {
    conditions.push('userId = ?');
    bindings.push(params.userId);
  }
  
  if (params?.status) {
    conditions.push('status = ?');
    bindings.push(params.status);
  }
  
  if (params?.category) {
    conditions.push('category = ?');
    bindings.push(params.category);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY createdAt DESC';
  
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
  const db = getDatabase();
  
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
  const db = getDatabase();
  
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
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO wishlists (id, userId, productId, addedAt)
    VALUES (?, ?, ?, ?)
  `).bind(id, userId, productId, now).run();
  
  return {
    id,
    userId,
    productId,
    addedAt: now
  };
};

export const removeFromWishlist = async (userId: string, productId: string): Promise<void> => {
  const db = getDatabase();
  
  await db.prepare(`
    DELETE FROM wishlists 
    WHERE userId = ? AND productId = ?
  `).bind(userId, productId).run();
};

export const clearWishlist = async (userId: string): Promise<void> => {
  const db = getDatabase();
  
  await db.prepare(`
    DELETE FROM wishlists 
    WHERE userId = ?
  `).bind(userId).run();
};

export const getWishlist = async (userId: string): Promise<WishlistItem[]> => {
  const db = getDatabase();
  
  const result = await db.prepare(`
    SELECT w.*, p.name as productName, p.basePrice, p.slug
    FROM wishlists w
    LEFT JOIN products p ON w.productId = p.id
    WHERE w.userId = ?
    ORDER BY w.addedAt DESC
  `).bind(userId).all();
  
  return result.results || [];
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
}): Promise<Product[]> => {
  return await getProducts(params);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const db = getDatabase();
  
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
    FROM products_new p
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
    tags: result.tags ? JSON.parse(result.tags) : [],
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
  const db = getDatabase();
  try {
    const result = await db.prepare('DELETE FROM products_new WHERE id = ?').bind(id).run();
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

export const createProductVariant = async (data: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariant> => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_variants (id, productId, name, price, stock, sku, isDefault, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.productId, data.name, data.price, data.stock || 0, 
    data.sku || '', data.isDefault || false, now, now
  ).run();
  
  return {
    id,
    ...data,
    stock: data.stock || 0,
    sku: data.sku || '',
    isDefault: data.isDefault || false,
    createdAt: now,
    updatedAt: now
  };
};

export const createProductImage = async (data: Omit<ProductImage, 'id' | 'createdAt'>): Promise<ProductImage> => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_images (id, productId, url, alt, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.productId, data.url, data.alt || '', 
    data.sortOrder || 0, now
  ).run();
  
  return {
    id,
    ...data,
    alt: data.alt || '',
    sortOrder: data.sortOrder || 0,
    createdAt: now
  };
};

export const updateInventory = async (productId: string, variantId: string, quantity: number): Promise<boolean> => {
  const db = getDatabase();
  try {
    const result = await db.prepare(`
      UPDATE product_variants 
      SET stock = ?, updatedAt = ?
      WHERE id = ? AND productId = ?
    `).bind(quantity, new Date().toISOString(), variantId, productId).run();
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
};

export const getAllBrands = async (): Promise<Brand[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM brands ORDER BY name ASC').all();
  return result.results || [];
};

export const createBrand = async (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brand> => {
  const db = getDatabase();
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

export const getAllCategories = async (): Promise<Category[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return result.results || [];
};

export const createCategory = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO categories (id, name, slug, description, parentId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.name, data.slug, data.description || '', data.parentId || null, now, now).run();
  
  return { id, ...data, description: data.description || '', parentId: data.parentId || null, createdAt: now, updatedAt: now };
};

export const getAllCoupons = async (): Promise<Coupon[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM coupons ORDER BY createdAt DESC').all();
  return result.results?.map((coupon: any) => ({
    ...coupon,
    value: Number(coupon.value),
    minimumAmount: coupon.minimumAmount ? Number(coupon.minimumAmount) : undefined,
    usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : undefined,
    usedCount: Number(coupon.usedCount || 0)
  })) || [];
};

export const createCoupon = async (data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO coupons (id, code, type, value, minimumAmount, usageLimit, usedCount, startsAt, expiresAt, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.code, data.type, data.value, data.minimumAmount || null,
    data.usageLimit || null, 0, data.startsAt || null, 
    data.expiresAt || null, data.isActive !== false, now, now
  ).run();
  
  return { id, ...data, usedCount: 0, isActive: data.isActive !== false, createdAt: now, updatedAt: now };
};

export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  const db = getDatabase();
  const result = await db.prepare(`
    SELECT * FROM product_reviews WHERE productId = ? AND isApproved = true ORDER BY createdAt DESC
  `).bind(productId).all();
  return result.results?.map((review: any) => ({
    ...review,
    rating: Number(review.rating),
    helpfulVotes: Number(review.helpfulVotes || 0)
  })) || [];
};

export const createProductReview = async (data: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductReview> => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO product_reviews (id, productId, userId, userName, rating, title, content, isApproved, helpfulVotes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.productId, data.userId, data.userName, data.rating, data.title, data.content, data.isApproved || false, 0, now, now).run();
  
  return { id, ...data, isApproved: data.isApproved || false, helpfulVotes: 0, createdAt: now, updatedAt: now };
};

export const updateReviewHelpfulVotes = async (reviewId: string): Promise<boolean> => {
  const db = getDatabase();
  try {
    const result = await db.prepare(`
      UPDATE product_reviews SET helpfulVotes = helpfulVotes + 1, updatedAt = ? WHERE id = ?
    `).bind(new Date().toISOString(), reviewId).run();
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating review helpful votes:', error);
    return false;
  }
};

export const getSupportTicketById = async (id: string): Promise<SupportTicket | null> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(id).first();
  return result ? result as SupportTicket : null;
};

export const updateSupportTicket = async (id: string, data: Partial<SupportTicket>): Promise<SupportTicket | null> => {
  const db = getDatabase();
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
  const db = getDatabase();
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
    if (data.powerRequirements !== undefined) { updateFields.push('powerRequirements = ?'); values.push(data.powerRequirements); }
    if (data.compatibility !== undefined) { updateFields.push('compatibility = ?'); values.push(data.compatibility); }
    if (data.technicalSpecs !== undefined) { updateFields.push('technicalSpecs = ?'); values.push(JSON.stringify(data.technicalSpecs)); }
    
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
  const db = getDatabase();
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
  const db = getDatabase();
  
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
    
    console.log('E-commerce database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize e-commerce database:', error);
    throw error;
  }
};
