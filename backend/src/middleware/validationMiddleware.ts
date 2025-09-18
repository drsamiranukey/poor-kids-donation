import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { AppError } from './errorMiddleware';
import { logger } from '../utils/logger';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    
    // Log validation errors for debugging
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: validationErrors,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Format errors for consistent response
    const formattedErrors = validationErrors.map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
      location: (error as any).location || 'body',
    }));

    // Create error message
    const errorMessage = formattedErrors.length === 1 
      ? formattedErrors[0].message 
      : 'Validation failed';

    const error = new AppError(errorMessage, 400);
    error.isOperational = true;
    error.errors = formattedErrors;

    return next(error);
  }

  next();
};

/**
 * Custom validation helper functions
 */
export const customValidators = {
  /**
   * Check if password meets security requirements
   */
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (date: Date): boolean => {
    return date > new Date();
  },

  /**
   * Check if date is within allowed range
   */
  isDateInRange: (date: Date, minDays: number = 1, maxDays: number = 365): boolean => {
    const now = new Date();
    const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
    
    return date >= minDate && date <= maxDate;
  },

  /**
   * Check if amount is within allowed range
   */
  isValidAmount: (amount: number, min: number = 5, max: number = 50000): boolean => {
    return amount >= min && amount <= max && Number.isFinite(amount);
  },

  /**
   * Check if string contains only allowed characters
   */
  isSafeString: (str: string): boolean => {
    // Allow alphanumeric, spaces, and common punctuation
    const safePattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
    return safePattern.test(str);
  },

  /**
   * Check if URL is valid and safe
   */
  isSafeUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Check if file type is allowed
   */
  isAllowedFileType: (mimetype: string, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean => {
    return allowedTypes.includes(mimetype);
  },

  /**
   * Check if file size is within limit
   */
  isValidFileSize: (size: number, maxSizeMB: number = 5): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  },
};

/**
 * Sanitization helper functions
 */
export const sanitizers = {
  /**
   * Remove HTML tags and dangerous characters
   */
  sanitizeHtml: (str: string): string => {
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove remaining angle brackets
      .trim();
  },

  /**
   * Normalize and clean text input
   */
  cleanText: (str: string): string => {
    return str
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s.,!?'"()-]/g, ''); // Remove special characters except common punctuation
  },

  /**
   * Format phone number
   */
  formatPhoneNumber: (phone: string): string => {
    return phone.replace(/\D/g, ''); // Remove all non-digit characters
  },

  /**
   * Normalize email address
   */
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const rateLimitInfo = req.rateLimit;
  
  if (rateLimitInfo && rateLimitInfo.remaining === 0) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      resetTime: new Date(rateLimitInfo.resetTime),
    });
  }
  
  next();
};

export default {
  validateRequest,
  customValidators,
  sanitizers,
  validateRateLimit,
};