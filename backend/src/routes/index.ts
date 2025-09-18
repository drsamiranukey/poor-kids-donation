import express from 'express';
import authRoutes from './authRoutes';
import campaignRoutes from './campaignRoutes';
import donationRoutes from './donationRoutes';
import { AppError } from '../middleware/errorMiddleware';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || 'v1',
  });
});

// API status endpoint with more detailed information
router.get('/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'success',
    data: {
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
      environment: process.env.NODE_ENV,
      version: process.env.API_VERSION || 'v1',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/donations', donationRoutes);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Poor Kids Donation Platform API',
    version: process.env.API_VERSION || 'v1',
    documentation: {
      endpoints: {
        auth: {
          base: '/api/v1/auth',
          routes: [
            'POST /register - Register a new user',
            'POST /login - Login user',
            'POST /logout - Logout user',
            'POST /forgot-password - Request password reset',
            'POST /reset-password/:token - Reset password',
            'GET /verify-email/:token - Verify email address',
            'POST /resend-verification - Resend verification email',
            'POST /refresh-token - Refresh access token',
            'POST /change-password - Change password (protected)',
            'GET /profile - Get user profile (protected)',
            'PUT /profile - Update user profile (protected)',
          ],
        },
        campaigns: {
          base: '/api/v1/campaigns',
          routes: [
            'GET / - Get all campaigns with filters',
            'GET /search - Search campaigns',
            'GET /featured - Get featured campaigns',
            'GET /category/:category - Get campaigns by category',
            'GET /stats - Get campaign statistics',
            'GET /:id - Get single campaign',
            'POST / - Create new campaign (protected)',
            'PUT /:id - Update campaign (protected)',
            'DELETE /:id - Delete campaign (protected)',
            'GET /user/my-campaigns - Get user campaigns (protected)',
            'POST /:id/images - Upload campaign images (protected)',
            'PATCH /:id/status - Toggle campaign status (admin)',
          ],
        },
        donations: {
          base: '/api/v1/donations',
          routes: [
            'POST /payment-intent - Create payment intent',
            'POST /confirm-payment - Confirm payment',
            'POST /webhook - Stripe webhook handler',
            'POST / - Create donation (protected)',
            'GET /my-donations - Get user donations (protected)',
            'GET /:id - Get single donation (protected)',
            'GET /:id/receipt - Download donation receipt (protected)',
            'POST /:id/thank-you - Send thank you email (protected)',
            'GET /campaign/:campaignId - Get campaign donations',
            'GET / - Get all donations (admin)',
            'GET /stats/overview - Get donation statistics (admin)',
            'PATCH /:id/status - Update donation status (admin)',
            'POST /:id/refund - Refund donation (admin)',
          ],
        },
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        note: 'Include JWT token in Authorization header for protected routes',
      },
      errorHandling: {
        format: {
          status: 'error',
          message: 'Error description',
          errors: 'Validation errors (if applicable)',
          stack: 'Error stack trace (development only)',
        },
      },
    },
  });
});

// Catch-all route for undefined API endpoints
router.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

export default router;