import express from 'express';
import { body, query, param } from 'express-validator';
import {
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
} from '../controllers/campaignController';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

// Validation rules
const createCampaignValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('goalAmount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Goal amount must be between $100 and $1,000,000'),
  body('category')
    .isIn(['education', 'healthcare', 'food', 'shelter', 'emergency', 'community', 'environment'])
    .withMessage('Invalid category'),
  body('endDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const now = new Date();
      const minEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const maxEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (value < minEndDate) {
        throw new Error('End date must be at least 7 days from now');
      }
      if (value > maxEndDate) {
        throw new Error('End date cannot be more than 1 year from now');
      }
      return true;
    }),
  body('location.country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country is required'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name too long'),
  body('beneficiaryInfo.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Beneficiary name must be between 2 and 100 characters'),
  body('beneficiaryInfo.age')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be between 0 and 120'),
  body('beneficiaryInfo.story')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Story must not exceed 2000 characters'),
];

const updateCampaignValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('goalAmount')
    .optional()
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Goal amount must be between $100 and $1,000,000'),
  body('category')
    .optional()
    .isIn(['education', 'healthcare', 'food', 'shelter', 'emergency', 'community', 'environment'])
    .withMessage('Invalid category'),
  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      const now = new Date();
      const minEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
      const maxEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (value < minEndDate) {
        throw new Error('End date must be at least 1 day from now');
      }
      if (value > maxEndDate) {
        throw new Error('End date cannot be more than 1 year from now');
      }
      return true;
    }),
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .isIn(['education', 'healthcare', 'food', 'shelter', 'emergency', 'community', 'environment'])
    .withMessage('Invalid category'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  query('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country name too long'),
  query('status')
    .optional()
    .isIn(['active', 'completed', 'expired', 'paused'])
    .withMessage('Invalid status'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'goalAmount', 'raisedAmount', 'endDate', 'donorCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
];

// Public routes
router.get('/', searchValidation, validateRequest, getCampaigns);
router.get('/search', searchValidation, validateRequest, searchCampaigns);
router.get('/featured', getFeaturedCampaigns);
router.get('/category/:category', getCampaignsByCategory);
router.get('/stats', getCampaignStats);
router.get('/:id', paramValidation, validateRequest, optionalAuth, getCampaign);

// Protected routes - User must be authenticated
router.post('/', protect, createCampaignValidation, validateRequest, createCampaign);
router.get('/user/my-campaigns', protect, getUserCampaigns);

// Protected routes - User must own the campaign or be admin
router.put('/:id', protect, paramValidation, updateCampaignValidation, validateRequest, updateCampaign);
router.delete('/:id', protect, paramValidation, validateRequest, deleteCampaign);
router.post('/:id/images', protect, paramValidation, validateRequest, upload.array('images', 5), uploadCampaignImages);

// Admin only routes
router.patch('/:id/status', protect, authorize('admin'), paramValidation, validateRequest, toggleCampaignStatus);

export default router;