import express from 'express';
import { body, query, param } from 'express-validator';
import {
  createDonation,
  getDonations,
  getDonation,
  getUserDonations,
  getCampaignDonations,
  updateDonationStatus,
  refundDonation,
  getDonationStats,
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  downloadReceipt,
  sendThankYouEmail,
} from '../controllers/donationController';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = express.Router();

// Validation rules
const createDonationValidation = [
  body('campaignId')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  body('amount')
    .isFloat({ min: 5, max: 50000 })
    .withMessage('Donation amount must be between $5 and $50,000'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  body('donorInfo.firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('donorInfo.lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('donorInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('donorInfo.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
];

const paymentIntentValidation = [
  body('campaignId')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  body('amount')
    .isFloat({ min: 5, max: 50000 })
    .withMessage('Donation amount must be between $5 and $50,000'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
];

const confirmPaymentValidation = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('donationData')
    .isObject()
    .withMessage('Donation data is required'),
];

const refundValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Refund reason must not exceed 500 characters'),
];

const searchValidation = [
  query('campaignId')
    .optional()
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status'])
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
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid donation ID'),
];

const campaignParamValidation = [
  param('campaignId')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
];

// Webhook route (must be before other middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Public routes
router.post('/payment-intent', paymentIntentValidation, validateRequest, createPaymentIntent);
router.post('/confirm-payment', confirmPaymentValidation, validateRequest, confirmPayment);

// Protected routes - User must be authenticated
router.post('/', protect, createDonationValidation, validateRequest, createDonation);
router.get('/my-donations', protect, searchValidation, validateRequest, getUserDonations);
router.get('/:id', protect, paramValidation, validateRequest, getDonation);
router.get('/:id/receipt', protect, paramValidation, validateRequest, downloadReceipt);
router.post('/:id/thank-you', protect, paramValidation, validateRequest, sendThankYouEmail);

// Campaign-specific donations (public with optional auth for additional info)
router.get('/campaign/:campaignId', campaignParamValidation, searchValidation, validateRequest, optionalAuth, getCampaignDonations);

// Admin routes
router.get('/', protect, authorize('admin'), searchValidation, validateRequest, getDonations);
router.get('/stats/overview', protect, authorize('admin'), getDonationStats);
router.patch('/:id/status', protect, authorize('admin'), paramValidation, validateRequest, updateDonationStatus);
router.post('/:id/refund', protect, authorize('admin'), paramValidation, refundValidation, validateRequest, refundDonation);

export default router;