'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: string;
  shippingAddress: any;
  items?: any[];
  createdAt: string;
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (paymentIntentId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [paymentIntentId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/by-payment-intent/${paymentIntentId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else if (response.status === 404 && retryCount < 3) {
        // Order might not be updated by webhook yet, retry after a delay
        console.log(`Order not found, retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchOrderDetails();
        }, 2000);
        return; // Don't set loading to false yet
      } else {
        console.error('Failed to fetch order details');
        setError('Could not load order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Could not load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
            <p className="mt-4 text-[#F5F5F5]">Confirming your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase from M2 Labs. Your order has been received and is being processed.
            </p>
            
            {order && (
              <div className="space-y-6">
                {/* Order Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                    <p className="text-sm text-gray-600"><strong>Order Number:</strong> {order.orderNumber}</p>
                    <p className="text-sm text-gray-600"><strong>Email:</strong> {order.email}</p>
                    <p className="text-sm text-gray-600"><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> 
                      <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p>{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>
                
                {/* Order Summary */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(order.shippingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(order.taxAmount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {paymentIntentId && !order && !error && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Payment ID:</strong> {paymentIntentId}
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
                <p>{error}</p>
              </div>
            )}
            
            <div className="mt-8 space-y-4 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
                >
                  Continue Shopping
                </Link>
                
                {user && (
                  <Link
                    href="/account/orders"
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    View All Orders
                  </Link>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What's Next?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Order Processing</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Email confirmation sent shortly</li>
                    <li>• Processing within 1-2 business days</li>
                    <li>• Tracking info when shipped</li>
                    {user && <li>• Track anytime in your account</li>}
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-green-800 mb-2">
                    Contact our support team:
                  </p>
                  <a href="mailto:support@m2labs.com" className="text-[#FF8A3D] hover:underline text-sm font-medium">
                    support@m2labs.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
