'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';

export const runtime = 'edge'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'M2 Labs',
    siteDescription: 'Custom Guitar Pedals & Audio Electronics',
    adminEmail: 'admin@m2labs.com',
    maintenanceMode: false,
    emailNotifications: true,
    orderNotifications: true,
    inventoryAlerts: true,
    lowStockThreshold: 5,
    timezone: 'America/New_York',
    currency: 'USD',
    taxRate: 8.5,
    shippingEnabled: true,
    freeShippingThreshold: 75,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // TODO: Implement actual save functionality
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '🏢' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
    { id: 'notifications', name: 'Notifications', icon: '📧' },
    { id: 'security', name: 'Security', icon: '🔒' },
  ];

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Settings</h1>
            <p className="text-gray-600">Configure your admin panel and site-wide settings</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#FF8A3D] text-[#FF8A3D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleSettingChange('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Description
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="maintenanceMode"
                          checked={settings.maintenanceMode}
                          onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                          className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                        />
                        <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
                          Enable maintenance mode (shows maintenance page to visitors)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E-commerce Settings */}
              {activeTab === 'ecommerce' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">E-commerce Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleSettingChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.taxRate}
                        onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Shipping Threshold ($)
                      </label>
                      <input
                        type="number"
                        value={settings.freeShippingThreshold}
                        onChange={(e) => handleSettingChange('freeShippingThreshold', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="shippingEnabled"
                          checked={settings.shippingEnabled}
                          onChange={(e) => handleSettingChange('shippingEnabled', e.target.checked)}
                          className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                        />
                        <label htmlFor="shippingEnabled" className="ml-2 text-sm text-gray-700">
                          Enable shipping calculations
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive admin notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Order Notifications</h4>
                        <p className="text-sm text-gray-500">Get notified when new orders are placed</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.orderNotifications}
                        onChange={(e) => handleSettingChange('orderNotifications', e.target.checked)}
                        className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Inventory Alerts</h4>
                        <p className="text-sm text-gray-500">Get alerts when products are running low</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.inventoryAlerts}
                        onChange={(e) => handleSettingChange('inventoryAlerts', e.target.checked)}
                        className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Security Features</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Session-based authentication is enabled</li>
                            <li>HTTPS encryption is enforced</li>
                            <li>Admin access logging is active</li>
                            <li>Password requirements: 8+ characters with mixed case</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      🔄 Force Password Reset for All Users
                    </button>
                    
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      📊 View Security Logs
                    </button>
                    
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      🔒 Enable Two-Factor Authentication
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Save Changes</h3>
                <p className="text-sm text-gray-500">Make sure to save your settings before leaving this page.</p>
              </div>
              <button
                onClick={handleSave}
                className="bg-[#FF8A3D] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

