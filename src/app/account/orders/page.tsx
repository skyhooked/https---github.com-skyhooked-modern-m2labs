'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/libs/database-ecommerce';
import Link from 'next/link';
export const runtime = 'edge'

export default function Orders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchOrders();
    }
  }, [user, loading, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/user/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-content mx-auto px-5">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="inline-flex items-center text-sm font-medium text-[#F5F5F5] hover:text-[#FF8A3D]"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Account
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5]">Order History</h1>
            <p className="mt-2 text-[#F5F5F5]">
              View and track all your M2 Labs orders
            </p>
          </div>

          {/* Orders */}
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-lg text-gray-600">Loading orders...</div>
            </div>
          ) : error ? (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="mt-2 text-gray-500">
                  When you make your first purchase, it will appear here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/shop"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80"
                  >
                    Start shopping
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <div className="text-lg font-medium text-gray-900">
                          ${(order.total / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.variant?.product?.name || item.productSnapshot?.name || 'Product'}
                            </h4>
                            {item.variant?.sku && (
                              <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-medium text-gray-900">
                              ${(item.totalPrice / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-500">No items found</div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {order.shippingAddress && (
                          <span>
                            Ships to: {order.shippingAddress.city}, {order.shippingAddress.state}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        {order.status === 'delivered' && (
                          <Link
                            href={`/account/warranty?orderId=${order.id}`}
                            className="text-sm font-medium text-[#FF8A3D] hover:text-[#FF8A3D]/80"
                          >
                            File warranty claim
                          </Link>
                        )}
                        <button className="text-sm font-medium text-gray-900 hover:text-gray-700">
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
