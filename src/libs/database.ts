import { User, Order, WarrantyClaim, UserRegistration } from './auth';
import { hashPassword } from './auth';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

// Simple JSON file-based database (replace with real database in production)
const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const ORDERS_FILE = join(DATA_DIR, 'orders.json');
const WARRANTY_CLAIMS_FILE = join(DATA_DIR, 'warranty-claims.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// User management
export const getUsers = async (): Promise<User[]> => {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveUsers = async (users: User[]): Promise<void> => {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.id === id) || null;
};

export const createUser = async (userData: UserRegistration): Promise<User> => {
  const users = await getUsers();

  // Check if user already exists
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const newUser: User & { password: string } = {
    id: generateId(),
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    dateOfBirth: userData.dateOfBirth,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: false,
    role: 'customer',
  };

  (users as Array<User & { password?: string }>).push(newUser);
  await saveUsers(users);

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const users = await getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveUsers(users);
  return users[idx];
};

/**
 * Option B: ensure a real local user exists for the given email.
 * Returns existing user or creates a minimal one.
 */
export const ensureUserForEmail = async (email: string): Promise<User> => {
  const normalized = email.toLowerCase().trim();
  if (!normalized) throw new Error('ensureUserForEmail: email is required');

  const existing = await getUserByEmail(normalized);
  if (existing) return existing;

  const registration: UserRegistration = {
    email: normalized,
    password: generateRandomPassword(),
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
  };

  const created = await createUser(registration);
  return created;
};

// Order management
export const getOrders = async (): Promise<Order[]> => {
  try {
    const data = await readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
  await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const orders = await getOrders();
  return orders.filter(o => o.userId === userId);
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const orders = await getOrders();

  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  await saveOrders(orders);

  return newOrder;
};

// Warranty claim management
export const getWarrantyClaims = async (): Promise<WarrantyClaim[]> => {
  try {
    const data = await readFile(WARRANTY_CLAIMS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveWarrantyClaims = async (claims: WarrantyClaim[]): Promise<void> => {
  await writeFile(WARRANTY_CLAIMS_FILE, JSON.stringify(claims, null, 2));
};

export const getWarrantyClaimsByUserId = async (userId: string): Promise<WarrantyClaim[]> => {
  const claims = await getWarrantyClaims();
  return claims.filter(c => c.userId === userId);
};

export const createWarrantyClaim = async (claimData: Omit<WarrantyClaim, 'id' | 'submittedAt' | 'updatedAt'>): Promise<WarrantyClaim> => {
  const claims = await getWarrantyClaims();

  const newClaim: WarrantyClaim = {
    ...claimData,
    id: generateId(),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  claims.push(newClaim);
  await saveWarrantyClaims(claims);

  return newClaim;
};

export const updateWarrantyClaim = async (id: string, updates: Partial<WarrantyClaim>): Promise<WarrantyClaim | null> => {
  const claims = await getWarrantyClaims();
  const idx = claims.findIndex(c => c.id === id);
  if (idx === -1) return null;

  claims[idx] = {
    ...claims[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveWarrantyClaims(claims);
  return claims[idx];
};

// Helper function to generate IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generate a random password for auto-created users
const generateRandomPassword = (length = 24): string => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Get user with password for authentication
export const getUserWithPassword = async (email: string): Promise<(User & { password: string }) | null> => {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data);
    return users.find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
};
