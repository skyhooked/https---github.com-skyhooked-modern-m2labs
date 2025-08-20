'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'User Management', href: '/admin/users', icon: '👥' },
    { name: 'Warranty Claims', href: '/admin/warranty', icon: '🛡️' },
    { name: 'News Management', href: '/admin/news', icon: '📰' },
    { name: 'Artist Management', href: '/admin/artists', icon: '🎤' },
    { name: 'Product Management', href: '/admin/products', icon: '🎸' },
    { name: 'Newsletter', href: '/admin/newsletter', icon: '📧' },
    { name: 'Order Management', href: '/admin/orders', icon: '📦', disabled: true },
    { name: 'Support Management', href: '/admin/support', icon: '💬', disabled: true },
    { name: 'Coupon Management', href: '/admin/coupons', icon: '🎫', disabled: true },
    { name: 'Analytics & Reports', href: '/admin/analytics', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-white shadow-lg flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:static inset-y-0 left-0 z-50 lg:z-auto`}>
        <div className="h-full flex flex-col">
        <div className="flex items-center justify-center h-16 bg-[#36454F]">
          <h1 className="text-xl font-bold text-white">M2 Labs Admin</h1>
        </div>
        
        <nav className="mt-8 flex-1 overflow-y-auto">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = item.disabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-400 rounded-md cursor-not-allowed"
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                    <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#FF8A3D] text-black'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-black">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@m2labs.com</p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {pathname === '/admin' && 'Dashboard'}
                {pathname === '/admin/users' && 'User Management'}
                {pathname === '/admin/warranty' && 'Warranty Claims'}
                {pathname === '/admin/news' && 'News Management'}
                {pathname.includes('/admin/news/') && 'Edit News Post'}
                {pathname === '/admin/artists' && 'Artist Management'}
                {pathname === '/admin/products' && 'Product Management'}
                {pathname === '/admin/newsletter' && 'Newsletter Management'}
                {pathname === '/admin/orders' && 'Order Management'}
                {pathname === '/admin/support' && 'Support Management'}
                {pathname === '/admin/coupons' && 'Coupon Management'}
                {pathname === '/admin/analytics' && 'Analytics & Reports'}
                {pathname === '/admin/settings' && 'Settings'}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                ← Back to Website
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
