import { NextRequest, NextResponse } from 'next/server';
import { getNewsPosts } from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET() {
  try {
    const newsData = await getNewsPosts();
    
    return NextResponse.json({
      success: true,
      count: newsData.length,
      posts: newsData.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt?.substring(0, 100) + '...',
        author: post.author,
        publishDate: post.publishDate,
        category: post.category,
        readTime: post.readTime
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
