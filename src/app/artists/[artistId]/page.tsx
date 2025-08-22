'use client';

export const runtime = 'edge';

import { useState, useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/libs/artists';
import { CustomSection, GalleryConfig } from '@/data/artistData';
import BandsinTownWidget from '@/components/BandsinTownWidget';
import { getImageStyleClasses } from '@/utils/imageStyles';

export default function ArtistProfile() {
  const params = useParams();
  const artistId = params.artistId as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const response = await fetch('/api/artists');
        if (response.ok) {
          const data = await response.json();
          const foundArtist = data.artists.find((a: Artist) => a.id === artistId);
          if (foundArtist) {
            setArtist(foundArtist);
          } else {
            notFound();
          }
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Failed to load artist:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      loadArtist();
    }
  }, [artistId]);

  // Helper function to extract handle from URL or return as-is
  const extractHandle = (input: string, _platform: string): string => {
    if (!input) return '';
    if (input.startsWith('@')) return input;
    if (input.includes('/')) {
      const parts = input.split('/');
      const handle = parts[parts.length - 1];
      return handle ? `@${handle}` : '';
    }
    return `@${input}`;
  };

  // Helper function to create proper social media URLs (includes TIDAL)
  const createSocialUrl = (input: string, platform: string): string => {
    if (!input) return '';
    if (input.startsWith('http')) return input;

    const username = input.startsWith('@') ? input.slice(1) : input;

    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`;
      case 'spotify':
        return input.includes('open.spotify.com')
          ? input
          : `https://open.spotify.com/search/${encodeURIComponent(username)}`;
      case 'bandcamp':
        return username.includes('.')
          ? `https://${username}`
          : `https://${username}.bandcamp.com`;
      case 'tidal':
        return input.includes('tidal.com')
          ? input
          : `https://tidal.com/search?q=${encodeURIComponent(username)}`;
      default:
        return input;
    }
  };

  // Normalize image paths for display
  const normalizeSrc = (raw?: string) => {
    if (!raw) return '';
    let s = raw!.trim();
    if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')) {
      return s;
    }
    // Convert Windows backslashes to forward slashes
    s = s.replace(/\\/g, '/');
    s = s.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');
    s = s.replace(/^\/?public\/images\//, '/images/');
    s = s.replace(/^p\/images\//, '/images/');
    if (s.startsWith('images/')) s = `/${s}`;
    if (!s.startsWith('/') && !s.includes('://')) s = `/${s}`;
    return s;
  };

  // Component to handle custom HTML with JavaScript execution
  const CustomHtmlSection = ({ section }: { section: CustomSection }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current || !section.content) return;

      // Extract and execute scripts
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = section.content;
      
      // Find all script tags
      const scripts = tempDiv.querySelectorAll('script');
      const htmlWithoutScripts = section.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Set the HTML content without scripts
      containerRef.current.innerHTML = htmlWithoutScripts;
      
      // Execute each script
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
        setTimeout(() => {
          if (document.head.contains(newScript)) {
            document.head.removeChild(newScript);
          }
        }, 100);
      });

      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }, [section.content]);

    return <div ref={containerRef} />;
  };

  // Component to render custom sections
  const renderCustomSection = (section: CustomSection) => {
    if (!section.enabled) return null;

    // Inline color support so it works even if Tailwind doesn't safelist classes
    const bgColor = (section as any).bgColor as string | undefined;
    const textColor = (section as any).textColor as string | undefined;
    const styleBg = bgColor ? { backgroundColor: bgColor } : undefined;
    const styleText = textColor ? { color: textColor } : undefined;

    // 🔒 Force ALL section titles to #F5F5F5
    const titleStyle = { color: '#F5F5F5' as const };

    const defaultBgByType: Record<string, string> = {
      gallery: 'bg-[#6C7A83]',
      video: 'bg-[#6C7A83]',
      text: 'bg-[#6C7A83]',
      custom_html: 'bg-[#6C7A83]'
    };
    const background = (section as any).bgClass ?? defaultBgByType[section.type] ?? '';

    const sectionClass = 'py-16 px-5';
    const containerClass = 'max-w-4xl mx-auto';
    
    switch (section.type) {
      case 'gallery': {
        const images = Array.isArray(section.content) ? section.content : [];
        const config = section.galleryConfig || {
          gridColumns: { mobile: 1, tablet: 2, desktop: 3 },
          aspectRatio: 'square',
          gap: 'md',
          borderRadius: 'md',
          hoverEffect: 'scale',
          lightbox: true,
          captions: false
        };

        // Generate dynamic grid classes
        const gridClasses = [
          `grid-cols-${config.gridColumns.mobile}`,
          `md:grid-cols-${config.gridColumns.tablet}`,
          `lg:grid-cols-${config.gridColumns.desktop}`
        ].join(' ');

        // Gap classes
        const gapClass = {
          'sm': 'gap-2',
          'md': 'gap-4', 
          'lg': 'gap-6'
        }[config.gap];

        // Aspect ratio classes
        const aspectClass = {
          'square': 'aspect-square',
          'portrait': 'aspect-[3/4]',
          'landscape': 'aspect-[4/3]',
          'auto': ''
        }[config.aspectRatio];

        // Border radius classes
        const radiusClass = {
          'none': 'rounded-none',
          'sm': 'rounded-sm',
          'md': 'rounded-lg',
          'lg': 'rounded-xl'
        }[config.borderRadius];

        // Hover effect classes
        const getHoverClasses = (effect: string) => {
          switch (effect) {
            case 'scale':
              return 'hover:scale-105 transition-transform duration-300';
            case 'fade':
              return 'hover:opacity-75 transition-opacity duration-300';
            case 'lift':
              return 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300';
            default:
              return '';
          }
        };

        return (
          <section key={section.id} className={`${sectionClass} ${background}`} style={styleBg}>
            <div className={containerClass} style={styleText}>
              <h2 className="text-3xl font-bold mb-8 text-center" style={titleStyle}>
                {section.title}
              </h2>
              <div className={`grid ${gridClasses} ${gapClass}`}>
                {images.map((img: string, index: number) => {
                  const imageSrc = normalizeSrc(img);
                  const filename = imageSrc.split('/').pop()?.split('.')[0] || `Image ${index + 1}`;
                  
                  const imageElement = (
                    <div key={index} className={`relative ${aspectClass || 'aspect-square'} ${radiusClass} overflow-hidden bg-gray-200 ${config.lightbox ? 'cursor-pointer' : ''}`}>
                      <Image 
                        src={imageSrc} 
                        alt={`${section.title} ${index + 1}`}
                        fill
                        className={`object-cover ${getHoverClasses(config.hoverEffect)}`}
                        sizes={`(max-width: 768px) ${100 / config.gridColumns.mobile}vw, (max-width: 1200px) ${100 / config.gridColumns.tablet}vw, ${100 / config.gridColumns.desktop}vw`}
                        onError={() => {
                          console.error('Image failed to load:', imageSrc);
                        }}
                      />
                      {config.captions && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                          {filename}
                        </div>
                      )}
                    </div>
                  );

                  // Wrap in lightbox functionality if enabled
                  if (config.lightbox) {
                    return (
                      <a
                        key={index}
                        href={imageSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(imageSrc, '_blank');
                        }}
                      >
                        {imageElement}
                      </a>
                    );
                  }

                  return imageElement;
                })}
              </div>
            </div>
          </section>
        );
      }
      
      case 'bandsintown':
        return (
          <BandsinTownWidget
            key={section.id}
            artistName={artist!.name}
            appId="M2Labs"
            maxEvents={10}
            className=""
          />
        );
      
      case 'video':
        return (
          <section key={section.id} className={`${sectionClass} ${background}`} style={styleBg}>
            <div className={containerClass} style={styleText}>
              <h2 className="text-3xl font-bold mb-8 text-center" style={titleStyle}>
                {section.title}
              </h2>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={section.content}
                  title={section.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        );
      
      case 'text':
        return (
          <section key={section.id} className={`${sectionClass} ${background}`} style={styleBg}>
            <div className={containerClass} style={styleText}>
              <h2 className="text-3xl font-bold mb-8 text-center" style={titleStyle}>
                {section.title}
              </h2>
              <div className="prose prose-lg mx-auto" style={styleText}>
                <p className="leading-relaxed" style={styleText}>
                  {section.content}
                </p>
              </div>
            </div>
          </section>
        );
      
      case 'custom_html':
        return (
          <section key={section.id} className={`${sectionClass} ${background}`} style={styleBg}>
            <div className={containerClass} style={styleText}>
              <h2 className="text-3xl font-bold mb-8 text-center" style={titleStyle}>
                {section.title}
              </h2>
              <CustomHtmlSection section={section} />
            </div>
          </section>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 text-center bg-[#36454F]">
          <div className="max-w-4xl mx-auto px-5">
            <div className="text-lg text-[#F5F5F5]">Loading artist profile...</div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!artist) {
    return notFound();
  }

  const src = normalizeSrc(artist.image);
  const isBlobOrData = src.startsWith('blob:') || src.startsWith('data:');
  const isSvg = src.toLowerCase().endsWith('.svg');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-6xl mx-auto px-5">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/artists"
              className="inline-flex items-center text-[#FF8A3D] hover:text-[#FF8A3D]/80 transition-colors"
            >
              ← Back to All Artists
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Artist Image */}
            <div className="order-2 lg:order-1">
              <div className={`${getImageStyleClasses(artist.imageStyle, 'detail')} shadow-lg`}>
                {(isBlobOrData || isSvg) ? (
                  <img
                    src={src}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={src}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="order-1 lg:order-2 text-[#F5F5F5]">
              <div className="mb-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">{artist.name}</h1>
                <div className="flex flex-wrap gap-2">
                  {artist.genre.split(',').map((genre, index) => (
                    <span key={index} className="bg-[#FF8A3D] text-black px-3 py-1 rounded text-sm font-medium">
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-xl text-[#F5F5F5]/80 mb-6">📍 {artist.location}</p>
              
              <p className="text-lg leading-relaxed mb-8">{artist.bio}</p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-4 mb-8">
                {artist.website && (
                  <Link
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#FF8A3D] text-black px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 transition-colors font-medium"
                  >
                    🌐 Visit Website
                  </Link>
                )}

                {artist.socialMedia?.instagram && (
                  <Link
                    href={createSocialUrl(artist.socialMedia.instagram, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity font-medium"
                  >
                    📸 Instagram
                  </Link>
                )}

                {artist.socialMedia?.spotify && (
                  <Link
                    href={createSocialUrl(artist.socialMedia.spotify, 'spotify')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors font-medium"
                  >
                    🎵 {artist.socialMedia.spotify.includes('open.spotify.com')
                      ? 'Listen on Spotify'
                      : extractHandle(artist.socialMedia.spotify, 'spotify')}
                  </Link>
                )}

                {artist.socialMedia?.tidal && (
                  <Link
                    href={createSocialUrl(artist.socialMedia.tidal, 'tidal')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/80 transition-colors font-medium"
                  >
                    🎵 {artist.socialMedia.tidal.includes('tidal.com')
                      ? 'Listen on TIDAL'
                      : extractHandle(artist.socialMedia.tidal, 'tidal')}
                  </Link>
                )}

                {artist.socialMedia?.bandcamp && (
                  <Link
                    href={createSocialUrl(artist.socialMedia.bandcamp, 'bandcamp')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors font-medium"
                  >
                    🎧 {artist.socialMedia.bandcamp.includes('.')
                      ? 'Bandcamp'
                      : extractHandle(artist.socialMedia.bandcamp, 'bandcamp')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      {artist.testimonial && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">What {artist.name.split(' ')[0]} Says</h2>
            <blockquote className="text-xl italic text-gray-700 leading-relaxed border-l-8 border-[#FF8A3D] pl-8 text-left">
              "{artist.testimonial}"
            </blockquote>
            <p className="text-right text-gray-600 mt-4 font-medium">— {artist.name}</p>
          </div>
        </section>
      )}

      {/* Gear Section */}
      <section className="py-16 bg-[#6C7A83]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-[#F5F5F5] mb-8 text-center">
            {artist.name.split(' ')[0]}'s Gear
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artist.gear.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#FF8A3D]"
              >
                <p className="font-medium text-gray-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Sections */}
      {artist.customSections && 
        artist.customSections
          .filter(section => section.enabled)
          .sort((a, b) => a.order - b.order)
          .map(section => renderCustomSection(section))
      }

      {/* Call to Action */}
      <section className="py-16 bg-[#36454F] text-center">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-[#F5F5F5] mb-4">
            Inspired by {artist.name.split(' ')[0]}'s Sound?
          </h2>
          <p className="text-[#F5F5F5]/80 mb-8 text-lg">
            Discover the M2 Labs gear that helps create these incredible tones.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
            >
              Shop M2 Labs Gear
            </Link>
            <Link
              href="/artists"
              className="bg-transparent border-2 border-[#FF8A3D] text-[#FF8A3D] px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D] hover:text-black transition-colors"
            >
              Meet More Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Bandsintown Events Section */}
      {artist.showBandsintown && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Upcoming Shows
            </h2>
            <BandsinTownWidget
              artistName={artist.bandsintown?.artistName || artist.name}
              appId="M2Labs"
              maxEvents={10}
              className=""
            />
          </div>
        </section>
      )}
    </Layout>
  );
}
