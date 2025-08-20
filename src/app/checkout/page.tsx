'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/components/cart/CartProvider';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && cart.itemCount === 0) {
      router.push('/shop');
    }
  }, [cart.itemCount, loading, router]);

  // Create payment intent when component mounts
  useEffect(() => {
    if (cart.itemCount > 0) {
      createPaymentIntent();
    }
  }, [cart.itemCount]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError('');

    try {
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
          customerEmail: user?.email,
          shippingAddress: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
            line1: '123 Main St', // This should come from a form
            city: 'Atlanta',
            state: 'GA',
            postal_code: '30309',
            country: 'US'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
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

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-6xl mx-auto px-5">
          <h1 className="text-3xl font-bold mb-8 text-center text-[#F5F5F5]">Checkout</h1>
          
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
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              
              {clientSecret && (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm 
                    paymentIntentId={paymentIntentId}
                    onSuccess={() => {
                      clearCart();
                      router.push(`/checkout/success?payment_intent=${paymentIntentId}`);
                    }}
                  />
                </Elements>
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
