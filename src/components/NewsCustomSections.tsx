'use client';

import Image from 'next/image';
import type { CustomSection } from '@/libs/database-d1';

interface NewsCustomSectionsProps {
  sections: CustomSection[];
}

export default function NewsCustomSections({ sections }: NewsCustomSectionsProps) {
  if (!sections || sections.length === 0) return null;

  const renderSection = (section: CustomSection) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'text':
        return (
          <div key={section.id} className="mb-8">
            {section.title && (
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">{section.title}</h3>
            )}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div 
                className="prose prose-lg prose-gray max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br/>') }}
              />
            </div>
          </div>
        );

      case 'gallery':
        const images = section.content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        if (images.length === 0) return null;

        return (
          <div key={section.id} className="mb-8">
            {section.title && (
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">{section.title}</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((imagePath, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={imagePath.startsWith('/') ? imagePath : `/${imagePath}`}
                    alt={`${section.title || 'Gallery'} image ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'video':
        const videoUrl = section.content.trim();
        if (!videoUrl) return null;

        // Handle YouTube URLs
        let embedUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
          const videoId = videoUrl.split('v=')[1]?.split('&')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes('youtu.be/')) {
          const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }

        return (
          <div key={section.id} className="mb-8">
            {section.title && (
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">{section.title}</h3>
            )}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={embedUrl}
                  title={section.title || 'Video'}
                  className="w-full h-full"
                  allowFullScreen
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          </div>
        );

      case 'html':
        return (
          <div key={section.id} className="mb-8">
            {section.title && (
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">{section.title}</h3>
            )}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div 
                className="prose prose-lg prose-gray max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const enabledSections = sections.filter(section => section.enabled);
  if (enabledSections.length === 0) return null;

  return (
    <div className="mt-8">
      {enabledSections.map(renderSection)}
    </div>
  );
}
