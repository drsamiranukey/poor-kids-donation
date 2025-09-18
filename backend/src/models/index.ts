// Export all models
import { User, IUser } from './User';
import { Campaign, ICampaign } from './Campaign';
import { Donation, IDonation } from './Donation';

export { User, IUser, Campaign, ICampaign, Donation, IDonation };

// Re-export for convenience
export default {
  User,
  Campaign,
  Donation,
};