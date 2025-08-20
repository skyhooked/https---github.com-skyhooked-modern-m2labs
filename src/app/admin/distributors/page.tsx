'use client';

import React, { useState, useEffect } from 'react';
import AuthWrapper from '@/components/admin/AuthWrapper';
import AdminLayout from '@/components/admin/AdminLayout';

export const runtime = 'edge'

interface Distributor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  username: string;
  territory?: string;
  discountRate: number;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  tier: 'standard' | 'premium' | 'exclusive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
  isVerified: boolean;
}

export default function DistributorManagement() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);

  useEffect(() => {
    fetchDistributors();
  }, [statusFilter, tierFilter]);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tierFilter !== 'all') params.append('tier', tierFilter);

      const response = await fetch(`/api/admin/distributors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDistributors(data.distributors || []);
      }
    } catch (error) {
      console.error('Error fetching distributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistributors = distributors.filter(distributor =>
    distributor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distributor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distributor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distributor.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'exclusive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (distributor: Distributor) => {
    setEditingDistributor(distributor);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this distributor?')) return;

    try {
      const response = await fetch(`/api/admin/distributors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDistributors(distributors.filter(d => d.id !== id));
      } else {
        const data = await response.json();
        alert(`Failed to delete distributor: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting distributor:', error);
      alert('Failed to delete distributor');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDistributor(null);
  };

  if (showForm) {
    return (
      <AuthWrapper>
        <AdminLayout>
          <DistributorForm
            distributor={editingDistributor}
            onSave={() => {
              closeForm();
              fetchDistributors();
            }}
            onCancel={closeForm}
          />
        </AdminLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Distributor Management</h1>
              <p className="text-gray-600 mt-2">
                Manage distributor accounts, territories, and business relationships
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80"
            >
              Add Distributor
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{distributors.length}</div>
              <div className="text-sm text-gray-600">Total Distributors</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {distributors.filter(d => d.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {distributors.filter(d => d.tier === 'premium' || d.tier === 'exclusive').length}
              </div>
              <div className="text-sm text-gray-600">Premium/Exclusive</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                ${distributors.reduce((sum, d) => sum + d.currentBalance, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Outstanding</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by company, contact name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                >
                  <option value="all">All Tiers</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Distributors Table */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8A3D]"></div>
                <p className="mt-2 text-gray-600">Loading distributors...</p>
              </div>
            ) : filteredDistributors.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No distributors found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by adding your first distributor.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company & Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Territory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status & Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDistributors.map((distributor) => (
                      <tr key={distributor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{distributor.companyName}</div>
                            <div className="text-sm text-gray-500">{distributor.contactName}</div>
                            <div className="text-sm text-gray-500">{distributor.email}</div>
                            <div className="text-sm text-gray-500">@{distributor.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {distributor.territory || 'Not assigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {distributor.city}, {distributor.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(distributor.status)}`}>
                              {distributor.status.toUpperCase()}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(distributor.tier)}`}>
                              {distributor.tier.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Credit: ${distributor.creditLimit.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Balance: ${distributor.currentBalance.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Discount: {(distributor.discountRate * 100).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {distributor.lastLoginAt
                            ? new Date(distributor.lastLoginAt).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(distributor)}
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(distributor.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

// Distributor Form Component
interface DistributorFormProps {
  distributor?: Distributor | null;
  onSave: () => void;
  onCancel: () => void;
}

function DistributorForm({ distributor, onSave, onCancel }: DistributorFormProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    username: '',
    password: '',
    territory: '',
    discountRate: 0,
    creditLimit: 0,
    currentBalance: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'pending',
    tier: 'standard' as 'standard' | 'premium' | 'exclusive',
    notes: '',
    isVerified: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (distributor) {
      setFormData({
        companyName: distributor.companyName,
        contactName: distributor.contactName,
        email: distributor.email,
        phone: distributor.phone || '',
        address: distributor.address || '',
        city: distributor.city || '',
        state: distributor.state || '',
        postalCode: distributor.postalCode || '',
        country: distributor.country || 'US',
        username: distributor.username,
        password: '', // Don't populate password for editing
        territory: distributor.territory || '',
        discountRate: distributor.discountRate,
        creditLimit: distributor.creditLimit,
        currentBalance: distributor.currentBalance,
        status: distributor.status,
        tier: distributor.tier,
        notes: distributor.notes || '',
        isVerified: distributor.isVerified
      });
    }
  }, [distributor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = distributor 
        ? `/api/admin/distributors/${distributor.id}`
        : '/api/admin/distributors';
      
      const method = distributor ? 'PUT' : 'POST';
      
      const submitData = { ...formData };
      
      // Only include password if it's set (for new distributors or password changes)
      if (!submitData.password && distributor) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        alert(`Failed to save distributor: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving distributor:', error);
      alert('Failed to save distributor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {distributor ? 'Edit Distributor' : 'Add New Distributor'}
        </h1>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Distributors
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
        {/* Company Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {distributor ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={!distributor}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Territory
              </label>
              <input
                type="text"
                value={formData.territory}
                onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                placeholder="e.g., Pacific Northwest, Southeast US"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Verified Distributor</span>
              </label>
            </div>
          </div>
        </div>

        {/* Business Terms */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discountRate * 100}
                onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) / 100 || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Internal notes about this distributor..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#FF8A3D] text-black rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50"
          >
            {saving ? 'Saving...' : distributor ? 'Update Distributor' : 'Create Distributor'}
          </button>
        </div>
      </form>
    </div>
  );
}
