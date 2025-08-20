'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const runtime = 'edge'

interface Distributor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  username: string;
  territory?: string;
  discountRate: number;
  creditLimit: number;
  currentBalance: number;
  status: string;
  tier: string;
  lastLoginAt?: string;
}

export default function DistributorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/distributor/auth/me');
      if (response.ok) {
        const data = await response.json();
        setDistributor(data.distributor);
      }
    } catch (error) {
      // Not logged in
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/distributor/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setDistributor(data.distributor);
        router.push('/distributor/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/distributor/auth/logout', { method: 'POST' });
      setDistributor(null);
      router.push('/distributor');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (distributor) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-[#FF8A3D]">M2 Labs</div>
                <div className="text-gray-500">|</div>
                <div className="text-gray-900 font-medium">Distributor Portal</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, {distributor.contactName}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Distributor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your inventory, orders, and business relationship with M2 Labs
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{distributor.tier.toUpperCase()}</div>
              <div className="text-sm text-gray-600">Account Tier</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {(distributor.discountRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Discount Rate</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                ${distributor.creditLimit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Credit Limit</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                ${distributor.currentBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Current Balance</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Inventory Requests</h3>
                <div className="text-2xl">📦</div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Request new inventory or check existing allocations
              </p>
              <button
                onClick={() => router.push('/distributor/inventory')}
                className="w-full bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
              >
                Manage Inventory
              </button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <div className="text-2xl">📋</div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                View and track your orders and shipments
              </p>
              <button
                onClick={() => router.push('/distributor/orders')}
                className="w-full bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
              >
                View Orders
              </button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Support & Inquiries</h3>
                <div className="text-2xl">💬</div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Get help or ask questions about products and policies
              </p>
              <button
                onClick={() => router.push('/distributor/support')}
                className="w-full bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company</label>
                    <p className="text-gray-900">{distributor.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="text-gray-900">{distributor.contactName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{distributor.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Territory</label>
                    <p className="text-gray-900">{distributor.territory || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Status</label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {distributor.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-gray-900">
                      {distributor.lastLoginAt
                        ? new Date(distributor.lastLoginAt).toLocaleDateString()
                        : 'First time login'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-[#FF8A3D]">
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            M2 Labs Distributor Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your distributor account and manage your business relationship
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#FF8A3D] focus:border-[#FF8A3D] focus:z-10"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#FF8A3D] focus:border-[#FF8A3D] focus:z-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8A3D] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in to Distributor Portal'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need access? Contact your M2 Labs representative or{' '}
              <a href="/contact" className="text-[#FF8A3D] hover:underline">
                reach out to our team
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
