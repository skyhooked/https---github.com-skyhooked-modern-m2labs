import { NextRequest, NextResponse } from 'next/server';
import { getArtists } from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET() {
  try {
    const artists = await getArtists();
    
    return NextResponse.json({
      success: true,
      count: artists.length,
      artists: artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.image,
        bio: artist.bio?.substring(0, 100) + '...',
        featured: artist.featured,
        gear: artist.gear,
        socialMedia: {
          instagram: artist.instagram,
          youtube: artist.youtube,
          spotify: artist.spotify,
          bandcamp: artist.bandcamp,
          tidal: artist.tidal
        }
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
