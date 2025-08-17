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
function getDatabase(): D1Database {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const globalAny = globalThis as any;
  
  // Try multiple binding locations for Cloudflare Pages
  const db = globalAny.DB || 
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
      return { results: result.result?.[0]?.results || [] };
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
  } as D1Database;
}

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
        id, name, bio, genre, location, image, website, instagram, youtube, spotify, bandcamp, tidal, 
        gear, testimonial, featured, showBandsintown, bandsintown_artist_name, order_position, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newArtist.id,
      newArtist.name,
      newArtist.bio || null,
      newArtist.genre || null,
      newArtist.location || null,
      newArtist.image || null,
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
    SET name = ?, bio = ?, genre = ?, location = ?, image = ?, website = ?, instagram = ?, youtube = ?, 
        spotify = ?, bandcamp = ?, tidal = ?, gear = ?, testimonial = ?, featured = ?, showBandsintown = ?, 
        bandsintown_artist_name = ?, order_position = ?, updatedAt = ?
    WHERE id = ?
  `).bind(
    updatedArtist.name,
    updatedArtist.bio || null,
    updatedArtist.genre || null,
    updatedArtist.location || null,
    updatedArtist.image || null,
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
  
  const result = await db.prepare('SELECT * FROM artists WHERE featured = 1 ORDER BY order_position ASC LIMIT ?').bind(count).all();
  return (result.results || []).map(artist => ({
    ...artist,
    gear: JSON.parse(artist.gear || '[]'),
    order: artist.order_position,
  }));
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
  
  try {
    // Run the migration SQL to set up tables and default data
    await db.exec(`
      -- Users table
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
      );

      -- Orders table
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
      );

      -- Warranty claims table
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
      );

      -- Artists table
      CREATE TABLE IF NOT EXISTS artists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT,
        genre TEXT,
        location TEXT,
        image TEXT,
        website TEXT,
        instagram TEXT,
        youtube TEXT,
        spotify TEXT,
        bandcamp TEXT,
        tidal TEXT,
        gear TEXT, -- JSON array as string
        testimonial TEXT,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        showBandsintown BOOLEAN NOT NULL DEFAULT FALSE,
        bandsintown_artist_name TEXT,
        order_position INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders (userId);
      CREATE INDEX IF NOT EXISTS idx_orders_ecwidOrderId ON orders (ecwidOrderId);
      CREATE INDEX IF NOT EXISTS idx_warranty_claims_userId ON warranty_claims (userId);
      CREATE INDEX IF NOT EXISTS idx_warranty_claims_orderId ON warranty_claims (orderId);
      CREATE INDEX IF NOT EXISTS idx_artists_order_position ON artists (order_position);
      CREATE INDEX IF NOT EXISTS idx_artists_featured ON artists (featured);
    `);

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
            id, name, bio, genre, location, image, website, instagram, youtube, spotify, bandcamp, tidal,
            gear, testimonial, featured, showBandsintown, bandsintown_artist_name, order_position, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          artist.id,
          artist.name,
          artist.bio,
          artist.genre,
          artist.location,
          artist.image,
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
          now,
          now
        ).run();
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};
