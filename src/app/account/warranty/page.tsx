'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { WarrantyClaim, Order } from '@/libs/auth';
import Link from 'next/link';
export const runtime = 'edge'

export default function Warranty() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    orderId: searchParams.get('orderId') || '',
    productName: '',
    serialNumber: '',
    issue: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchClaims();
      fetchOrders();
    }
  }, [user, loading, router]);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/user/warranty');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims);
      } else {
        setError('Failed to load warranty claims');
      }
    } catch (error) {
      setError('Failed to load warranty claims');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/user/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders.filter((order: Order) => order.status === 'delivered'));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/warranty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchClaims();
        setShowForm(false);
        setFormData({
          orderId: '',
          productName: '',
          serialNumber: '',
          issue: ''
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit warranty claim');
      }
    } catch (error) {
      setError('Failed to submit warranty claim');
    } finally {
      setIsSubmitting(false);
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
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status;
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5]">Warranty Claims</h1>
                <p className="mt-2 text-[#F5F5F5]">
                  Manage warranty claims for your M2 Labs products
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 font-medium"
              >
                New Claim
              </button>
            </div>
          </div>

          {/* New Claim Form */}
          {showForm && (
            <div className="mb-8 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Submit New Warranty Claim</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                    Order
                  </label>
                  <select
                    id="orderId"
                    name="orderId"
                    required
                    value={formData.orderId}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                  >
                    <option value="">Select an order...</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                    placeholder="e.g., The Bomber Overdrive"
                  />
                </div>

                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    required
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                    placeholder="Found on the back of your pedal"
                  />
                </div>

                <div>
                  <label htmlFor="issue" className="block text-sm font-medium text-gray-700">
                    Issue Description
                  </label>
                  <textarea
                    id="issue"
                    name="issue"
                    required
                    rows={4}
                    value={formData.issue}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                    placeholder="Describe the issue you're experiencing with your pedal..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8A3D] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Claims List */}
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-lg text-gray-600">Loading warranty claims...</div>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No warranty claims</h3>
                <p className="mt-2 text-gray-500">
                  You haven't submitted any warranty claims yet.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80"
                  >
                    Submit first claim
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {claims.map((claim) => (
                <div key={claim.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {claim.productName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Claim #{claim.id} • Submitted {new Date(claim.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{claim.serialNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">#{claim.orderId}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Issue Description</dt>
                        <dd className="mt-1 text-sm text-gray-900">{claim.issue}</dd>
                      </div>
                      {claim.notes && (
                        <div className="md:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">{claim.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(claim.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-3">
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
