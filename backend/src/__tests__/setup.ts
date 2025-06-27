import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database connection pool
export const testPool = new Pool({
  user: process.env.TEST_DB_USER || 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  database: process.env.TEST_DB_NAME || 'hitconnector_test',
  password: process.env.TEST_DB_PASSWORD || 'password',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database setup
export async function setupTestDatabase(): Promise<void> {
  // Create test tables
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('rapper', 'studio')),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      is_verified BOOLEAN DEFAULT false,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS studios (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      phone VARCHAR(20),
      email VARCHAR(255),
      website TEXT,
      amenities TEXT[],
      hourly_rate_min DECIMAL(10, 2),
      hourly_rate_max DECIMAL(10, 2),
      rating DECIMAL(3, 2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      image_urls TEXT[],
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS studio_rooms (
      id SERIAL PRIMARY KEY,
      studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hourly_rate DECIMAL(10, 2) NOT NULL,
      capacity INTEGER,
      equipment TEXT[],
      image_urls TEXT[],
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
      room_id INTEGER REFERENCES studio_rooms(id) ON DELETE CASCADE,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      total_hours DECIMAL(4, 2) NOT NULL,
      hourly_rate DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      special_requests TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Clean test database
export async function cleanTestDatabase(): Promise<void> {
  await testPool.query('TRUNCATE TABLE reviews, bookings, studio_rooms, studios, users RESTART IDENTITY CASCADE');
}

// Close test database connection
export async function closeTestDatabase(): Promise<void> {
  await testPool.end();
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean database before each test
beforeEach(async () => {
  await cleanTestDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await closeTestDatabase();
}); 