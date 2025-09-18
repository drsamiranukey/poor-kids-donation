import { Request, Response, NextFunction } from 'express';
import { Donation } from '../models/Donation';
import { Campaign } from '../models/Campaign';
import { User } from '../models/User';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

// Get all donations
export const getDonations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Add campaign filter
    if (req.query.campaign) {
      filter.campaign = req.query.campaign;
    }

    // Add donor filter
    if (req.query.donor) {
      filter.donor = req.query.donor;
    }

    // Add status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'firstName lastName avatar email')
      .populate('campaign', 'title goalAmount currentAmount organizer')
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
    logger.logError(error as Error, { controller: 'donationController.getDonations' });
    next(error);
  }
};

// Get single donation
export const getDonation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'firstName lastName avatar email')
      .populate('campaign', 'title goalAmount currentAmount organizer');

    if (!donation) {
      return next(new AppError('Donation not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        donation,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.getDonation' });
    next(error);
  }
};

// Create donation
export const createDonation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId, amount, isAnonymous, message, paymentMethod } = req.body;

    // Validate campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    if (!campaign.isActive || campaign.status !== 'active') {
      return next(new AppError('Campaign is not accepting donations', 400));
    }

    // Create donation
    const donationData: any = {
      campaign: campaignId,
      amount,
      isAnonymous: isAnonymous || false,
      message: message || '',
      paymentMethod: paymentMethod || 'stripe',
      status: 'pending',
    };

    // Add donor if user is authenticated
    if (req.user) {
      donationData.donor = req.user._id;
    }

    const donation = await Donation.create(donationData);
    await donation.populate('donor', 'firstName lastName avatar');
    await donation.populate('campaign', 'title organizer');

    logger.logBusiness('Donation created', {
      donationId: donation._id,
      campaignId,
      amount,
      donorId: req.user?._id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Donation created successfully',
      data: {
        donation,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.createDonation' });
    next(error);
  }
};

// Update donation status (for payment processing)
export const updateDonationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, paymentIntentId, transactionId } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return next(new AppError('Donation not found', 404));
    }

    // Update donation
    donation.status = status;
    if (paymentIntentId) donation.paymentIntentId = paymentIntentId;
    if (transactionId) donation.transactionId = transactionId;

    if (status === 'completed') {
      donation.completedAt = new Date();
      
      // Update campaign amount
      await Campaign.findByIdAndUpdate(
        donation.campaign,
        { $inc: { currentAmount: donation.amount } }
      );

      // Update user donation stats if donor exists
      if (donation.donor) {
        await User.findByIdAndUpdate(
          donation.donor,
          { 
            $inc: { 
              totalDonated: donation.amount,
              donationCount: 1 
            }
          }
        );
      }
    }

    await donation.save();

    logger.logBusiness('Donation status updated', {
      donationId: donation._id,
      newStatus: status,
      amount: donation.amount,
    });

    res.status(200).json({
      status: 'success',
      message: 'Donation status updated successfully',
      data: {
        donation,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.updateDonationStatus' });
    next(error);
  }
};

// Get donation statistics
export const getDonationStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await Donation.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageDonation: { $avg: '$amount' },
          maxDonation: { $max: '$amount' },
          minDonation: { $min: '$amount' },
        },
      },
    ]);

    // Monthly donation trends
    const monthlyStats = await Donation.aggregate([
      {
        $match: { 
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top campaigns by donations
    const topCampaigns = await Donation.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$campaign',
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaign'
        }
      },
      {
        $unwind: '$campaign'
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || {
          totalDonations: 0,
          totalAmount: 0,
          averageDonation: 0,
          maxDonation: 0,
          minDonation: 0,
        },
        monthlyTrends: monthlyStats,
        topCampaigns,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.getDonationStats' });
    next(error);
  }
};

// Get user donations
export const getUserDonations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ donor: req.user?._id })
      .populate('campaign', 'title goalAmount currentAmount organizer images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ donor: req.user?._id });

    // Get user donation summary
    const summary = await Donation.aggregate([
      {
        $match: { 
          donor: req.user?._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalDonated: { $sum: '$amount' },
          donationCount: { $sum: 1 },
          averageDonation: { $avg: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        donations,
        summary: summary[0] || {
          totalDonated: 0,
          donationCount: 0,
          averageDonation: 0
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.getUserDonations' });
    next(error);
  }
};

// Get campaign donations
export const getCampaignDonations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    const filter: any = { 
      campaign: campaignId,
      status: 'completed'
    };

    // Only show non-anonymous donations or if user is campaign organizer
    if (!req.user || campaign.organizer.toString() !== req.user._id.toString()) {
      filter.isAnonymous = false;
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(filter);

    // Get donation summary for this campaign
    const summary = await Donation.aggregate([
      {
        $match: { 
          campaign: campaign._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          donationCount: { $sum: 1 },
          averageDonation: { $avg: '$amount' },
          uniqueDonors: { $addToSet: '$donor' }
        }
      },
      {
        $addFields: {
          uniqueDonorCount: { $size: { $ifNull: ['$uniqueDonors', []] } }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        donations,
        summary: summary[0] || {
          totalAmount: 0,
          donationCount: 0,
          averageDonation: 0,
          uniqueDonorCount: 0
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.getCampaignDonations' });
    next(error);
  }
};

// Get recent donations (public)
export const getRecentDonations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const donations = await Donation.find({
      status: 'completed',
      isAnonymous: false,
    })
      .populate('donor', 'firstName lastName avatar')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      status: 'success',
      data: {
        donations,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.getRecentDonations' });
    next(error);
  }
};

// Refund donation (admin only)
export const refundDonation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return next(new AppError('Donation not found', 404));
    }

    if (donation.status !== 'completed') {
      return next(new AppError('Only completed donations can be refunded', 400));
    }

    // Update donation status
    donation.status = 'refunded';
    donation.refundReason = reason;
    donation.refundedAt = new Date();
    donation.refundedBy = req.user?._id;
    await donation.save();

    // Update campaign amount
    await Campaign.findByIdAndUpdate(
      donation.campaign,
      { $inc: { currentAmount: -donation.amount } }
    );

    // Update user donation stats if donor exists
    if (donation.donor) {
      await User.findByIdAndUpdate(
        donation.donor,
        { 
          $inc: { 
            totalDonated: -donation.amount,
            donationCount: -1 
          }
        }
      );
    }

    logger.logBusiness('Donation refunded', {
      donationId: donation._id,
      amount: donation.amount,
      reason,
      adminId: req.user?._id,
    });

    res.status(200).json({
      status: 'success',
      message: 'Donation refunded successfully',
      data: {
        donation,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'donationController.refundDonation' });
    next(error);
  }
};

export default {
  getDonations,
  getDonation,
  createDonation,
  updateDonationStatus,
  getDonationStats,
  getUserDonations,
  getCampaignDonations,
  getRecentDonations,
  refundDonation,
};