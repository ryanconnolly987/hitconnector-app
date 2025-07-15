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

export async function getActiveBookings(studioId: string) {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    const allBookings = parsed.bookings || [];
    
    // Filter by studioId and exclude CANCELED bookings (canonical filter)
    const filteredBookings = allBookings.filter((booking: any) => 
      booking.studioId === studioId && 
      booking.status !== 'CANCELED' && 
      booking.status !== 'cancelled'  // Handle both cases
    );
    
    // Enhance with artist data (equivalent to Prisma include)
    const enhancedBookings = filteredBookings.map((booking: any) => {
      const artistInfo = getUserInfo(booking.userId);
      return {
        ...booking,
        artist: artistInfo ? {
          displayName: artistInfo.name || booking.userName,
          slug: artistInfo.slug,
          avatarUrl: artistInfo.profileImage
        } : null,
        engineer: booking.staffName ? {
          displayName: booking.staffName
        } : null,
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