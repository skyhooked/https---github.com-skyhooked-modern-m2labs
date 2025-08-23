// Cloudflare D1 database layer for Edge Runtime
import {
  User,
  Order,
  WarrantyClaim,
  UserRegistration,
  hashPassword,
  generateId,
} from './auth';

// Type for Cloudflare D1 binding
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
  raw<T = any>(): Promise<T[]>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: any;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Get D1 database from environment bindings
export function getDatabase(): D1Database {
  console.log('🔍 Attempting to get D1 database...');
  
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const globalAny = globalThis as any;
  
  // For Next.js on Cloudflare Pages, the D1 binding is in process.env
  const db = (process.env as any).DB || 
             globalAny.DB || 
             globalAny.env?.DB || 
             globalAny.__env?.DB ||
             globalAny.ASSETS?.env?.DB ||
             globalAny.context?.env?.DB;
  
  if (!db) {
    console.warn('⚠️ D1 Database binding not found, will use fallback approach');
    console.warn('This is likely due to a Pages binding configuration issue');
    
    // Create a mock D1 database that uses REST API
    const mockDb = createMockD1Database();
    return mockDb;
  } else {
    console.log('✅ D1 Database binding found successfully');
  }
  
  return db;
}

// Create a mock D1 database that uses Cloudflare REST API
function createMockD1Database(): D1Database {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  const apiToken = process.env.CF_API_TOKEN;
  
  if (!accountId || !databaseId || !apiToken) {
    throw new Error('Missing required environment variables for D1 REST API fallback');
  }
  
  const createBoundStatement = (query: string, values: any[] = []) => ({
    bind: (...newValues: any[]) => createBoundStatement(query, newValues),
    run: async () => {
      console.log('🔄 Using D1 REST API fallback for query:', query.substring(0, 50) + '...');
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: query,
          params: values
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`D1 REST API error: ${response.status} ${error}`);
      }
      
      const result = await response.json();
      return { success: true, meta: result.result?.[0]?.meta || {} };
    },
    all: async () => {
      console.log('🔄 Using D1 REST API fallback for query:', query.substring(0, 50) + '...');
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: query,
          params: values
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`D1 REST API error: ${response.status} ${error}`);
      }
      
      const result = await response.json();
      return { 
        results: result.result?.[0]?.results || [], 
        success: true, 
        meta: result.result?.[0]?.meta || {} 
      };
    },
    first: async () => {
      console.log('🔄 Using D1 REST API fallback for query:', query.substring(0, 50) + '...');
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: query,
          params: values
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`D1 REST API error: ${response.status} ${error}`);
      }
      
      const result = await response.json();
      const results = result.result?.[0]?.results || [];
      return results[0] || null;
    },
    raw: async () => {
      throw new Error('raw() not implemented in D1 REST API fallback');
    }
  });

  return {
    prepare: (query: string) => createBoundStatement(query),
    dump: async () => {
      throw new Error('dump() not implemented in D1 REST API fallback');
    },
    batch: async () => {
      throw new Error('batch() not implemented in D1 REST API fallback');
    },
    exec: async (query: string) => {
      console.log('🔄 Using D1 REST API fallback for exec:', query.substring(0, 50) + '...');
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: query,
          params: []
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`D1 REST API error: ${response.status} ${error}`);
      }
      
      const result = await response.json();
      return { count: 1, duration: 0 };
    }
  } as unknown as D1Database;
}

// ---------- News Posts ----------
export interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  fullContent: string;
  coverImage?: string;
  author: string;
  publishDate: string;
  readTime?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export const getNewsPosts = async (): Promise<NewsPost[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM news_posts ORDER BY publishDate DESC').all();
  return result.results || [];
};

export const getNewsPostById = async (id: string): Promise<NewsPost | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM news_posts WHERE id = ?').bind(id).first();
  return result || null;
};

export const createNewsPost = async (postData: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsPost> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const postId = postData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + '-' + Date.now().toString(36);
  
  const now = new Date().toISOString();
  
  const newPost: NewsPost = {
    id: postId,
    ...postData,
    createdAt: now,
    updatedAt: now,
  };

  await db.prepare(`
    INSERT INTO news_posts (
      id, title, excerpt, fullContent, coverImage, author, publishDate, readTime, category, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    newPost.id,
    newPost.title,
    newPost.excerpt,
    newPost.fullContent,
    newPost.coverImage || null,
    newPost.author,
    newPost.publishDate,
    newPost.readTime || null,
    newPost.category || null,
    newPost.createdAt,
    newPost.updatedAt
  ).run();

  return newPost;
};

export const updateNewsPost = async (id: string, updates: Partial<NewsPost>): Promise<NewsPost | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const existingPost = await getNewsPostById(id);
  if (!existingPost) return null;

  const now = new Date().toISOString();
  const updatedPost = { ...existingPost, ...updates, updatedAt: now };

  await db.prepare(`
    UPDATE news_posts 
    SET title = ?, excerpt = ?, fullContent = ?, coverImage = ?, author = ?, publishDate = ?, readTime = ?, category = ?, updatedAt = ?
    WHERE id = ?
  `).bind(
    updatedPost.title,
    updatedPost.excerpt,
    updatedPost.fullContent,
    updatedPost.coverImage || null,
    updatedPost.author,
    updatedPost.publishDate,
    updatedPost.readTime || null,
    updatedPost.category || null,
    updatedPost.updatedAt,
    id
  ).run();

  return updatedPost;
};

export const deleteNewsPost = async (id: string): Promise<boolean> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('DELETE FROM news_posts WHERE id = ?').bind(id).run();
  return result.success;
};

// ---------- Users ----------
export const getUsers = async (): Promise<(User & { password?: string })[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
  return result.results || [];
};

export const saveUsers = async (users: (User & { password?: string })[]): Promise<void> => {
  // This function is kept for compatibility but not used in D1 implementation
  // Individual CRUD operations are preferred with SQL databases
  console.warn('saveUsers() is deprecated with D1, use individual create/update operations');
};

export const getUserByEmail = async (email: string): Promise<(User & { password?: string }) | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  return result || null;
};

export const getUserById = async (id: string): Promise<(User & { password?: string }) | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return result || null;
};

export const createUser = async (userData: UserRegistration): Promise<User> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  // Check if user already exists
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const userId = generateId();
  const now = new Date().toISOString();
  
  const newUser = {
    id: userId,
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone || '',
    dateOfBirth: userData.dateOfBirth || '',
    role: 'customer' as const,
    password: hashedPassword,
    isVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.prepare(`
    INSERT INTO users (id, email, firstName, lastName, phone, dateOfBirth, role, password, isVerified, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    newUser.id,
    newUser.email,
    newUser.firstName,
    newUser.lastName,
    newUser.phone,
    newUser.dateOfBirth,
    newUser.role,
    newUser.password,
    newUser.isVerified,
    newUser.createdAt,
    newUser.updatedAt
  ).run();

  // Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const getUserWithPassword = async (email: string): Promise<(User & { password: string }) | null> => {
  const user = await getUserByEmail(email);
  if (!user || !user.password) return null;
  return user as User & { password: string };
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const existingUser = await getUserById(id);
  if (!existingUser) return null;

  const now = new Date().toISOString();
  const updatedUser = { ...existingUser, ...updates, updatedAt: now };

  await db.prepare(`
    UPDATE users 
    SET firstName = ?, lastName = ?, phone = ?, dateOfBirth = ?, role = ?, isVerified = ?, updatedAt = ?
    WHERE id = ?
  `).bind(
    updatedUser.firstName,
    updatedUser.lastName,
    updatedUser.phone || '',
    updatedUser.dateOfBirth || '',
    updatedUser.role,
    updatedUser.isVerified,
    updatedUser.updatedAt,
    id
  ).run();

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

// ---------- Orders ----------
export const getOrders = async (): Promise<Order[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  return (result.results || []).map(order => ({
    ...order,
    items: JSON.parse(order.items || '[]'),
    shippingAddress: JSON.parse(order.shippingAddress || '{}'),
    billingAddress: JSON.parse(order.billingAddress || '{}'),
  }));
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
  // This function is kept for compatibility but not used in D1 implementation
  console.warn('saveOrders() is deprecated with D1, use individual create/update operations');
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').bind(userId).all();
  return (result.results || []).map(order => ({
    ...order,
    items: JSON.parse(order.items || '[]'),
    shippingAddress: JSON.parse(order.shippingAddress || '{}'),
    billingAddress: JSON.parse(order.billingAddress || '{}'),
  }));
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const orderId = generateId();
  const now = new Date().toISOString();
  
  const newOrder: Order = {
    id: orderId,
    ...orderData,
    createdAt: now,
    updatedAt: now,
  };

  await db.prepare(`
    INSERT INTO orders (id, userId, ecwidOrderId, status, total, currency, items, shippingAddress, billingAddress, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    newOrder.id,
    newOrder.userId,
    newOrder.ecwidOrderId,
    newOrder.status,
    newOrder.total,
    newOrder.currency,
    JSON.stringify(newOrder.items),
    JSON.stringify(newOrder.shippingAddress),
    JSON.stringify(newOrder.billingAddress),
    newOrder.createdAt,
    newOrder.updatedAt
  ).run();

  return newOrder;
};

// ---------- Warranty Claims ----------
export const getWarrantyClaims = async (): Promise<WarrantyClaim[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM warranty_claims ORDER BY submittedAt DESC').all();
  return result.results || [];
};

export const saveWarrantyClaims = async (claims: WarrantyClaim[]): Promise<void> => {
  // This function is kept for compatibility but not used in D1 implementation
  console.warn('saveWarrantyClaims() is deprecated with D1, use individual create/update operations');
};

export const getWarrantyClaimsByUserId = async (userId: string): Promise<WarrantyClaim[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM warranty_claims WHERE userId = ? ORDER BY submittedAt DESC').bind(userId).all();
  return result.results || [];
};

export const createWarrantyClaim = async (claimData: Omit<WarrantyClaim, 'id' | 'status' | 'submittedAt' | 'updatedAt'>): Promise<WarrantyClaim> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const claimId = generateId();
  const now = new Date().toISOString();
  
  const newClaim: WarrantyClaim = {
    id: claimId,
    ...claimData,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  };

  await db.prepare(`
    INSERT INTO warranty_claims (id, userId, orderId, productName, serialNumber, issue, status, submittedAt, updatedAt, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    newClaim.id,
    newClaim.userId,
    newClaim.orderId,
    newClaim.productName,
    newClaim.serialNumber,
    newClaim.issue,
    newClaim.status,
    newClaim.submittedAt,
    newClaim.updatedAt,
    newClaim.notes || null
  ).run();

  return newClaim;
};

export const updateWarrantyClaim = async (id: string, updates: Partial<WarrantyClaim>): Promise<WarrantyClaim | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const existingClaim = await db.prepare('SELECT * FROM warranty_claims WHERE id = ?').bind(id).first();
  if (!existingClaim) return null;

  const now = new Date().toISOString();
  const updatedClaim = { ...existingClaim, ...updates, updatedAt: now };

  await db.prepare(`
    UPDATE warranty_claims 
    SET userId = ?, orderId = ?, productName = ?, serialNumber = ?, issue = ?, status = ?, updatedAt = ?, notes = ?
    WHERE id = ?
  `).bind(
    updatedClaim.userId,
    updatedClaim.orderId,
    updatedClaim.productName,
    updatedClaim.serialNumber,
    updatedClaim.issue,
    updatedClaim.status,
    updatedClaim.updatedAt,
    updatedClaim.notes || null,
    id
  ).run();

  return updatedClaim;
};

// ---------- Artists ----------
export interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  location?: string;
  image?: string;
  imageStyle?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  spotify?: string;
  bandcamp?: string;
  tidal?: string;
  gear: string[]; // Will be stored as JSON string in DB
  testimonial?: string;
  featured: boolean;
  showBandsintown?: boolean;
  bandsintown_artist_name?: string;
  order: number; // Renamed from order_position to match frontend
  useCustomTemplate?: boolean;
  customTemplatePath?: string;
  customSections?: any[]; // Will be stored as JSON string in DB
  createdAt: string;
  updatedAt: string;
}

export const getArtists = async (): Promise<Artist[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM artists ORDER BY order_position ASC').all();
  return (result.results || []).map(artist => ({
    ...artist,
    gear: JSON.parse(artist.gear || '[]'),
    customSections: JSON.parse(artist.customSections || '[]'),
    order: artist.order_position, // Map DB field to frontend field
  }));
};

export const getArtistById = async (id: string): Promise<Artist | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('SELECT * FROM artists WHERE id = ?').bind(id).first();
  if (!result) return null;
  
  return {
    ...result,
    gear: JSON.parse(result.gear || '[]'),
    customSections: JSON.parse(result.customSections || '[]'),
    order: result.order_position,
  };
};

export const createArtist = async (artistData: Omit<Artist, 'createdAt' | 'updatedAt'>): Promise<Artist> => {
  console.log('🎯 createArtist called with data:', JSON.stringify(artistData, null, 2));
  
  const db = getDatabase();
  if (!db) {
    console.error('❌ Database not available in createArtist');
    throw new Error('Database not available');
  }
  
  console.log('✅ Database found in createArtist');
  
  const now = new Date().toISOString();
  
  const newArtist: Artist = {
    ...artistData,
    createdAt: now,
    updatedAt: now,
  };
  
  console.log('📝 Prepared artist data for insertion:', {
    id: newArtist.id,
    name: newArtist.name,
    order: newArtist.order,
    featured: newArtist.featured
  });

  try {
    console.log('🔧 Attempting database insertion...');
    
    const result = await db.prepare(`
      INSERT INTO artists (
        id, name, bio, genre, location, image, imageStyle, website, instagram, youtube, spotify, bandcamp, tidal, 
        gear, testimonial, featured, showBandsintown, bandsintown_artist_name, order_position, useCustomTemplate, customTemplatePath, customSections, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newArtist.id,
      newArtist.name,
      newArtist.bio || null,
      newArtist.genre || null,
      newArtist.location || null,
      newArtist.image || null,
      newArtist.imageStyle || 'square',
      newArtist.website || null,
      newArtist.instagram || null,
      newArtist.youtube || null,
      newArtist.spotify || null,
      newArtist.bandcamp || null,
      newArtist.tidal || null,
      JSON.stringify(newArtist.gear || []),
      newArtist.testimonial || null,
      newArtist.featured,
      newArtist.showBandsintown || false,
      newArtist.bandsintown_artist_name || null,
      newArtist.order,
      newArtist.useCustomTemplate || false,
      newArtist.customTemplatePath || null,
      JSON.stringify(newArtist.customSections || []),
      newArtist.createdAt,
      newArtist.updatedAt
    ).run();

    console.log('✅ Database insertion successful:', result);
    console.log('🎉 Artist created successfully:', newArtist.id);
    
    return newArtist;
  } catch (dbError: any) {
    console.error('❌ Database insertion failed:', dbError);
    console.error('Error details:', {
      message: dbError.message,
      stack: dbError.stack,
      artistData: newArtist
    });
    throw new Error(`Failed to create artist in database: ${dbError.message}`);
  }
};

export const updateArtist = async (id: string, updates: Partial<Artist>): Promise<Artist | null> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const existingArtist = await getArtistById(id);
  if (!existingArtist) return null;

  const now = new Date().toISOString();
  const updatedArtist = { ...existingArtist, ...updates, updatedAt: now };

  await db.prepare(`
    UPDATE artists 
    SET name = ?, bio = ?, genre = ?, location = ?, image = ?, imageStyle = ?, website = ?, instagram = ?, youtube = ?, 
        spotify = ?, bandcamp = ?, tidal = ?, gear = ?, testimonial = ?, featured = ?, showBandsintown = ?, 
        bandsintown_artist_name = ?, order_position = ?, useCustomTemplate = ?, customTemplatePath = ?, customSections = ?, updatedAt = ?
    WHERE id = ?
  `).bind(
    updatedArtist.name,
    updatedArtist.bio || null,
    updatedArtist.genre || null,
    updatedArtist.location || null,
    updatedArtist.image || null,
    updatedArtist.imageStyle || 'square',
    updatedArtist.website || null,
    updatedArtist.instagram || null,
    updatedArtist.youtube || null,
    updatedArtist.spotify || null,
    updatedArtist.bandcamp || null,
    updatedArtist.tidal || null,
    JSON.stringify(updatedArtist.gear || []),
    updatedArtist.testimonial || null,
    updatedArtist.featured,
    updatedArtist.showBandsintown || false,
    updatedArtist.bandsintown_artist_name || null,
    updatedArtist.order,
    updatedArtist.useCustomTemplate || false,
    updatedArtist.customTemplatePath || null,
    JSON.stringify(updatedArtist.customSections || []),
    updatedArtist.updatedAt,
    id
  ).run();

  return updatedArtist;
};

export const deleteArtist = async (id: string): Promise<boolean> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  const result = await db.prepare('DELETE FROM artists WHERE id = ?').bind(id).run();
  return result.success;
};

export const getFeaturedArtists = async (count: number = 3): Promise<Artist[]> => {
  const db = getDatabase();
  if (!db) throw new Error('Database not available');
  
  console.log('🔍 getFeaturedArtists: Querying for featured artists...');
  const result = await db.prepare('SELECT * FROM artists WHERE (featured = 1 OR featured = "true") ORDER BY order_position ASC LIMIT ?').bind(count).all();
  console.log('📊 getFeaturedArtists: Raw query result:', {
    success: result.success,
    resultCount: result.results?.length || 0,
    results: result.results?.map(r => ({ id: r.id, name: r.name, featured: r.featured }))
  });
  
  const transformedArtists = (result.results || []).map(artist => ({
    ...artist,
    gear: JSON.parse(artist.gear || '[]'),
    customSections: JSON.parse(artist.customSections || '[]'),
    order: artist.order_position,
  }));
  
  console.log('✨ getFeaturedArtists: Returning', transformedArtists.length, 'featured artists');
  return transformedArtists;
};

// ---------- Helper Functions ----------
export const ensureUserForEmail = async (email: string, userData?: Partial<UserRegistration>): Promise<User> => {
  let user = await getUserByEmail(email);
  
  if (!user && userData) {
    // Create new user if doesn't exist
    const newUserData: UserRegistration = {
      email,
      password: 'temp-password-' + Math.random().toString(36), // Temporary password
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      dateOfBirth: userData.dateOfBirth || '',
    };
    
    user = await createUser(newUserData);
  }
  
  if (!user) {
    throw new Error('User not found and insufficient data to create user');
  }
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ---------- Database Initialization ----------
export const initializeDatabase = async (): Promise<void> => {
  console.log('🔍 Attempting to get D1 database...');
  const db = getDatabase();
  
  if (!db) {
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('This should NOT happen with your current binding configuration!');
    console.warn('Environment variables:', {
      D1_DATABASE_ID: process.env.D1_DATABASE_ID,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
    });
    throw new Error('Database not available');
  }
  
  console.log('✅ Database connection successful, proceeding with initialization...');
  
  // First, check and add missing columns to existing tables
  try {
    await db.exec(`
      ALTER TABLE artists ADD COLUMN imageStyle TEXT DEFAULT 'square';
    `);
    console.log('✅ Added imageStyle column to artists table');
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('✅ imageStyle column already exists');
    } else {
      console.warn('Could not add imageStyle column:', error.message);
    }
  }
  
  try {
    // Create tables individually to avoid large SQL exec issues
    console.log('Creating users table...');
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT,
        dateOfBirth TEXT,
        role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
        password TEXT NOT NULL,
        isVerified BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `).run();
    console.log('✅ Users table created successfully');

    console.log('Creating orders table...');
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        ecwidOrderId TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
        total REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        items TEXT NOT NULL,
        shippingAddress TEXT NOT NULL,
        billingAddress TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `).run();
    console.log('✅ Orders table created successfully');

    console.log('Creating warranty claims table...');
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS warranty_claims (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        orderId TEXT NOT NULL,
        productName TEXT NOT NULL,
        serialNumber TEXT NOT NULL,
        issue TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('submitted', 'review', 'approved', 'rejected', 'resolved', 'under_review', 'completed')) DEFAULT 'submitted',
        submittedAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `).run();
    console.log('✅ Warranty claims table created successfully');
    
    // Create essential indexes
    console.log('Creating indexes...');
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders (userId)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_warranty_claims_userId ON warranty_claims (userId)`).run();
    console.log('✅ Indexes created successfully');

    // Insert default admin user if it doesn't exist
    const adminExists = await getUserByEmail('admin@m2labs.com');
    if (!adminExists) {
      await db.prepare(`
        INSERT INTO users (id, email, firstName, lastName, role, password, isVerified, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'admin-001',
        'admin@m2labs.com',
        'Admin',
        'User',
        'admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }

    // Insert default newsletter template if it doesn't exist
    const templateExists = await db.prepare('SELECT COUNT(*) as count FROM newsletter_templates WHERE id = ?').bind('default-template-001').first();
    if (templateExists.count === 0) {
      await db.prepare(`
        INSERT INTO newsletter_templates (id, name, description, htmlContent, isDefault, category, variables, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'default-template-001',
        'M2 Labs Default Template',
        'Clean, branded template for M2 Labs newsletters',
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-top: 20px; 
        }
        .header { 
            text-align: center; 
            background: #FF8A3D; 
            color: white; 
            padding: 20px; 
            border-radius: 10px 10px 0 0; 
            margin: -20px -20px 20px -20px; 
        }
        .content { 
            padding: 20px 0; 
        }
        .footer { 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
        }
        .btn { 
            display: inline-block; 
            background: #FF8A3D; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        @media only screen and (max-width: 600px) {
            .container { 
                margin: 10px; 
                padding: 15px; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>M2 Labs</h1>
            <p>{{headerText}}</p>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>M2 Labs - Premium Guitar Effects</p>
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit Website</a></p>
            <p>{{companyAddress}}</p>
        </div>
    </div>
</body>
</html>`,
        true,
        'default',
        '{"subject":"Newsletter Subject","headerText":"Stay Connected","content":"Newsletter content goes here","unsubscribeUrl":"{{unsubscribeUrl}}","websiteUrl":"https://m2labs.com","companyAddress":"M2 Labs, Your City, State 12345"}',
        'admin-001',
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }

    // Insert initial artists if table is empty
    const artistCount = await db.prepare('SELECT COUNT(*) as count FROM artists').first();
    if (artistCount.count === 0) {
      const now = new Date().toISOString();
      const initialArtists = [
        {
          id: 'caro-pohl',
          name: 'Caro Pohl',
          bio: 'Caro Pohl picked up a guitar at 14 and never needed permission to get loud. Her first was a Yamaha Pacifica. It wasn\'t about the gear. It was about pushing sound hard enough to make it hers.',
          genre: 'Metal',
          location: 'Cologne, Germany',
          image: '/images/uploads/1755221517314-cp-sc2.jpg',
          website: 'https://saddiscore.de/',
          instagram: '@saddiscore',
          spotify: 'https://open.spotify.com/artist/0XkyklXB3YOwxTuSylThrw',
          tidal: 'https://tidal.com/artist/5395187',
          gear: '["The Bomber Overdrive"]',
          featured: true,
          order_position: 1
        },
        {
          id: 'hector-guzman',
          name: 'Hector Guzman',
          bio: 'Hector Guzman is a producer and mix engineer based in Los Angeles. His credits include major-label and independent artists across genres spanning from Alternative Rock, Hip-hop, and Country.',
          genre: 'Producer',
          location: 'Los Angeles, CA',
          image: '/images/HG.webp',
          website: 'https://www.hectorguzman.com/',
          instagram: '@hectorguzman.co',
          gear: '["The Bomber Overdrive"]',
          featured: true,
          order_position: 2
        },
        {
          id: 'loraine-james',
          name: 'Loraine James',
          bio: 'Loraine James has carved out a distinctive space in electronic music through her innovative blend of broken beat, jungle, ambient, and experimental sounds.',
          genre: 'Electronic/Experimental',
          location: 'London, UK',
          image: '/images/Lorainepfp.jpg',
          website: 'https://lorainejames.bandcamp.com/',
          instagram: '@lorainejames',
          spotify: 'https://open.spotify.com/artist/7j0rlQs0PAjRtJcIGIax4E',
          bandcamp: 'https://lorainejames.bandcamp.com/',
          gear: '["The Bomber Overdrive"]',
          featured: true,
          order_position: 3
        }
      ];

      for (const artist of initialArtists) {
        await db.prepare(`
          INSERT INTO artists (
            id, name, bio, genre, location, image, imageStyle, website, instagram, youtube, spotify, bandcamp, tidal,
            gear, testimonial, featured, showBandsintown, bandsintown_artist_name, order_position, useCustomTemplate, customTemplatePath, customSections, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          artist.id,
          artist.name,
          artist.bio,
          artist.genre,
          artist.location,
          artist.image,
          'square', // default imageStyle for initial artists
          artist.website || null,
          artist.instagram || null,
          null, // youtube
          artist.spotify || null,
          artist.bandcamp || null,
          artist.tidal || null,
          artist.gear,
          null, // testimonial
          artist.featured,
          false, // showBandsintown
          null, // bandsintown_artist_name
          artist.order_position,
          false, // useCustomTemplate
          null, // customTemplatePath
          '[]', // customSections (empty array as JSON)
          now,
          now
        ).run();
      }
    }

    // Insert default news posts if table is empty
    const newsCount = await db.prepare('SELECT COUNT(*) as count FROM news_posts').first();
    if (newsCount.count === 0) {
      const now = new Date().toISOString();
      const defaultNewsPosts = [
        {
          id: "bomber-cologne",
          title: "The Bomber Has Landed: Cologne Gets Its First Taste of M2 Labs Overdrive",
          excerpt: "Thick tone. Punchy drive. No survivors. We're proud to announce that the Bomber Overdrive has officially touched down in Cologne...",
          fullContent: "Thick tone. Punchy drive. No survivors. We're proud to announce that the Bomber Overdrive has officially touched down in Cologne and is making waves in the local music scene. This marks our first international distribution partnership, bringing the signature M2 Labs sound to musicians across Germany and Europe.",
          coverImage: "/images/M2-Labs-The-Bomber-Overdrive-3.jpg",
          author: "Jonathan",
          publishDate: "2024-06-13",
          readTime: "1 min read",
          category: null
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
          category: null
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
          category: null
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
          category: "Spotlight"
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
          category: "Interview"
        }
      ];

      for (const post of defaultNewsPosts) {
        await db.prepare(`
          INSERT INTO news_posts (id, title, excerpt, fullContent, coverImage, author, publishDate, readTime, category, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          post.id,
          post.title,
          post.excerpt,
          post.fullContent,
          post.coverImage,
          post.author,
          post.publishDate,
          post.readTime,
          post.category,
          now,
          now
        ).run();
      }
    }
    
    console.log('Database initialized successfully');
    
    // Initialize e-commerce tables
    try {
      const { initializeEcommerceDatabase } = await import('./database-ecommerce');
      await initializeEcommerceDatabase();
      console.log('E-commerce database initialized successfully');
    } catch (ecommerceError) {
      console.error('Failed to initialize e-commerce database:', ecommerceError);
      // Don't throw error - allow main initialization to continue
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// ---------- Newsletter Functions ----------

// Newsletter Subscriber Functions
export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  subscriptionDate: string;
  isActive: boolean;
  preferences?: any;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export const getNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_subscribers ORDER BY createdAt DESC').all();
  return result.results || [];
};

export const getActiveSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_subscribers WHERE isActive = ? ORDER BY createdAt DESC').bind(true).all();
  return result.results || [];
};

export const getSubscriberByEmail = async (email: string): Promise<NewsletterSubscriber | null> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').bind(email.toLowerCase()).first();
  return result || null;
};

export const createNewsletterSubscriber = async (data: {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  source?: string;
  preferences?: any;
}): Promise<NewsletterSubscriber> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  await db.prepare(`
    INSERT INTO newsletter_subscribers (id, email, firstName, lastName, userId, subscriptionDate, isActive, preferences, source, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.email.toLowerCase(),
    data.firstName || null,
    data.lastName || null,
    data.userId || null,
    now,
    true,
    JSON.stringify(data.preferences || {}),
    data.source || 'website',
    now,
    now
  ).run();

  return await db.prepare('SELECT * FROM newsletter_subscribers WHERE id = ?').bind(id).first();
};

export const updateNewsletterSubscriber = async (id: string, updates: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | null> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), now, id];
  
  await db.prepare(`UPDATE newsletter_subscribers SET ${setClause}, updatedAt = ? WHERE id = ?`).bind(...values).run();
  return await db.prepare('SELECT * FROM newsletter_subscribers WHERE id = ?').bind(id).first();
};

export const unsubscribeEmail = async (email: string, campaignId?: string, reason?: string): Promise<boolean> => {
  const db = getDatabase();
  const subscriber = await getSubscriberByEmail(email);
  if (!subscriber) return false;

  const now = new Date().toISOString();
  
  // Mark subscriber as inactive
  await db.prepare('UPDATE newsletter_subscribers SET isActive = ?, updatedAt = ? WHERE id = ?')
    .bind(false, now, subscriber.id).run();
  
  // Record unsubscribe event
  await db.prepare(`
    INSERT INTO newsletter_unsubscribes (id, subscriberId, campaignId, reason, unsubscribeDate)
    VALUES (?, ?, ?, ?, ?)
  `).bind(generateId(), subscriber.id, campaignId || null, reason || null, now).run();

  return true;
};

// Newsletter Campaign Functions
export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  content: string;
  templateId?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
  bounceCount: number;
  createdBy: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const getNewsletterCampaigns = async (): Promise<NewsletterCampaign[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_campaigns ORDER BY createdAt DESC').all();
  return (result.results || []).map(campaign => ({
    ...campaign,
    tags: campaign.tags ? JSON.parse(campaign.tags) : []
  }));
};

export const getCampaignById = async (id: string): Promise<NewsletterCampaign | null> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_campaigns WHERE id = ?').bind(id).first();
  if (!result) return null;
  
  return {
    ...result,
    tags: result.tags ? JSON.parse(result.tags) : []
  };
};

export const createNewsletterCampaign = async (data: {
  name: string;
  subject: string;
  previewText?: string;
  content: string;
  templateId?: string;
  scheduledAt?: string;
  createdBy: string;
  tags?: string[];
}): Promise<NewsletterCampaign> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  await db.prepare(`
    INSERT INTO newsletter_campaigns (id, name, subject, previewText, content, templateId, status, scheduledAt, recipientCount, openCount, clickCount, unsubscribeCount, bounceCount, createdBy, tags, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.name,
    data.subject,
    data.previewText || null,
    data.content,
    data.templateId || null,
    data.scheduledAt ? 'scheduled' : 'draft',
    data.scheduledAt || null,
    0, 0, 0, 0, 0,
    data.createdBy,
    JSON.stringify(data.tags || []),
    now,
    now
  ).run();

  const campaign = await getCampaignById(id);
  if (!campaign) {
    throw new Error('Failed to create newsletter campaign');
  }
  return campaign;
};

export const updateNewsletterCampaign = async (id: string, updates: Partial<NewsletterCampaign>): Promise<NewsletterCampaign | null> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // Handle tags serialization
  const processedUpdates: any = { ...updates };
  if (processedUpdates.tags) {
    processedUpdates.tags = JSON.stringify(processedUpdates.tags);
  }
  
  const setClause = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(processedUpdates), now, id];
  
  await db.prepare(`UPDATE newsletter_campaigns SET ${setClause}, updatedAt = ? WHERE id = ?`).bind(...values).run();
  return await getCampaignById(id);
};

// Newsletter Template Functions
export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  htmlContent: string;
  isDefault: boolean;
  category: string;
  variables?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const getNewsletterTemplates = async (): Promise<NewsletterTemplate[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_templates ORDER BY isDefault DESC, createdAt DESC').all();
  return (result.results || []).map(template => ({
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : {}
  }));
};

export const getTemplateById = async (id: string): Promise<NewsletterTemplate | null> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_templates WHERE id = ?').bind(id).first();
  if (!result) return null;
  
  return {
    ...result,
    variables: result.variables ? JSON.parse(result.variables) : {}
  };
};

export const createNewsletterTemplate = async (data: {
  name: string;
  description?: string;
  thumbnail?: string;
  htmlContent: string;
  category: string;
  variables?: any;
  createdBy: string;
}): Promise<NewsletterTemplate> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = generateId();
  
  await db.prepare(`
    INSERT INTO newsletter_templates (id, name, description, thumbnail, htmlContent, isDefault, category, variables, createdBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.name,
    data.description || null,
    data.thumbnail || null,
    data.htmlContent,
    false,
    data.category,
    JSON.stringify(data.variables || {}),
    data.createdBy,
    now,
    now
  ).run();

  const template = await getTemplateById(id);
  if (!template) {
    throw new Error('Failed to create newsletter template');
  }
  return template;
};

export const updateNewsletterTemplate = async (id: string, updates: Partial<NewsletterTemplate>): Promise<NewsletterTemplate | null> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // Handle variables serialization
  const processedUpdates: any = { ...updates };
  if (processedUpdates.variables) {
    processedUpdates.variables = JSON.stringify(processedUpdates.variables);
  }
  
  const setClause = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(processedUpdates), now, id];
  
  await db.prepare(`UPDATE newsletter_templates SET ${setClause}, updatedAt = ? WHERE id = ?`).bind(...values).run();
  return await getTemplateById(id);
};

// Newsletter Analytics Functions
export const recordNewsletterEvent = async (data: {
  campaignId: string;
  subscriberId: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'unsubscribed' | 'bounced';
  eventData?: any;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO newsletter_analytics (id, campaignId, subscriberId, eventType, eventData, userAgent, ipAddress, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    generateId(),
    data.campaignId,
    data.subscriberId,
    data.eventType,
    JSON.stringify(data.eventData || {}),
    data.userAgent || null,
    data.ipAddress || null,
    now
  ).run();
  
  // Update campaign counters
  const counterColumn = `${data.eventType}Count`;
  if (['open', 'click', 'unsubscribe', 'bounce'].includes(data.eventType.replace('Count', ''))) {
    await db.prepare(`UPDATE newsletter_campaigns SET ${counterColumn} = ${counterColumn} + 1 WHERE id = ?`)
      .bind(data.campaignId).run();
  }
};

export const getCampaignAnalytics = async (campaignId: string): Promise<any[]> => {
  const db = getDatabase();
  const result = await db.prepare('SELECT * FROM newsletter_analytics WHERE campaignId = ? ORDER BY timestamp DESC')
    .bind(campaignId).all();
  return result.results || [];
};
