import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/[id]/bookings/route';

// Mock file system
jest.mock('fs');
jest.mock('path');

const mockBookingsData = {
  bookings: [
    {
      id: 'booking_1',
      userId: 'user_123',
      studioId: 'studio_456',
      studioName: 'Test Studio',
      date: '2025-07-20',
      startTime: '10:00',
      endTime: '12:00',
      status: 'CONFIRMED'
    },
    {
      id: 'booking_2',
      userId: 'user_123',
      studioId: 'studio_789',
      studioName: 'Another Studio',
      date: '2025-07-21',
      startTime: '14:00',
      endTime: '16:00',
      status: 'completed'
    },
    {
      id: 'booking_3',
      userId: 'user_456',
      studioId: 'studio_456',
      studioName: 'Test Studio',
      date: '2025-07-22',
      startTime: '09:00',
      endTime: '11:00',
      status: 'CONFIRMED'
    }
  ]
};

const mockStudiosData = {
  studios: [
    {
      id: 'studio_456',
      name: 'Test Studio',
      slug: 'test-studio',
      profileImage: 'https://example.com/studio1.jpg'
    },
    {
      id: 'studio_789',
      name: 'Another Studio',
      slug: 'another-studio',
      profileImage: null
    }
  ]
};

// Setup mocks
const fs = require('fs');
const path = require('path');

fs.existsSync = jest.fn();
fs.readFileSync = jest.fn();
path.join = jest.fn((...args) => args.join('/'));

describe('/api/users/[id]/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.join calls
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock file existence and reading
    fs.existsSync.mockImplementation((filePath) => {
      return filePath.includes('bookings.json') || filePath.includes('studios.json');
    });
    
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('bookings.json')) {
        return JSON.stringify(mockBookingsData);
      }
      if (filePath.includes('studios.json')) {
        return JSON.stringify(mockStudiosData);
      }
      return '{}';
    });
  });

  describe('GET', () => {
    it('should return bookings for a valid user ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(2);
      expect(data.bookings[0].studio.name).toBe('Test Studio');
      expect(data.bookings[0].studio.slug).toBe('test-studio');
      expect(data.bookings[0].studio.avatarUrl).toBe('https://example.com/studio1.jpg');
    });

    it('should return 400 for missing user ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/users//bookings');
      const params = Promise.resolve({ id: '' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User ID is required');
    });

    it('should return empty array for user with no bookings', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user_999/bookings');
      const params = Promise.resolve({ id: 'user_999' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(0);
    });

    it('should handle missing bookings file gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(0);
    });

    it('should include studio information from studios data', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings[0].studio).toEqual({
        id: 'studio_456',
        name: 'Test Studio',
        slug: 'test-studio',
        avatarUrl: 'https://example.com/studio1.jpg'
      });

      expect(data.bookings[1].studio).toEqual({
        id: 'studio_789',
        name: 'Another Studio',
        slug: 'another-studio',
        avatarUrl: null
      });
    });

    it('should sort bookings by date (newest first)', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings[0].date).toBe('2025-07-21'); // Newer date first
      expect(data.bookings[1].date).toBe('2025-07-20');
    });

    it('should handle file read errors gracefully', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(0);
    });

    it('should normalize booking status to confirmed', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user_123/bookings');
      const params = Promise.resolve({ id: 'user_123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      data.bookings.forEach(booking => {
        expect(booking.status).toBe('confirmed');
      });
    });
  });
}); 