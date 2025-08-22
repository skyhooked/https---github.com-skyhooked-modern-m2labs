// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getNewsPosts, createNewsPost, updateNewsPost, deleteNewsPost, NewsPost } from '@/libs/database-d1';

export const runtime = 'edge'

// GET - Fetch all news posts
export async function GET() {
  try {
    const newsData = await getNewsPosts();
    return NextResponse.json(newsData);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST - Create new news post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Creating news post:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.title || !body.fullContent || !body.author) {
      return NextResponse.json(
        { error: 'title, fullContent, and author are required' },
        { status: 400 }
      );
    }

    const postData = {
      title: body.title,
      excerpt: body.excerpt || '',
      fullContent: body.fullContent,
      coverImage: body.coverImage || '',
      author: body.author,
      publishDate: body.publishDate || new Date().toISOString().split('T')[0],
      readTime: body.readTime || '',
      category: body.category || '',
    };

    const newPost = await createNewsPost(postData);
    console.log('News post created successfully:', newPost.id);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating news post:', error);
    return NextResponse.json({ error: 'Failed to create news post' }, { status: 500 });
  }
}

// PUT - Update existing news post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Updating news post:', JSON.stringify(body, null, 2));

    if (!body?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updatedPost = await updateNewsPost(body.id, body);

    if (!updatedPost) {
      return NextResponse.json({ error: 'News post not found' }, { status: 404 });
    }

    console.log('News post updated successfully:', updatedPost.id);
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating news post:', error);
    return NextResponse.json({ error: 'Failed to update news post' }, { status: 500 });
  }
}

// DELETE - Delete news post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    console.log('Deleting news post:', id);

    const success = await deleteNewsPost(id);

    if (!success) {
      return NextResponse.json({ error: 'News post not found' }, { status: 404 });
    }

    console.log('News post deleted successfully:', id);
    return NextResponse.json({ message: 'News post deleted successfully' });
  } catch (error) {
    console.error('Error deleting news post:', error);
    return NextResponse.json({ error: 'Failed to delete news post' }, { status: 500 });
  }
}
