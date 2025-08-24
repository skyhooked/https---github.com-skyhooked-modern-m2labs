'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/data/newsData';
import type { NewsPost } from '@/libs/database-d1';
import { markdownToHtml, isMarkdown } from '@/utils/markdown';
import NewsCustomSections from '@/components/NewsCustomSections';

export default function NewsArticle() {
  const params = useParams();
  const articleId = params.id as string;
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch('/api/news');
        if (response.ok) {
          const posts = await response.json();
          const foundPost = posts.find((p: NewsPost) => p.id === articleId);
          if (foundPost) {
            setPost(foundPost);
          } else {
            notFound();
          }
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Failed to load article:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadPost();
    }
  }, [articleId]);

  if (loading) {
    return (
      <Layout>
        <section className="py-16 text-center bg-[#36454F]">
          <div className="max-w-4xl mx-auto px-5">
            <div className="text-lg text-[#F5F5F5]">Loading article...</div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!post) {
    return notFound();
  }

  return (
    <Layout>
      <article className="py-16 bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/news"
              className="inline-flex items-center text-[#FF8A3D] hover:text-[#FF8A3D]/80 transition-colors"
            >
              ← Back to News
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#F5F5F5] mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[#F5F5F5]/80 mb-6">
              <span>By {post.author}</span>
              <span>•</span>
              <span>{formatDate(post.publishDate)}</span>
              {post.readTime && (
                <>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </>
              )}
              {post.category && (
                <span className="bg-[#FF8A3D] text-black px-3 py-1 rounded-full text-sm font-medium">
                  {post.category}
                </span>
              )}
            </div>
            <p className="text-xl text-[#F5F5F5]/90 leading-relaxed">
              {post.excerpt}
            </p>
          </header>

          {/* Cover Image */}
          <div className="mb-8">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div 
              className="prose prose-lg prose-gray max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: isMarkdown(post.fullContent) 
                  ? markdownToHtml(post.fullContent) 
                  : post.fullContent 
              }}
            />
          </div>

          {/* Custom Sections */}
          {post.customSections && post.customSections.length > 0 && (
            <NewsCustomSections sections={post.customSections} />
          )}

          {/* Article Footer */}
          <footer className="mt-8 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-[#F5F5F5]/80">
                <p className="font-medium">Published by {post.author}</p>
                <p className="text-sm">{formatDate(post.publishDate)}</p>
              </div>
              
              {/* Share Buttons */}
              <div className="flex items-center gap-3">
                <span className="text-[#F5F5F5]/80 text-sm">Share:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 transition-colors"
                >
                  Facebook
                </a>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </Layout>
  );
}
