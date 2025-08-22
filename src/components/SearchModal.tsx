'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllArtists } from '@/libs/artists';
import { newsData } from '@/data/newsData';

interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    artists: any[];
    news: any[];
    products: any[];
  }>({ artists: [], news: [], products: [] });

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults({ artists: [], news: [], products: [] });
      return;
    }

    const searchLower = term.toLowerCase();
    
    // Search artists
    let artists: any[] = [];
    try {
      const allArtists = await getAllArtists();
      artists = allArtists.filter(artist => 
        artist.name.toLowerCase().includes(searchLower) ||
        (artist.genre && artist.genre.toLowerCase().includes(searchLower)) ||
        (artist.location && artist.location.toLowerCase().includes(searchLower)) ||
        (artist.bio && artist.bio.toLowerCase().includes(searchLower)) ||
        (artist.gear && artist.gear.some(gear => gear.toLowerCase().includes(searchLower)))
      );
    } catch (error) {
      console.error('Error searching artists:', error);
    }

    // Search news
    const news = newsData.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.fullContent.toLowerCase().includes(searchLower) ||
      (post.category && post.category.toLowerCase().includes(searchLower))
    );

    // Search products
    let products: any[] = [];
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        products = data.products || [];
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }

    setResults({ artists, news, products });
  };

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[10000] flex items-start justify-center pt-20"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#36454F] rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden border border-white/10">
        {/* Search Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products, artists, news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-[#2D3A3F] border border-white/20 rounded-lg focus:outline-none focus:border-[#FF8A3D] text-lg text-white placeholder-white/60"
                autoFocus
              />
              <Image
                src="/icons/search.svg"
                alt="Search"
                width={20}
                height={20}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-50 brightness-0 invert"
              />
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl font-bold p-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!searchTerm.trim() ? (
            <div className="text-center text-white/60 py-8">
              <p>Start typing to search for products, artists, news, or gear...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Products Results */}
              {results.products.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Products ({results.products.length})</h3>
                  <div className="space-y-3">
                    {results.products.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug}`}
                        onClick={onClose}
                        className="block p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images.find((img: any) => img.isMainImage)?.url || product.images[0]?.url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{product.name}</h4>
                            <p className="text-sm text-white/70">
                              ${(product.basePrice / 100).toFixed(2)}
                              {product.brand && ` • ${product.brand.name}`}
                            </p>
                          </div>
                          {product.isFeatured && (
                            <span className="inline-block bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs">
                              Featured
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Results */}
              {results.artists.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Artists ({results.artists.length})</h3>
                  <div className="space-y-3">
                    {results.artists.map((artist) => (
                      <Link
                        key={artist.id}
                        href="/artists"
                        onClick={onClose}
                        className="block p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-medium text-white">{artist.name}</h4>
                            <p className="text-sm text-white/70">{artist.genre} • {artist.location}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* News Results */}
              {results.news.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">News ({results.news.length})</h3>
                  <div className="space-y-3">
                    {results.news.map((post) => (
                      <Link
                        key={post.id}
                        href="/news"
                        onClick={onClose}
                        className="block p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{post.title}</h4>
                            <p className="text-sm text-white/70">
                              {post.fullContent.substring(0, 100)}...
                            </p>
                            {post.category && (
                              <span className="inline-block bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs mt-1">
                                {post.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchTerm.trim() && results.products.length === 0 && results.artists.length === 0 && results.news.length === 0 && (
                <div className="text-center text-white/60 py-8">
                  <p>No results found for "{searchTerm}"</p>
                  <p className="text-sm mt-2">Try searching for product names, artist names, genres, gear, or news topics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
