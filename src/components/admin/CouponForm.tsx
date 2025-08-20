'use client';

import React, { useState, useEffect } from 'react';

interface Coupon {
  id?: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
}

interface CouponFormProps {
  coupon?: Coupon | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function CouponForm({ coupon, onSave, onCancel }: CouponFormProps) {
  const [formData, setFormData] = useState<Coupon>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimumOrderAmount: 0,
    maximumDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (coupon) {
      setFormData({
        ...coupon,
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
        minimumOrderAmount: coupon.minimumOrderAmount || 0,
        maximumDiscountAmount: coupon.maximumDiscountAmount || 0,
        usageLimit: coupon.usageLimit || 0,
      });
    }
  }, [coupon]);

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'value' || name === 'minimumOrderAmount' || name === 'maximumDiscountAmount' || name === 'usageLimit') {
      const numValue = parseFloat(value) || 0;
      
      // Convert to cents for monetary values
      if ((name === 'value' && formData.type === 'fixed_amount') || 
          name === 'minimumOrderAmount' || 
          name === 'maximumDiscountAmount') {
        setFormData(prev => ({ ...prev, [name]: numValue * 100 }));
      } else {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else if (name === 'code') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Coupon code must be at least 3 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Coupon name is required';
    }

    if (formData.type !== 'free_shipping' && formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required';
    }

    if (formData.validUntil && formData.validFrom && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
      const method = coupon ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        minimumOrderAmount: formData.minimumOrderAmount || null,
        maximumDiscountAmount: formData.maximumDiscountAmount || null,
        usageLimit: formData.usageLimit || null,
      };

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
        const errorData = await response.json();
        setErrors(errorData.errors || { general: 'Failed to save coupon' });
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      setErrors({ general: 'Failed to save coupon' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
          <p className="text-gray-600 mt-2">
            {coupon ? 'Update coupon details and settings' : 'Create a new discount code for customers'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="coupon-form"
            disabled={loading}
            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Coupon'}
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      <form id="coupon-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D] font-mono"
                  placeholder="DISCOUNT20"
                />
                <button
                  type="button"
                  onClick={generateCouponCode}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Generate
                </button>
              </div>
              {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="20% Off All Pedals"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="Special discount for new customers"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Discount Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            {formData.type !== 'free_shipping' && (
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.type === 'fixed_amount' ? formatCurrency(formData.value) : formData.value}
                  onChange={handleInputChange}
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                />
                {errors.value && <p className="text-red-600 text-sm mt-1">{errors.value}</p>}
              </div>
            )}

            <div>
              <label htmlFor="minimumOrderAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount ($)
              </label>
              <input
                type="number"
                id="minimumOrderAmount"
                name="minimumOrderAmount"
                value={formatCurrency(formData.minimumOrderAmount || 0)}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="0.00"
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label htmlFor="maximumDiscountAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Amount ($)
                </label>
                <input
                  type="number"
                  id="maximumDiscountAmount"
                  name="maximumDiscountAmount"
                  value={formatCurrency(formData.maximumDiscountAmount || 0)}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage & Validity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                id="usageLimit"
                name="usageLimit"
                value={formData.usageLimit || ''}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (customers can use this coupon)
              </label>
            </div>

            <div>
              <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-2">
                Valid From *
              </label>
              <input
                type="date"
                id="validFrom"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
              {errors.validFrom && <p className="text-red-600 text-sm mt-1">{errors.validFrom}</p>}
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                id="validUntil"
                name="validUntil"
                value={formData.validUntil || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              />
              {errors.validUntil && <p className="text-red-600 text-sm mt-1">{errors.validUntil}</p>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
