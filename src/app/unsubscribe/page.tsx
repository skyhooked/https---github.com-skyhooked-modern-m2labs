'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (emailParam && token) {
      setEmail(emailParam);
      setStatus('form');
    } else if (emailParam) {
      setEmail(emailParam);
      setStatus('form');
    } else {
      setStatus('form');
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = searchParams.get('token');
      const campaignId = searchParams.get('campaign');
      
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim() || undefined,
          campaignId: campaignId || undefined,
          token: token || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.alreadyUnsubscribed 
          ? 'You are already unsubscribed from our newsletter.' 
          : 'You have been successfully unsubscribed from our newsletter.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (status === 'success') {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-2xl mx-auto px-5">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsubscribed Successfully</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  We're sorry to see you go! Your email address has been removed from our newsletter list.
                </p>
                <div className="flex justify-center space-x-4">
                  <a 
                    href="/" 
                    className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-opacity-80 font-medium"
                  >
                    Visit Our Website
                  </a>
                  <a 
                    href="/contact" 
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-2xl mx-auto px-5">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsubscribe Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-4">
                <button 
                  onClick={() => setStatus('form')}
                  className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-opacity-80 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-2xl mx-auto px-5">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe from Newsletter</h1>
              <p className="text-gray-600">
                We're sorry to see you go. Please confirm your email address to unsubscribe.
              </p>
            </div>

            <form onSubmit={handleUnsubscribe} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Unsubscribing (Optional)
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a reason (optional)</option>
                  <option value="too_frequent">Emails are too frequent</option>
                  <option value="not_relevant">Content is not relevant</option>
                  <option value="never_signed_up">I never signed up</option>
                  <option value="technical_issues">Technical issues</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Before you go...</h3>
                <p className="text-sm text-blue-800">
                  You can also manage your email preferences in your account settings instead of 
                  unsubscribing completely. This way you can choose what types of emails you receive.
                </p>
                <div className="mt-3">
                  <a 
                    href="/account/newsletter" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Manage Email Preferences →
                  </a>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
                <a
                  href="/"
                  className="flex-1 px-6 py-3 text-center text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  Keep Subscription
                </a>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
