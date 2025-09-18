import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from './errorMiddleware';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  // Check file type
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn('File upload rejected - invalid type', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      ip: req.ip,
    });
    
    cb(new AppError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.', 400));
  }
};

// Cloudinary storage configuration
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req: Request, file: Express.Multer.File) => {
      // Determine folder based on file purpose
      if (req.route?.path?.includes('campaign')) {
        return 'poor-kids-donation/campaigns';
      } else if (req.route?.path?.includes('profile')) {
        return 'poor-kids-donation/profiles';
      }
      return 'poor-kids-donation/general';
    },
    public_id: (req: Request, file: Express.Multer.File) => {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `${timestamp}_${randomString}`;
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
  } as any,
});

// Local storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const filename = `${timestamp}_${randomString}.${extension}`;
    cb(null, filename);
  },
});

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// Create multer instances
const storage = process.env.CLOUDINARY_CLOUD_NAME ? cloudinaryStorage : localStorage;

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
});

export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
});

// Utility functions for file handling
export const uploadUtils = {
  /**
   * Delete file from Cloudinary
   */
  deleteFromCloudinary: async (publicId: string): Promise<void> => {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info('File deleted from Cloudinary', { publicId });
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary', { publicId, error });
      throw new AppError('Failed to delete file', 500);
    }
  },

  /**
   * Get optimized image URL from Cloudinary
   */
  getOptimizedImageUrl: (publicId: string, options: any = {}): string => {
    const defaultOptions = {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto',
    };

    const finalOptions = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, finalOptions);
  },

  /**
   * Generate multiple image sizes
   */
  generateImageSizes: (publicId: string) => {
    return {
      thumbnail: cloudinary.url(publicId, {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
      }),
      small: cloudinary.url(publicId, {
        width: 400,
        height: 300,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
      }),
      medium: cloudinary.url(publicId, {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
      }),
      large: cloudinary.url(publicId, {
        width: 1200,
        height: 900,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
      }),
      original: cloudinary.url(publicId, {
        quality: 'auto:best',
        fetch_format: 'auto',
      }),
    };
  },

  /**
   * Validate uploaded file
   */
  validateFile: (file: Express.Multer.File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: 'File size exceeds 5MB limit' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { isValid: false, error: 'Invalid file type' };
    }

    return { isValid: true };
  },

  /**
   * Process uploaded files and return formatted data
   */
  processUploadedFiles: (files: Express.Multer.File[]) => {
    return files.map((file) => {
      const isCloudinary = 'path' in file && file.path.includes('cloudinary');
      
      if (isCloudinary) {
        // Cloudinary file
        return {
          url: file.path,
          publicId: (file as any).filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          sizes: uploadUtils.generateImageSizes((file as any).filename),
        };
      } else {
        // Local file
        return {
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      }
    });
  },
};

// Error handling middleware for multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum is 5 files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      default:
        message = error.message;
    }

    logger.warn('Multer upload error', {
      code: error.code,
      message: error.message,
      field: error.field,
      ip: req.ip,
    });

    return next(new AppError(message, 400));
  }

  next(error);
};

export default {
  upload,
  uploadMemory,
  uploadUtils,
  handleMulterError,
};