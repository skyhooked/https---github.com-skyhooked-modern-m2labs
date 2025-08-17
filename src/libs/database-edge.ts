// Edge Runtime compatible database layer
// Uses in-memory storage for Cloudflare Pages Edge Runtime
import {
  User,
  Order,
  WarrantyClaim,
  UserRegistration,
  hashPassword,
  generateId,
} from './auth';

// In-memory storage for Edge Runtime
let usersCache: (User & { password?: string })[] = [];
let ordersCache: Order[] = [];
let warrantyClaimsCache: WarrantyClaim[] = [];

// Initialize with default data
const defaultUsers: (User & { password?: string })[] = [
  {
    id: 'admin-001',
    email: 'admin@m2labs.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    createdAt: new Date().toISOString(),
  }
];

const defaultOrders: Order[] = [];
const defaultWarrantyClaims: WarrantyClaim[] = [];

// Initialize caches
usersCache = [...defaultUsers];
ordersCache = [...defaultOrders];
warrantyClaimsCache = [...defaultWarrantyClaims];

// ---------- Users ----------
export const getUsers = async (): Promise<(User & { password?: string })[]> => {
  return [...usersCache];
};

export const saveUsers = async (users: (User & { password?: string })[]): Promise<void> => {
  usersCache = [...users];
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
  
  // Check if user already exists
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const newUser: User & { password: string } = {
    id: generateId(),
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone || '',
    dateOfBirth: userData.dateOfBirth || '',
    role: 'user',
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

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
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...updates };
  await saveUsers(users);

  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
};

// ---------- Orders ----------
export const getOrders = async (): Promise<Order[]> => {
  return [...ordersCache];
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
  ordersCache = [...orders];
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const orders = await getOrders();
  return orders.filter(order => order.userId === userId);
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const orders = await getOrders();
  
  const newOrder: Order = {
    id: generateId(),
    ...orderData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  await saveOrders(orders);

  return newOrder;
};

// ---------- Warranty Claims ----------
export const getWarrantyClaims = async (): Promise<WarrantyClaim[]> => {
  return [...warrantyClaimsCache];
};

export const saveWarrantyClaims = async (claims: WarrantyClaim[]): Promise<void> => {
  warrantyClaimsCache = [...claims];
};

export const getWarrantyClaimsByUserId = async (userId: string): Promise<WarrantyClaim[]> => {
  const claims = await getWarrantyClaims();
  return claims.filter(claim => claim.userId === userId);
};

export const createWarrantyClaim = async (claimData: Omit<WarrantyClaim, 'id' | 'createdAt' | 'status'>): Promise<WarrantyClaim> => {
  const claims = await getWarrantyClaims();
  
  const newClaim: WarrantyClaim = {
    id: generateId(),
    ...claimData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  claims.push(newClaim);
  await saveWarrantyClaims(claims);

  return newClaim;
};

export const updateWarrantyClaim = async (id: string, updates: Partial<WarrantyClaim>): Promise<WarrantyClaim | null> => {
  const claims = await getWarrantyClaims();
  const claimIndex = claims.findIndex(c => c.id === id);
  
  if (claimIndex === -1) return null;

  claims[claimIndex] = { ...claims[claimIndex], ...updates };
  await saveWarrantyClaims(claims);

  return claims[claimIndex];
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
