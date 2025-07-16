import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

interface Booking {
  id: string;
  studioId: string;
  status: string;
  [key: string]: any;
}

/**
 * Reset all existing bookings for studio dashboard - development environment only
 * Removes bookings with status 'confirmed', 'pending', 'CONFIRMED', 'PENDING'
 */
function resetStudioBookings(): void {
  // Safety check - only run in development environment
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Reset bookings script cannot run in production environment');
    process.exit(1);
  }

  console.log('🔄 Starting booking reset process...');

  try {
    // Check if bookings file exists
    if (!fs.existsSync(BOOKINGS_FILE)) {
      console.log('ℹ️ No bookings file found, nothing to reset');
      return;
    }

    // Read current bookings
    const bookingsData = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const parsed = JSON.parse(bookingsData);
    const currentBookings: Booking[] = parsed.bookings || [];

    console.log(`📋 Found ${currentBookings.length} total bookings`);

    // Count bookings to be removed
    const bookingsToRemove = currentBookings.filter(booking => 
      booking.status && ['confirmed', 'pending', 'CONFIRMED', 'PENDING'].includes(booking.status)
    );

    console.log(`🎯 Found ${bookingsToRemove.length} bookings to remove (confirmed/pending status)`);

    if (bookingsToRemove.length === 0) {
      console.log('✅ No confirmed or pending bookings found, nothing to reset');
      return;
    }

    // Remove confirmed and pending bookings
    const filteredBookings = currentBookings.filter(booking => 
      !booking.status || !['confirmed', 'pending', 'CONFIRMED', 'PENDING'].includes(booking.status)
    );

    // Update the bookings file
    const updatedData = {
      ...parsed,
      bookings: filteredBookings
    };

    // Backup original file first
    const backupFile = `${BOOKINGS_FILE}.backup.${Date.now()}`;
    fs.copyFileSync(BOOKINGS_FILE, backupFile);
    console.log(`💾 Created backup: ${path.basename(backupFile)}`);

    // Write updated bookings
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(updatedData, null, 2));

    console.log(`✅ Successfully reset bookings:`);
    console.log(`   - Removed: ${bookingsToRemove.length} confirmed/pending bookings`);
    console.log(`   - Remaining: ${filteredBookings.length} bookings (completed/cancelled)`);
    console.log(`   - Backup saved: ${path.basename(backupFile)}`);

    // Log details of removed bookings
    if (bookingsToRemove.length > 0) {
      console.log('\n📝 Removed bookings details:');
      bookingsToRemove.forEach(booking => {
        console.log(`   - ${booking.id}: ${booking.status} (Studio: ${booking.studioId})`);
      });
    }

  } catch (error) {
    console.error('❌ Error resetting bookings:', error);
    process.exit(1);
  }
}

// Run the reset if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetStudioBookings();
}

export { resetStudioBookings }; 