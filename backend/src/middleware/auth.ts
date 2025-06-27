import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    userType: 'rapper' | 'studio';
    firstName?: string;
    lastName?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user from database to ensure they still exist
    const result = await pool.query(
      'SELECT id, email, user_type, first_name, last_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid token. User not found.', 401);
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user from database to ensure they still exist
    const result = await pool.query(
      'SELECT id, email, user_type, first_name, last_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Require rapper user type
export const requireRapper = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.userType !== 'rapper') {
    throw new AppError('Rapper access required', 403);
  }

  next();
};

// Require studio user type
export const requireStudio = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.userType !== 'studio') {
    throw new AppError('Studio access required', 403);
  }

  next();
}; 