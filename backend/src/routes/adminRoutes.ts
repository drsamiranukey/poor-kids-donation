import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param, query } from 'express-validator';
import { User } from '../models/User';
import { Campaign } from '../models/Campaign';
import { Donation } from '../models/Donation';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

const router = express.Router();

// All routes are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const [userStats, campaignStats, donationStats, recentActivity] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            verifiedUsers: { $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] } },
            newUsersThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),

      // Campaign statistics
      Campaign.aggregate([
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            activeCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completedCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalGoalAmount: { $sum: '$goalAmount' },
            totalRaisedAmount: { $sum: '$currentAmount' },
            averageGoal: { $avg: '$goalAmount' },
          }
        }
      ]),

      // Donation statistics
      Donation.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageDonation: { $avg: '$amount' },
            donationsThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  1,
                  0
                ]
              }
            },
            amountThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),

      // Recent activity
      Promise.all([
        User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
        Campaign.find().sort({ createdAt: -1 }).limit(5).populate('organizer', 'firstName lastName').select('title goalAmount createdAt organizer'),
        Donation.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(5).populate('donor', 'firstName lastName').populate('campaign', 'title').select('amount createdAt donor campaign')
      ])
    ]);

    const dashboardData = {
      users: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        newUsersThisMonth: 0
      },
      campaigns: campaignStats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        totalGoalAmount: 0,
        totalRaisedAmount: 0,
        averageGoal: 0
      },
      donations: donationStats[0] || {
        totalDonations: 0,
        totalAmount: 0,
        averageDonation: 0,
        donationsThisMonth: 0,
        amountThisMonth: 0
      },
      recentActivity: {
        newUsers: recentActivity[0],
        newCampaigns: recentActivity[1],
        recentDonations: recentActivity[2]
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: dashboardData,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'adminRoutes.getDashboard' });
    next(error);
  }
});

// User management
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }

    if (req.query.verified !== undefined) {
      filter.emailVerified = req.query.verified === 'true';
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
    logger.logError(error as Error, { route: 'adminRoutes.getUsers' });
    next(error);
  }
});

// Update user status
router.patch('/users/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      logger.logBusiness('User status updated by admin', {
        userId: user._id,
        adminId: req.user?._id,
        newStatus: isActive,
      });

      res.status(200).json({
        status: 'success',
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.updateUserStatus' });
      next(error);
    }
  }
);

// Update user role
router.patch('/users/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { role } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      logger.logBusiness('User role updated by admin', {
        userId: user._id,
        adminId: req.user?._id,
        newRole: role,
      });

      res.status(200).json({
        status: 'success',
        message: `User role updated to ${role} successfully`,
        data: {
          user,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.updateUserRole' });
      next(error);
    }
  }
);

// Campaign management
router.get('/campaigns', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === 'true';
    }

    const campaigns = await Campaign.find(filter)
      .populate('organizer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'adminRoutes.getCampaigns' });
    next(error);
  }
});

// Update campaign status
router.patch('/campaigns/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid campaign ID'),
    body('status').isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { status } = req.body;

      const campaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate('organizer', 'firstName lastName');

      if (!campaign) {
        return next(new AppError('Campaign not found', 404));
      }

      logger.logBusiness('Campaign status updated by admin', {
        campaignId: campaign._id,
        adminId: req.user?._id,
        newStatus: status,
      });

      res.status(200).json({
        status: 'success',
        message: `Campaign status updated to ${status} successfully`,
        data: {
          campaign,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.updateCampaignStatus' });
      next(error);
    }
  }
);

// Toggle campaign active status
router.patch('/campaigns/:id/toggle',
  [
    param('id').isMongoId().withMessage('Invalid campaign ID'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return next(new AppError('Campaign not found', 404));
      }

      campaign.isActive = !campaign.isActive;
      await campaign.save();

      logger.logBusiness('Campaign active status toggled by admin', {
        campaignId: campaign._id,
        adminId: req.user?._id,
        newStatus: campaign.isActive,
      });

      res.status(200).json({
        status: 'success',
        message: `Campaign ${campaign.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          campaign,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.toggleCampaign' });
      next(error);
    }
  }
);

// Donation management
router.get('/donations', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount) {
        filter.amount.$gte = parseFloat(req.query.minAmount as string);
      }
      if (req.query.maxAmount) {
        filter.amount.$lte = parseFloat(req.query.maxAmount as string);
      }
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'firstName lastName email')
      .populate('campaign', 'title organizer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'adminRoutes.getDonations' });
    next(error);
  }
});

// System logs
router.get('/logs',
  [
    query('level').optional().isIn(['error', 'warn', 'info', 'debug']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // TODO: Implement log retrieval from logging system
      // This would depend on the logging implementation (file-based, database, etc.)
      
      const logs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'User logged in',
          meta: { userId: '123', ip: '192.168.1.1' }
        }
      ];

      res.status(200).json({
        status: 'success',
        data: {
          logs,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.getLogs' });
      next(error);
    }
  }
);

// System settings
router.get('/settings', async (req, res, next) => {
  try {
    // TODO: Implement system settings retrieval
    const settings = {
      siteName: 'Poor Kids Donation',
      maintenanceMode: false,
      registrationEnabled: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
      emailSettings: {
        smtpEnabled: true,
        fromEmail: 'noreply@poorkidsdonation.com',
      },
      paymentSettings: {
        stripeEnabled: true,
        paypalEnabled: false,
        minimumDonation: 1,
        maximumDonation: 10000,
      },
    };

    res.status(200).json({
      status: 'success',
      data: {
        settings,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'adminRoutes.getSettings' });
    next(error);
  }
});

// Update system settings
router.patch('/settings',
  [
    body('siteName').optional().isString().isLength({ min: 1, max: 100 }),
    body('maintenanceMode').optional().isBoolean(),
    body('registrationEnabled').optional().isBoolean(),
    body('maxFileSize').optional().isInt({ min: 1024, max: 100 * 1024 * 1024 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // TODO: Implement system settings update
      const updatedSettings = req.body;

      logger.logBusiness('System settings updated', {
        adminId: req.user?._id,
        updatedFields: Object.keys(updatedSettings),
      });

      res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: {
          settings: updatedSettings,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.updateSettings' });
      next(error);
    }
  }
);

// Export data
router.get('/export/:type',
  [
    param('type').isIn(['users', 'campaigns', 'donations']).withMessage('Invalid export type'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { type } = req.params;
      const format = req.query.format || 'csv';

      // TODO: Implement data export functionality
      // This would generate CSV/JSON exports of the requested data

      logger.logBusiness('Data export requested', {
        adminId: req.user?._id,
        type,
        format,
      });

      res.status(200).json({
        status: 'success',
        message: `${type} export will be generated and sent to your email`,
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'adminRoutes.exportData' });
      next(error);
    }
  }
);

// System health check
router.get('/health', async (req, res, next) => {
  try {
    // TODO: Implement comprehensive health checks
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'connected',
        redis: 'connected',
        email: 'operational',
        storage: 'operational',
        payment: 'operational',
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    res.status(200).json({
      status: 'success',
      data: {
        health,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { route: 'adminRoutes.getHealth' });
    next(error);
  }
});

export default router;