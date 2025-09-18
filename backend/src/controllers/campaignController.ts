import { Request, Response, NextFunction } from 'express';
import { Campaign } from '../models/Campaign';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

// Get all campaigns
export const getCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };
    
    // Add category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Add status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const campaigns = await Campaign.find(filter)
      .populate('organizer', 'firstName lastName avatar')
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
    logger.logError(error as Error, { controller: 'campaignController.getCampaigns' });
    next(error);
  }
};

// Get single campaign
export const getCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('organizer', 'firstName lastName avatar email')
      .populate('updates.author', 'firstName lastName avatar')
      .populate('comments.user', 'firstName lastName avatar')
      .populate('comments.replies.user', 'firstName lastName avatar');

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        campaign,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.getCampaign' });
    next(error);
  }
};

// Create campaign
export const createCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignData = {
      ...req.body,
      organizer: req.user?._id,
    };

    const campaign = await Campaign.create(campaignData);
    await campaign.populate('organizer', 'firstName lastName avatar');

    logger.logBusiness('Campaign created', {
      campaignId: campaign._id,
      organizerId: req.user?._id,
      title: campaign.title,
    });

    res.status(201).json({
      status: 'success',
      message: 'Campaign created successfully',
      data: {
        campaign,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.createCampaign' });
    next(error);
  }
};

// Update campaign
export const updateCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check if user is the organizer or admin
    if (campaign.organizer.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to update this campaign', 403));
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('organizer', 'firstName lastName avatar');

    logger.logBusiness('Campaign updated', {
      campaignId: campaign._id,
      organizerId: req.user?._id,
      updatedFields: Object.keys(req.body),
    });

    res.status(200).json({
      status: 'success',
      message: 'Campaign updated successfully',
      data: {
        campaign: updatedCampaign,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.updateCampaign' });
    next(error);
  }
};

// Delete campaign
export const deleteCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check if user is the organizer or admin
    if (campaign.organizer.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to delete this campaign', 403));
    }

    await Campaign.findByIdAndDelete(req.params.id);

    logger.logBusiness('Campaign deleted', {
      campaignId: campaign._id,
      organizerId: req.user?._id,
      title: campaign.title,
    });

    res.status(200).json({
      status: 'success',
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.deleteCampaign' });
    next(error);
  }
};

// Get campaign statistics
export const getCampaignStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalRaised: { $sum: '$currentAmount' },
          averageGoal: { $avg: '$goalAmount' },
        },
      },
    ]);

    const categoryStats = await Campaign.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRaised: { $sum: '$currentAmount' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalRaised: 0,
          averageGoal: 0,
        },
        byCategory: categoryStats,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.getCampaignStats' });
    next(error);
  }
};

// Search campaigns
export const searchCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, category, minGoal, maxGoal } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    // Text search
    if (q) {
      filter.$text = { $search: q as string };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Goal amount range
    if (minGoal || maxGoal) {
      filter.goalAmount = {};
      if (minGoal) filter.goalAmount.$gte = parseFloat(minGoal as string);
      if (maxGoal) filter.goalAmount.$lte = parseFloat(maxGoal as string);
    }

    const campaigns = await Campaign.find(filter)
      .populate('organizer', 'firstName lastName avatar')
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
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
    logger.logError(error as Error, { controller: 'campaignController.searchCampaigns' });
    next(error);
  }
};

// Get featured campaigns
export const getFeaturedCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const campaigns = await Campaign.find({
      isActive: true,
      status: 'active',
      isFeatured: true,
    })
      .populate('organizer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      status: 'success',
      data: {
        campaigns,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.getFeaturedCampaigns' });
    next(error);
  }
};

// Get campaigns by category
export const getCampaignsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find({
      category,
      isActive: true,
      status: 'active',
    })
      .populate('organizer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments({
      category,
      isActive: true,
      status: 'active',
    });

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
    logger.logError(error as Error, { controller: 'campaignController.getCampaignsByCategory' });
    next(error);
  }
};

// Get user campaigns
export const getUserCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find({ organizer: req.user?._id })
      .populate('organizer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments({ organizer: req.user?._id });

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
    logger.logError(error as Error, { controller: 'campaignController.getUserCampaigns' });
    next(error);
  }
};

// Toggle campaign status (admin only)
export const toggleCampaignStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    campaign.isActive = !campaign.isActive;
    await campaign.save();

    logger.logBusiness('Campaign status toggled', {
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
    logger.logError(error as Error, { controller: 'campaignController.toggleCampaignStatus' });
    next(error);
  }
};

// Upload campaign images
export const uploadCampaignImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Check if user is the organizer
    if (campaign.organizer.toString() !== req.user?._id.toString()) {
      return next(new AppError('Not authorized to upload images for this campaign', 403));
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(new AppError('No images uploaded', 400));
    }

    const imageUrls = files.map(file => (file as any).path || file.filename);
    campaign.images.push(...imageUrls);
    await campaign.save();

    logger.logBusiness('Campaign images uploaded', {
      campaignId: campaign._id,
      organizerId: req.user?._id,
      imageCount: files.length,
    });

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: {
        campaign,
        uploadedImages: imageUrls,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'campaignController.uploadCampaignImages' });
    next(error);
  }
};

export default {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  searchCampaigns,
  getFeaturedCampaigns,
  getCampaignsByCategory,
  getUserCampaigns,
  toggleCampaignStatus,
  uploadCampaignImages,
};