import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Generate JWT token
const generateToken = (userId: number, email: string, userType: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new AppError('JWT secret not configured', 500);
  }

  return jwt.sign(
    { id: userId, email, userType },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// POST /api/auth/signup
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    password,
    confirmPassword,
    userType,
    firstName,
    lastName,
    studioName,
    phone
  } = req.body;

  // Validation
  if (!email || !password || !userType) {
    throw new AppError('Email, password, and user type are required', 400);
  }

  if (!['rapper', 'studio'].includes(userType)) {
    throw new AppError('User type must be either rapper or studio', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await pool.query(`
    INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, user_type, first_name, last_name, phone, created_at
  `, [
    email.toLowerCase(),
    passwordHash,
    userType,
    firstName || null,
    lastName || null,
    phone || null
  ]);

  const user = result.rows[0];

  // If user is a studio, create studio profile
  if (userType === 'studio') {
    await pool.query(`
      INSERT INTO studios (user_id, name, email, phone)
      VALUES ($1, $2, $3, $4)
    `, [user.id, studioName || `${firstName} ${lastName} Studio`, email, phone]);
  }

  // Generate token
  const token = generateToken(user.id, user.email, user.user_type);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        createdAt: user.created_at
      },
      token
    }
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, userType } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  if (!userType || !['rapper', 'studio'].includes(userType)) {
    throw new AppError('Valid user type is required', 400);
  }

  // Find user
  const result = await pool.query(`
    SELECT id, email, password_hash, user_type, first_name, last_name, phone, is_verified
    FROM users 
    WHERE email = $1 AND user_type = $2
  `, [email.toLowerCase(), userType]);

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user.id, user.email, user.user_type);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isVerified: user.is_verified
      },
      token
    }
  });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  // Get additional user data
  const result = await pool.query(`
    SELECT u.*, s.id as studio_id, s.name as studio_name
    FROM users u
    LEFT JOIN studios s ON u.id = s.user_id
    WHERE u.id = $1
  `, [user.id]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const userData = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: userData.id,
        email: userData.email,
        userType: userData.user_type,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        isVerified: userData.is_verified,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
        ...(userData.user_type === 'studio' && {
          studioId: userData.studio_id,
          studioName: userData.studio_name
        })
      }
    }
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Since we're using stateless JWT, we just return success
  // In a production app, you might want to implement token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// POST /api/auth/refresh
router.post('/refresh', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Generate new token
  const token = generateToken(user.id, user.email, user.userType);

  res.json({
    success: true,
    data: { token }
  });
}));

export default router; 