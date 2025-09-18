// User Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'donor' | 'volunteer';
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Donation Types
export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorId?: string;
  campaignId?: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  paymentMethod: 'stripe' | 'paypal' | 'manual';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Types
export interface Campaign {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  imageUrl?: string;
  category: string;
  location?: string;
  beneficiaryCount?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Beneficiary Types
export interface Beneficiary {
  id: string;
  name: string;
  age?: number;
  location: string;
  story: string;
  imageUrl?: string;
  campaignIds: string[];
  status: 'active' | 'graduated' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  userId: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  paymentMethodId?: string;
}

// Form Types
export interface DonationFormData {
  amount: number;
  currency: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  campaignId?: string;
  paymentMethod: 'stripe' | 'paypal';
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics Types
export interface DonationStats {
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  donorCount: number;
  campaignCount: number;
  beneficiaryCount: number;
  monthlyGrowth: number;
}

export interface CampaignStats {
  id: string;
  title: string;
  goalAmount: number;
  raisedAmount: number;
  donationCount: number;
  progress: number;
  daysRemaining?: number;
}

// Dashboard Types
export interface DashboardData {
  stats: DonationStats;
  recentDonations: Donation[];
  topCampaigns: CampaignStats[];
  recentCampaigns: Campaign[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Filter and Sort Types
export interface DonationFilters {
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  campaignId?: string;
  paymentStatus?: string;
  isAnonymous?: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: DonationFilters;
}