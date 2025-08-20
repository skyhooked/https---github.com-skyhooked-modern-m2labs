// Client-side Stripe utilities for M2 Labs
// Payment form components and checkout flow

'use client';

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

// Load Stripe with publishable key
let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

export default getStripe;

// ========================================
// PAYMENT ELEMENT OPTIONS
// ========================================

export const getPaymentElementOptions = (
  clientSecret: string,
  returnUrl: string
) => {
  return {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#FF8A3D',
        colorBackground: '#ffffff',
        colorText: '#36454F',
        colorDanger: '#df1b41',
        fontFamily: 'Helvetica Neue, Arial, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'link'],
    fields: {
      billingDetails: {
        name: 'auto',
        email: 'auto',
        phone: 'auto',
        address: {
          line1: 'auto',
          line2: 'auto',
          city: 'auto',
          state: 'auto',
          postalCode: 'auto',
          country: 'auto',
        },
      },
    },
    wallets: {
      applePay: 'auto',
      googlePay: 'auto',
    },
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
    },
  };
};

// ========================================
// CHECKOUT UTILITIES
// ========================================

export interface CheckoutData {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  customerEmail?: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
}

export const createCheckoutSession = async (data: CheckoutData): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> => {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }
  
  return response.json();
};

export const confirmPayment = async (
  stripe: Stripe,
  elements: StripeElements,
  returnUrl: string
): Promise<{ error?: any; paymentIntent?: any }> => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl,
    },
    redirect: 'if_required',
  });
  
  return { error, paymentIntent };
};

// ========================================
// PAYMENT METHOD UTILITIES
// ========================================

export const savePaymentMethod = async (
  paymentMethodId: string,
  customerId: string
): Promise<{ error?: any; paymentMethod?: any }> => {
  try {
    const response = await fetch('/api/stripe/save-payment-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
        customerId,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Failed to save payment method' };
    }
    
    return { paymentMethod: result.paymentMethod };
  } catch (error) {
    return { error: 'Network error while saving payment method' };
  }
};

export const getCustomerPaymentMethods = async (customerId: string): Promise<{
  paymentMethods: any[];
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/stripe/payment-methods/${customerId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { paymentMethods: [], error: error.message };
    }
    
    const data = await response.json();
    return { paymentMethods: data.paymentMethods };
  } catch (error) {
    return { paymentMethods: [], error: 'Failed to fetch payment methods' };
  }
};

// ========================================
// SUBSCRIPTION UTILITIES (Future)
// ========================================

export const createSubscriptionCheckout = async (data: {
  priceId: string;
  customerId?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}): Promise<{
  clientSecret: string;
  subscriptionId: string;
}> => {
  const response = await fetch('/api/stripe/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }
  
  return response.json();
};

// ========================================
// APPLE PAY / GOOGLE PAY UTILITIES
// ========================================

export const isApplePayAvailable = async (): Promise<boolean> => {
  const stripe = await getStripe();
  if (!stripe) return false;
  
  return stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: { label: 'Demo', amount: 1 },
    requestPayerName: true,
    requestPayerEmail: true,
  }).canMakePayment().then(result => !!result?.applePay);
};

export const isGooglePayAvailable = async (): Promise<boolean> => {
  const stripe = await getStripe();
  if (!stripe) return false;
  
  return stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: { label: 'Demo', amount: 1 },
    requestPayerName: true,
    requestPayerEmail: true,
  }).canMakePayment().then(result => !!result?.googlePay);
};

export const createPaymentRequest = (
  stripe: Stripe,
  data: {
    country: string;
    currency: string;
    total: {
      label: string;
      amount: number;
    };
    displayItems?: Array<{
      label: string;
      amount: number;
    }>;
    shippingOptions?: Array<{
      id: string;
      label: string;
      detail?: string;
      amount: number;
    }>;
  }
) => {
  return stripe.paymentRequest({
    country: data.country,
    currency: data.currency,
    total: data.total,
    displayItems: data.displayItems,
    shippingOptions: data.shippingOptions?.map(option => ({
      ...option,
      detail: option.detail || '' // Ensure detail is always a string
    })),
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
    requestShipping: true,
  });
};

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

export const getStripeErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  switch (error.type) {
    case 'card_error':
      switch (error.code) {
        case 'card_declined':
          return 'Your card was declined. Please try a different payment method.';
        case 'expired_card':
          return 'Your card has expired. Please try a different payment method.';
        case 'incorrect_cvc':
          return 'Your card\'s security code is incorrect.';
        case 'incorrect_number':
          return 'Your card number is incorrect.';
        case 'invalid_expiry_month':
        case 'invalid_expiry_year':
          return 'Your card\'s expiration date is incorrect.';
        case 'insufficient_funds':
          return 'Your card has insufficient funds.';
        default:
          return error.message || 'Your card was declined.';
      }
    case 'validation_error':
      return error.message || 'Please check your payment information and try again.';
    case 'api_error':
      return 'A payment processing error occurred. Please try again.';
    case 'rate_limit_error':
      return 'Too many requests. Please wait a moment and try again.';
    case 'authentication_error':
      return 'Authentication failed. Please refresh the page and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

// ========================================
// FORMATTING UTILITIES
// ========================================

export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const formatDisplayItems = (items: Array<{
  name: string;
  price: number;
  quantity: number;
}>): Array<{ label: string; amount: number }> => {
  return items.map(item => ({
    label: `${item.name} (×${item.quantity})`,
    amount: item.price * item.quantity,
  }));
};

// ========================================
// VALIDATION UTILITIES
// ========================================

export const validateCardNumber = (cardNumber: string): boolean => {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Check length (13-19 digits for most cards)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm check
  let sum = 0;
  let alternate = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned.charAt(i), 10);
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  // Expected format: MM/YY or MM/YYYY
  const match = expiry.match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!match) return false;
  
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  
  // Convert 2-digit year to 4-digit
  if (year < 100) {
    year += 2000;
  }
  
  // Validate month
  if (month < 1 || month > 12) return false;
  
  // Check if expiry is in the future
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
};

export const validateCVC = (cvc: string, cardType?: string): boolean => {
  const cleaned = cvc.replace(/\D/g, '');
  
  // American Express typically uses 4 digits, others use 3
  if (cardType === 'amex') {
    return cleaned.length === 4;
  }
  
  return cleaned.length === 3;
};
