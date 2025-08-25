'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/libs/database-ecommerce';
import Link from 'next/link';

export const runtime = 'edge';

interface Props {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetails({ params }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.orderId);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && orderId) {
      fetchOrder();
    }
  }, [user, loading, router, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else if (response.status === 404) {
        setError('Order not found');
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-content mx-auto px-5">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <Link
                href="/account/orders"
                className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-content mx-auto px-5">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-600 mb-4">Order not found</div>
              <Link
                href="/account/orders"
                className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-4xl mx-auto px-5">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account/orders"
              className="inline-flex items-center text-sm font-medium text-[#F5F5F5] hover:text-[#FF8A3D]"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5]">Order Details</h1>
            <p className="mt-2 text-[#F5F5F5]">
              Order #{order.orderNumber}
            </p>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Order Status Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Order #{order.orderNumber}</h2>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Order Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items Ordered</h3>
                <div className="space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.variant?.product?.name || item.productSnapshot?.name || 'Product'}
                        </h4>
                        {item.variant?.sku && (
                          <p className="text-sm text-gray-500">SKU: {item.variant.sku}</p>
                        )}
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">No items found</div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 max-w-sm ml-auto">
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
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="grid md:grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                  <div className="text-sm text-gray-600">
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
                  <div className="text-sm text-gray-600">
                    <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                    <p>{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                    <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {order.stripePaymentIntentId && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                  <div className="text-sm text-gray-600">
                    <p><strong>Payment ID:</strong> {order.stripePaymentIntentId}</p>
                    {order.paymentMethod && (
                      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-6 flex space-x-4">
                {order.status === 'delivered' && (
                  <Link
                    href={`/account/warranty?orderId=${order.id}`}
                    className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 font-medium"
                  >
                    File Warranty Claim
                  </Link>
                )}
                <Link
                  href="/account/orders"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Back to Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
