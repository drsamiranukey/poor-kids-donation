import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: any[];
}

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
    const message = 'Validation Error';
    error = new AppError(message, 400);
    error.errors = errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    const message = err.message || 'Payment processing error';
    error = new AppError(message, 400);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new AppError(message, 429);
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    const message = 'CORS policy violation';
    error = new AppError(message, 403);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  const errorResponse: ErrorResponse = {
    status,
    message: error.message || 'Internal Server Error',
  };

  // Add validation errors if present
  if (error.errors) {
    errorResponse.errors = error.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Log critical errors
  if (statusCode >= 500) {
    logger.error('Critical Error:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
export const handleValidationError = (errors: any[]) => {
  const formattedErrors = errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value,
  }));

  return new AppError('Validation failed', 400);
};

// Database error handler
export const handleDBError = (error: any) => {
  logger.logDB('Error', 'unknown', { error: error.message });
  
  if (error.name === 'MongoNetworkError') {
    return new AppError('Database connection failed', 503);
  }
  
  if (error.name === 'MongoTimeoutError') {
    return new AppError('Database operation timed out', 504);
  }
  
  return new AppError('Database error occurred', 500);
};

// Payment error handler
export const handlePaymentError = (error: any) => {
  logger.logPayment('Error', { error: error.message });
  
  if (error.type === 'StripeCardError') {
    return new AppError(error.message, 400);
  }
  
  if (error.type === 'StripeInvalidRequestError') {
    return new AppError('Invalid payment request', 400);
  }
  
  if (error.type === 'StripeAPIError') {
    return new AppError('Payment service unavailable', 503);
  }
  
  return new AppError('Payment processing failed', 500);
};

// Authentication error handler
export const handleAuthError = (message: string, statusCode: number = 401) => {
  logger.logAuth('Error', { message });
  return new AppError(message, statusCode);
};

// Authorization error handler
export const handleAuthorizationError = (message: string = 'Access denied') => {
  logger.logSecurity('Authorization Failed', { message });
  return new AppError(message, 403);
};

// File upload error handler
export const handleUploadError = (error: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size too large', 400);
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400);
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }
  
  return new AppError('File upload failed', 500);
};

// Rate limit error handler
export const handleRateLimitError = () => {
  logger.logSecurity('Rate Limit Exceeded', { severity: 'medium' });
  return new AppError('Too many requests, please try again later', 429);
};

// Export error types for TypeScript
export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  errors?: any[];
}

export default {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  handleValidationError,
  handleDBError,
  handlePaymentError,
  handleAuthError,
  handleAuthorizationError,
  handleUploadError,
  handleRateLimitError,
};