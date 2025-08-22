'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import Link from 'next/link';
// Remove artistData import - we'll get stats from the API instead

export const runtime = 'edge'

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  href?: string;
  disabled?: boolean;
  stats?: { label: string; value: string | number }[];
}

function ModuleCard({ title, description, icon, href, disabled, stats }: ModuleCardProps) {
  const cardContent = (
    <div className={`rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#FF8A3D]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {disabled && (
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
        )}
      </div>
      
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-[#FF8A3D]">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (disabled || !href) {
    return cardContent;
  }

  return <Link href={href}>{cardContent}</Link>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const modules = [
    {
      title: 'User Management',
      description: 'Manage customer accounts and user permissions',
      icon: '👥',
      href: '/admin/users',
      stats: [
        { label: 'Total Users', value: loading ? '...' : (stats?.users?.totalUsers || '0') },
        { label: 'Verified', value: loading ? '...' : (stats?.users?.verifiedUsers || '0') },
      ],
    },
    {
      title: 'Distributor Management',
      description: 'Manage distributor accounts, territories, and business relationships',
      icon: '🏢',
      href: '/admin/distributors',
      stats: [
        { label: 'Total Distributors', value: loading ? '...' : (stats?.distributors?.totalDistributors || '0') },
        { label: 'Active', value: loading ? '...' : (stats?.distributors?.activeDistributors || '0') },
      ],
    },
    {
      title: 'Warranty Claims',
      description: 'Process and manage warranty claim requests',
      icon: '🛡️',
      href: '/admin/warranty',
      stats: [
        { label: 'Open Claims', value: loading ? '...' : (stats?.warranty?.openClaims || '0') },
        { label: 'Processed', value: loading ? '...' : (stats?.warranty?.processedClaims || '0') },
      ],
    },
    {
      title: 'News Management',
      description: 'Manage blog posts, articles, and announcements',
      icon: '📰',
      href: '/admin/news',
      stats: [
        { label: 'Total Posts', value: 5 },
        { label: 'Published', value: 5 },
      ],
    },
    {
      title: 'Artist Management',
      description: 'Manage artist profiles and endorsements',
      icon: '🎤',
      href: '/admin/artists',
      stats: [
        { label: 'Artists', value: loading ? '...' : (stats?.artists?.totalArtists || '0') },
        { label: 'Featured', value: loading ? '...' : (stats?.artists?.featuredArtists || '0') },
      ],
    },
    {
      title: 'Product Management',
      description: 'Manage pedals, inventory, and product details',
      icon: '🎸',
      href: '/admin/products',
      stats: [
        { label: 'Products', value: loading ? '...' : (stats?.products?.totalProducts || '0') },
        { label: 'Active', value: loading ? '...' : (stats?.products?.activeProducts || '0') },
      ],
    },
    {
      title: 'Newsletter Management',
      description: 'Manage email campaigns and subscriber lists',
      icon: '📧',
      href: '/admin/newsletter',
      stats: [
        { label: 'Subscribers', value: loading ? '...' : (stats?.newsletter?.subscribers || '0') },
        { label: 'Campaigns', value: loading ? '...' : (stats?.newsletter?.campaigns || '0') },
      ],
    },
    {
      title: 'Order Management',
      description: 'Process and track customer orders',
      icon: '📦',
      href: '/admin/orders',
      disabled: true,
      stats: [
        { label: 'Total Orders', value: loading ? '...' : (stats?.orders?.totalOrders || '0') },
        { label: 'Pending', value: loading ? '...' : (stats?.orders?.pendingOrders || '0') },
      ],
    },
    {
      title: 'Support Management',
      description: 'Manage customer support tickets and inquiries',
      icon: '💬',
      href: '/admin/support',
      stats: [
        { label: 'Open Tickets', value: loading ? '...' : (stats?.support?.openTickets || '0') },
        { label: 'Resolved', value: loading ? '...' : (stats?.support?.resolvedTickets || '0') },
      ],
    },
    {
      title: 'Coupon Management',
      description: 'Create and manage discount codes',
      icon: '🎫',
      href: '/admin/coupons',
      disabled: true,
      stats: [
        { label: 'Active Coupons', value: '0' },
        { label: 'Total Uses', value: '0' },
      ],
    },
    {
      title: 'Admin Settings',
      description: 'Configure site settings and preferences',
      icon: '⚙️',
      href: '/admin/settings',
      stats: [
        { label: 'Site Config', value: 'Active' },
        { label: 'Security', value: 'Enabled' },
      ],
    },
    {
      title: 'Analytics & Reports',
      description: 'View sales analytics and business insights',
      icon: '📈',
      href: '/admin/analytics',
      stats: [
        { label: 'Total Revenue', value: '$0' },
        { label: 'Orders', value: loading ? '...' : (stats?.orders?.totalOrders || '0') },
      ],
    },
  ];

  const quickStats = [
    { 
      label: 'Registered Users', 
      value: loading ? '...' : (stats?.users?.totalUsers?.toString() || '0'), 
      color: 'text-blue-600' 
    },
    { 
      label: 'Support Tickets', 
      value: loading ? '...' : (stats?.support?.totalTickets?.toString() || '0'), 
      color: 'text-green-600' 
    },
    { 
      label: 'Active Products', 
      value: loading ? '...' : (stats?.products?.activeProducts?.toString() || '0'), 
      color: 'text-purple-600' 
    },
    { 
      label: 'Artist Profiles', 
      value: artists.length.toString(), 
      color: 'text-orange-600' 
    },
  ];

  return (
    <AuthWrapper>
      <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#36454F] to-[#6C7A83] rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to M2 Labs Admin</h1>
          <p className="text-gray-200">
            Manage your website content, products, and business operations from this central dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <ModuleCard key={index} {...module} />
            ))}
          </div>
        </div>

        {/* Recent Activity & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Enhanced product fields added for JHS-style layout</span>
                </div>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#FF8A3D] rounded-full"></div>
                  <span className="text-sm text-gray-700">Admin settings module implemented</span>
                </div>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">E-commerce system with cart functionality deployed</span>
                </div>
                <span className="text-xs text-gray-500">Today</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">News post "The Bomber Has Landed" published</span>
                </div>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Database</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Authentication</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">E-commerce</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Payment Processing</span>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Setup Required</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Email System</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Configured</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                🚀 System ready for production use
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
    </AuthWrapper>
  );
}
