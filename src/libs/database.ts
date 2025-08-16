import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  User,
  Order,
  WarrantyClaim,
  UserRegistration,
  hashPassword,
  generateId,
} from './auth';

// Simple JSON file-based database (replace with real database in production)
const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const ORDERS_FILE = join(DATA_DIR, 'orders.json');
const WARRANTY_CLAIMS_FILE = join(DATA_DIR, 'warranty-claims.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// ---------- Users ----------
export const getUsers = async (): Promise<(User & { password?: string })[]> => {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveUsers = async (users: (User & { password?: string })[]): Promise<void> => {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

export const getUserByEmail = async (email: string): Promise<(User & { password?: string }) | null> => {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const getUserById = async (id: string): Promise<(User & { password?: string }) | null> => {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
};

export const createUser = async (userData: UserRegistration): Promise<User> => {
  const users = await getUsers();

  const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const now = new Date().toISOString();
  const newUser: User & { password: string } = {
    id: generateId(),
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    dateOfBirth: userData.dateOfBirth,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
    isVerified: false,
    role: 'customer',
  };

  users.push(newUser);
  await saveUsers(users);

  // strip password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = users[idx];
  return rest as User;
};

// For auth: get user with password hash
export const getUserWithPassword = async (
  email: string
): Promise<(User & { password: string }) | null> => {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data) as Array<User & { password?: string }>;
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found || !found.password) return null;
    return found as User & { password: string };
  } catch {
    return null;
  }
};

// Ensure / create a minimal user for a given email (used by SSO flows)
export const ensureUserForEmail = async (rawEmail: string): Promise<User> => {
  const email = String(rawEmail || '').toLowerCase().trim();
  if (!email) throw new Error('Email is required');

  const existing = await getUserByEmail(email);
  if (existing) {
    // strip password if present
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = existing;
    return rest as User;
  }

  const local = email.split('@')[0] || 'User';
  const firstName = local.replace(/[._-]+/g, ' ').split(' ')[0] || 'User';

  const registration: UserRegistration = {
    email,
    password: randomPassword(32),
    firstName,
    lastName: '',
    phone: '',
    dateOfBirth: '',
  };

  return await createUser(registration);
};

// ---------- Orders ----------
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
  const now = new Date().toISOString();
  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  orders.push(newOrder);
  await saveOrders(orders);
  return newOrder;
};

// ---------- Warranty Claims ----------
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

export const createWarrantyClaim = async (
  claimData: Omit<WarrantyClaim, 'id' | 'submittedAt' | 'updatedAt'>
): Promise<WarrantyClaim> => {
  const claims = await getWarrantyClaims();
  const now = new Date().toISOString();
  const newClaim: WarrantyClaim = {
    ...claimData,
    id: generateId(),
    submittedAt: now,
    updatedAt: now,
  };
  claims.push(newClaim);
  await saveWarrantyClaims(claims);
  return newClaim;
};

export const updateWarrantyClaim = async (
  id: string,
  updates: Partial<WarrantyClaim>
): Promise<WarrantyClaim | null> => {
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

// Simple random password generator (no crypto dependency needed here)
const randomPassword = (len = 24): string =>
  Array.from({ length: len }, () => Math.random().toString(36)[2] || 'x').join('');
 