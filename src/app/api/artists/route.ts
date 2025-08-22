import { NextRequest, NextResponse } from 'next/server';
import { getArtists, getFeaturedArtists } from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured');
    const limit = url.searchParams.get('limit');
    
    let artists;
    
    if (featured === 'true') {
      const limitNum = limit ? parseInt(limit) : 3;
      artists = await getFeaturedArtists(limitNum);
    } else {
      artists = await getArtists();
    }
    
    // Transform D1 data to match expected interface
    const transformedArtists = artists.map(artist => ({
      ...artist,
      bio: artist.bio || '',
      genre: artist.genre || '',
      location: artist.location || '',
      image: artist.image || '',
      imageStyle: artist.imageStyle || 'square', // Include imageStyle field
      socialMedia: {
        instagram: artist.instagram,
        youtube: artist.youtube,
        spotify: artist.spotify,
        bandcamp: artist.bandcamp,
        tidal: artist.tidal,
      }
    }));
    
    return NextResponse.json({
      success: true,
      artists: transformedArtists
    });
    
  } catch (error) {
    console.error('Failed to load artists:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load artists' 
      },
      { status: 500 }
    );
  }
}
