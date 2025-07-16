import fs from 'fs';
import path from 'path';
import { resetStudioBookings } from '../resetBookings';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

describe('Reset Bookings Test', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    // Set development environment
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(BOOKINGS_FILE)) {
      fs.unlinkSync(BOOKINGS_FILE);
    }
    
    // Clean up backup files
    const backupFiles = fs.readdirSync(DATA_DIR).filter(file => 
      file.startsWith('bookings.json.backup.')
    );
    backupFiles.forEach(file => {
      fs.unlinkSync(path.join(DATA_DIR, file));
    });
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('should remove confirmed and pending bookings', () => {
    // Create test bookings data
    const testBookings = {
      bookings: [
        {
          id: 'booking_confirmed_123',
          studioId: 'studio_456',
          status: 'CONFIRMED',
          userName: 'Test Artist',
          date: '2025-01-20'
        },
        {
          id: 'booking_pending_124',
          studioId: 'studio_456', 
          status: 'PENDING',
          userName: 'Test Artist 2',
          date: '2025-01-21'
        },
        {
          id: 'booking_completed_125',
          studioId: 'studio_456',
          status: 'COMPLETED',
          userName: 'Test Artist 3',
          date: '2025-01-19'
        },
        {
          id: 'booking_cancelled_126',
          studioId: 'studio_456',
          status: 'cancelled',
          userName: 'Test Artist 4', 
          date: '2025-01-18'
        }
      ]
    };

    // Write test data
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(testBookings, null, 2));

    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Run the reset function
    resetStudioBookings();

    // Read the updated data
    const updatedData = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));

    // Verify results
    expect(updatedData.bookings).toHaveLength(2);
    expect(updatedData.bookings.map((b: any) => b.id)).toEqual([
      'booking_completed_125',
      'booking_cancelled_126'
    ]);

    // Verify console output
    expect(consoleSpy).toHaveBeenCalledWith('📋 Found 4 total bookings');
    expect(consoleSpy).toHaveBeenCalledWith('🎯 Found 2 bookings to remove (confirmed/pending status)');
    expect(consoleSpy).toHaveBeenCalledWith('✅ Successfully reset bookings:');

    // Verify backup was created
    const backupFiles = fs.readdirSync(DATA_DIR).filter(file => 
      file.startsWith('bookings.json.backup.')
    );
    expect(backupFiles).toHaveLength(1);

    consoleSpy.mockRestore();
  });

  test('should handle case with no confirmed/pending bookings', () => {
    // Create test bookings with only completed/cancelled
    const testBookings = {
      bookings: [
        {
          id: 'booking_completed_123',
          studioId: 'studio_456',
          status: 'COMPLETED',
          userName: 'Test Artist'
        },
        {
          id: 'booking_cancelled_124',
          studioId: 'studio_456',
          status: 'cancelled',
          userName: 'Test Artist 2'
        }
      ]
    };

    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(testBookings, null, 2));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    resetStudioBookings();

    // Verify no changes were made
    const updatedData = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
    expect(updatedData.bookings).toHaveLength(2);

    expect(consoleSpy).toHaveBeenCalledWith('✅ No confirmed or pending bookings found, nothing to reset');

    consoleSpy.mockRestore();
  });

  test('should handle missing bookings file', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    resetStudioBookings();

    expect(consoleSpy).toHaveBeenCalledWith('ℹ️ No bookings file found, nothing to reset');

    consoleSpy.mockRestore();
  });

  test('should prevent running in production environment', () => {
    process.env.NODE_ENV = 'production';

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    resetStudioBookings();

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Reset bookings script cannot run in production environment');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
}); 