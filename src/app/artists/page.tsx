'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Link from 'next/link';
import Image from 'next/image';
import { getAllArtists, Artist } from '@/libs/artists';
import { getImageStyleClasses } from '@/utils/imageStyles';

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load artists from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/artists');
        const data = await response.json();
        
        if (data.success) {
          setArtists(data.artists);
        } else {
          console.error('Failed to load artists:', data.error);
        }
      } catch (error) {
        console.error('Failed to load artists:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to extract handle from URL or return as-is
  const extractHandle = (input: string, platform: string): string => {
    if (!input) return '';
    if (input.startsWith('@')) return input;
    if (input.includes('/')) {
      const parts = input.split('/');
      const handle = parts[parts.length - 1];
      return handle ? `@${handle}` : '';
    }
    return `@${input}`;
  };

  // Helper function to create proper social media URLs
  const createSocialUrl = (input: string, platform: string): string => {
    if (!input) return '';
    if (input.startsWith('http')) return input;

    const username = input.startsWith('@') ? input.slice(1) : input;

    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`;
      case 'spotify':
        return input.includes('open.spotify.com') ? input : `https://open.spotify.com/search/${encodeURIComponent(username)}`;
      case 'bandcamp':
        return username.includes('.') ? `https://${username}` : `https://${username}.bandcamp.com`;
      case 'tidal':
        return input.includes('tidal.com') ? input : `https://tidal.com/search?q=${encodeURIComponent(username)}`;
      default:
        return input;
    }
  };

  // Normalize image paths for display
  const normalizeSrc = (raw?: string) => {
    if (!raw) return '';
    let s = raw.trim();

    // Remote or temporary: leave as-is
    if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')) return s;

    // Convert Windows backslashes to forward slashes
    s = s.replace(/\\/g, '/');

    // Strip leading ./ or ../
    s = s.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');

    // Map public paths to /images
    s = s.replace(/^\/?public\/images\//, '/images/');
    // Fix common slip p/images -> /images
    s = s.replace(/^p\/images\//, '/images/');

    // Ensure leading slash for local
    if (s.startsWith('images/')) s = `/${s}`;
    if (!s.startsWith('/')) s = `/${s}`;

    return s;
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 text-center bg-[#36454F]">
          <div className="max-w-content mx-auto px-5">
            <div className="text-lg text-[#F5F5F5]">Loading artists...</div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 text-center bg-[#36454F]">
        <div className="max-w-content mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-[#F5F5F5]">Our Artists</h2>
            <p className="text-[#F5F5F5] max-w-2xl mx-auto">
              Meet the talented musicians who trust M2 Labs gear to bring their creative visions to life.
              Each artist brings their unique style and story to our community.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column */}
            <div className="flex-1 space-y-8">
              {artists.filter((_, index) => index % 2 === 0).map((artist) => {
                const src = normalizeSrc(artist.image);
                const isBlobOrData = src.startsWith('blob:') || src.startsWith('data:');
                const isSvg = src.toLowerCase().endsWith('.svg');

                return (
                  <article key={artist.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex flex-col">
                      <div className="w-full">
                        <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200 relative">
                          {(isBlobOrData || isSvg) ? (
                            <img
                              src={src}
                              alt={artist.name}
                              className="w-full h-full object-cover absolute inset-0"
                            />
                          ) : (
                            <Image
                              src={src}
                              alt={artist.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          )}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-bold text-primary">{artist.name}</h3>
                          <div className="flex flex-wrap gap-1">
                            {artist.genre.split(',').map((genre, index) => (
                              <span key={index} className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs font-medium">
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-secondary text-sm mb-3">📍 {artist.location}</p>

                        <p className="text-secondary mb-4 leading-relaxed">{artist.bio}</p>

                        {artist.testimonial && (
                          <blockquote className="text-sm italic text-gray-600 border-l-4 border-[#FF8A3D] pl-4 mb-4">
                            "{artist.testimonial}"
                          </blockquote>
                        )}

                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Gear:</h4>
                          <div className="flex flex-wrap gap-2">
                            {artist.gear.map((item, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {artist.website && (
                            <Link
                              href={artist.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🌐 Website
                            </Link>
                          )}
                          {artist.socialMedia.instagram && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.instagram, 'instagram')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              📸 Instagram
                            </Link>
                          )}
                          {artist.socialMedia.spotify && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.spotify, 'spotify')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎵 {artist.socialMedia.spotify.includes('open.spotify.com') ? 'Spotify' : 'Spotify'}
                            </Link>
                          )}
                          {artist.socialMedia.tidal && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.tidal, 'tidal')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎵 TIDAL
                            </Link>
                          )}
                          {artist.socialMedia.bandcamp && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.bandcamp, 'bandcamp')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎧 Bandcamp
                            </Link>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <div className="mt-auto">
                          <Link
                            href={`/artists/${artist.id}`}
                            className="inline-block w-full bg-[#FF8A3D] text-black text-center px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
                          >
                            View Full Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-8">
              {artists.filter((_, index) => index % 2 === 1).map((artist) => {
                const src = normalizeSrc(artist.image);
                const isBlobOrData = src.startsWith('blob:') || src.startsWith('data:');
                const isSvg = src.toLowerCase().endsWith('.svg');

                return (
                  <article key={artist.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex flex-col">
                      <div className="w-full">
                        <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200 relative">
                          {(isBlobOrData || isSvg) ? (
                            <img
                              src={src}
                              alt={artist.name}
                              className="w-full h-full object-cover absolute inset-0"
                            />
                          ) : (
                            <Image
                              src={src}
                              alt={artist.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          )}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-bold text-primary">{artist.name}</h3>
                          <div className="flex flex-wrap gap-1">
                            {artist.genre.split(',').map((genre, index) => (
                              <span key={index} className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs font-medium">
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-secondary text-sm mb-3">📍 {artist.location}</p>

                        <p className="text-secondary mb-4 leading-relaxed">{artist.bio}</p>

                        {artist.testimonial && (
                          <blockquote className="text-sm italic text-gray-600 border-l-4 border-[#FF8A3D] pl-4 mb-4">
                            "{artist.testimonial}"
                          </blockquote>
                        )}

                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Gear:</h4>
                          <div className="flex flex-wrap gap-2">
                            {artist.gear.map((item, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {artist.website && (
                            <Link
                              href={artist.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🌐 Website
                            </Link>
                          )}
                          {artist.socialMedia.instagram && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.instagram, 'instagram')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              📸 Instagram
                            </Link>
                          )}
                          {artist.socialMedia.spotify && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.spotify, 'spotify')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎵 {artist.socialMedia.spotify.includes('open.spotify.com') ? 'Spotify' : 'Spotify'}
                            </Link>
                          )}
                          {artist.socialMedia.tidal && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.tidal, 'tidal')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎵 TIDAL
                            </Link>
                          )}
                          {artist.socialMedia.bandcamp && (
                            <Link
                              href={createSocialUrl(artist.socialMedia.bandcamp, 'bandcamp')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium transition-colors"
                            >
                              🎧 Bandcamp
                            </Link>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <div className="mt-auto">
                          <Link
                            href={`/artists/${artist.id}`}
                            className="inline-block w-full bg-[#FF8A3D] text-black text-center px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
                          >
                            View Full Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Join Artist Family Section */}
      <section id="join-artists" className="py-8 bg-[#6C7A83]">
        <div className="max-w-content mx-auto px-5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3 text-[#F5F5F5]">Want to Join Our Artist Family?</h2>
            <p className="text-[#F5F5F5] mb-3 leading-relaxed text-sm">
              If you're an artist using M2 Labs gear, we'd love to feature your story and music. Join our
              community of talented musicians who trust M2 Labs to shape their sound and bring their
              creative visions to life.
            </p>
            <p className="text-[#F5F5F5] mb-4 leading-relaxed text-sm">
              Tell us about your projects, the rigs you rely on, and how our gear fits your sound. We review every
              submission and reach out to artists whose work aligns with the M2 Labs ethos.
            </p>
            <Link
              href="/artist-endorsement"
              className="inline-block bg-[#FF8A3D] text-black px-3 py-1.5 rounded text-sm font-medium hover:bg-[#F5F5F5] transition-colors duration-200"
            >
              Apply for Endorsement
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
