// Direct D1 artist functions - no JSON fallbacks
import { getArtists, getFeaturedArtists } from './database-d1';

// Artist interface matching both D1 schema and existing artistData interface
export interface Artist {
  id: string;
  name: string;
  bio: string;
  genre: string;
  location: string;
  image: string;
  imageStyle?: 'square' | 'portrait' | 'landscape' | 'circle';
  website?: string;
  socialMedia: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    bandcamp?: string;
    tidal?: string;
  };
  gear: string[];
  testimonial?: string;
  featured: boolean;
  showBandsintown?: boolean;
  bandsintown_artist_name?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Get all artists from D1 database
export async function getAllArtists(): Promise<Artist[]> {
  try {
    const rawArtists = await getArtists();
    // Transform the D1 data to match the expected interface
    return rawArtists.map(artist => ({
      ...artist,
      bio: artist.bio || '',
      genre: artist.genre || '',
      location: artist.location || '',
      image: artist.image || '',
      socialMedia: {
        instagram: artist.instagram,
        youtube: artist.youtube,
        spotify: artist.spotify,
        bandcamp: artist.bandcamp,
        tidal: artist.tidal,
      }
    }));
  } catch (error) {
    console.error('Failed to load artists from D1:', error);
    return [];
  }
}

// Get featured artists from D1 database
export async function getFeaturedArtistsFromD1(count: number = 3): Promise<Artist[]> {
  try {
    const rawArtists = await getFeaturedArtists(count);
    // Transform the D1 data to match the expected interface
    return rawArtists.map(artist => ({
      ...artist,
      bio: artist.bio || '',
      genre: artist.genre || '',
      location: artist.location || '',
      image: artist.image || '',
      socialMedia: {
        instagram: artist.instagram,
        youtube: artist.youtube,
        spotify: artist.spotify,
        bandcamp: artist.bandcamp,
        tidal: artist.tidal,
      }
    }));
  } catch (error) {
    console.error('Failed to load featured artists from D1:', error);
    return [];
  }
}

// Get artist by ID
export async function getArtistById(id: string): Promise<Artist | null> {
  try {
    const artists = await getAllArtists(); // Use our transformed version
    return artists.find(artist => artist.id === id) || null;
  } catch (error) {
    console.error('Failed to load artist by ID from D1:', error);
    return null;
  }
}

// Client-side hook for loading artists
export function useArtists() {
  // This would be used by components that need reactive artist data
  // For now, we'll keep it simple and direct
  return {
    loadArtists: getAllArtists,
    loadFeaturedArtists: getFeaturedArtistsFromD1,
    loadArtistById: getArtistById
  };
}
