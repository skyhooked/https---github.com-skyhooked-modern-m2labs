'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
export const runtime = 'edge'

export default function Profile() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || ''
      });
    }
  }, [user, loading, router]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
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
            <h1 className="mt-2 text-3xl font-bold text-[#F5F5F5]">Profile Settings</h1>
            <p className="mt-2 text-[#F5F5F5]">
              Update your personal information and preferences
            </p>
          </div>

          {/* Profile Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-primary">Personal Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{success}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-primary">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-primary">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email address cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-primary">
                  Phone number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-primary">
                  Date of birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/account"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8A3D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-primary">Account Information</h2>
            </div>
            <div className="px-6 py-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending verification'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{user.role}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
