#!/usr/bin/env npx ts-node

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

interface BookingData {
  bookings: Booking[];
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

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STUDIOS_FILE = path.join(DATA_DIR, 'studios.json');

/**
 * Clean orphan bookings migration script
 * Removes bookings that:
 * 1. Reference non-existent users
 * 2. Reference non-existent studios
 * 3. Have missing required data
 */
export async function cleanOrphanBookings(): Promise<void> {
  console.log('🧹 Starting orphan booking cleanup...');
  
  try {
    // Load data files
    const bookingsData: BookingData = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
    const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const studiosData = JSON.parse(fs.readFileSync(STUDIOS_FILE, 'utf8'));
    const studios: Studio[] = studiosData.studios || studiosData;

    console.log('📊 Initial state:');
    console.log(`  - Bookings: ${bookingsData.bookings.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Studios: ${studios.length}`);

    // Create lookup maps for fast validation
    const userIds = new Set(users.map(u => u.id));
    const studioIds = new Set(studios.map(s => s.id));

    let orphanCount = 0;
    const cleanedBookings: Booking[] = [];

    for (const booking of bookingsData.bookings) {
      let isOrphan = false;
      const reasons: string[] = [];

      // Check if user exists
      if (!booking.userId || !userIds.has(booking.userId)) {
        isOrphan = true;
        reasons.push('missing or invalid userId');
      }

      // Check if studio exists
      if (!booking.studioId || !studioIds.has(booking.studioId)) {
        isOrphan = true;
        reasons.push('missing or invalid studioId');
      }

      // Check for required fields
      if (!booking.id || !booking.date || !booking.startTime || !booking.endTime) {
        isOrphan = true;
        reasons.push('missing required fields');
      }

      // Check for invalid status
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
      if (!booking.status || !validStatuses.includes(booking.status)) {
        isOrphan = true;
        reasons.push('invalid status');
      }

      if (isOrphan) {
        orphanCount++;
        console.log(`❌ Orphan booking: ${booking.id} - ${reasons.join(', ')}`);
      } else {
        cleanedBookings.push(booking);
      }
    }

    // Create backup before modifying
    const backupFile = `${BOOKINGS_FILE}.backup.${Date.now()}`;
    fs.copyFileSync(BOOKINGS_FILE, backupFile);
    console.log(`💾 Backup created: ${path.basename(backupFile)}`);

    // Write cleaned data
    bookingsData.bookings = cleanedBookings;
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsData, null, 2));

    console.log('✅ Cleanup completed:');
    console.log(`  - Removed ${orphanCount} orphan bookings`);
    console.log(`  - Remaining bookings: ${cleanedBookings.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

/**
 * Validate booking data integrity
 * Used as a safety guard in booking fetchers
 */
export function validateBookingIntegrity(booking: Booking, users: User[], studios: Studio[]): boolean {
  if (!booking || !booking.id) return false;
  
  // Check user exists
  if (!booking.userId || !users.find(u => u.id === booking.userId)) {
    console.warn(`⚠️ Invalid booking ${booking.id}: user not found`);
    return false;
  }

  // Check studio exists
  if (!booking.studioId || !studios.find(s => s.id === booking.studioId)) {
    console.warn(`⚠️ Invalid booking ${booking.id}: studio not found`);
    return false;
  }

  // Check required fields
  if (!booking.date || !booking.startTime || !booking.endTime) {
    console.warn(`⚠️ Invalid booking ${booking.id}: missing required fields`);
    return false;
  }

  return true;
}

// Run if called directly
if (require.main === module) {
  cleanOrphanBookings()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
} 