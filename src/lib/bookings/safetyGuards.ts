import fs from 'fs';
import path from 'path';

interface Booking {
  id: string;
  studioId: string;
  studioName: string;
  roomId?: string;
  roomName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate?: number;
  totalCost: number;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Studio {
  id: string;
  name: string;
  owner: string;
}

const DATA_DIR = process.cwd();
const USERS_FILE = path.join(DATA_DIR, 'data', 'users.json');
const STUDIOS_FILE = path.join(DATA_DIR, 'data', 'studios.json');

// Cache for validation data
let userCache: Set<string> | null = null;
let studioCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Load and cache user/studio IDs for validation
 */
function loadValidationCache(): void {
  const now = Date.now();
  
  // Only reload cache if it's expired or empty
  if (userCache && studioCache && (now - cacheTimestamp) < CACHE_TTL) {
    return;
  }

  try {
    // Load users
    const users: User[] = fs.existsSync(USERS_FILE) 
      ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
      : [];
    userCache = new Set(users.map(u => u.id));

    // Load studios
    const studiosData = fs.existsSync(STUDIOS_FILE) 
      ? JSON.parse(fs.readFileSync(STUDIOS_FILE, 'utf8'))
      : { studios: [] };
    const studios: Studio[] = studiosData.studios || studiosData;
    studioCache = new Set(studios.map(s => s.id));

    cacheTimestamp = now;
    
    console.log(`🔒 [Safety Guards] Cache updated: ${userCache.size} users, ${studioCache.size} studios`);
  } catch (error) {
    console.error('❌ [Safety Guards] Error loading validation cache:', error);
    // Initialize empty caches to prevent repeated errors
    userCache = new Set();
    studioCache = new Set();
    cacheTimestamp = now;
  }
}

/**
 * Validate booking data integrity
 * Used as a safety guard in booking fetchers
 */
export function validateBookingIntegrity(booking: Booking): boolean {
  if (!booking || !booking.id) {
    console.warn(`⚠️ [Safety Guards] Invalid booking: missing ID`);
    return false;
  }

  // Ensure cache is loaded
  loadValidationCache();

  // Check user exists
  if (!booking.userId || !userCache!.has(booking.userId)) {
    console.warn(`⚠️ [Safety Guards] Invalid booking ${booking.id}: user ${booking.userId} not found`);
    return false;
  }

  // Check studio exists
  if (!booking.studioId || !studioCache!.has(booking.studioId)) {
    console.warn(`⚠️ [Safety Guards] Invalid booking ${booking.id}: studio ${booking.studioId} not found`);
    return false;
  }

  // Check required fields
  if (!booking.date || !booking.startTime || !booking.endTime) {
    console.warn(`⚠️ [Safety Guards] Invalid booking ${booking.id}: missing required fields (date, startTime, endTime)`);
    return false;
  }

  // Check valid status
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!booking.status || !validStatuses.includes(booking.status)) {
    console.warn(`⚠️ [Safety Guards] Invalid booking ${booking.id}: invalid status "${booking.status}"`);
    return false;
  }

  return true;
}

/**
 * Filter array of bookings to remove orphaned records
 */
export function filterValidBookings(bookings: Booking[]): Booking[] {
  if (!Array.isArray(bookings)) {
    console.warn('⚠️ [Safety Guards] Invalid bookings array provided');
    return [];
  }

  const validBookings = bookings.filter(validateBookingIntegrity);
  
  const filteredCount = bookings.length - validBookings.length;
  if (filteredCount > 0) {
    console.log(`🧹 [Safety Guards] Filtered out ${filteredCount} invalid bookings`);
  }
  
  return validBookings;
}

/**
 * Force cache refresh (useful for testing or after data updates)
 */
export function refreshValidationCache(): void {
  userCache = null;
  studioCache = null;
  cacheTimestamp = 0;
  loadValidationCache();
} 