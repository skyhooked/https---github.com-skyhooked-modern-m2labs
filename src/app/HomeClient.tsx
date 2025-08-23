'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import SectionDivider from '@/components/SectionDivider';
import Image from 'next/image';
import Link from 'next/link';
import { getLatestPosts, formatDate, loadNewsFromServer } from '@/data/newsData';
import { getImageStyleClasses, getCardLayoutConfig } from '@/utils/imageStyles';
import { getFeaturedArtistsFromD1 } from '@/libs/artists';


export default function HomeClient() {
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load fresh data via API
        const [artistsResponse, freshNews] = await Promise.all([
          fetch('/api/artists?featured=true&limit=3'),
          loadNewsFromServer()
        ]);
        
        const artistsData = await artistsResponse.json();
        console.log('🎨 Featured artists API response:', artistsData);
        if (artistsData.success) {
          console.log('✅ Featured artists loaded:', artistsData.artists.length, 'artists');
          setFeaturedArtists(artistsData.artists);
        } else {
          console.error('❌ Featured artists API failed:', artistsData.error);
        }
        
        if (freshNews && freshNews.length > 0) {
          setLatestPosts(freshNews.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Newsletter signup handler
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          source: 'homepage'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterStatus('success');
        setNewsletterMessage(data.alreadySubscribed 
          ? 'You\'re already subscribed to our newsletter!' 
          : 'Successfully subscribed to our newsletter!');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterStatus('error');
      setNewsletterMessage('Failed to subscribe. Please try again.');
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setNewsletterStatus('idle');
      setNewsletterMessage('');
    }, 5000);
  };

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
              latestPosts.map((post: any) => (
              <Link key={post.id} href={`/news/${post.id}`}>
                <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-primary line-clamp-2 hover:text-[#FF8A3D] transition-colors">{post.title}</h3>
                    <p className="text-secondary mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex justify-between items-center text-sm text-secondary/70">
                      <span>By {post.author}</span>
                      <span>{formatDate(post.publishDate)}</span>
                    </div>
                  </div>
                </article>
              </Link>
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
            ) : featuredArtists.length > 0 ? (
              featuredArtists.map((artist: any) => {
                // Get layout configuration based on image style
                const imageStyle = artist.imageStyle || 'square';
                const { imageContainerClass, contentContainerClass, cardFlexDirection, imageHeight } = 
                  getCardLayoutConfig(imageStyle, 'homepage');

                return (
                  <article key={artist.id} className="bg-white rounded-lg shadow-lg overflow-hidden border">
                    <div className={`flex ${cardFlexDirection} h-80`}>
                      <div className={imageContainerClass}>
                        <div className={`relative overflow-hidden bg-gray-200 ${imageHeight} ${artist.imageStyle === 'circle' ? 'rounded-full' : 'rounded-lg'}`}>
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            fill
                            className={`${imageStyle === 'square' || imageStyle === 'circle' ? 'object-cover object-top' : 'object-cover'}`}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                      <div className={`${contentContainerClass} justify-between min-h-0`}>
                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
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
                          <p className="text-secondary text-sm mb-2">📍 {artist.location}</p>
                          <p className="text-secondary mb-4 line-clamp-3">{artist.bio}</p>
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
                        </div>

                        {/* Fixed button at bottom */}
                        <div className="flex-shrink-0 mt-2 pt-2 border-t border-gray-100">
                          <Link
                            href={`/artists/${artist.id}`}
                            className="inline-block w-full bg-[#FF8A3D] text-black text-center px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium text-sm"
                          >
                            View Full Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#F5F5F5] text-lg">No featured artists found.</p>
                <p className="text-[#F5F5F5]/70 text-sm mt-2">Check the database or mark some artists as featured.</p>
              </div>
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
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-xl mx-auto">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email here"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              disabled={newsletterStatus === 'loading'}
              className="flex-1 w-full sm:w-auto px-4 py-3 border border-secondary/30 rounded focus:outline-none focus:border-accent disabled:opacity-50 text-[#F5F5F5] placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading'}
              className="bg-accent text-white px-6 py-3 rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newsletterStatus === 'loading' ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
          
          {newsletterMessage && (
            <div className={`mt-4 text-center p-3 rounded ${
              newsletterStatus === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : newsletterStatus === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : ''
            }`}>
              {newsletterMessage}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
