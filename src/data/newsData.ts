export interface CustomSection {
  id: string;
  title: string;
  type: 'text' | 'gallery' | 'video' | 'html';
  content: string;
  enabled: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  fullContent: string;
  coverImage: string;
  author: string;
  publishDate: string;
  readTime: string;
  category?: string;
  customSections?: CustomSection[];
  useCustomTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const newsData: NewsPost[] = [
  {
    id: "bomber-cologne",
    title: "The Bomber Has Landed: Cologne Gets Its First Taste of M2 Labs Overdrive",
    excerpt: "Thick tone. Punchy drive. No survivors. We're proud to announce that the Bomber Overdrive has officially touched down in Cologne...",
    fullContent: "Thick tone. Punchy drive. No survivors. We're proud to announce that the Bomber Overdrive has officially touched down in Cologne and is making waves in the local music scene. This marks our first international distribution partnership, bringing the signature M2 Labs sound to musicians across Germany and Europe.",
    coverImage: "/images/M2-Labs-The-Bomber-Overdrive-3.jpg",
    author: "Jonathan",
    publishDate: "2024-06-13",
    readTime: "1 min read",
  },
  {
    id: "price-stability",
    title: "Standing Strong: Our Commitment to Price Stability in Changing Times",
    excerpt: "The symphony of global commerce has always been a delicate dance of supply and demand, manufacturing relationships and economic forces...",
    fullContent: "The symphony of global commerce has always been a delicate dance of supply and demand, manufacturing relationships and economic forces. In these uncertain times, we remain committed to providing consistent, fair pricing for our customers while maintaining the quality standards that define M2 Labs.",
    coverImage: "/images/M2-Labs-The-Bomber-Overdrive-4.jpg",
    author: "Jonathan",
    publishDate: "2024-04-17",
    readTime: "2 min read",
  },
  {
    id: "wormwood-project",
    title: "Sonic Artistry: Brandon Gaines of WormWood Project Talks Music, Art and Tone",
    excerpt: "In the world of gritty, atmospheric music, few bands capture the raw essence of Southern Gothic Grunge quite like the WormWood Project...",
    fullContent: "In the world of gritty, atmospheric music, few bands capture the raw essence of Southern Gothic Grunge quite like the WormWood Project. We sat down with Brandon Gaines to discuss their unique sound, artistic vision, and how the Bomber Overdrive fits into their sonic palette.",
    coverImage: "/images/M2-Labs-The-Bomber-Overdrive-5.jpg",
    author: "Jonathan",
    publishDate: "2024-04-03",
    readTime: "2 min read",
  },
  {
    id: "loraine-postrock",
    title: "Loraine: Atlanta's Post‑Rock Revelation",
    excerpt: "Discover how the band Loraine balances concise post‑rock song structures with emotional depth and learn what's next on their horizon.",
    fullContent: "Discover how the band Loraine balances concise post‑rock song structures with emotional depth and learn what's next on their horizon. Their innovative approach to post-rock has been turning heads in Atlanta's vibrant music scene.",
    coverImage: "/images/M2-Labs-The-Bomber-Overdrive-1.jpg",
    author: "Jonathan",
    publishDate: "2024-04-02",
    readTime: "Spotlight",
    category: "Spotlight",
  },
  {
    id: "riff-wizard-interview",
    title: "Interview with Ethan of Riff Wizard Guitars",
    excerpt: "Dive into the creative mind behind Riff Wizard Guitars and find out how the store became a home for boutique gear enthusiasts.",
    fullContent: "Dive into the creative mind behind Riff Wizard Guitars and find out how the store became a home for boutique gear enthusiasts. Ethan shares his journey building a community around quality instruments and effects.",
    coverImage: "/images/TBO-Pedal-HERO.webp",
    author: "Jonathan",
    publishDate: "2024-04-02",
    readTime: "Interview",
    category: "Interview",
  },
];

// Internal variable to hold current news data
let currentNewsData: NewsPost[] = [...newsData];

// Utility function to get all news posts
export function getAllPosts(): NewsPost[] {
  return currentNewsData;
}

// Utility function to load news from server (for initialization)
export async function loadNewsFromServer(): Promise<NewsPost[]> {
  try {
    const response = await fetch('/api/news');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        currentNewsData = data;
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load news from server, using default data:', error);
  }
  // Fallback to default data
  currentNewsData = [...newsData];
  return currentNewsData;
}

// Utility function to get the latest N posts
export function getLatestPosts(count: number = 3): NewsPost[] {
  return currentNewsData
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, count);
}

// Utility function to format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

