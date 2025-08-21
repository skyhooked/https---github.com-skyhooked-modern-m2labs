'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { useWishlist } from '@/components/wishlist/WishlistProvider';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured: boolean;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  defaultVariant?: {
    id: string;
    name: string;
    sku: string;
    price?: number;
  };
  images?: {
    id: string;
    url: string;
    altText?: string;
    isMainImage: boolean;
  }[];
}

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isLoading, setIsLoading] = React.useState(false);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);

  const mainImage = product.images?.find(img => img.isMainImage) || product.images?.[0];
  const price = product.defaultVariant?.price || product.basePrice;
  const comparePrice = product.compareAtPrice;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100); // Convert from cents to dollars
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.defaultVariant) {
      // Navigate to product page to select variant
      window.location.href = `/shop/${product.slug}`;
      return;
    }
    
    setIsLoading(true);
    try {
      await addToCart(
        product.defaultVariant.id,
        1,
        price / 100 // Convert from cents to dollars for cart
      );
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // You could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setWishlistLoading(true);
    try {
      const inWishlist = isInWishlist(product.id, product.defaultVariant?.id);
      if (inWishlist) {
        await removeFromWishlist(product.id, product.defaultVariant?.id);
      } else {
        await addToWishlist(product.id, product.defaultVariant?.id);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (layout === 'list') {
    return (
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
          <div className="flex items-center space-x-6">
            {/* Product Image */}
            <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={mainImage.altText || product.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  {product.brand && (
                    <p className="text-sm text-gray-500">{product.brand.name}</p>
                  )}
                  {product.shortDescription && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.shortDescription}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {comparePrice && comparePrice > price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(comparePrice)}
                      </span>
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(price)}
                    </span>
                  </div>
                  {product.isFeatured && (
                    <span className="inline-block bg-[#FF8A3D] text-black text-xs px-2 py-1 rounded mt-1">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/shop/${product.slug}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
        {/* Product Image */}
        <div className="aspect-w-1 aspect-h-1 bg-gray-100 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={mainImage.altText || product.name}
              width={300}
              height={300}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Featured Badge */}
          {product.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="bg-[#FF8A3D] text-black text-xs px-2 py-1 rounded">
                Featured
              </span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`p-2 rounded-full transition-colors ${
                isInWishlist(product.id, product.defaultVariant?.id)
                  ? 'bg-[#FF8A3D] text-black'
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-[#FF8A3D]'
              } disabled:opacity-50`}
            >
              <svg className="w-5 h-5" fill={isInWishlist(product.id, product.defaultVariant?.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          
          {/* Sale Badge */}
          {comparePrice && comparePrice > price && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                Sale
              </span>
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="p-4">
          <div className="mb-2">
            {product.brand && (
              <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand.name}</p>
            )}
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          </div>
          
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {comparePrice && comparePrice > price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(price)}
              </span>
            </div>
            
            {/* Quick Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="bg-[#FF8A3D] text-black px-3 py-1.5 rounded text-sm font-medium hover:bg-[#FF8A3D]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : '+'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
