import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import Link from 'next/link';
import { getAllArtists } from '@/data/artistData';
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
  const artists = getAllArtists();
  
  const modules = [
    {
      title: 'User Management',
      description: 'Manage customer accounts and user permissions',
      icon: '👥',
      href: '/admin/users',
      stats: [
        { label: 'Total Users', value: '0' },
        { label: 'Verified', value: '0' },
      ],
    },
    {
      title: 'Warranty Claims',
      description: 'Process and manage warranty claim requests',
      icon: '🛡️',
      href: '/admin/warranty',
      stats: [
        { label: 'Open Claims', value: '0' },
        { label: 'Processed', value: '0' },
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
        { label: 'Artists', value: artists.length },
        { label: 'Featured', value: artists.filter(a => a.featured).length },
      ],
    },
    {
      title: 'Product Management',
      description: 'Manage pedals, inventory, and product details',
      icon: '🎸',
      href: '/admin/products',
      stats: [
        { label: 'Products', value: '0' },
        { label: 'In Stock', value: '0' },
      ],
    },
    {
      title: 'Newsletter Management',
      description: 'Manage email campaigns and subscriber lists',
      icon: '📧',
      href: '/admin/newsletter',
      stats: [
        { label: 'Subscribers', value: '0' },
        { label: 'Campaigns', value: '0' },
      ],
    },
    {
      title: 'Order Management',
      description: 'Process and track customer orders',
      icon: '📦',
      href: '/admin/orders',
      stats: [
        { label: 'Total Orders', value: '0' },
        { label: 'Pending', value: '0' },
      ],
    },
    {
      title: 'Support Management',
      description: 'Manage customer support tickets and inquiries',
      icon: '💬',
      href: '/admin/support',
      stats: [
        { label: 'Open Tickets', value: '0' },
        { label: 'Resolved', value: '0' },
      ],
    },
    {
      title: 'Analytics & Reports',
      description: 'View website traffic and engagement metrics',
      icon: '📈',
      disabled: true,
      stats: [
        { label: 'Monthly Visits', value: '-' },
        { label: 'Conversion Rate', value: '-' },
      ],
    },
  ];

  const quickStats = [
    { label: 'Registered Users', value: '0', color: 'text-blue-600' },
    { label: 'Warranty Claims', value: '0', color: 'text-green-600' },
    { label: 'News Posts', value: '5', color: 'text-purple-600' },
    { label: 'Artist Profiles', value: artists.length.toString(), color: 'text-orange-600' },
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

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Authentication system deployed with Ecwid SSO</span>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">User management and warranty system activated</span>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">News post "The Bomber Has Landed" published</span>
              </div>
              <span className="text-xs text-gray-500">2 days ago</span>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Ready for customer registrations and orders!</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
    </AuthWrapper>
  );
}
