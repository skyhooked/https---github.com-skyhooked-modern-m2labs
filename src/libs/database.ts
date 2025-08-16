// src/libs/database.ts
// Edge-safe in-memory "DB" with same API as the old file-backed version.

import { User, Order, WarrantyClaim, UserRegistration } from './auth';
import { hashPassword, generateId } from './auth';

type DBShape = {
  users: (User & { password?: string })[];
  orders: Order[];
  claims: WarrantyClaim[];
};

declare global {
  // eslint-disable-next-line no-var
  var __M2_DB__: DBShape | undefined;
}

function db(): DBShape {
  if (!globalThis.__M2_DB__) {
    globalThis.__M2_DB__ = { users: [], orders: [], claims: [] };
  }
  return globalThis.__M2_DB__!;
}

// User management
export const getUsers = async (): Promise<User[]> => {
  return db().users.map(({ password, ...u }) => u as User);
};

export const saveUsers = async (_users: User[]): Promise<void> => {
  // no-op; in-memory
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const u = db().users.find(user => user.email.toLowerCase() === String(email).toLowerCase());
  if (!u) return null;
  const { password: _p, ...rest } = u;
  return rest as User;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const u = db().users.find(user => user.id === id);
  if (!u) return null;
  const { password: _p, ...rest } = u;
  return rest as User;
};

export const createUser = async (userData: UserRegistration): Promise<User> => {
  const users = db().users;

  const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existing) throw new Error('User with this email already exists');

  const hashedPassword = await hashPassword(userData.password);
  const newUser: User & { password?: string } = {
    id: generateId(),
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone || '',
    dateOfBirth: userData.dateOfBirth || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: false,
    role: 'customer',
    password: hashedPassword,
  };

  users.push(newUser);
  const { password: _p, ...withoutPassword } = newUser;
  return withoutPassword as User;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const users = db().users;
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { password: _p, ...withoutPassword } = users[idx];
  return withoutPassword as User;
};

// Get user with password for authentication
export const getUserWithPassword = async (
  email: string
): Promise<(User & { password: string }) | null> => {
  const u = db().users.find(user => user.email.toLowerCase() === String(email).toLowerCase());
  if (!u || !u.password) return null;
  const { password, ...rest } = u;
  return { ...(rest as User), password };
};

// Order management
export const getOrders = async (): Promise<Order[]> => db().orders;

export const saveOrders = async (_o: Order[]): Promise<void> => {
  // no-op; in-memory
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  return db().orders.filter(o => o.userId === userId);
};

export const createOrder = async (
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> => {
  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db().orders.push(newOrder);
  return newOrder;
};

// Warranty claim management
export const getWarrantyClaims = async (): Promise<WarrantyClaim[]> => db().claims;

export const saveWarrantyClaims = async (_c: WarrantyClaim[]): Promise<void> => {
  // no-op; in-memory
};

export const getWarrantyClaimsByUserId = async (userId: string): Promise<WarrantyClaim[]> => {
  return db().claims.filter(c => c.userId === userId);
};

export const createWarrantyClaim = async (
  claimData: Omit<WarrantyClaim, 'id' | 'submittedAt' | 'updatedAt'>
): Promise<WarrantyClaim> => {
  const newClaim: WarrantyClaim = {
    ...claimData,
    id: generateId(),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db().claims.push(newClaim);
  return newClaim;
};

export const updateWarrantyClaim = async (
  id: string,
  updates: Partial<WarrantyClaim>
): Promise<WarrantyClaim | null> => {
  const claims = db().claims;
  const idx = claims.findIndex(c => c.id === id);
  if (idx === -1) return null;

  claims[idx] = {
    ...claims[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return claims[idx];
};

/**
 * 🔹 Ensure a local user exists for the given email.
 * If not found, creates a minimal user with a random password.
 */
export const ensureUserForEmail = async (rawEmail: string): Promise<User> => {
  const email = String(rawEmail || '').toLowerCase().trim();
  if (!email) throw new Error('Email is required');

  const existing = await getUserByEmail(email);
  if (existing) return existing;

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

// Simple random password generator
const randomPassword = (len = 24): string =>
  Array.from({ length: len }, () => Math.random().toString(36)[2] || 'x').join('');
