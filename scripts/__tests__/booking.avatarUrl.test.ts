import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Mock the Next.js environment
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');
const STUDIOS_FILE = path.join(DATA_DIR, 'studios.json');

describe('Booking Avatar URL Test', () => {
  beforeAll(() => {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test data
    [BOOKINGS_FILE, USERS_FILE, PROFILES_FILE, STUDIOS_FILE].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  test('should include avatarUrl in studio dashboard booking payload', async () => {
    // Seed test data
    const testUserId = 'test-artist-123';
    const testStudioId = 'test-studio-456';
    const cloudinaryUrl = 'https://res.cloudinary.com/test/image/upload/v123456789/artist-avatar.jpg';

    // Create test user
    const userData = [{
      id: testUserId,
      name: 'Test Artist',
      email: 'test@example.com',
      role: 'rapper',
      slug: 'test-artist'
    }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(userData, null, 2));

    // Create test profile with Cloudinary avatar
    const profileData = [{
      id: testUserId,
      userId: testUserId,
      name: 'Test Artist',
      profileImage: cloudinaryUrl,
      slug: 'test-artist'
    }];
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profileData, null, 2));

    // Create test studio
    const studioData = {
      studios: [{
        id: testStudioId,
        name: 'Test Studio',
        description: 'A test recording studio'
      }]
    };
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(studioData, null, 2));

    // Create test booking
    const bookingData = {
      bookings: [{
        id: 'test-booking-789',
        userId: testUserId,
        studioId: testStudioId,
        userName: 'Test Artist',
        userEmail: 'test@example.com',
        date: '2025-01-20',
        startTime: '10:00',
        endTime: '12:00',
        status: 'CONFIRMED',
        roomName: 'Studio A',
        totalCost: 100,
        duration: 2
      }]
    };
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingData, null, 2));

    // Import and test the bookings API
    const { GET } = await import('../../src/app/api/bookings/route');
    
    // Create mock request with studioId
    const url = new URL(`http://localhost:3000/api/bookings?studioId=${testStudioId}`);
    const request = new NextRequest(url);

    // Call the API
    const response = await GET(request);
    const data = await response.json();

    // Verify the response structure
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('upcoming');
    expect(Array.isArray(data.upcoming)).toBe(true);

    // Find the test booking in upcoming
    const testBooking = data.upcoming.find((b: any) => b.id === 'test-booking-789');
    expect(testBooking).toBeDefined();

    // Verify avatarUrl is present in artist object
    expect(testBooking.artist).toBeDefined();
    expect(testBooking.artist.avatarUrl).toBe(cloudinaryUrl);
    expect(testBooking.artist.displayName).toBe('Test Artist');
    expect(testBooking.artist.slug).toBe('test-artist');

    // Verify backward compatibility fields
    expect(testBooking.artistProfilePicture).toBe(cloudinaryUrl);
    expect(testBooking.artistName).toBe('Test Artist');
    expect(testBooking.artistSlug).toBe('test-artist');
  });

  test('should handle missing avatar gracefully', async () => {
    // Seed test data without avatar
    const testUserId = 'test-artist-no-avatar';
    const testStudioId = 'test-studio-no-avatar';

    // Create test user without profile
    const userData = [{
      id: testUserId,
      name: 'Artist No Avatar',
      email: 'no-avatar@example.com',
      role: 'rapper',
      slug: 'artist-no-avatar'
    }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(userData, null, 2));

    // Create empty profile data
    fs.writeFileSync(PROFILES_FILE, JSON.stringify([], null, 2));

    // Create test studio
    const studioData = {
      studios: [{
        id: testStudioId,
        name: 'Test Studio No Avatar'
      }]
    };
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(studioData, null, 2));

    // Create test booking
    const bookingData = {
      bookings: [{
        id: 'test-booking-no-avatar',
        userId: testUserId,
        studioId: testStudioId,
        userName: 'Artist No Avatar',
        userEmail: 'no-avatar@example.com',
        date: '2025-01-20',
        startTime: '14:00',
        endTime: '16:00',
        status: 'CONFIRMED',
        roomName: 'Studio B',
        totalCost: 80,
        duration: 2
      }]
    };
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingData, null, 2));

    // Import and test the bookings API
    const { GET } = await import('../../src/app/api/bookings/route');
    
    // Create mock request with studioId
    const url = new URL(`http://localhost:3000/api/bookings?studioId=${testStudioId}`);
    const request = new NextRequest(url);

    // Call the API
    const response = await GET(request);
    const data = await response.json();

    // Find the test booking
    const testBooking = data.upcoming.find((b: any) => b.id === 'test-booking-no-avatar');
    expect(testBooking).toBeDefined();

    // Verify avatarUrl is null but present
    expect(testBooking.artist).toBeDefined();
    expect(testBooking.artist).toHaveProperty('avatarUrl');
    expect(testBooking.artist.avatarUrl).toBeNull();
    expect(testBooking.artist.displayName).toBe('Artist No Avatar');

    // Verify backward compatibility fields
    expect(testBooking).toHaveProperty('artistProfilePicture');
    expect(testBooking.artistProfilePicture).toBeNull();
  });
}); 