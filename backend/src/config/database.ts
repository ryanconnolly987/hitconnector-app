import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hitconnector',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database initialization
export async function initDatabase(): Promise<void> {
  try {
    // Test the connection
    const client = await pool.connect();
    console.log('Database connection established');
    client.release();

    // Create tables if they don't exist
    await createTables();
    console.log('Database tables ensured');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create all necessary tables
async function createTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table (for both rappers and studios)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('rapper', 'studio')),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        is_verified BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Studios table
    await client.query(`
      CREATE TABLE IF NOT EXISTS studios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
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
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Studio rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS studio_rooms (
        id SERIAL PRIMARY KEY,
        studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        hourly_rate DECIMAL(10, 2) NOT NULL,
        capacity INTEGER,
        equipment TEXT[],
        image_urls TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Bookings table
    await client.query(`
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
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        special_requests TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(200),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Studio availability table
    await client.query(`
      CREATE TABLE IF NOT EXISTS studio_availability (
        id SERIAL PRIMARY KEY,
        studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES studio_rooms(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_studios_city ON studios(city);
      CREATE INDEX IF NOT EXISTS idx_studios_rating ON studios(rating);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_reviews_studio ON reviews(studio_id);
    `);

    await client.query('COMMIT');
    console.log('All tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
} 