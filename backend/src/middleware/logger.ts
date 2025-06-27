import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Skip logging for health check endpoint
  if (req.path === '/health') {
    return next();
  }

  console.log(`[${timestamp}] ${req.method} ${req.path} - Start`);

  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '[REDACTED]';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '[REDACTED]';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[REDACTED]';
    
    console.log(`[${timestamp}] Request body:`, sanitizedBody);
  }

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const duration = Date.now() - start;
    const endTimestamp = new Date().toISOString();
    
    console.log(`[${endTimestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.warn(`[${endTimestamp}] Error response for ${req.method} ${req.path}:`, {
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }

    return originalEnd(chunk, encoding as BufferEncoding, cb);
  };

  next();
}; 