import express, { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload, uploadMemory, uploadUtils, handleMulterError } from '../middleware/uploadMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param } from 'express-validator';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

const router = express.Router();

// Upload single image
router.post('/image',
  protect,
  upload.single('image'),
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError('No image file provided', 400));
      }

      const imageUrl = (req.file as any).path || req.file.filename;

      logger.logBusiness('Image uploaded', {
        userId: req.user?._id,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      res.status(200).json({
        status: 'success',
        message: 'Image uploaded successfully',
        data: {
          imageUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.uploadImage' });
      next(error);
    }
  }
);

// Upload multiple images
router.post('/images',
  protect,
  upload.array('images', 10), // Max 10 images
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return next(new AppError('No image files provided', 400));
      }

      const uploadedImages = files.map(file => ({
        imageUrl: (file as any).path || file.filename,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      }));

      logger.logBusiness('Multiple images uploaded', {
        userId: req.user?._id,
        imageCount: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
      });

      res.status(200).json({
        status: 'success',
        message: `${files.length} images uploaded successfully`,
        data: {
          images: uploadedImages,
          count: files.length,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.uploadImages' });
      next(error);
    }
  }
);

// Upload avatar
router.post('/avatar',
  protect,
  upload.single('avatar'),
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError('No avatar file provided', 400));
      }

      const avatarUrl = (req.file as any).path || req.file.filename;

      // TODO: Update user avatar in database
      // const user = await User.findByIdAndUpdate(
      //   req.user?._id,
      //   { avatar: avatarUrl },
      //   { new: true }
      // );

      logger.logBusiness('Avatar uploaded', {
        userId: req.user?._id,
        filename: req.file.filename,
        size: req.file.size,
      });

      res.status(200).json({
        status: 'success',
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl,
          filename: req.file.filename,
          size: req.file.size,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.uploadAvatar' });
      next(error);
    }
  }
);

// Upload campaign images
router.post('/campaign/:id/images',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid campaign ID'),
  ],
  validateRequest,
  upload.array('images', 5), // Max 5 images per campaign
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return next(new AppError('No image files provided', 400));
      }

      // TODO: Verify campaign ownership and update campaign images
      // const campaign = await Campaign.findById(req.params.id);
      // if (!campaign) {
      //   return next(new AppError('Campaign not found', 404));
      // }
      // 
      // if (campaign.organizer.toString() !== req.user?._id.toString()) {
      //   return next(new AppError('Not authorized to upload images for this campaign', 403));
      // }

      const uploadedImages = files.map(file => ({
        imageUrl: (file as any).path || file.filename,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      }));

      logger.logBusiness('Campaign images uploaded', {
        campaignId: req.params.id,
        userId: req.user?._id,
        imageCount: files.length,
      });

      res.status(200).json({
        status: 'success',
        message: `${files.length} campaign images uploaded successfully`,
        data: {
          images: uploadedImages,
          count: files.length,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.uploadCampaignImages' });
      next(error);
    }
  }
);

// Upload document
router.post('/document',
  protect,
  uploadMemory.single('document'),
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError('No document file provided', 400));
      }

      // TODO: Process document upload (PDF, DOC, etc.)
      const documentUrl = `documents/${Date.now()}_${req.file.originalname}`;

      logger.logBusiness('Document uploaded', {
        userId: req.user?._id,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      res.status(200).json({
        status: 'success',
        message: 'Document uploaded successfully',
        data: {
          documentUrl,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.uploadDocument' });
      next(error);
    }
  }
);

// Delete uploaded file
router.delete('/file',
  protect,
  [
    body('fileUrl').notEmpty().withMessage('File URL is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileUrl } = req.body;

      // TODO: Implement file deletion from storage (Cloudinary, local, etc.)
      // This would depend on the storage provider being used

      logger.logBusiness('File deleted', {
        userId: req.user?._id,
        fileUrl,
      });

      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.deleteFile' });
      next(error);
    }
  }
);

// Get upload statistics
router.get('/stats',
  protect,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Implement upload statistics
      // This would track user's upload usage, storage consumed, etc.
      const stats = {
        totalUploads: 0,
        totalSize: 0,
        imageUploads: 0,
        documentUploads: 0,
        storageUsed: 0,
        storageLimit: 100 * 1024 * 1024, // 100MB default limit
      };

      res.status(200).json({
        status: 'success',
        data: {
          stats,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.getUploadStats' });
      next(error);
    }
  }
);

// Get file info
router.get('/file/info',
  protect,
  [
    body('fileUrl').notEmpty().withMessage('File URL is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileUrl } = req.query;

      // TODO: Get file information from storage provider
      const fileInfo = {
        url: fileUrl,
        size: 0,
        mimetype: 'unknown',
        uploadedAt: new Date(),
        uploadedBy: req.user?._id,
      };

      res.status(200).json({
        status: 'success',
        data: {
          fileInfo,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.getFileInfo' });
      next(error);
    }
  }
);

// Resize image
router.post('/image/resize',
  protect,
  uploadMemory.single('image'),
  handleMulterError,
  [
    body('width').optional().isInt({ min: 50, max: 2000 }).withMessage('Width must be between 50 and 2000 pixels'),
    body('height').optional().isInt({ min: 50, max: 2000 }).withMessage('Height must be between 50 and 2000 pixels'),
    body('quality').optional().isInt({ min: 10, max: 100 }).withMessage('Quality must be between 10 and 100'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new AppError('No image file provided', 400));
      }

      const { width, height, quality = 80 } = req.body;

      // TODO: Implement image resizing using sharp or similar library
      // const resizedImageBuffer = await sharp(req.file.buffer)
      //   .resize(width ? parseInt(width) : undefined, height ? parseInt(height) : undefined)
      //   .jpeg({ quality: parseInt(quality) })
      //   .toBuffer();

      const resizedImageUrl = `resized/${Date.now()}_${req.file.originalname}`;

      logger.logBusiness('Image resized', {
        userId: req.user?._id,
        originalSize: req.file.size,
        width,
        height,
        quality,
      });

      res.status(200).json({
        status: 'success',
        message: 'Image resized successfully',
        data: {
          imageUrl: resizedImageUrl,
          originalSize: req.file.size,
          // resizedSize: resizedImageBuffer.length,
          dimensions: { width, height },
          quality,
        },
      });
    } catch (error) {
      logger.logError(error as Error, { route: 'uploadRoutes.resizeImage' });
      next(error);
    }
  }
);

export default router;