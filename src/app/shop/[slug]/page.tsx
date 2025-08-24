'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCart } from '@/components/cart/CartProvider';
import { useWishlist } from '@/components/wishlist/WishlistProvider';
import ReviewsList from '@/components/reviews/ReviewsList';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured: boolean;
  powerRequirements?: string;
  compatibility?: string;
  technicalSpecs?: Record<string, any>;
  // Enhanced fields
  youtubeVideoId?: string;
  features?: string[];
  toggleOptions?: Record<string, string>;
  powerConsumption?: string;
  relatedProducts?: string[];
  dimensions?: string;
  weight?: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price?: number;
    isDefault: boolean;
    inventory?: {
      quantity: number;
    };
  }>;
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
    isMainImage: boolean;
    position: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product && product.variants && !selectedVariant) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [product, selectedVariant]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else if (response.status === 404) {
        setError('Product not found');
      } else {
        setError('Failed to load product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    
    setAddingToCart(true);
    try {
      const price = selectedVariant.price || product?.basePrice || 0;
      await addToCart(selectedVariant.id, 1, price / 100); // Convert from cents
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  const extractYouTubeVideoId = (input: string): string => {
    // If it's already just an ID (no URL), return as-is
    if (input && !input.includes('youtube') && !input.includes('youtu.be')) {
      return input;
    }
    
    // Extract from full YouTube URLs
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If no pattern matches, return the original input
    return input;
  };

  const currentPrice = selectedVariant?.price || product?.basePrice || 0;
  const comparePrice = product?.compareAtPrice;
  const mainImages = product?.images?.sort((a, b) => a.position - b.position) || [];
  const selectedImage = mainImages[selectedImageIndex];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
            <p className="mt-4 text-[#F5F5F5]">Loading product...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#36454F] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Product not found'}</p>
            <Link
              href="/shop"
              className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg hover:bg-[#FF8A3D]/80"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-7xl mx-auto px-5">
          {/* Breadcrumb */}
          <div className="mb-8">
            <nav className="flex items-center space-x-2 text-sm text-[#F5F5F5]">
              <Link href="/" className="hover:text-[#FF8A3D]">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-[#FF8A3D]">Shop</Link>
              <span>/</span>
              <span className="text-[#FF8A3D]">{product.name}</span>
            </nav>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px] max-h-[500px] flex items-center justify-center">
                  {selectedImage ? (
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.altText || product.name}
                      width={600}
                      height={600}
                      className="w-full h-auto max-h-[500px] object-contain"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {mainImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {mainImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative bg-gray-100 rounded-lg overflow-hidden border-2 h-20 flex items-center justify-center ${
                          index === selectedImageIndex ? 'border-[#FF8A3D]' : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.altText || `${product.name} ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-auto max-h-20 object-contain"
                          style={{ objectFit: 'contain' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  {product.brand && (
                    <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand.name}</p>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  {product.isFeatured && (
                    <span className="inline-block bg-[#FF8A3D] text-black text-sm px-3 py-1 rounded mt-2">
                      Featured Product
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4">
                  {comparePrice && comparePrice > currentPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(comparePrice)}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(currentPrice)}
                  </span>
                  {comparePrice && comparePrice > currentPrice && (
                    <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                      Save {formatPrice(comparePrice - currentPrice)}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Variant Selection */}
                {product.variants && product.variants.length > 1 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Variant</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                            selectedVariant?.id === variant.id
                              ? 'border-[#FF8A3D] bg-[#FF8A3D]/10 text-[#FF8A3D]'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {variant.name}
                          {variant.price && variant.price !== product.basePrice && (
                            <span className="block text-xs">
                              {formatPrice(variant.price)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div>
                  {selectedVariant?.inventory?.quantity ? (
                    <p className="text-green-600 text-sm">
                      ✓ In stock ({selectedVariant.inventory.quantity} available)
                    </p>
                  ) : (
                    <p className="text-red-600 text-sm">
                      ⚠ Limited stock
                    </p>
                  )}
                </div>

                {/* Add to Cart */}
                <div className="space-y-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !selectedVariant}
                    className="w-full bg-[#FF8A3D] text-black py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        const inWishlist = isInWishlist(product.id, selectedVariant?.id);
                        if (inWishlist) {
                          removeFromWishlist(product.id, selectedVariant?.id);
                        } else {
                          addToWishlist(product.id, selectedVariant?.id);
                        }
                      }}
                      className={`py-2 px-4 rounded-lg transition-colors ${
                        isInWishlist(product.id, selectedVariant?.id)
                          ? 'bg-[#FF8A3D] text-black'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isInWishlist(product.id, selectedVariant?.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                    <Link
                      href="/contact"
                      className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
                    >
                      Ask Question
                    </Link>
                  </div>
                </div>

                {/* Key Features */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    {/* Product-specific features */}
                    {product.features && product.features.length > 0 ? (
                      product.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))
                    ) : (
                      <>
                        <li>• Transferable lifetime warranty</li>
                        <li>• Handcrafted in the USA</li>
                        <li>• Premium components throughout</li>
                      </>
                    )}
                    {/* Technical specifications */}
                    {product.powerRequirements && (
                      <li>• Power: {product.powerRequirements}</li>
                    )}
                    {product.powerConsumption && (
                      <li>• Power consumption: {product.powerConsumption}</li>
                    )}
                    {product.dimensions && (
                      <li>• Dimensions: {product.dimensions}</li>
                    )}
                    {product.weight && (
                      <li>• Weight: {product.weight}</li>
                    )}
                    {product.compatibility && (
                      <li>• Compatible with: {product.compatibility}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* YouTube Video Section */}
            {product.youtubeVideoId && (
              <div className="border-t border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Demo</h2>
                <div className="max-w-4xl mx-auto">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${extractYouTubeVideoId(product.youtubeVideoId)}`}
                      title={`${product.name} Demo Video`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Demo video for {product.name}
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Description */}
            {product.description && (
              <div className="border-t border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Toggle Options & Settings */}
            {product.toggleOptions && Object.keys(product.toggleOptions).length > 0 && (
              <div className="border-t border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Toggle Options & Settings</h2>
                <div className="space-y-4">
                  {Object.entries(product.toggleOptions).map(([setting, description]) => (
                    <div key={setting} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{setting}</h3>
                      <p className="text-gray-600">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications */}
            {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 && (
              <div className="border-t border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(product.technicalSpecs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">{key}:</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="border-t border-gray-200 p-8">
              <ReviewsList productId={product.id} />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
