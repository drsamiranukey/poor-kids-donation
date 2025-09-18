import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Register user
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    logger.logBusiness('User registered', {
      userId: user._id,
      email: user.email,
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: user.getPublicProfile(),
        token,
        verificationToken,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.register' });
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if account is locked
    if (user.isLocked()) {
      return next(new AppError('Account is temporarily locked due to too many failed login attempts', 423));
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    logger.logAuth('User logged in', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.login' });
    next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful',
  });
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No user found with this email address', 404));
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    logger.logAuth('Password reset requested', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email',
      data: {
        resetToken, // In production, this should be sent via email
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.forgotPassword' });
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new auth token
    const authToken = user.generateAuthToken();

    logger.logAuth('Password reset successful', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      data: {
        user: user.getPublicProfile(),
        token: authToken,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.resetPassword' });
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.logAuth('Email verified', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.verifyEmail' });
    next(error);
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user?.getPublicProfile(),
    },
  });
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'preferences', 'address', 'socialLinks'];
    const updates: any = {};

    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user?._id, updates, {
      new: true,
      runValidators: true,
    });

    logger.logBusiness('Profile updated', {
      userId: user?._id,
      updatedFields: Object.keys(updates),
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: user?.getPublicProfile(),
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.updateProfile' });
    next(error);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 400));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.logAuth('Password changed', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.changePassword' });
    next(error);
  }
};

// Resend email verification
export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No user found with this email address', 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email is already verified', 400));
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    logger.logAuth('Email verification resent', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully',
      data: {
        verificationToken, // In production, this should be sent via email
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.resendVerification' });
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate new auth token
    const token = user.generateAuthToken();

    logger.logAuth('Token refreshed', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    logger.logError(error as Error, { controller: 'authController.refreshToken' });
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
};