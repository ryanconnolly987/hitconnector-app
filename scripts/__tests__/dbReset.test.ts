import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const STUDIOS_FILE = path.join(DATA_DIR, 'studios.json');

describe('Database Reset Script', () => {
  beforeAll(() => {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  });

  test('should wipe all user-generated data', () => {
    // Create dummy data
    const dummyBookings = {
      bookings: [
        {
          id: 'test-booking-123',
          userId: 'test-user-456',
          studioId: 'test-studio-789',
          date: '2025-01-20',
          startTime: '10:00',
          endTime: '12:00',
          status: 'CONFIRMED'
        }
      ]
    };

    const dummyStudios = {
      studios: [
        {
          id: 'test-studio-789',
          name: 'Test Studio',
          description: 'A test recording studio'
        }
      ]
    };

    // Write dummy data to files
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(dummyBookings, null, 2));
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(dummyStudios, null, 2));

    // Verify dummy data exists
    const bookingsBeforeReset = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
    const studiosBeforeReset = JSON.parse(fs.readFileSync(STUDIOS_FILE, 'utf8'));
    
    expect(bookingsBeforeReset.bookings).toHaveLength(1);
    expect(studiosBeforeReset.studios).toHaveLength(1);

    // Run the reset script
    try {
      execSync('npm run db:reset', { stdio: 'pipe' });
    } catch (error) {
      console.error('Reset script failed:', error);
      throw error;
    }

    // Verify data is wiped
    const bookingsAfterReset = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
    const studiosAfterReset = JSON.parse(fs.readFileSync(STUDIOS_FILE, 'utf8'));
    
    expect(bookingsAfterReset.bookings).toHaveLength(0);
    expect(studiosAfterReset.studios).toHaveLength(0);
  });

  test('should preserve file structure', () => {
    // Run the reset script
    execSync('npm run db:reset', { stdio: 'pipe' });

    // Check that all expected files exist with correct structure
    const expectedFiles = [
      'bookings.json',
      'booking-requests.json', 
      'messages.json',
      'users.json',
      'user-profiles.json',
      'studios.json',
      'rappers.json',
      'follows.json',
      'open-calls.json'
    ];

    expectedFiles.forEach(filename => {
      const filePath = path.join(DATA_DIR, filename);
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Verify file is valid JSON
      const content = fs.readFileSync(filePath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
}); 