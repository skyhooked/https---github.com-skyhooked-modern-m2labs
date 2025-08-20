'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentIntentId) {
      // In a real implementation, you'd fetch order details here
      // For now, we'll just show a success message
      setLoading(false);
    }
  }, [paymentIntentId]);

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
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
            
            {paymentIntentId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Payment ID:</strong> {paymentIntentId}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-gray-600">
                You will receive an email confirmation shortly with your order details and tracking information.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/account/orders"
                  className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
                >
                  View Orders
                </Link>
                <Link
                  href="/shop"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's Next?</h3>
              <div className="text-left text-sm text-gray-600 space-y-2">
                <p>• You'll receive an email confirmation within 15 minutes</p>
                <p>• Your order will be processed within 1-2 business days</p>
                <p>• Shipping typically takes 3-5 business days</p>
                <p>• Track your order anytime in your account</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Need help?</strong> Contact our support team at{' '}
                <a href="mailto:support@m2labs.com" className="text-[#FF8A3D] hover:underline">
                  support@m2labs.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
