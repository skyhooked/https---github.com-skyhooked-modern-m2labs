// src/data/artistData.tsx

export interface GalleryConfig {
  gridColumns: {
    mobile: number;    // 1-3 columns on mobile
    tablet: number;    // 2-5 columns on tablet
    desktop: number;   // 3-8 columns on desktop
  };
  aspectRatio: 'square' | 'portrait' | 'landscape' | 'auto';
  gap: 'sm' | 'md' | 'lg';
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect: 'none' | 'scale' | 'fade' | 'lift';
  lightbox: boolean;
  captions: boolean;
}

export interface CustomSection {
  id: string;
  type: 'gallery' | 'bandsintown' | 'video' | 'custom_html' | 'text';
  title: string;
  content: any;
  enabled: boolean;
  order: number;
  // Gallery-specific configuration
  galleryConfig?: GalleryConfig;

  // Tailwind class options (optional)
  bgClass?: string;          // e.g. 'bg-[#36454F]'
  textColorClass?: string;   // e.g. 'text-[#F5F5F5]'

  // Inline color options used by the renderer (these ALWAYS work)
  bgColor?: string;          // hex like '#36454F'
  textColor?: string;        // hex like '#F5F5F5'
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  genre: string;
  location: string;
  image: string;
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
  order: number;
  
  // Bandsintown integration
  showBandsintown?: boolean;
  bandsintown?: {
    artistName?: string; // Optional override for artist name on Bandsintown
    enabled?: boolean;
  };
  
  // Customization options
  useCustomTemplate?: boolean;
  customTemplatePath?: string;
  customSections?: CustomSection[];
}

export const artistsData: Artist[] = [
  {
    id: "brandon-gaines",
    name: "Brandon Gaines",
    bio: "Lead guitarist and creative force behind WormWood Project, Brandon brings a unique blend of Southern Gothic atmosphere to grunge music.",
    genre: "Southern Gothic Grunge",
    location: "Georgia, USA",
    image: "/images/placeholder-artist-1.svg",
    website: "https://wormwoodproject.com",
    socialMedia: {
      instagram: "@wormwoodproject",
      spotify: "WormWood Project"
    },
    gear: ["The Bomber Overdrive", "Fender Stratocaster", "Marshall JCM800"],
    testimonial: "The Bomber Overdrive perfectly captures that gritty, atmospheric tone I've been searching for. It's become essential to the WormWood Project sound.",
    featured: true,
    order: 1,

    // Example custom section wired to the renderer colors
    customSections: [
      {
        id: 'about',
        type: 'text',
        title: 'About',
        content: 'Short blurb here.',
        enabled: true,
        order: 10,

        // You can keep the Tailwind classes if you want,
        // but the inline hex below is what the page actually reads.
        bgClass: 'bg-[#6C7A83]',
        textColorClass: 'text-[#6C7A83]',

        // Inline colors the renderer uses
        bgColor: '#6C7A83',
        // Use a contrasting text color so it’s readable
        textColor: '#F5F5F5'
      }
    ]
  },
  {
    id: "loraine-band",
    name: "Loraine",
    bio: "Atlanta's innovative post-rock band that balances concise song structures with deep emotional resonance.",
    genre: "Post-Rock",
    location: "Atlanta, GA",
    image: "/images/placeholder-artist-2.svg",
    socialMedia: {
      instagram: "@loraineband",
      bandcamp: "loraine"
    },
    gear: ["The Bomber Overdrive", "Gibson Les Paul", "Vox AC30"],
    testimonial: "M2 Labs gear helps us achieve those dynamic swells and emotional peaks that define our sound.",
    featured: true,
    order: 2
  },
  {
    id: "ethan-riff-wizard",
    name: "Ethan (Riff Wizard Guitars)",
    bio: "Store owner and gear enthusiast who has built a community around quality instruments and boutique effects.",
    genre: "Gear Specialist",
    location: "Various",
    image: "/images/placeholder-artist-3.svg",
    website: "https://riffwizardguitars.com",
    socialMedia: {
      instagram: "@riffwizardguitars"
    },
    gear: ["The Bomber Overdrive", "Various boutique pedals"],
    testimonial: "M2 Labs represents exactly what we look for in boutique gear - quality, character, and that special something that makes music magical.",
    featured: true,
    order: 3
  },
  {
    id: "cologne-artist",
    name: "Klaus Mueller",
    bio: "German guitarist who was among the first to experience The Bomber Overdrive in Europe's vibrant music scene.",
    genre: "Alternative Rock",
    location: "Cologne, Germany",
    image: "/images/placeholder-artist-4.svg",
    socialMedia: {
      instagram: "@klausmueller_guitar"
    },
    gear: ["The Bomber Overdrive", "Telecaster", "Orange Amplifiers"],
    testimonial: "The Bomber brings American tone character to European stages. It's become my secret weapon.",
    featured: false,
    order: 4
  }
];

// Utility function to get featured artists (top 3 by order)
export function getFeaturedArtists(count: number = 3): Artist[] {
  return currentArtistsData
    .sort((a, b) => a.order - b.order)
    .slice(0, count);
}

// Internal variable to hold current artists data
let currentArtistsData: Artist[] = [...artistsData];

// Utility function to get all artists (sorted by order)
export function getAllArtists(): Artist[] {
  return currentArtistsData.sort((a, b) => a.order - b.order);
}

// Utility function to load artists from server (for initialization)
export async function loadArtistsFromServer(): Promise<Artist[]> {
  try {
    const response = await fetch('/api/admin/artists');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        // If we got valid data (even if empty), use it, otherwise fallback to default
        if (data.length > 0) {
          currentArtistsData = data;
          return data;
        } else {
          // Empty array from server, use default data
          currentArtistsData = [...artistsData];
          return currentArtistsData;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load artists from server, using default data:', error);
  }
  // Fallback to default data
  currentArtistsData = [...artistsData];
  return currentArtistsData;
}

// Utility function to toggle featured status (for admin use)
export function toggleArtistFeatured(artistId: string): void {
  const artist = currentArtistsData.find(a => a.id === artistId);
  if (artist) {
    artist.featured = !artist.featured;
  }
}

// Utility function to update an artist
export function updateArtist(artistId: string, updatedData: Partial<Artist>): boolean {
  const index = currentArtistsData.findIndex(a => a.id === artistId);
  if (index !== -1) {
    currentArtistsData[index] = { ...currentArtistsData[index], ...updatedData };
    return true;
  }
  return false;
}

// Utility function to add a new artist
export function addArtist(artistData: Omit<Artist, 'id'>): Artist {
  const id = artistData.name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  // Set order to be last
  const maxOrder = Math.max(...currentArtistsData.map(a => a.order), 0);
  const newArtist: Artist = { ...artistData, id, order: maxOrder + 1 };
  currentArtistsData.push(newArtist);
  return newArtist;
}

// Utility function to delete an artist
export function deleteArtist(artistId: string): boolean {
  const index = currentArtistsData.findIndex(a => a.id === artistId);
  if (index !== -1) {
    currentArtistsData.splice(index, 1);
    return true;
  }
  return false;
}

// Utility function to reorder artists
export function reorderArtists(reorderedArtists: Artist[]): void {
  reorderedArtists.forEach((artist, index) => {
    artist.order = index + 1;
  });
  currentArtistsData = [...reorderedArtists];
}

// Utility function to update all artists (for bulk operations)
export function updateAllArtists(newArtistsData: Artist[]): void {
  currentArtistsData = [...newArtistsData];
}
