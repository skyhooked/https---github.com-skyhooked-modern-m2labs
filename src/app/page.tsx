'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import SectionDivider from '@/components/SectionDivider';
import Image from 'next/image';
import Link from 'next/link';
import { getLatestPosts, formatDate, loadNewsFromServer, NewsPost } from '@/data/newsData';
import { getFeaturedArtists, loadArtistsFromServer, Artist } from '@/data/artistData';


// Remove dynamic export to allow static generation


export default function Home() {
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [latestPosts, setLatestPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from server on mount and refresh periodically
  useEffect(() => {
    const loadData = async () => {
      try {
        // First set fallback data immediately for faster render
        setFeaturedArtists(getFeaturedArtists(3));
        setLatestPosts(getLatestPosts(3));
        setIsLoading(false);
        
        // Then try to load fresh data from server
        await Promise.all([
          loadArtistsFromServer(),
          loadNewsFromServer()
        ]);
        setFeaturedArtists(getFeaturedArtists(3));
        setLatestPosts(getLatestPosts(3));
      } catch (error) {
        console.error('Failed to load data:', error);
        // Ensure we still have fallback data even if server fails
        setFeaturedArtists(getFeaturedArtists(3));
        setLatestPosts(getLatestPosts(3));
        setIsLoading(false);
      }
    };

    // Load data initially
    loadData();

    // Refresh data periodically to catch admin changes
    const interval = setInterval(() => {
      setFeaturedArtists(getFeaturedArtists(3));
      setLatestPosts(getLatestPosts(3));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Helper function to extract handle from URL or return as-is
  const extractHandle = (input: string, platform: string): string => {
    if (!input) return '';
    
    // If it's already just a handle (starts with @), return as-is
    if (input.startsWith('@')) return input;
    
    // Extract handle from URL
    if (input.includes('/')) {
      const parts = input.split('/');
      const handle = parts[parts.length - 1];
      return handle ? `@${handle}` : '';
    }
    
    // If it's just a username without @, add @
    return `@${input}`;
  };

  // Helper function to create proper social media URLs
  const createSocialUrl = (input: string, platform: string): string => {
    if (!input) return '';
    
    // If it's already a full URL, return as-is
    if (input.startsWith('http')) return input;
    
    // Remove @ if present to get clean username
    const username = input.startsWith('@') ? input.slice(1) : input;
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`;
      case 'spotify':
        return input.includes('open.spotify.com') ? input : `https://open.spotify.com/search/${encodeURIComponent(username)}`;
      case 'bandcamp':
        return username.includes('.') ? `https://${username}` : `https://${username}.bandcamp.com`;
      default:
        return input;
    }
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <Hero />

      {/* Section Divider */}
      <SectionDivider variant="logo" color="#B87333" height="1px" className="bg-[#36454F]" />

      {/* Products Section */}
      <section id="products" className="py-20 text-center bg-[#36454F]">
          <div className="max-w-content mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2 text-[#F5F5F5]">Our Pedals</h2>
          <p className="max-w-2xl mx-auto mb-8" style={{ color: "#F5F5F5" }}>
            Explore our range of analog effects, designed for musicians and creators.
          </p>
          
          <div className="flex justify-center">
            <article className="bg-[#F5F5F5] rounded-lg shadow-lg overflow-hidden max-w-md">
              <Image
                src="/images/M2-Labs-The-Bomber-Overdrive-1.jpg"
                alt="The Bomber Overdrive pedal on a wooden table"
                width={320}
                height={200}
                className="w-full h-60 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">The Bomber Overdrive</h3>
                <p className="text-secondary mb-6 leading-relaxed">
                  The Bomber Overdrive hits that perfect spot between subtle breakup and serious distortion. The
                  Distortion control lets you shape exactly how much grit you want, from tube-like edge-of-breakup
                  tones to rich, full-throttle drive loaded with harmonics. Are you ready to drop The Bomber on your board?
                </p>
                <Link 
                  href="/product" 
                  className="inline-block bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"

                >
                  Learn More
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

{/* Section Divider */}
      <SectionDivider variant="logo" color="#B87333" height="1px" className="bg-[#36454F]" />

      {/* Story Section */}
      <section id="story" className="py-20 bg-[#6C7A83]">
        <div className="max-w-content mx-auto px-5">
          <div className="flex flex-wrap lg:flex-nowrap gap-8 items-center">
            <div 
              className="flex-1 min-h-80 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: "url('/images/OutStory-Hero.webp')" }}
              role="img" 
              aria-label="Vintage studio with guitars and amps"
            />
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4 text-[#F5F5F5]">Our Story</h2>
              <p className="text-[#F5F5F5] mb-6">How did a WWII Lancaster called “Mike Squared” set the course for a guitar company? It starts with an RF engineer and a Georgia guitarist who met, turned mentorship into partnership, and spent ten years blending precision with feel. The moments that followed are the reason our pedals exist at all. Read the story to see where the plane, the name, and the first spark connect..</p>
              <Link
                href="/our-story"
                className="self-start w-fit inline-block bg-[#FF8A3D] text-black px-4 py-2 rounded-md font-medium hover:bg-[#F5F5F5] transition-colors duration-200"
                >
                Read More
              </Link>
            </div>
          </div>
        </div>
      </section>

{/* Section Divider */}
      <SectionDivider variant="logo" color="#B87333" height="1px" className="bg-[#36454F]" />

      {/* News Section */}
      <section id="news" className="pt-0 pb-12 text-center bg-[#36454F]">
        <div className="max-w-content mx-auto px-5">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-[#F5F5F5]">Latest News</h2>
            <p className="max-w-2xl mx-auto mb-6 text-[#F5F5F5]">Stay up to date with our latest updates, product launches, and stories.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.length === 0 && isLoading ? (
              // Loading placeholder
              Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              latestPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-primary line-clamp-2">{post.title}</h3>
                  <p className="text-secondary mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex justify-between items-center text-sm text-secondary/70">
                    <span>By {post.author}</span>
                    <span>{formatDate(post.publishDate)}</span>
                  </div>
                </div>
              </article>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/news"
              className="inline-block bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </section>

{/* Section Divider */}
      <SectionDivider variant="logo" color="#B87333" height="1px" className="bg-[#36454F]" />

      {/* Artists Section */}
      <section id="artists" className="pt-0 pb-12 text-center bg-[#36454F]">
        <div className="max-w-content mx-auto px-5">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-[#F5F5F5]">Featured Artists</h2>
            <p className="max-w-2xl mx-auto mb-6 text-[#F5F5F5]">Meet the musicians who trust M2 Labs gear to shape their sound.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArtists.length === 0 && isLoading ? (
              // Loading placeholder
              Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-20"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-32"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </article>
              ))
            ) : (
              featuredArtists.map((artist) => (
              <article key={artist.id} className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <Image
                  src={artist.image}
                  alt={artist.name}
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                                      <div className="mb-3">
                      <h3 className="text-xl font-semibold text-primary mb-2">{artist.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {artist.genre?.split(',').map((genre: string, index: number) => (
                          <span key={index} className="text-xs bg-[#FF8A3D] text-black px-2 py-1 rounded">
                            {genre.trim()}
                          </span>
                        )) || null}
                      </div>
                    </div>
                  <p className="text-secondary text-sm mb-2">📍 {artist.location || 'Unknown location'}</p>
                  <p className="text-secondary mb-4 line-clamp-3">{artist.bio || 'No bio available'}</p>
                  {artist.testimonial && (
                    <blockquote className="text-sm italic text-gray-600 border-l-4 border-[#FF8A3D] pl-3 mb-4">
                      "{artist.testimonial}"
                    </blockquote>
                  )}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {artist.gear?.slice(0, 2).map((item: string, index: number) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item}
                      </span>
                    )) || null}
                    {artist.gear && artist.gear.length > 2 && (
                      <span className="text-xs text-gray-500">+{artist.gear.length - 2} more</span>
                    )}
                  </div>
                                    <div className="mt-auto">
                    <Link
                      href={`/artists/${artist.id}`}
                      className="inline-block w-full bg-[#FF8A3D] text-black text-center px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium text-sm"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </div>
              </article>
              ))
            )}
          </div>
          
          
          <div className="text-center mt-12">
            <Link
              href="/artists"
              className="inline-block bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
            >
              View All Artists
            </Link>
          </div>
        </div>
      </section>

{/* Section Divider */}
      <SectionDivider variant="logo" color="#B87333" height="1px" className="bg-[#36454F]" />

      {/* Newsletter Section */}
      <section id="newsletter" className="pt-0 pb-12 text-center bg-[#36454F]">
        <div className="max-w-content mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2 text-[#F5F5F5]">Stay in Touch</h2>
          <p className="max-w-2xl mx-auto mb-6 text-[#F5F5F5]">Join our email list to receive updates.</p>
          
          <form className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-xl mx-auto">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email here"
              required
              className="flex-1 w-full sm:w-auto px-4 py-3 border border-secondary/30 rounded focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="bg-accent text-white px-6 py-3 rounded font-medium hover:bg-accent/80 transition-colors"
            >
              Sign Up
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}