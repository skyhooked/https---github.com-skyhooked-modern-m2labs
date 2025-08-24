'use client';

import React, { useState, useEffect } from 'react';



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
  brandId?: string;
  sku?: string;
  basePrice: number;
  compareAtPrice?: number;
  cost?: number;
  isFeatured: boolean;
  isActive: boolean;
  weight?: string;
  dimensions?: string;
  powerRequirements?: string;
  compatibility?: string;
  technicalSpecs?: Record<string, any>;
  // Enhanced fields inspired by JHS Pedals
  youtubeVideoId?: string;
  features?: string[];
  toggleOptions?: Record<string, string>;
  powerConsumption?: string;
  relatedProducts?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
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
    brandId: 'brand-m2labs', // Default to M2 Labs brand (using database ID)
    sku: '',
    basePrice: 0,
    compareAtPrice: 0,
    cost: 0,
    isFeatured: false,
    isActive: true,
    weight: '',
    dimensions: '',
    powerRequirements: '',
    compatibility: '',
    technicalSpecs: {},
    // Enhanced fields
    youtubeVideoId: '',
    features: [],
    toggleOptions: {},
    powerConsumption: '',
    relatedProducts: [],
    seoTitle: '',
    seoDescription: '',
    metaKeywords: '',
    variants: [{ name: 'Standard', sku: '', isDefault: true, inventory: { quantity: 0 } }],
    images: [],
    categories: []
  });

  // Separate state for price display values to avoid input cursor jumping
  const [priceDisplayValues, setPriceDisplayValues] = useState({
    basePrice: '0.00',
    compareAtPrice: '0.00'
  });
  
  // Track variant price display values separately
  const [variantPriceDisplayValues, setVariantPriceDisplayValues] = useState<{ [key: number]: string }>({});


  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFileName, setImageFileName] = useState('');

  useEffect(() => {
    fetchCategories();
    
    if (product) {
      setFormData({
        ...product,
        compareAtPrice: product.compareAtPrice || 0,
        cost: product.cost || 0,
        technicalSpecs: product.technicalSpecs || {},
        brandId: product.brandId || 'brand-m2labs', // Ensure M2 Labs brand is always set (using database ID)
        sku: product.sku || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        // Enhanced fields with defaults
        youtubeVideoId: product.youtubeVideoId || '',
        features: product.features || [],
        toggleOptions: product.toggleOptions || {},
        powerConsumption: product.powerConsumption || '',
        relatedProducts: product.relatedProducts || [],
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        metaKeywords: product.metaKeywords || '',
        variants: product.variants || [{ name: 'Standard', sku: '', isDefault: true, inventory: { quantity: 0 } }],
        images: product.images || [],
        categories: product.categories || []
      });
      
      // Set display values for prices
      setPriceDisplayValues({
        basePrice: formatPrice(product.basePrice || 0),
        compareAtPrice: formatPrice(product.compareAtPrice || 0)
      });
      
      // Set display values for variant prices
      const variantDisplayValues: { [key: number]: string } = {};
      (product.variants || []).forEach((variant, index) => {
        if (variant.price) {
          variantDisplayValues[index] = formatPrice(variant.price);
        }
      });
      setVariantPriceDisplayValues(variantDisplayValues);
    }
  }, [product]);



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
      // Update display value immediately for smooth typing
      setPriceDisplayValues(prev => ({ ...prev, [name]: value }));
      
      // Convert to cents for internal storage
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      const priceInCents = Math.round(numericValue * 100);
      setFormData(prev => ({ ...prev, [name]: priceInCents }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updatedVariants = [...(formData.variants || [])];
    if (field === 'price') {
      // Update display value immediately
      setVariantPriceDisplayValues(prev => ({ ...prev, [index]: value }));
      
      // Convert to cents for internal storage
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      const priceInCents = Math.round(numericValue * 100);
      updatedVariants[index] = { ...updatedVariants[index], [field]: priceInCents };
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
    const newVariantIndex = (formData.variants || []).length;
    setFormData(prev => ({ 
      ...prev, 
      variants: [...(prev.variants || []), newVariant] 
    }));
    // Initialize display value for new variant
    setVariantPriceDisplayValues(prev => ({ ...prev, [newVariantIndex]: '' }));
  };

  const removeVariant = (index: number) => {
    const updatedVariants = formData.variants?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
    
    // Clean up display values and reindex them
    const updatedDisplayValues: { [key: number]: string } = {};
    Object.entries(variantPriceDisplayValues).forEach(([key, value]) => {
      const keyIndex = parseInt(key);
      if (keyIndex < index) {
        updatedDisplayValues[keyIndex] = value;
      } else if (keyIndex > index) {
        updatedDisplayValues[keyIndex - 1] = value;
      }
    });
    setVariantPriceDisplayValues(updatedDisplayValues);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      alert('Upload failed: Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.');
      return;
    }

    setUploadingImage(true);
    setImageFileName(file.name);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Add the uploaded image to the product images
      const newImage: ProductImage = {
        url: result.path,
        altText: formData.name || 'Product image',
        isMainImage: (formData.images?.length || 0) === 0, // First image is main
        position: (formData.images?.length || 0)
      };
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), newImage]
      }));
      
      setImageFileName(`✅ ${file.name} (uploaded)`);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
      setImageFileName('');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = formData.images?.filter((_, i) => i !== index) || [];
    // If we removed the main image, make the first remaining image the main one
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMainImage)) {
      updatedImages[0].isMainImage = true;
    }
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const setMainImage = (index: number) => {
    const updatedImages = formData.images?.map((img, i) => ({
      ...img,
      isMainImage: i === index
    })) || [];
    setFormData(prev => ({ ...prev, images: updatedImages }));
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
                value={priceDisplayValues.basePrice}
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
                value={priceDisplayValues.compareAtPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="399.99"
              />
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

        {/* Product Images */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
          
          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF8A3D] file:text-black hover:file:bg-[#FF8A3D]/80"
            />
            {imageFileName && (
              <p className="mt-1 text-xs text-black">Selected: {imageFileName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG, WebP, or SVG. First image will be the main product image.
            </p>
          </div>

          {/* Images Grid */}
          {formData.images && formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative border border-gray-200 rounded-lg p-2">
                  <img
                    src={image.url}
                    alt={image.altText || 'Product image'}
                    className="w-full h-32 object-cover rounded"
                  />
                  
                  {/* Image Controls */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {!image.isMainImage && (
                      <button
                        type="button"
                        onClick={() => setMainImage(index)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="Set as main image"
                      >
                        Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Main Image Badge */}
                  {image.isMainImage && (
                    <div className="absolute top-1 left-1 bg-green-600 text-white px-2 py-1 rounded text-xs">
                      Main
                    </div>
                  )}
                  
                  {/* Image Info */}
                  <div className="mt-2 text-xs text-gray-600">
                    Position: {image.position + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {(!formData.images || formData.images.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No images uploaded yet. Add some product images to showcase your product.
            </div>
          )}
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
                      value={variantPriceDisplayValues[index] || ''}
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

        {/* Enhanced Product Details */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Enhanced Details</h2>
          
          <div className="space-y-6">
            {/* YouTube Video */}
            <div>
              <label htmlFor="youtubeVideoId" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video ID
              </label>
              <input
                type="text"
                id="youtubeVideoId"
                name="youtubeVideoId"
                value={formData.youtubeVideoId || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                placeholder="dQw4w9WgXcQ (just the video ID from YouTube URL)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Extract the video ID from YouTube URL: youtube.com/watch?v=<strong>VIDEO_ID</strong>
              </p>
            </div>

            {/* Physical Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  placeholder="2.6&quot; x 4.8&quot; x 1.6&quot;"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  placeholder="1.2 lbs"
                />
              </div>

              <div>
                <label htmlFor="powerConsumption" className="block text-sm font-medium text-gray-700 mb-2">
                  Power Consumption
                </label>
                <input
                  type="text"
                  id="powerConsumption"
                  name="powerConsumption"
                  value={formData.powerConsumption || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                  placeholder="64mA"
                />
              </div>
            </div>

            {/* Product Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Features
              </label>
              <div className="space-y-2">
                {(formData.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...(formData.features || [])];
                        newFeatures[index] = e.target.value;
                        setFormData({...formData, features: newFeatures});
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="Feature description"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = [...(formData.features || [])];
                        newFeatures.splice(index, 1);
                        setFormData({...formData, features: newFeatures});
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = [...(formData.features || []), ''];
                    setFormData({...formData, features: newFeatures});
                  }}
                  className="px-4 py-2 bg-[#FF8A3D] text-black rounded-lg hover:bg-[#FF8A3D]/80"
                >
                  Add Feature
                </button>
              </div>
            </div>

            {/* Toggle Options/Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toggle Options & Settings
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Explain different switch positions, settings, or configuration options (like JHS Pedals toggle explanations)
              </p>
              <div className="space-y-2">
                {Object.entries(formData.toggleOptions || {}).map(([key, value], index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newOptions = {...(formData.toggleOptions || {})};
                        delete newOptions[key];
                        newOptions[e.target.value] = value;
                        setFormData({...formData, toggleOptions: newOptions});
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="Setting name (e.g., 'Both toggles up')"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newOptions = {...(formData.toggleOptions || {})};
                        newOptions[key] = e.target.value;
                        setFormData({...formData, toggleOptions: newOptions});
                      }}
                      className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      placeholder="Description of what this setting does"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = {...(formData.toggleOptions || {})};
                        delete newOptions[key];
                        setFormData({...formData, toggleOptions: newOptions});
                      }}
                      className="md:col-span-3 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove Setting
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = {...(formData.toggleOptions || {}), '': ''};
                    setFormData({...formData, toggleOptions: newOptions});
                  }}
                  className="px-4 py-2 bg-[#FF8A3D] text-black rounded-lg hover:bg-[#FF8A3D]/80"
                >
                  Add Setting
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
