'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Image from 'next/image';
import { getAllPosts, loadNewsFromServer, formatDate, NewsPost } from '@/data/newsData';

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
          <h2 className="text-3xl font-bold mb-6 text-[#F5F5F5]">Latest Posts</h2>
          <p className="max-w-2xl mx-auto mb-8 text-[#F5F5F5]">Stay up to date with our latest updates, product launches, and stories from the M2 Labs community.</p>
          
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={400}
                      height={250}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-bold mb-4 text-primary">{post.title}</h3>
                    <p className="text-secondary leading-relaxed mb-4">
                      {post.fullContent}
                    </p>
                    <div className="flex justify-between items-center text-sm text-secondary/70">
                      <span>By {post.author} – {formatDate(post.publishDate)} – {post.readTime}</span>
                      {post.category && <span className="bg-[#FF8A3D] text-black px-2 py-1 rounded text-xs">{post.category}</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
