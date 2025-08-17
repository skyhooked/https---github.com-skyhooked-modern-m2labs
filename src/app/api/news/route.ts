// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NewsPost, newsData as defaultNewsData } from '@/data/newsData';

export const runtime = 'nodejs'

/**
 * Edge-safe in-memory store (per isolate). If you need persistence,
 * swap these helpers to use KV/D1/R2/etc.
 */
type Store = { posts: NewsPost[] };
const g = globalThis as unknown as { __newsStore?: Store };

function getStore(): Store {
  if (!g.__newsStore) g.__newsStore = { posts: [...defaultNewsData] };
  return g.__newsStore;
}

async function readNewsData(): Promise<NewsPost[]> {
  return getStore().posts;
}

async function writeNewsData(newsData: NewsPost[]): Promise<void> {
  getStore().posts = newsData;
}

// Make a slug id from a title; guarantees uniqueness within the store
function makeIdFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/^-+|-+$/g, '');

  let id = base || `news-${Date.now().toString(36)}`;
  const posts = getStore().posts;
  let i = 1;
  while (posts.some(p => p.id === id)) id = `${base}-${i++}`;
  return id;
}

// GET - Fetch all news posts
export async function GET() {
  try {
    const newsData = await readNewsData();
    return NextResponse.json(newsData);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST - Create new news post
export async function POST(request: NextRequest) {
  try {
    // Accept whatever fields your NewsPost actually has; we won't assume keys.
    const body = (await request.json()) as Partial<NewsPost> & Record<string, unknown>;

    // Try to derive an id from a "title" field if present; otherwise use timestamp.
    const maybeTitle =
      typeof body['title'] === 'string' ? (body['title'] as string) : '';

    const id = makeIdFromTitle(maybeTitle || `news-${Date.now().toString(36)}`);

    const newsData = await readNewsData();
    const postWithId = { ...(body as any), id } as NewsPost;

    // Add to beginning of array (newest first)
    newsData.unshift(postWithId);
    await writeNewsData(newsData);

    return NextResponse.json(postWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating news post:', error);
    return NextResponse.json({ error: 'Failed to create news post' }, { status: 500 });
  }
}

// PUT - Update existing news post
export async function PUT(request: NextRequest) {
  try {
    const updated = (await request.json()) as Partial<NewsPost> & { id?: string };

    if (!updated?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const newsData = await readNewsData();
    const index = newsData.findIndex(post => post.id === updated.id);

    if (index === -1) {
      return NextResponse.json({ error: 'News post not found' }, { status: 404 });
    }

    // Merge existing post with provided fields
    newsData[index] = { ...(newsData[index] as any), ...(updated as any) } as NewsPost;
    await writeNewsData(newsData);

    return NextResponse.json(newsData[index]);
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

    const newsData = await readNewsData();
    const filteredData = newsData.filter(post => post.id !== id);

    if (filteredData.length === newsData.length) {
      return NextResponse.json({ error: 'News post not found' }, { status: 404 });
    }

    await writeNewsData(filteredData);
    return NextResponse.json({ message: 'News post deleted successfully' });
  } catch (error) {
    console.error('Error deleting news post:', error);
    return NextResponse.json({ error: 'Failed to delete news post' }, { status: 500 });
  }
}
