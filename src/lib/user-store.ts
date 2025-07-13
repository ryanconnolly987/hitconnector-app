import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { slugify } from './utils';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'rapper' | 'studio';
  slug?: string;
  studioId?: string;
  stripeCustomerId?: string;
  createdAt: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  role: 'rapper' | 'studio';
  studioName?: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const SALT_ROUNDS = 12;

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read users from file
export function getUsers(): User[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write users to file
export function saveUsers(users: User[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users file:', error);
    throw new Error('Failed to save user data');
  }
}

// Find user by email
export function findUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

// Create new user
export async function createUser(userData: UserCreateData): Promise<User> {
  const users = getUsers();
  
  // Check if user already exists
  const existingUser = findUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
  
  // Generate user ID and slug
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const baseSlug = slugify(userData.name);
  
  // Ensure slug is unique
  let finalSlug = baseSlug;
  let counter = 1;
  while (users.some(user => user.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // Create user object
  const newUser: User = {
    id: userId,
    email: userData.email.toLowerCase(),
    passwordHash,
    name: userData.name,
    role: userData.role,
    slug: finalSlug,
    createdAt: new Date().toISOString()
  };

  // Add studioId for studio users
  if (userData.role === 'studio') {
    newUser.studioId = `studio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add user to list and save
  users.push(newUser);
  saveUsers(users);

  return newUser;
}

// Verify user credentials
export async function verifyUser(email: string, password: string): Promise<User | null> {
  const user = findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

// Get user without password hash (for responses)
export function getUserSafe(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Update user with Stripe customer ID
export function updateUserStripeCustomerId(userId: string, stripeCustomerId: string): void {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].stripeCustomerId = stripeCustomerId;
  saveUsers(users);
}

// Get user by ID
export function findUserById(userId: string): User | null {
  const users = getUsers();
  return users.find(user => user.id === userId) || null;
} 