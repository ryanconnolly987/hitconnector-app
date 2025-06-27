import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // PostgreSQL errors
  if (error.name === 'DatabaseError') {
    statusCode = 500;
    message = 'Database error';
  }

  // Duplicate entry error (PostgreSQL unique constraint)
  if (error.message && error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Log error for debugging
  if (statusCode >= 500) {
    console.error('Internal Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('Client Error:', {
      message: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
}; 