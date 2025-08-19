'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/data/newsData';

interface NewsletterDashboardProps {
  stats: {
    totalSubscribers: number;
    activeSubscribers: number;
    totalCampaigns: number;
    sentCampaigns: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'subscription' | 'campaign' | 'unsubscribe';
  description: string;
  timestamp: string;
}

export default function NewsletterDashboard({ stats }: NewsletterDashboardProps) {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch recent campaigns
        const campaignsResponse = await fetch('/api/newsletter/campaigns', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          setRecentCampaigns((campaignsData.campaigns || []).slice(0, 5));
        }

        // Generate mock recent activity for now
        // In production, you'd fetch this from the analytics table
        setRecentActivity([
          {
            id: '1',
            type: 'subscription',
            description: 'New subscriber from homepage',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'campaign',
            description: 'Weekly newsletter sent to 150 subscribers',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'subscription',
            description: 'New subscriber from our-story page',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'subscription': return '👋';
      case 'campaign': return '📧';
      case 'unsubscribe': return '👋';
      default: return '📝';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'sent':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'sending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold">{stats.totalSubscribers}</p>
            </div>
            <div className="text-4xl opacity-80">👥</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium">Active Subscribers</p>
              <p className="text-3xl font-bold">{stats.activeSubscribers}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-purple-100 text-sm font-medium">Total Campaigns</p>
              <p className="text-3xl font-bold">{stats.totalCampaigns}</p>
            </div>
            <div className="text-4xl opacity-80">📧</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-orange-100 text-sm font-medium">Sent Campaigns</p>
              <p className="text-3xl font-bold">{stats.sentCampaigns}</p>
            </div>
            <div className="text-4xl opacity-80">🚀</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCampaigns.length > 0 ? (
              recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{campaign.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadge(campaign.status)}>
                        {campaign.status}
                      </span>
                      {campaign.recipientCount > 0 && (
                        <span className="text-sm text-gray-500">
                          {campaign.recipientCount} recipients
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">📧</div>
                <p>No campaigns yet</p>
                <p className="text-sm">Create your first newsletter campaign to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all">
            <div className="text-2xl">📝</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Campaign</p>
              <p className="text-sm text-gray-600">Start a new newsletter campaign</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all">
            <div className="text-2xl">🎨</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Design Template</p>
              <p className="text-sm text-gray-600">Create a custom email template</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all">
            <div className="text-2xl">📊</div>
            <div className="text-left">
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Check campaign performance</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
