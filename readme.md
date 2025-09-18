# Poor Kids Donation Platform

A comprehensive donation platform built with React, Node.js, and MongoDB to help connect donors with children in need around the world.

## 🌟 Features

### For Donors
- **Secure Donations**: Stripe-powered payment processing with multiple payment methods
- **Campaign Discovery**: Browse and search donation campaigns by category, location, and urgency
- **Real-time Updates**: Track campaign progress and receive updates on funded projects
- **Donation History**: Complete record of all donations with downloadable receipts
- **Anonymous Giving**: Option to donate anonymously while still receiving tax receipts

### For Campaign Creators
- **Campaign Management**: Create and manage donation campaigns with rich media support
- **Progress Tracking**: Real-time analytics and donor engagement metrics
- **Communication Tools**: Send updates and thank you messages to donors
- **Verification System**: Multi-step verification process to ensure campaign authenticity

### For Administrators
- **Platform Oversight**: Comprehensive admin dashboard for platform management
- **Campaign Moderation**: Review and approve campaigns before they go live
- **Financial Reporting**: Detailed financial reports and transaction monitoring
- **User Management**: Manage user accounts and resolve disputes

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Query** for server state management
- **React Hook Form** for form handling
- **Stripe Elements** for payment processing

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Stripe** for payment processing
- **Cloudinary** for image storage
- **Winston** for logging

### DevOps & Deployment
- **Netlify** for frontend hosting
- **Railway** for backend hosting
- **MongoDB Atlas** for database hosting
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local) or MongoDB Atlas account
- Stripe account for payment processing
- Cloudinary account for image storage

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/poor-kids-donation.git
cd poor-kids-donation
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/poor-kids-donation
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poor-kids-donation

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (using Gmail)
EMAIL_FROM=noreply@poorkidsdonation.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Copy environment variables
cp .env.example .env.local
```

Edit the `.env.local` file:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_ENVIRONMENT=development
```

### 4. Start Development Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/v1/docs

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `cd frontend && npm ci && npm run build`
   - Set publish directory: `frontend/dist`
   - Add environment variables in Netlify dashboard

### Backend Deployment (Railway)

1. **Prepare for deployment:**
   ```bash
   cd backend
   npm run build
   ```

2. **Deploy to Railway:**
   - Connect your GitHub repository to Railway
   - Railway will automatically detect the Node.js project
   - Add environment variables in Railway dashboard
   - The service will be available at your Railway URL

### Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your application's IP addresses
4. Update the `MONGODB_URI` in your environment variables

## 📚 API Documentation

The API provides comprehensive endpoints for:

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email address
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)

### Campaigns (`/api/v1/campaigns`)
- `GET /` - Get all campaigns with filtering
- `GET /search` - Search campaigns
- `GET /featured` - Get featured campaigns
- `GET /:id` - Get single campaign
- `POST /` - Create new campaign (protected)
- `PUT /:id` - Update campaign (protected)
- `DELETE /:id` - Delete campaign (protected)

### Donations (`/api/v1/donations`)
- `POST /payment-intent` - Create Stripe payment intent
- `POST /confirm-payment` - Confirm payment
- `POST /` - Create donation (protected)
- `GET /my-donations` - Get user donations (protected)
- `GET /:id` - Get single donation (protected)
- `GET /campaign/:campaignId` - Get campaign donations

Visit `/api/v1/docs` for complete API documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (user, admin)
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured CORS for secure cross-origin requests
- **Helmet**: Security headers for Express applications
- **Data Encryption**: Sensitive data encryption at rest
- **Payment Security**: PCI-compliant payment processing with Stripe

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/poor-kids-donation/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- Thanks to all contributors who help make this platform better
- Special thanks to the organizations working to help children in need
- Built with love for a better world

---

**Made with ❤️ for children in need around the world**