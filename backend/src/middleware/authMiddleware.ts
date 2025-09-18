import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from './errorMiddleware';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Interface for JWT payload
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Protect middleware - verify JWT token
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      logger.logAuth('Access denied - No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
      });
      return next(new AppError('Access denied. No token provided.', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.logAuth('Access denied - User not found', {
          userId: decoded.id,
          ip: req.ip,
        });
        return next(new AppError('User not found', 401));
      }

      // Check if user is active
      if (!user.isActive) {
        logger.logAuth('Access denied - User account deactivated', {
          userId: user._id,
          email: user.email,
        });
        return next(new AppError('User account has been deactivated', 401));
      }

      // Check if user account is locked
      if (user.isLocked()) {
        logger.logSecurity('Access denied - Account locked', {
          userId: user._id,
          email: user.email,
          severity: 'medium',
        });
        return next(new AppError('Account is temporarily locked due to multiple failed login attempts', 423));
      }

      // Add user to request object
      req.user = user;

      logger.logAuth('Access granted', {
        userId: user._id,
        email: user.email,
        role: user.role,
        url: req.originalUrl,
      });

      next();
    } catch (jwtError: any) {
      logger.logAuth('Invalid token', {
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', 401));
      } else {
        return next(new AppError('Token verification failed', 401));
      }
    }
  } catch (error) {
    logger.logError(error as Error, {
      middleware: 'protect',
      url: req.originalUrl,
    });
    next(new AppError('Authentication error', 500));
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (user && user.isActive && !user.isLocked()) {
          req.user = user;
        }
      } catch (jwtError) {
        // Silently fail for optional auth
        logger.logAuth('Optional auth failed', {
          error: (jwtError as Error).message,
          ip: req.ip,
        });
      }
    }

    next();
  } catch (error) {
    logger.logError(error as Error, {
      middleware: 'optionalAuth',
      url: req.originalUrl,
    });
    next();
  }
};

// Authorize middleware - check user roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.logAuth('Authorization failed - No user in request', {
        url: req.originalUrl,
        requiredRoles: roles,
      });
      return next(new AppError('Access denied. Please log in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.logAuth('Authorization failed - Insufficient permissions', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
      });
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Restrict access to specific roles (alias for authorize)
export const restrictTo = authorize;

// Check if user owns resource
export const checkOwnership = (resourceField: string = 'user') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Access denied. Please log in.', 401));
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource ID from params or body
    const resourceId = req.params.id || req.body[resourceField];
    const userId = req.user._id.toString();

    if (resourceId !== userId) {
      logger.logSecurity('Ownership check failed', {
        userId: req.user._id,
        resourceId,
        resourceField,
        url: req.originalUrl,
        severity: 'medium',
      });
      return next(new AppError('Access denied. You can only access your own resources.', 403));
    }

    next();
  };
};

// Verify email middleware
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Access denied. Please log in.', 401));
  }

  if (!req.user.isEmailVerified) {
    logger.logAuth('Email verification required', {
      userId: req.user._id,
      email: req.user.email,
    });
    return next(new AppError('Please verify your email address to continue.', 403));
  }

  next();
};

// Rate limiting by user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      logger.logSecurity('User rate limit exceeded', {
        userId: req.user._id,
        requestCount: userRequests.count,
        maxRequests,
        severity: 'medium',
      });
      return next(new AppError('Too many requests. Please try again later.', 429));
    }

    userRequests.count++;
    next();
  };
};

// Check if user can perform action on campaign
export const checkCampaignAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Access denied. Please log in.', 401));
    }

    // Admin can access any campaign
    if (req.user.role === 'admin') {
      return next();
    }

    const campaignId = req.params.id || req.params.campaignId;
    
    if (!campaignId) {
      return next(new AppError('Campaign ID is required', 400));
    }

    // Import Campaign model dynamically to avoid circular dependency
    const { Campaign } = await import('../models/Campaign');
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check if user is the organizer
    if (campaign.organizer.toString() !== req.user._id.toString()) {
      logger.logSecurity('Campaign access denied', {
        userId: req.user._id,
        campaignId,
        organizerId: campaign.organizer,
        severity: 'medium',
      });
      return next(new AppError('Access denied. You can only manage your own campaigns.', 403));
    }

    next();
  } catch (error) {
    logger.logError(error as Error, {
      middleware: 'checkCampaignAccess',
      userId: req.user?._id,
    });
    next(new AppError('Error checking campaign access', 500));
  }
};

// Middleware to log user activity
export const logUserActivity = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      logger.logBusiness(`User ${action}`, {
        userId: req.user._id,
        email: req.user.email,
        action,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    next();
  };
};

export default {
  protect,
  optionalAuth,
  authorize,
  restrictTo,
  checkOwnership,
  requireEmailVerification,
  userRateLimit,
  checkCampaignAccess,
  logUserActivity,
};