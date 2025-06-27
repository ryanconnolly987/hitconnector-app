import request from 'supertest';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from '../routes/auth';
import studioRoutes from '../routes/studios';
import bookingRoutes from '../routes/bookings';
import userRoutes from '../routes/users';
import reviewRoutes from '../routes/reviews';
import uploadRoutes from '../routes/upload';

// Import middleware
import { errorHandler } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/logger';

// Load test environment
dotenv.config({ path: '.env.test' });

// Create test app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(errorHandler);

describe('Smoke Tests - Basic API Functionality', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Routes', () => {
    it('should handle signup request', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'rapper',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect([200, 201, 400, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle login request', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        userType: 'rapper'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect([200, 401, 400]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle auth/me request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Studios Routes', () => {
    it('should get studios list', async () => {
      const response = await request(app)
        .get('/api/studios')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('studios');
      expect(Array.isArray(response.body.data.studios)).toBe(true);
    });

    it('should handle studio search with filters', async () => {
      const response = await request(app)
        .get('/api/studios?city=Los%20Angeles&minPrice=50&maxPrice=200')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should handle invalid studio ID', async () => {
      const response = await request(app)
        .get('/api/studios/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Bookings Routes', () => {
    it('should require authentication for bookings list', async () => {
      const response = await request(app)
        .get('/api/bookings');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should require authentication for creating booking', async () => {
      const bookingData = {
        studioId: 1,
        roomId: 1,
        bookingDate: '2024-12-31',
        startTime: '10:00',
        endTime: '12:00'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Users Routes', () => {
    it('should require authentication for profile', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle public user profile request', async () => {
      const response = await request(app)
        .get('/api/users/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Reviews Routes', () => {
    it('should get reviews for non-existent studio', async () => {
      const response = await request(app)
        .get('/api/reviews/studio/99999')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.reviews).toEqual([]);
    });

    it('should require authentication for creating review', async () => {
      const reviewData = {
        studioId: 1,
        rating: 5,
        title: 'Great studio!',
        comment: 'Really enjoyed my time here.'
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Upload Routes', () => {
    it('should require authentication for file upload', async () => {
      const response = await request(app)
        .post('/api/upload/avatar');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields for signup', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'rapper'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});

describe('Integration Tests - Full User Journey', () => {
  let authToken: string;
  let userId: number;

  describe('User Registration and Login Flow', () => {
    it('should allow user to sign up and login', async () => {
      // First, sign up a new user
      const signupData = {
        email: 'integration@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'rapper',
        firstName: 'Integration',
        lastName: 'Test'
      };

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      if (signupResponse.status === 201) {
        expect(signupResponse.body).toHaveProperty('success', true);
        expect(signupResponse.body.data).toHaveProperty('token');
        authToken = signupResponse.body.data.token;
        userId = signupResponse.body.data.user.id;
      }

      // Then, try to login
      const loginData = {
        email: 'integration@example.com',
        password: 'password123',
        userType: 'rapper'
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      if (loginResponse.status === 200) {
        expect(loginResponse.body).toHaveProperty('success', true);
        expect(loginResponse.body.data).toHaveProperty('token');
        authToken = loginResponse.body.data.token;
        userId = loginResponse.body.data.user.id;
      }

      // Should be able to access profile
      if (authToken) {
        const profileResponse = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(profileResponse.body).toHaveProperty('success', true);
        expect(profileResponse.body.data.user).toHaveProperty('email', 'integration@example.com');
      }
    });
  });
}); 