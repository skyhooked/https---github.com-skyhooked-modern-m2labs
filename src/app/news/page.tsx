'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Image from 'next/image';
import Link from 'next/link';
import { getAllPosts, loadNewsFromServer, formatDate } from '@/data/newsData';
import type { NewsPost } from '@/libs/database-d1';
import { markdownToHtml, isMarkdown } from '@/utils/markdown';

export default function News() {
  const [posts, setPosts] = useState<NewsPost[]>(getAllPosts());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const serverPosts = await loadNewsFromServer();
        setPosts(serverPosts);
      } catch (error) {
        console.error('Failed to load news:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <section className="py-16 text-center bg-[#36454F]">
          <div className="max-w-4xl mx-auto px-5">
            <div className="text-lg text-[#F5F5F5]">Loading news...</div>
          </div>
        </section>
      </Layout>
    );
  }
  return (
    <Layout>      
      <section className="py-16 text-center bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-[#F5F5F5]">Latest Posts</h2>
            <a 
              href="/api/rss" 
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#FF8A3D] text-black rounded-lg text-sm font-medium hover:bg-[#FF8A3D]/80 transition-colors"
              title="Subscribe to RSS Feed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.429 2.776c9.064 0 16.397 7.333 16.397 16.397h-3.473c0-7.127-5.797-12.924-12.924-12.924v-3.473zm0 5.838c5.678 0 10.286 4.608 10.286 10.286h-3.473c0-3.759-3.054-6.813-6.813-6.813v-3.473zm2.995 9.329c0 1.652-1.342 2.995-2.995 2.995s-2.995-1.343-2.995-2.995 1.342-2.995 2.995-2.995 2.995 1.343 2.995 2.995z"/>
              </svg>
              RSS Feed
            </a>
          </div>
          <p className="max-w-2xl mx-auto mb-8 text-[#F5F5F5]">Stay up to date with our latest updates, product launches, and stories from the M2 Labs community.</p>
          
          <div className="space-y-8">
            {posts.map((post) => (
              <div key={post.id} className="mb-8">
                <Link href={`/news/${post.id}`}>
                  <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="md:flex">
                      {post.coverImage && (
                        <div className="md:w-1/3">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={400}
                            height={250}
                            className="w-full h-64 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`p-8 ${post.coverImage ? 'md:w-2/3' : 'w-full'}`}>
                        <h3 className="text-2xl font-bold mb-4 text-primary hover:text-[#FF8A3D] transition-colors">{post.title}</h3>
                        <div className="text-secondary leading-relaxed mb-4">
                          <p>{post.excerpt}</p>
                        </div>
                        <div className="flex justify-between items-center text-sm text-secondary/70 mb-4">
                          <span>By {post.author} – {formatDate(post.publishDate)} – {post.readTime}</span>
                          {post.category && <span className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs">{post.category}</span>}
                        </div>
                        <div className="flex justify-end">
                          <span className="text-[#FF8A3D] font-medium text-sm hover:text-[#FF8A3D]/80 transition-colors">
                            Read Full Article →
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
