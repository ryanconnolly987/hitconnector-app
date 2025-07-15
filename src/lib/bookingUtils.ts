import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');

interface Booking {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  totalCost: number;
  createdAt: string;
  artistId?: string;
  artistName?: string;
  artistSlug?: string;
  artistProfilePicture?: string;
}

interface BookingRequest {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'rejected';
  totalCost: number;
  createdAt: string;
}

// Helper to read bookings from JSON file
function getBookings(): Booking[] {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.bookings || [];
    }
  } catch (error) {
    console.error('Error reading bookings file:', error);
  }
  return [];
}

// Helper to read booking requests from JSON file
function getBookingRequests(): BookingRequest[] {
  try {
    if (fs.existsSync(BOOKING_REQUESTS_FILE)) {
      const data = fs.readFileSync(BOOKING_REQUESTS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.bookingRequests || [];
    }
  } catch (error) {
    console.error('Error reading booking requests file:', error);
  }
  return [];
}

// Main helper function to get active bookings (excluding cancelled)
export const selectActiveBookings = (studioId: string) => {
  const bookings = getBookings();
  const bookingRequests = getBookingRequests();
  
  // Filter active bookings (not cancelled or rejected)
  const activeBookings = bookings.filter(booking => 
    booking.studioId === studioId && 
    !['cancelled', 'rejected'].includes(booking.status)
  );
  
  // Add confirmed booking requests as active bookings
  const confirmedRequests = bookingRequests.filter(request =>
    request.studioId === studioId && 
    request.status === 'confirmed'
  ).map(request => ({
    ...request,
    status: 'confirmed' as const
  }));
  
  const allActive = [...activeBookings, ...confirmedRequests];
  
  // Sort by date and time
  allActive.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  return allActive;
};

// Partition bookings into pending, upcoming, and past
export const partitionBookings = (bookings: Booking[]) => {
  const now = new Date();
  
  const pending = bookings.filter(b => b.status === 'pending');
  const upcoming = bookings.filter(b => {
    const endDateTime = new Date(`${b.date}T${b.endTime || '23:59'}`);
    return endDateTime > now && ['confirmed', 'completed'].includes(b.status);
  });
  const past = bookings.filter(b => {
    const endDateTime = new Date(`${b.date}T${b.endTime || '23:59'}`);
    return endDateTime <= now && ['confirmed', 'completed'].includes(b.status);
  });
  
  return { pending, upcoming, past };
}; 