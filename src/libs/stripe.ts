// Stripe integration for M2 Labs e-commerce
// Server-side utilities for payment processing

import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
function getStripe(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  
  return new Stripe(key, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
  });
}

// ========================================
// PAYMENT INTENT FUNCTIONS
// ========================================

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  orderId: string;
  customerEmail: string;
  customerId?: string;
  metadata?: Record<string, string>;
  shipping?: {
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    name: string;
    phone?: string;
  };
}

export const createPaymentIntent = async (params: CreatePaymentIntentParams & { secretKey?: string }): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe(params.secretKey);
  
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: params.amount,
    currency: params.currency || 'usd',
    metadata: {
      orderId: params.orderId,
      customerEmail: params.customerEmail,
      source: 'M2Labs Website',
      ...params.metadata,
    },
    receipt_email: params.customerEmail,
    statement_descriptor: 'M2 LABS',
    statement_descriptor_suffix: 'PEDALS',
  };
  
  // Add customer if provided
  if (params.customerId) {
    paymentIntentParams.customer = params.customerId;
  }
  
  // Add shipping if provided
  if (params.shipping) {
    paymentIntentParams.shipping = params.shipping;
  }
  
  // Enable automatic payment methods for better conversion
  paymentIntentParams.automatic_payment_methods = {
    enabled: true,
    allow_redirects: 'always', // Allow redirects for PayPal, Klarna, etc.
  };
  
  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
  
  return paymentIntent;
};

export const confirmPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe();
  
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'requires_confirmation') {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  }
  
  return paymentIntent;
};

export const cancelPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe();
  
  return await stripe.paymentIntents.cancel(paymentIntentId);
};

// ========================================
// CUSTOMER FUNCTIONS
// ========================================

export const createStripeCustomer = async (data: {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> => {
  const stripe = getStripe();
  
  const customerParams: Stripe.CustomerCreateParams = {
    email: data.email,
    name: data.name,
    phone: data.phone,
    address: data.address,
    metadata: {
      source: 'M2Labs Website',
      ...data.metadata,
    },
  };
  
  return await stripe.customers.create(customerParams);
};

export const updateStripeCustomer = async (
  customerId: string, 
  data: Partial<{
    email: string;
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    metadata: Record<string, string>;
  }>
): Promise<Stripe.Customer> => {
  const stripe = getStripe();
  
  return await stripe.customers.update(customerId, data);
};

export const getStripeCustomer = async (customerId: string): Promise<Stripe.Customer> => {
  const stripe = getStripe();
  
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
};

export const getStripeCustomerByEmail = async (email: string): Promise<Stripe.Customer | null> => {
  const stripe = getStripe();
  
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });
  
  return customers.data.length > 0 ? customers.data[0] : null;
};

// ========================================
// REFUND FUNCTIONS
// ========================================

export const createRefund = async (data: {
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number; // Partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}): Promise<Stripe.Refund> => {
  const stripe = getStripe();
  
  const refundParams: Stripe.RefundCreateParams = {
    reason: data.reason,
    metadata: {
      source: 'M2Labs Admin',
      ...data.metadata,
    },
  };
  
  if (data.paymentIntentId) {
    refundParams.payment_intent = data.paymentIntentId;
  } else if (data.chargeId) {
    refundParams.charge = data.chargeId;
  } else {
    throw new Error('Either paymentIntentId or chargeId is required for refund');
  }
  
  if (data.amount) {
    refundParams.amount = data.amount;
  }
  
  return await stripe.refunds.create(refundParams);
};

// ========================================
// WEBHOOK FUNCTIONS
// ========================================

export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
): Stripe.Event => {
  const stripe = getStripe();
  
  return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
};

// ========================================
// PRICE CALCULATION FUNCTIONS
// ========================================

export const calculateTax = async (data: {
  amount: number; // in cents
  currency: string;
  customerAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}): Promise<number> => {
  // For now, return a simple US-based tax calculation
  // In production, you might want to use Stripe Tax or a third-party service
  
  const { customerAddress, amount } = data;
  
  // Simple tax rates by state (this should be replaced with real tax calculation)
  const taxRates: Record<string, number> = {
    'CA': 0.0875, // California
    'NY': 0.08,   // New York
    'TX': 0.0625, // Texas
    'FL': 0.06,   // Florida
    'WA': 0.065,  // Washington
    // Add more states as needed
  };
  
  const stateCode = customerAddress.state?.toUpperCase();
  const taxRate = taxRates[stateCode] || 0;
  
  return Math.round(amount * taxRate);
};

export const calculateShipping = async (data: {
  items: Array<{
    weight?: number;
    requiresShipping: boolean;
  }>;
  shippingAddress: {
    country: string;
    state: string;
    postal_code: string;
  };
  subtotal: number; // in cents
}): Promise<{
  amount: number; // in cents
  method: string;
  estimatedDays: string;
}> => {
  const { items, shippingAddress, subtotal } = data;
  
  // Check if any items require shipping
  const requiresShipping = items.some(item => item.requiresShipping);
  
  if (!requiresShipping) {
    return {
      amount: 0,
      method: 'Digital/No Shipping Required',
      estimatedDays: 'Immediate'
    };
  }
  
  // Free shipping threshold ($50)
  const freeShippingThreshold = 5000; // $50.00 in cents
  
  if (subtotal >= freeShippingThreshold) {
    return {
      amount: 0,
      method: 'Free Standard Shipping',
      estimatedDays: '3-5 business days'
    };
  }
  
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0.5), 0); // Default 0.5 lbs per item
  
  // Base rates (these should be replaced with real shipping API calls)
  let baseRate = 0; // Free shipping for testing
  
  // International shipping
  if (shippingAddress.country !== 'US') {
    baseRate = 1999; // $19.99 for international
    return {
      amount: baseRate,
      method: 'International Standard',
      estimatedDays: '7-14 business days'
    };
  }
  
  // Weight-based pricing disabled for testing
  // if (totalWeight > 2) {
  //   baseRate += Math.ceil((totalWeight - 2) / 0.5) * 200; // $2 per additional 0.5 lbs
  // }
  
  return {
    amount: baseRate,
    method: 'Free Shipping (Testing)',
    estimatedDays: '3-5 business days'
  };
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const formatStripeAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// ========================================
// CONNECT/MARKETPLACE FUNCTIONS (Future)
// ========================================

// These would be used if M2 Labs expands to sell other brands/artists' products
export const createConnectAccount = async (data: {
  type: 'express' | 'standard' | 'custom';
  email: string;
  country: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Account> => {
  const stripe = getStripe();
  
  return await stripe.accounts.create({
    type: data.type,
    email: data.email,
    country: data.country,
    metadata: {
      source: 'M2Labs Platform',
      ...data.metadata,
    },
  });
};

// ========================================
// SUBSCRIPTION FUNCTIONS (Future)
// ========================================

// These would be used for subscription products like pedal maintenance plans
export const createSubscription = async (data: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription> => {
  const stripe = getStripe();
  
  return await stripe.subscriptions.create({
    customer: data.customerId,
    items: [{ price: data.priceId }],
    metadata: {
      source: 'M2Labs Website',
      ...data.metadata,
    },
  });
};

export const cancelSubscription = async (subscriptionId: string): Promise<Stripe.Subscription> => {
  const stripe = getStripe();
  
  return await stripe.subscriptions.cancel(subscriptionId);
};

// ========================================
// PRODUCT SYNC FUNCTIONS
// ========================================

// Sync M2 Labs products to Stripe for better reporting and analytics
export const createStripeProduct = async (data: {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
}): Promise<Stripe.Product> => {
  const stripe = getStripe();
  
  return await stripe.products.create({
    id: data.id,
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: {
      source: 'M2Labs Catalog',
      ...data.metadata,
    },
  });
};

export const createStripePrice = async (data: {
  productId: string;
  unitAmount: number; // in cents
  currency?: string;
  nickname?: string;
}): Promise<Stripe.Price> => {
  const stripe = getStripe();
  
  return await stripe.prices.create({
    product: data.productId,
    unit_amount: data.unitAmount,
    currency: data.currency || 'usd',
    nickname: data.nickname,
  });
};
