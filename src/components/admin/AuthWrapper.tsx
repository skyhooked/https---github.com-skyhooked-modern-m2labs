'use client';

import { useState, useEffect } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Simple auth state - in the future, replace with proper authentication
const AUTH_KEY = 'admin_authenticated';

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem(AUTH_KEY);
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check - replace with proper auth in the future
    const ADMIN_PASSWORD = 'admin123'; // TODO: Move to environment variables
    
    if (password === ADMIN_PASSWORD) {
      try {
        // Generate a proper JWT token for admin API access
        const response = await fetch('/api/auth/admin-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: ADMIN_PASSWORD })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem(AUTH_KEY, 'true');
          localStorage.setItem('token', data.token); // Store JWT token for API calls
          setIsAuthenticated(true);
          setError('');
        } else {
          setError('Failed to generate admin token');
        }
      } catch (error) {
        console.error('Admin login error:', error);
        setError('Login failed');
      }
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token'); // Clear JWT token
    setIsAuthenticated(false);
    setPassword('');
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">M2 Labs Admin</h1>
            <p className="text-gray-600">Enter password to access admin panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
            >
              Access Admin Panel
            </button>
          </form>
          
          <div className="text-center text-xs text-gray-500">
            <p>Temporary password: admin123</p>
            <p>(This will be replaced with proper authentication)</p>
          </div>
        </div>
      </div>
    );
  }

  // Render admin content if authenticated
  return (
    <div>
      {/* Add logout option to the admin interface */}
      <div className="hidden" id="logout-trigger">
        <button onClick={handleLogout}>Logout</button>
      </div>
      {children}
    </div>
  );
}

