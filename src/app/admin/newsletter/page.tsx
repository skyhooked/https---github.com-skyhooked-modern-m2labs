'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import NewsletterDashboard from '@/components/admin/NewsletterDashboard';
import CampaignManager from '@/components/admin/CampaignManager';
import TemplateManager from '@/components/admin/TemplateManager';
import SubscriberManager from '@/components/admin/SubscriberManager';

export const runtime = 'edge';

type TabType = 'dashboard' | 'campaigns' | 'templates' | 'subscribers';

export default function NewsletterManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalCampaigns: 0,
    sentCampaigns: 0
  });

  // Load initial stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch subscribers
        const subscribersResponse = await fetch('/api/newsletter', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (subscribersResponse.ok) {
          const subscribersData = await subscribersResponse.json();
          console.log('Newsletter API response:', subscribersData);
          setStats(prev => ({
            ...prev,
            totalSubscribers: subscribersData.totalCount || 0,
            activeSubscribers: subscribersData.activeCount || 0
          }));
        } else {
          console.error('Newsletter API error:', subscribersResponse.status, await subscribersResponse.text());
        }

        // Fetch campaigns
        const campaignsResponse = await fetch('/api/newsletter/campaigns', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          const campaigns = campaignsData.campaigns || [];
          setStats(prev => ({
            ...prev,
            totalCampaigns: campaigns.length,
            sentCampaigns: campaigns.filter((c: any) => c.status === 'sent').length
          }));
        }
      } catch (error) {
        console.error('Error loading newsletter stats:', error);
      }
    };

    loadStats();
  }, []);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: '📊' },
    { id: 'campaigns' as TabType, label: 'Campaigns', icon: '📧' },
    { id: 'templates' as TabType, label: 'Templates', icon: '🎨' },
    { id: 'subscribers' as TabType, label: 'Subscribers', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <NewsletterDashboard stats={stats} />;
      case 'campaigns':
        return <CampaignManager />;
      case 'templates':
        return <TemplateManager />;
      case 'subscribers':
        return <SubscriberManager />;
      default:
        return <NewsletterDashboard stats={stats} />;
    }
  };

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Newsletter Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your email campaigns, templates, and subscribers
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.activeSubscribers}</div>
                <div className="text-sm text-gray-600">Active Subscribers</div>
              </div>
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.sentCampaigns}</div>
                <div className="text-sm text-gray-600">Campaigns Sent</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border">
            {renderTabContent()}
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

