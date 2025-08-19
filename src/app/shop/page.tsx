'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/product/ProductCard';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/products?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchTerm);
  };

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#F5F5F5]">M2 Labs Store</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-center text-secondary mb-8 max-w-2xl mx-auto">
              Discover our handcrafted guitar pedals. Each pedal comes with our transferable lifetime warranty
              and is built to inspire your creativity.
            </p>
            
            {/* Search and Filters */}
            <div className="mb-8 border-b border-gray-200 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8A3D] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
                
                {/* Layout Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">View:</span>
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 rounded ${layout === 'grid' ? 'bg-[#FF8A3D] text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 rounded ${layout === 'list' ? 'bg-[#FF8A3D] text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Products */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchProducts()}
                  className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg hover:bg-[#FF8A3D]/80"
                >
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No products available</h3>
                <p className="mt-2 text-gray-500">
                  Products will appear here once they are added to the catalog.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                
                <div className={
                  layout === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }>
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      layout={layout}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
