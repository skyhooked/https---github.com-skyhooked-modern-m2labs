import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  getArtists, 
  createArtist, 
  getNewsPosts,
  createNewsPost
} from '@/libs/database-d1';

export const runtime = 'edge';

// Import JSON data
import { artistsData } from '@/data/artistData';
import { newsData } from '@/data/newsData';

export async function GET() {
  try {
    await initializeDatabase();
    
    const [currentArtists, currentNews] = await Promise.all([
      getArtists(),
      getNewsPosts()
    ]);

    return NextResponse.json({
      success: true,
      status: {
        artists: {
          in_d1: currentArtists.length,
          in_json: artistsData.length,
          missing_from_d1: Math.max(0, artistsData.length - currentArtists.length)
        },
        news: {
          in_d1: currentNews.length,
          in_json: newsData.length,
          missing_from_d1: Math.max(0, newsData.length - currentNews.length)
        }
      },
      current_d1_artists: currentArtists.map(a => ({ id: a.id, name: a.name, order: a.order })),
      current_d1_news: currentNews.map(n => ({ id: n.id, title: n.title, publishDate: n.publishDate })),
      json_artists: artistsData.map(a => ({ id: a.id, name: a.name, order: a.order })),
      json_news: newsData.map(n => ({ id: n.id, title: n.title, publishDate: n.publishDate }))
    });
  } catch (error) {
    console.error('Migration check failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { migrate } = await request.json();
    
    if (!migrate) {
      return NextResponse.json({ error: 'Set migrate: true to proceed' }, { status: 400 });
    }

    await initializeDatabase();
    
    const results = {
      artists: { migrated: 0, skipped: 0, errors: [] as string[] },
      news: { migrated: 0, skipped: 0, errors: [] as string[] }
    };

    // Migrate Artists
    const existingArtists = await getArtists();
    const existingArtistIds = new Set(existingArtists.map(a => a.id));

    for (const artist of artistsData) {
      if (!existingArtistIds.has(artist.id)) {
        try {
          await createArtist({
            id: artist.id,
            name: artist.name,
            bio: artist.bio,
            genre: artist.genre,
            location: artist.location,
            image: artist.image,
            website: artist.website || '',
            instagram: artist.socialMedia?.instagram || '',
            youtube: artist.socialMedia?.youtube || '',
            spotify: artist.socialMedia?.spotify || '',
            bandcamp: artist.socialMedia?.bandcamp || '',
            tidal: artist.socialMedia?.tidal || '',
            gear: artist.gear || [],
            testimonial: artist.testimonial || '',
            featured: artist.featured,
            showBandsintown: artist.showBandsintown || false,
            bandsintown_artist_name: artist.bandsintown?.artistName || '',
            order: artist.order
          });
          results.artists.migrated++;
        } catch (error) {
          results.artists.errors.push(`${artist.name}: ${error}`);
        }
      } else {
        results.artists.skipped++;
      }
    }

    // Migrate News  
    const existingNews = await getNewsPosts();
    const existingNewsIds = new Set(existingNews.map(n => n.id));

    for (const post of newsData) {
      if (!existingNewsIds.has(post.id)) {
        try {
          await createNewsPost({
            title: post.title,
            excerpt: post.excerpt,
            fullContent: post.fullContent,
            coverImage: post.coverImage || '',
            author: post.author,
            publishDate: post.publishDate,
            readTime: post.readTime || '',
            category: post.category || ''
          });
          results.news.migrated++;
        } catch (error) {
          results.news.errors.push(`${post.title}: ${error}`);
        }
      } else {
        results.news.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
