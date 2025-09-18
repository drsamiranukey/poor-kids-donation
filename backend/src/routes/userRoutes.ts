import express, { Request, Response, NextFunction } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param } from 'express-validator';
import { User } from '../models/User';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

const router = express.Router();

// Get current user profile
router.get('/profile', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'userRoutes.getProfile' });
    next(error);
  }
});

// Update current user profile
router.patch('/profile', 
  protect,
  [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('bio').optional().isLength({ max: 500 }),
    body('dateOfBirth').optional().isISO8601(),
    body('address.street').optional().trim().isLength({ max: 100 }),
    body('address.city').optional().trim().isLength({ max: 50 }),
    body('address.state').optional().trim().isLength({ max: 50 }),
    body('address.country').optional().trim().isLength({ max: 50 }),
    body('address.zipCode').optional().trim().isLength({ max: 20 }),
    body('preferences.emailNotifications').optional().isBoolean(),
    body('preferences.smsNotifications').optional().isBoolean(),
    body('preferences.marketingEmails').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allowedFields = [
        'firstName', 'lastName', 'phone', 'bio', 'dateOfBirth', 
        'address', 'preferences', 'socialLinks'
      ];
      
      const updateData: any = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      // Handle email update separately (requires verification)
      if (req.body.email && req.body.email !== req.user?.email) {
        updateData.newEmail = req.body.email;
        updateData.emailVerified = false;
        // TODO: Send email verification
      }

      const user = await User.findByIdAndUpdate(
        req.user?._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      logger.logBusiness('User profile updated', {
        userId: req.user?._id,
        updatedFields: Object.keys(updateData),
      });

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.updateProfile' });
      next(error);
    }
  }
);

// Change password
router.patch('/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user?._id).select('+password');
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check current password
      const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordCorrect) {
        return next(new AppError('Current password is incorrect', 400));
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.logSecurity('Password changed', {
        userId: user._id,
        email: user.email,
      });

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.changePassword' });
      next(error);
    }
  }
);

// Delete account
router.delete('/account',
  protect,
  [
    body('password').notEmpty().withMessage('Password is required to delete account'),
    body('confirmDelete').equals('DELETE').withMessage('Please type DELETE to confirm'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body;

      const user = await User.findById(req.user?._id).select('+password');
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Verify password
      const isPasswordCorrect = await user.matchPassword(password);
      if (!isPasswordCorrect) {
        return next(new AppError('Password is incorrect', 400));
      }

      // Soft delete - mark as inactive
      user.isActive = false;
      // user.deletedAt = new Date(); // TODO: Add deletedAt field to User model
      await user.save();

      logger.logSecurity('User account deleted', {
        userId: user._id,
        email: user.email,
      });

      res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully',
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.deleteAccount' });
      next(error);
    }
  }
);

// Get user statistics
router.get('/stats', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    // Get user with populated data
    const user = await User.findById(userId)
      .select('totalDonated donationCount createdAt')
      .lean();

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get additional stats from related collections
    const [campaignStats, donationStats] = await Promise.all([
      // Campaign stats
      req.app.locals.db.collection('campaigns').aggregate([
        { $match: { organizer: userId } },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            activeCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalRaised: { $sum: '$currentAmount' },
            totalGoal: { $sum: '$goalAmount' },
          }
        }
      ]).toArray(),
      
      // Recent donation activity
      req.app.locals.db.collection('donations').find({
        donor: userId,
        status: 'completed'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    ]);

    const stats = {
      user: {
        memberSince: user.createdAt,
        totalDonated: user.totalDonated || 0,
        donationCount: user.donationCount || 0,
      },
      campaigns: campaignStats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRaised: 0,
        totalGoal: 0,
      },
      recentDonations: donationStats,
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'userRoutes.getStats' });
    next(error);
  }
});

// Get all users (admin only)
router.get('/',
  protect,
  restrictTo('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter: any = {};
      
      // Add search filter
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ];
      }

      // Add role filter
      if (req.query.role) {
        filter.role = req.query.role;
      }

      // Add status filter
      if (req.query.status) {
        filter.isActive = req.query.status === 'active';
      }

      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.status(200).json({
        status: 'success',
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.getUsers' });
      next(error);
    }
  }
);

// Get single user (admin only)
router.get('/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.getUser' });
      next(error);
    }
  }
);

// Update user (admin only)
router.patch('/:id',
  protect,
  restrictTo('admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['user', 'admin']),
    body('isActive').optional().isBoolean(),
    body('emailVerified').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allowedFields = ['role', 'isActive', 'emailVerified'];
      const updateData: any = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      logger.logBusiness('User updated by admin', {
        userId: user._id,
        adminId: req.user?._id,
        updatedFields: Object.keys(updateData),
      });

      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.updateUser' });
      next(error);
    }
  }
);

// Upload avatar
router.post('/avatar',
  protect,
  // TODO: Add multer middleware for file upload
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This would be implemented with multer and cloudinary
      res.status(501).json({
        status: 'error',
        message: 'Avatar upload not implemented yet',
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'userRoutes.uploadAvatar' });
      next(error);
    }
  }
);

export default router;