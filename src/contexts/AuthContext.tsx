'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/libs/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: ProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to prevent auth flash

  // Check if user is authenticated on component mount
  useEffect(() => {
    // Skip auth check for admin routes - they use their own AuthWrapper
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('AuthProvider: Skipping auth check for admin route:', window.location.pathname);
      setLoading(false);
      return;
    }
    
    console.log('AuthProvider: Running auth check for route:', typeof window !== 'undefined' ? window.location.pathname : 'server');
    // Run auth check asynchronously without blocking render
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Double-check: Skip auth check for admin routes
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('AuthProvider: checkAuth() called but skipping for admin route');
      setLoading(false);
      return;
    }
    
    try {
      console.log('AuthProvider: Making request to /api/auth/me');
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/auth/me', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // 401 is expected for unauthenticated users, don't log as error
        setUser(null);
      }
    } catch (err: unknown) {
      // Handle aborted requests and other errors gracefully
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn('Auth check timed out');
      } else if (err instanceof TypeError) {
        console.error('Auth check network error:', err);
      } else {
        console.error('Auth check failed:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
  };

  const register = async (userData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData: ProfileData) => {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Profile update failed');
    }

    setUser(data.user);
  };

  const refreshUser = async () => {
    // Skip refresh for admin routes
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }
    await checkAuth();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
