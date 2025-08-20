'use client';

import React from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/components/wishlist/WishlistProvider';
import { useCart } from '@/components/cart/CartProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function WishlistPage() {
  const { user } = useAuth();
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  if (!user) {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
              <p className="text-gray-600 mb-6">
                Please sign in to view your wishlist and saved items.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/shop"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  const handleAddToCart = async (item: any) => {
    try {
      const price = item.variant?.price || item.product?.basePrice;
      if (item.variant) {
        await addToCart(item.variant.id, 1, price / 100);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 bg-[#36454F] min-h-screen">
          <div className="max-w-4xl mx-auto px-5">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
              <p className="mt-4 text-gray-600">Loading your wishlist...</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-6xl mx-auto px-5">
          {/* Header */}
          <div className="mb-8">
            <nav className="flex items-center space-x-2 text-sm text-[#F5F5F5] mb-4">
              <Link href="/" className="hover:text-[#FF8A3D]">Home</Link>
              <span>/</span>
              <Link href="/account" className="hover:text-[#FF8A3D]">Account</Link>
              <span>/</span>
              <span className="text-[#FF8A3D]">Wishlist</span>
            </nav>
            <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">My Wishlist</h1>
            <p className="text-gray-300">
              {items.length} item{items.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>

          {/* Wishlist Content */}
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">
                Start adding products you love to your wishlist and they'll appear here.
              </p>
              <Link
                href="/shop"
                className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors inline-block"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Saved Items</h2>
                  <p className="text-sm text-gray-500">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <Link href={`/shop/${item.product?.slug}`}>
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            {item.product?.images?.find(img => img.isMainImage) ? (
                              <Image
                                src={item.product.images.find(img => img.isMainImage)?.url!}
                                alt={item.product.name}
                                width={80}
                                height={80}
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
                        </Link>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/shop/${item.product?.slug}`}>
                          <h3 className="text-lg font-medium text-gray-900 hover:text-[#FF8A3D] transition-colors">
                            {item.product?.name}
                          </h3>
                        </Link>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            Variant: {item.variant.name}
                          </p>
                        )}
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {formatPrice(item.variant?.price || item.product?.basePrice || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        {item.variant && (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
                          >
                            Add to Cart
                          </button>
                        )}
                        <Link
                          href={`/shop/${item.product?.slug}`}
                          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => removeFromWishlist(item.productId, item.variantId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Keep shopping to discover more great products
                  </p>
                  <Link
                    href="/shop"
                    className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
