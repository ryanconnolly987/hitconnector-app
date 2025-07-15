import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

// Helper function to get user info
function getUserInfo(userId: string): any {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(usersData).users || [];
      const user = users.find((u: any) => u.id === userId);
      if (user) return user;
    }

    if (fs.existsSync(PROFILES_FILE)) {
      const profilesData = fs.readFileSync(PROFILES_FILE, 'utf8');
      const profiles = JSON.parse(profilesData).profiles || [];
      const profile = profiles.find((p: any) => p.userId === userId);
      if (profile) {
        return {
          name: profile.name,
          slug: profile.slug,
          profileImage: profile.profileImage
        };
      }
    }
  } catch (error) {
    console.error('Error reading user info:', error);
  }
  return null;
}

// Helper function to save bookings back to file
function saveBookings(bookings: any[]): void {
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings }, null, 2));
}

// Auto-completion logic: move CONFIRMED bookings to COMPLETED when endDateTime < now
function autoCompleteBookings(bookings: any[]): { updated: boolean, bookings: any[] } {
  const now = new Date();
  let updated = false;
  
  const updatedBookings = bookings.map((booking: any) => {
    // Only auto-complete CONFIRMED bookings
    if (booking.status === 'CONFIRMED' || booking.status === 'confirmed') {
      const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
      if (endDateTime < now) {
        updated = true;
        return {
          ...booking,
          status: 'COMPLETED',
          completedAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
      }
    }
    return booking;
  });
  
  return { updated, bookings: updatedBookings };
}

export async function getActiveBookings(studioId: string) {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    let allBookings = parsed.bookings || [];
    
    // Run auto-completion logic (nightly cron equivalent)
    const { updated, bookings: updatedBookings } = autoCompleteBookings(allBookings);
    if (updated) {
      console.log('🔄 Auto-completed expired bookings');
      saveBookings(updatedBookings);
      allBookings = updatedBookings;
    }
    
    // Filter by studioId and return all non-canceled bookings (status in ['PENDING','CONFIRMED','COMPLETED'])
    const filteredBookings = allBookings.filter((booking: any) => 
      booking.studioId === studioId && 
      booking.status !== 'CANCELED' && 
      booking.status !== 'cancelled' &&
      booking.status !== 'rejected'  // Also exclude rejected bookings
    );
    
    // Enhance with artist data (equivalent to Prisma include)
    const enhancedBookings = filteredBookings.map((booking: any) => {
      const artistInfo = getUserInfo(booking.userId);
      return {
        ...booking,
        // Normalize status to uppercase for consistent filtering
        status: booking.status === 'pending' ? 'PENDING' : 
               booking.status === 'confirmed' ? 'CONFIRMED' : 
               booking.status === 'completed' ? 'COMPLETED' : booking.status,
        artist: artistInfo ? {
          displayName: artistInfo.name || booking.userName,
          slug: artistInfo.slug,
          avatarUrl: artistInfo.profileImage  // Ensure avatarUrl is present
        } : null,
        engineer: booking.staffName ? {
          displayName: booking.staffName
        } : null,
        // Add flat fields for backward compatibility
        artistId: booking.userId,
        artistName: artistInfo?.name || booking.userName,
        artistSlug: artistInfo?.slug,
        artistProfilePicture: artistInfo?.profileImage,  // Ensure artistProfilePicture is present
        // Convert date fields to Date objects for consistent filtering
        startDateTime: new Date(`${booking.date}T${booking.startTime}`),
        endDateTime: new Date(`${booking.date}T${booking.endTime}`),
        totalCost: booking.totalCost || booking.totalAmount || 0
      };
    });
    
    // Sort by start date ascending (equivalent to Prisma orderBy)
    enhancedBookings.sort((a: any, b: any) => a.startDateTime.getTime() - b.startDateTime.getTime());
    
    return enhancedBookings;
  } catch (error) {
    console.error('Error reading bookings file:', error);
    return [];
  }
} 