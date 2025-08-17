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
  return globalThis.DB || (globalThis as any).env?.DB;
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
  const db = getDatabase();
  if (!db) {
    console.warn('Database not available - this may be expected in local development');
    return;
  }
  
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders (userId);
      CREATE INDEX IF NOT EXISTS idx_orders_ecwidOrderId ON orders (ecwidOrderId);
      CREATE INDEX IF NOT EXISTS idx_warranty_claims_userId ON warranty_claims (userId);
      CREATE INDEX IF NOT EXISTS idx_warranty_claims_orderId ON warranty_claims (orderId);
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
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};
