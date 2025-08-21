'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const runtime = 'edge'

interface InventoryRequest {
  id: string;
  productName: string;
  quantity: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  requestedAt: string;
  notes?: string;
}

interface Distributor {
  id: string;
  companyName: string;
  contactName: string;
}

export default function DistributorInventory() {
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    productName: '',
    quantity: 1,
    notes: ''
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchRequests();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/distributor/auth/me');
      if (response.ok) {
        const data = await response.json();
        setDistributor(data.distributor);
      } else {
        router.push('/distributor');
      }
    } catch (error) {
      router.push('/distributor');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/distributor/inventory-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/distributor/inventory-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        setNewRequest({ productName: '', quantity: 1, notes: '' });
        setShowNewRequest(false);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/distributor')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {distributor?.contactName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">
              Request new inventory and track your current allocations
            </p>
          </div>
          <button
            onClick={() => setShowNewRequest(true)}
            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
          >
            New Request
          </button>
        </div>

        {/* New Request Form */}
        {showNewRequest && (
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">New Inventory Request</h2>
              <button
                onClick={() => setShowNewRequest(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newRequest.productName}
                    onChange={(e) => setNewRequest({ ...newRequest, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                    placeholder="e.g., The Bomber Overdrive"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRequest.quantity}
                    onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  rows={3}
                  placeholder="Any special requirements or notes..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRequest(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Inventory Requests</h2>
          </div>
          <div className="p-6">
            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{request.productName}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Quantity:</span> {request.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span> {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {request.status}
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {request.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📦</div>
                <p>No inventory requests yet</p>
                <p className="text-sm">Create your first request to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
