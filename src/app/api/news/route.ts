import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NewsPost, newsData as defaultNewsData } from '@/data/newsData';
export const runtime = 'edge';

const NEWS_DATA_PATH = join(process.cwd(), 'data', 'news.json');

// Helper function to read current news data
async function readNewsData(): Promise<NewsPost[]> {
  try {
    const fileContent = await readFile(NEWS_DATA_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist, return default data and create the file
    console.log('News JSON file not found, creating with default data');
    try {
      await writeNewsData(defaultNewsData);
      return defaultNewsData;
    } catch (writeError) {
      console.error('Error creating news data file:', writeError);
      return defaultNewsData;
    }
  }
}

// Helper function to write news data back to file
async function writeNewsData(newsData: NewsPost[]): Promise<void> {
  try {
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    await writeFile(NEWS_DATA_PATH, JSON.stringify(newsData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing news data:', error);
    throw error;
  }
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
    const newPost: Omit<NewsPost, 'id'> = await request.json();
    
    // Generate ID from title
    const id = newPost.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const newsData = await readNewsData();
    const postWithId: NewsPost = { ...newPost, id };
    
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
    const updatedPost: NewsPost = await request.json();
    const newsData = await readNewsData();
    
    const index = newsData.findIndex(post => post.id === updatedPost.id);
    if (index === -1) {
      return NextResponse.json({ error: 'News post not found' }, { status: 404 });
    }
    
    newsData[index] = updatedPost;
    await writeNewsData(newsData);
    
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

