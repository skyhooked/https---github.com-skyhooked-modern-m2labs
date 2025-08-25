'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/components/cart/CartProvider';
import { useShippingRates } from '@/hooks/useShippingRates';
import { ShippingOptions } from '@/components/ShippingOptions';

// Load Stripe dynamically after getting publishable key
let stripePromise: Promise<any> | null = null;

// HS code mapping for your products
const DEFAULT_HS_CODE = '854370'; // effects pedals / electronic sound apparatus
const ORIGIN_COUNTRY_ALPHA2 = 'US'; // update if needed
const HS_BY_SKU: Record<string, string> = {
  'M2L-TBO': '854370', // The Bomber Overdrive
  // add other SKUs here if you want per-SKU overrides
};

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      const response = await fetch('/api/stripe/config');
      if (response.ok) {
        const { publishableKey } = await response.json();
        stripePromise = loadStripe(publishableKey);
      } else {
        console.error('Failed to get Stripe config');
        stripePromise = Promise.resolve(null);
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

interface ShippingAddress {
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
}

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: ''
  });
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: ''
  });
  const [showShippingForm, setShowShippingForm] = useState(true);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [stripeInstance, setStripeInstance] = useState<any>(null);

  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [showShippingOptions, setShowShippingOptions] = useState(false);
  const { rates, loading: ratesLoading, error: ratesError, getRates } = useShippingRates();

  const originAddress = {
    line_1: "1850 Cotillion Drive",
    city: "Atlanta", 
    state: "GA",
    postal_code: "30338",
    country_alpha2: "US"
  };

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Store the current URL to redirect back after login
        localStorage.setItem('redirectAfterLogin', '/checkout');
        router.push('/login');
        return;
      }
      
      if (cart.itemCount === 0) {
        router.push('/shop');
        return;
      }
    }
  }, [user, authLoading, cart.itemCount, router]);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const stripe = await getStripePromise();
      setStripeInstance(stripe);
    };
    initStripe();
  }, []);

  // Initialize user data in forms
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
      setBillingAddress(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
    }
    setLoading(false);
  }, [user]);

  const createPaymentIntent = async () => {
    // Validate shipping address first
    if (!isShippingAddressValid()) {
      setError('Please complete the shipping address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const addressToUse = billingAddressSameAsShipping ? shippingAddress : billingAddress;
      
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            id: item.variant?.product?.id || item.variantId,
            name: item.variant?.product?.name || 'Product',
            price: item.unitPrice / 100, // Convert from cents
            quantity: item.quantity,
            variantId: item.variantId,
            image: (item.variant?.product as any)?.images?.[0]?.url || '/images/placeholder-product.png'
          })),
          subtotal: cart.subtotal,
          // Include selected shipping rate
          shippingRate: selectedShippingRate ? {
            courier: selectedShippingRate.courier_name,
            service: selectedShippingRate.service_name,
            cost: selectedShippingRate.total_charge,
            deliveryTime: `${selectedShippingRate.min_delivery_time}-${selectedShippingRate.max_delivery_time} business days`
          } : null,
          customerEmail: user?.email,
          shippingAddress: {
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
            line1: shippingAddress.address1,
            line2: shippingAddress.address2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone
          },
          billingAddress: {
            name: `${addressToUse.firstName} ${addressToUse.lastName}`.trim(),
            line1: addressToUse.address1,
            line2: addressToUse.address2,
            city: addressToUse.city,
            state: addressToUse.state,
            postal_code: addressToUse.postalCode,
            country: addressToUse.country,
            phone: addressToUse.phone
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setOrderSummary({
          subtotal: data.subtotal / 100,
          shipping: data.shipping / 100,
          tax: data.tax / 100,
          total: data.total / 100
        });
        setShowShippingForm(false);
        setShowShippingOptions(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError('Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  const isShippingAddressValid = (): boolean => {
    return !!(
      shippingAddress.firstName.trim() &&
      shippingAddress.lastName.trim() &&
      shippingAddress.address1.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.state.trim() &&
      shippingAddress.postalCode.trim() &&
      shippingAddress.country.trim()
    );
  };

  const handleShippingAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingAddressChange = (field: keyof ShippingAddress, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleContinueToPayment = () => {
    if (!showShippingOptions && isShippingAddressValid()) {
      // First time - get shipping rates
      const DEFAULT_PEDAL_HS = '854370';
const shippingItems = cart.items.map(item => ({
  description: item.variant?.product?.name || 'Product',
  category: 'general',
  sku: item.variantId || 'UNKNOWN',
  quantity: item.quantity,
  actual_weight: 0.5, // kg - replace with actual item weight
  declared_currency: 'USD',
  declared_customs_value: item.unitPrice / 100, // Convert from cents
  hs_code: DEFAULT_HS_CODE,                     // <-- required by Easyship: hs_code or item_category_id
  origin_country_alpha2: ORIGIN_COUNTRY_ALPHA2  // <-- recommended for accurate rates
}));

      const destinationAddress = {
        line_1: shippingAddress.address1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country_alpha2: shippingAddress.country || 'US'
      };

      // Estimate box dimensions - replace with your actual logic
      const boxDims = { length: 20, width: 15, height: 10 }; // cm
      const totalWeight = shippingItems.reduce((sum, item) => 
        sum + (item.actual_weight * item.quantity), 0
      );

      getRates(originAddress, destinationAddress, shippingItems, boxDims, totalWeight);
      setShowShippingOptions(true);
    } else if (selectedShippingRate) {
      // Second time - create payment intent with selected shipping
      createPaymentIntent();
    }
  };

  const handleBackToShipping = () => {
    setShowShippingForm(true);
    setClientSecret('');
    setPaymentIntentId('');
    setError('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
            <p className="mt-4 text-[#F5F5F5]">Preparing checkout...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={createPaymentIntent}
              className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg hover:bg-[#FF8A3D]/80"
            >
              Try again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#F5F5F5] mb-4">Your cart is empty</p>
            <button
              onClick={() => router.push('/shop')}
              className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg hover:bg-[#FF8A3D]/80"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const appearance = {
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
  };

  const options = {
    clientSecret,
    appearance,
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
            <p className="mt-4 text-[#F5F5F5]">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-6xl mx-auto px-5">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center ${showShippingForm ? 'text-[#FF8A3D]' : 'text-green-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                  showShippingForm ? 'border-[#FF8A3D] bg-[#FF8A3D] text-black' : 'border-green-400 bg-green-400 text-white'
                }`}>
                  {showShippingForm ? '1' : '✓'}
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className={`flex items-center ${!showShippingForm ? 'text-[#FF8A3D]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                  !showShippingForm ? 'border-[#FF8A3D] bg-[#FF8A3D] text-black' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-8 text-center text-[#F5F5F5]">
            {showShippingForm ? 'Shipping Information' : 'Payment Information'}
          </h1>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.variant?.product?.name || 'Product'}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.unitPrice * item.quantity / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${orderSummary.subtotal > 0 ? orderSummary.subtotal.toFixed(2) : cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{orderSummary.shipping > 0 ? `$${orderSummary.shipping.toFixed(2)}` : 'Calculated at checkout'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{orderSummary.tax > 0 ? `$${orderSummary.tax.toFixed(2)}` : 'Calculated at checkout'}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${orderSummary.total > 0 ? orderSummary.total.toFixed(2) : cart.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Dynamic Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {showShippingForm ? (
                <div>
                  <ShippingForm
                    shippingAddress={shippingAddress}
                    onShippingAddressChange={handleShippingAddressChange}
                    billingAddress={billingAddress}
                    onBillingAddressChange={handleBillingAddressChange}
                    billingAddressSameAsShipping={billingAddressSameAsShipping}
                    onBillingAddressSameAsShippingChange={setBillingAddressSameAsShipping}
                    onContinue={handleContinueToPayment}
                    isLoading={loading}
                    error={error}
                    isValid={isShippingAddressValid()}
                  />
                  
                  {/* Show shipping options after address is entered */}
                  {showShippingOptions && (
                    <div className="mt-6 border-t pt-6">
                      <ShippingOptions
                        rates={rates}
                        selectedRate={selectedShippingRate}
                        onSelectRate={setSelectedShippingRate}
                        loading={ratesLoading}
                        error={ratesError}
                      />
                      
                      {selectedShippingRate && (
                        <button
                          onClick={handleContinueToPayment}
                          disabled={loading}
                          className="w-full mt-4 bg-[#FF8A3D] text-black py-3 px-4 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Processing...' : 'Continue to Payment'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Payment Information</h2>
                    <button
                      onClick={handleBackToShipping}
                      className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium"
                    >
                      ← Back to Shipping
                    </button>
                  </div>
                  
                  {clientSecret && stripeInstance && (
                    <Elements options={options} stripe={stripeInstance}>
                      <CheckoutForm 
                        paymentIntentId={paymentIntentId}
                        onSuccess={() => {
                          clearCart();
                          router.push(`/checkout/success?payment_intent=${paymentIntentId}`);
                        }}
                      />
                    </Elements>
                  )}
                  
                  {clientSecret && !stripeInstance && (
                    <div className="text-center text-gray-600">
                      Loading payment form...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function CheckoutForm({ paymentIntentId, onSuccess }: { paymentIntentId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <div className="text-red-600 text-sm">{message}</div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-[#FF8A3D] text-black py-3 px-4 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Complete Order'}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
}

function ShippingForm({
  shippingAddress,
  onShippingAddressChange,
  billingAddress,
  onBillingAddressChange,
  billingAddressSameAsShipping,
  onBillingAddressSameAsShippingChange,
  onContinue,
  isLoading,
  error,
  isValid
}: {
  shippingAddress: ShippingAddress;
  onShippingAddressChange: (field: keyof ShippingAddress, value: string) => void;
  billingAddress: ShippingAddress;
  onBillingAddressChange: (field: keyof ShippingAddress, value: string) => void;
  billingAddressSameAsShipping: boolean;
  onBillingAddressSameAsShippingChange: (value: boolean) => void;
  onContinue: () => void;
  isLoading: boolean;
  error: string;
  isValid: boolean;
}) {
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Shipping Address</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={shippingAddress.firstName}
            onChange={(e) => onShippingAddressChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={shippingAddress.lastName}
            onChange={(e) => onShippingAddressChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company (optional)
        </label>
        <input
          type="text"
          id="company"
          value={shippingAddress.company}
          onChange={(e) => onShippingAddressChange('company', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
        />
      </div>
      
      <div>
        <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
          Address *
        </label>
        <input
          type="text"
          id="address1"
          value={shippingAddress.address1}
          onChange={(e) => onShippingAddressChange('address1', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
          placeholder="Street address"
          required
        />
      </div>
      
      <div>
        <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
          Apartment, suite, etc. (optional)
        </label>
        <input
          type="text"
          id="address2"
          value={shippingAddress.address2}
          onChange={(e) => onShippingAddressChange('address2', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            id="city"
            value={shippingAddress.city}
            onChange={(e) => onShippingAddressChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            id="state"
            value={shippingAddress.state}
            onChange={(e) => onShippingAddressChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
            required
          >
            <option value="">Select State</option>
            {US_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            id="postalCode"
            value={shippingAddress.postalCode}
            onChange={(e) => onShippingAddressChange('postalCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone (optional)
        </label>
        <input
          type="tel"
          id="phone"
          value={shippingAddress.phone}
          onChange={(e) => onShippingAddressChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
          placeholder="(555) 123-4567"
        />
      </div>
      
      {/* Billing Address Section */}
      <div className="border-t pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="billingAddressSame"
            checked={billingAddressSameAsShipping}
            onChange={(e) => onBillingAddressSameAsShippingChange(e.target.checked)}
            className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
          />
          <label htmlFor="billingAddressSame" className="ml-2 block text-sm text-gray-700">
            Billing address is the same as shipping address
          </label>
        </div>
        
        {!billingAddressSameAsShipping && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Billing Address</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="billingFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="billingFirstName"
                  value={billingAddress.firstName}
                  onChange={(e) => onBillingAddressChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="billingLastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="billingLastName"
                  value={billingAddress.lastName}
                  onChange={(e) => onBillingAddressChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="billingAddress1" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                id="billingAddress1"
                value={billingAddress.address1}
                onChange={(e) => onBillingAddressChange('address1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                placeholder="Street address"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="billingCity"
                  value={billingAddress.city}
                  onChange={(e) => onBillingAddressChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  id="billingState"
                  value={billingAddress.state}
                  onChange={(e) => onBillingAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  required
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="billingPostalCode"
                  value={billingAddress.postalCode}
                  onChange={(e) => onBillingAddressChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={onContinue}
        disabled={!isValid || isLoading}
        className="w-full bg-[#FF8A3D] text-black py-3 px-4 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </div>
  );
}
