'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const runtime = 'edge'

interface Inquiry {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

interface Distributor {
  id: string;
  companyName: string;
  contactName: string;
}

export default function DistributorSupport() {
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInquiry, setNewInquiry] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high'
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchInquiries();
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

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/distributor/inquiries');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/distributor/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInquiry),
      });

      if (response.ok) {
        setNewInquiry({ subject: '', message: '', priority: 'normal' });
        setShowNewInquiry(false);
        fetchInquiries();
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-green-100 text-green-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Support & Inquiries</h1>
            <p className="text-gray-600 mt-2">
              Get help with products, policies, or account questions
            </p>
          </div>
          <button
            onClick={() => setShowNewInquiry(true)}
            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
          >
            New Inquiry
          </button>
        </div>

        {/* Quick Help Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="text-2xl mb-3">📖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Catalog</h3>
            <p className="text-gray-600 text-sm mb-4">
              Browse our complete product catalog with detailed specifications
            </p>
            <a href="/shop" className="text-[#FF8A3D] hover:underline text-sm font-medium">
              View Catalog →
            </a>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ordering Guide</h3>
            <p className="text-gray-600 text-sm mb-4">
              Learn about minimum orders, lead times, and pricing tiers
            </p>
            <button className="text-[#FF8A3D] hover:underline text-sm font-medium">
              Download Guide →
            </button>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Sales</h3>
            <p className="text-gray-600 text-sm mb-4">
              Need to speak with someone directly? Reach out to our team
            </p>
            <a href="/contact" className="text-[#FF8A3D] hover:underline text-sm font-medium">
              Contact Us →
            </a>
          </div>
        </div>

        {/* New Inquiry Form */}
        {showNewInquiry && (
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">New Support Inquiry</h2>
              <button
                onClick={() => setShowNewInquiry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitInquiry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newInquiry.subject}
                    onChange={(e) => setNewInquiry({ ...newInquiry, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newInquiry.priority}
                    onChange={(e) => setNewInquiry({ ...newInquiry, priority: e.target.value as 'low' | 'normal' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newInquiry.message}
                  onChange={(e) => setNewInquiry({ ...newInquiry, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  rows={5}
                  placeholder="Please provide detailed information about your inquiry..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
                >
                  Submit Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewInquiry(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inquiries List */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Support Inquiries</h2>
          </div>
          <div className="p-6">
            {inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{inquiry.subject}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(inquiry.priority)}`}>
                          {inquiry.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{inquiry.message}</p>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Created:</span> {new Date(inquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <p>No support inquiries yet</p>
                <p className="text-sm">Submit your first inquiry to get help from our team</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
