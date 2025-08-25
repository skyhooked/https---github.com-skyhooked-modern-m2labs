'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Dark mode context
const DarkModeContext = createContext<{
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Dark mode hook
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('admin-dark-mode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Default to dark mode for admin
      setIsDarkMode(true);
      localStorage.setItem('admin-dark-mode', 'true');
    }
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('admin-dark-mode', JSON.stringify(newDarkMode));
  };

  return { isDarkMode, toggleDarkMode };
}

// Dark mode toggle button component
function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        // Sun icon for light mode
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const darkMode = useDarkMode();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'User Management', href: '/admin/users', icon: '👥' },
    { name: 'Distributor Management', href: '/admin/distributors', icon: '🏢' },
    { name: 'Warranty Claims', href: '/admin/warranty', icon: '🛡️' },
    { name: 'News Management', href: '/admin/news', icon: '📰' },
    { name: 'Artist Management', href: '/admin/artists', icon: '🎤' },
    { name: 'Product Management', href: '/admin/products', icon: '🎸' },
    { name: 'Newsletter', href: '/admin/newsletter', icon: '📧' },
    { name: 'Order Management', href: '/admin/orders', icon: '📦', disabled: false },
    { name: 'Support Management', href: '/admin/support', icon: '💬' },
    { name: 'Coupon Management', href: '/admin/coupons', icon: '🎫', disabled: true },
    { name: 'Analytics & Reports', href: '/admin/analytics', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
    { name: 'Database Migration', href: '/admin/migrate', icon: '🔄' },
  ];

  return (
    <DarkModeContext.Provider value={darkMode}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
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
      <div className={`w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:static inset-y-0 left-0 z-50 lg:z-auto`}>
        <div className="h-full flex flex-col">
        <div className="flex items-center justify-center h-16 bg-[#36454F] dark:bg-gray-900">
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
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 rounded-md cursor-not-allowed"
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                    <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">Soon</span>
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
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-black">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@m2labs.com</p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
              <DarkModeToggle />
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ← Back to Website
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-8 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      </div>
    </DarkModeContext.Provider>
  );
}
