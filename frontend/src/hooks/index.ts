// Export all custom hooks from a single entry point

export { default as useAuth, AuthProvider, useAuthOptional, withAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

export { default as useDonation } from './useDonation';
export type { UseDonationReturn } from './useDonation';

export { default as useCampaigns } from './useCampaigns';
export type { UseCampaignsReturn } from './useCampaigns';

// Re-export types for convenience
export type {
  User,
  Donation,
  Campaign,
  LoginCredentials,
  RegisterData,
  DonationFormData,
  CampaignFormData,
  PaymentMethod,
} from '../types';