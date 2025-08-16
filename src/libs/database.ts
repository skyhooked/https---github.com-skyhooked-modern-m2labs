// src/libs/database.ts
// Edge-safe in-memory "database" (no fs/path). Data is ephemeral per worker instance.

import { User, Order, WarrantyClaim, UserRegistration } from './auth';
import { hashPassword } from './auth';

// Internal store. We keep `any` for users so hashed passwords can live alongside `User` fields.
const DB = {
  users: [] as any[], // (User & { password: string })[]
  orders: [] as Order[],
  warrantyClaims: [] as WarrantyClaim[],
};

// Simple deep clone to avoid leaking references across callers
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// -------------------- Users --------------------
export const getUsers = async (): Promise<User[]> => {
  return clone(DB.users) as User[];
};

export const saveUsers = async (users: User[]): Promise<void> => {
  // Replace in-place to preserve module identity
  DB.users.length = 0;
  DB.users.push(...clone(users as any[]));
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const e = email.toLowerCase();
  const u = (DB.users as any[]).find((u) => String(u.email).toLowerCase() === e);
  return u ? (clone(u) as User) : null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const u = (DB.users as any[]).find((u) => u.id === id);
  return u ? (clone(u) as User) : null;
};

export const createUser = async (userData: UserRegistration): Promise<User> => {
  // Check if user already exists
  const exists = (DB.users as any[]).some(
    (u) => String(u.email).toLowerCase() === String(userData.email).toLowerCase(),
  );
  if (exists) throw new Error('User with this email already exists');

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

  // Persist in memory
  const users = await getUsers();
  users.push(newUser as any);
  await saveUsers(users);

  // Return without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  // Work on the internal array directly so we don't drop passwords
  const idx = (DB.users as any[]).findIndex((u) => u.id === id);
  if (idx === -1) return null;

  (DB.users as any[])[idx] = {
    ...(DB.users as any[])[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return clone((DB.users as any[])[idx]) as User;
};

// Include password for auth flows
export const getUserWithPassword = async (
  email: string,
): Promise<(User & { password: string }) | null> => {
  const e = email.toLowerCase();
  const u = (DB.users as any[]).find((u) => String(u.email).toLowerCase() === e);
  return u ? (clone(u) as User & { password: string }) : null;
};

/**
 * Ensure a local user exists for the given email.
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

// -------------------- Orders --------------------
export const getOrders = async (): Promise<Order[]> => {
  return clone(DB.orders);
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
  DB.orders.length = 0;
  DB.orders.push(...clone(orders));
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  return clone(DB.orders.filter((o) => o.userId === userId));
};

export const createOrder = async (
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Order> => {
  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  DB.orders.push(clone(newOrder));
  return clone(newOrder);
};

// -------------------- Warranty Claims --------------------
export const getWarrantyClaims = async (): Promise<WarrantyClaim[]> => {
  return clone(DB.warrantyClaims);
};

export const saveWarrantyClaims = async (claims: WarrantyClaim[]): Promise<void> => {
  DB.warrantyClaims.length = 0;
  DB.warrantyClaims.push(...clone(claims));
};

export const getWarrantyClaimsByUserId = async (userId: string): Promise<WarrantyClaim[]> => {
  return clone(DB.warrantyClaims.filter((c) => c.userId === userId));
};

export const createWarrantyClaim = async (
  claimData: Omit<WarrantyClaim, 'id' | 'submittedAt' | 'updatedAt'>,
): Promise<WarrantyClaim> => {
  const newClaim: WarrantyClaim = {
    ...claimData,
    id: generateId(),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  DB.warrantyClaims.push(clone(newClaim));
  return clone(newClaim);
};

export const updateWarrantyClaim = async (
  id: string,
  updates: Partial<WarrantyClaim>,
): Promise<WarrantyClaim | null> => {
  const idx = DB.warrantyClaims.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  DB.warrantyClaims[idx] = {
    ...DB.warrantyClaims[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return clone(DB.warrantyClaims[idx]);
};

// -------------------- Helpers --------------------
const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

// Simple random password generator
const randomPassword = (len = 24): string =>
  Array.from({ length: len }, () => Math.random().toString(36)[2] || 'x').join('');
