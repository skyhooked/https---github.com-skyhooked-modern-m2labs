'use client';

import React, { useState, useEffect } from 'react';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price?: number;
  isDefault: boolean;
  inventory?: {
    quantity: number;
  };
}

interface ProductImage {
  id?: string;
  url: string;
  altText?: string;
  isMainImage: boolean;
  position: number;
}

interface Product {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured: boolean;
  isActive: boolean;
  powerRequirements?: string;
  compatibility?: string;
  technicalSpecs?: Record<string, any>;
  brand?: Brand;
  variants?: ProductVariant[];
  images?: ProductImage[];
  categories?: Category[];
}

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    basePrice: 0,
    compareAtPrice: 0,
    isFeatured: false,
    isActive: true,
    powerRequirements: '',
    compatibility: '',
    technicalSpecs: {},
    variants: [{ name: 'Standard', sku: '', isDefault: true, inventory: { quantity: 0 } }],
    images: [],
    categories: []
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBrands();
    fetchCategories();
    
    if (product) {
      setFormData({
        ...product,
        compareAtPrice: product.compareAtPrice || 0,
        technicalSpecs: product.technicalSpecs || {},
        variants: product.variants || [{ name: 'Standard', sku: '', isDefault: true, inventory: { quantity: 0 } }],
        images: product.images || [],
        categories: product.categories || []
      });
    }
  }, [product]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/admin/brands');
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        slug: generateSlug(value)
      }));
    } else if (name === 'basePrice' || name === 'compareAtPrice') {
      const priceInCents = parseFloat(value) * 100;
      setFormData(prev => ({ ...prev, [name]: priceInCents }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updatedVariants = [...(formData.variants || [])];
    if (field === 'price') {
      updatedVariants[index] = { ...updatedVariants[index], [field]: parseFloat(value) * 100 };
    } else if (field === 'quantity') {
      updatedVariants[index] = { 
        ...updatedVariants[index], 
        inventory: { quantity: parseInt(value) || 0 }
      };
    } else {
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      name: '',
      sku: '',
      isDefault: false,
      inventory: { quantity: 0 }
    };
    setFormData(prev => ({ 
      ...prev, 
      variants: [...(prev.variants || []), newVariant] 
    }));
  };

  const removeVariant = (index: number) => {
    const updatedVariants = formData.variants?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || { general: 'Failed to save product' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ general: 'Failed to save product' });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-2">
            {product ? 'Update product details and settings' : 'Create a new product for your catalog'}
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
            form="product-form"
            disabled={loading}
            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="product-url-slug"
              />
              {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug}</p>}
            </div>

            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Base Price ($) *
              </label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={formatPrice(formData.basePrice)}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="299.99"
              />
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Compare At Price ($)
              </label>
              <input
                type="number"
                id="compareAtPrice"
                name="compareAtPrice"
                value={formatPrice(formData.compareAtPrice || 0)}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="399.99"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select
                id="brand"
                name="brandId"
                value={formData.brand?.id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              >
                <option value="">Select a brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-6">
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
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                  Featured
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              placeholder="Brief description for product cards and listings"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Full Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
              placeholder="Detailed product description with features and specifications"
            />
          </div>
        </div>

        {/* Product Variants */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
            <button
              type="button"
              onClick={addVariant}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {formData.variants?.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variant Name *
                    </label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="Standard, Limited Edition, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="PROD-001-STD"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={variant.price ? formatPrice(variant.price) : ''}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="Leave empty to use base price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={variant.inventory?.quantity || 0}
                      onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={variant.isDefault}
                      onChange={(e) => handleVariantChange(index, 'isDefault', e.target.checked)}
                      className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Default variant
                    </label>
                  </div>
                  {formData.variants && formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Technical Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="powerRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                Power Requirements
              </label>
              <input
                type="text"
                id="powerRequirements"
                name="powerRequirements"
                value={formData.powerRequirements || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="9V DC, center negative"
              />
            </div>

            <div>
              <label htmlFor="compatibility" className="block text-sm font-medium text-gray-700 mb-2">
                Compatibility
              </label>
              <input
                type="text"
                id="compatibility"
                name="compatibility"
                value={formData.compatibility || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="Electric guitar, bass guitar"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
