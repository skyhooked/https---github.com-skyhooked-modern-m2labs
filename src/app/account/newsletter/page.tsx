'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export const runtime = 'edge';

interface NewsletterSubscription {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  subscriptionDate: string;
  preferences?: any;
  source: string;
}

export default function NewsletterPreferences() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<NewsletterSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      // Check if user is subscribed by trying to fetch their subscription
      const response = await fetch('/api/newsletter', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userSubscription = data.subscribers?.find((sub: any) => 
          sub.email.toLowerCase() === user.email.toLowerCase() || sub.userId === user.id
        );
        
        if (userSubscription) {
          setSubscription(userSubscription);
          setIsSubscribed(userSubscription.isActive);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          source: 'account'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(true);
        setMessage({
          type: 'success',
          text: data.alreadySubscribed 
            ? 'You\'re already subscribed to our newsletter!' 
            : 'Successfully subscribed to our newsletter!'
        });
        await checkSubscriptionStatus();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to subscribe to newsletter'
        });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage({
        type: 'error',
        text: 'Failed to subscribe to newsletter'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user || !confirm('Are you sure you want to unsubscribe from our newsletter?')) {
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/newsletter?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setIsSubscribed(false);
        setSubscription(null);
        setMessage({
          type: 'success',
          text: 'Successfully unsubscribed from newsletter'
        });
      } else {
        const data = await response.json();
        setMessage({
          type: 'error',
          text: data.error || 'Failed to unsubscribe'
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage({
        type: 'error',
        text: 'Failed to unsubscribe'
      });
    } finally {
      setUpdating(false);
    }
  };

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

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-content mx-auto px-5">
          {/* Header */}
          <div className="mb-8">
            <Link href="/account" className="text-[#FF8A3D] hover:text-white text-sm mb-4 inline-block">
              ← Back to Account
            </Link>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <h1 className="text-3xl font-bold text-primary mb-2">Newsletter Preferences</h1>
                <p className="text-secondary">Manage your email subscription and preferences</p>
              </div>
            </div>
          </div>

          {/* Newsletter Status */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-primary mb-2">Subscription Status</h2>
                  <p className="text-secondary">
                    Email: <span className="font-medium">{user.email}</span>
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isSubscribed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                </div>
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                {isSubscribed ? (
                  <div className="space-y-4">
                    {subscription && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Subscription Details</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Subscribed: {new Date(subscription.subscriptionDate).toLocaleDateString()}</p>
                          <p>Source: {subscription.source.charAt(0).toUpperCase() + subscription.source.slice(1)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handleUnsubscribe}
                        disabled={updating}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Updating...' : 'Unsubscribe'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Stay Connected</h3>
                      <p className="text-sm text-blue-800">
                        Subscribe to our newsletter to receive updates about new products, artist news, 
                        exclusive content, and special offers.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleSubscribe}
                      disabled={updating}
                      className="px-6 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {updating ? 'Subscribing...' : 'Subscribe to Newsletter'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Newsletter Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-primary mb-4">What You'll Receive</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">Product Updates</h3>
                      <p className="text-sm text-secondary">Be the first to know about new pedals and gear releases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">Artist Features</h3>
                      <p className="text-sm text-secondary">Discover new artists and hear their stories</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">Exclusive Offers</h3>
                      <p className="text-sm text-secondary">Get special discounts and early access to sales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#FF8A3D] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">Tech Insights</h3>
                      <p className="text-sm text-secondary">Learn about pedal technology and sound design</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Privacy Promise:</strong> We respect your privacy and will never share your email address 
                  with third parties. You can unsubscribe at any time using the link in our emails or by 
                  managing your preferences here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
