import mongoose, { Document, Schema } from 'mongoose';

// Campaign interface
export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  category: 'education' | 'healthcare' | 'food' | 'shelter' | 'emergency' | 'other';
  goalAmount: number;
  currentAmount: number;
  currency: string;
  images: string[];
  video?: string;
  location: {
    country: string;
    state?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  organizer: mongoose.Types.ObjectId;
  beneficiaries: {
    count: number;
    ageGroup: string;
    description: string;
  };
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  featured: boolean;
  urgent: boolean;
  tags: string[];
  updates: {
    title: string;
    content: string;
    images?: string[];
    createdAt: Date;
  }[];
  milestones: {
    amount: number;
    description: string;
    achieved: boolean;
    achievedAt?: Date;
  }[];
  expenses: {
    description: string;
    amount: number;
    category: string;
    receipt?: string;
    date: Date;
  }[];
  donorCount: number;
  shareCount: number;
  viewCount: number;
  likes: number;
  comments: {
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    replies?: {
      user: mongoose.Types.ObjectId;
      content: string;
      createdAt: Date;
    }[];
  }[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  verification: {
    isVerified: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    documents: string[];
  };
  settings: {
    allowAnonymousDonations: boolean;
    showDonorList: boolean;
    allowComments: boolean;
    autoThankYou: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getProgressPercentage(): number;
  isExpired(): boolean;
  canReceiveDonations(): boolean;
  addUpdate(title: string, content: string, images?: string[]): Promise<void>;
  addMilestone(amount: number, description: string): Promise<void>;
  checkMilestones(): Promise<void>;
  addExpense(description: string, amount: number, category: string, receipt?: string): Promise<void>;
  incrementDonorCount(): Promise<void>;
  incrementViewCount(): Promise<void>;
  incrementShareCount(): Promise<void>;
  addComment(userId: mongoose.Types.ObjectId, content: string): Promise<void>;
}

// Campaign schema
const campaignSchema = new Schema<ICampaign>({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  category: {
    type: String,
    required: [true, 'Campaign category is required'],
    enum: {
      values: ['education', 'healthcare', 'food', 'shelter', 'emergency', 'other'],
      message: 'Please select a valid category',
    },
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1, 'Goal amount must be at least $1'],
    max: [1000000, 'Goal amount cannot exceed $1,000,000'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'],
  },
  images: [{
    type: String,
    required: true,
  }],
  video: String,
  location: {
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    state: String,
    city: String,
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required'],
  },
  beneficiaries: {
    count: {
      type: Number,
      required: [true, 'Number of beneficiaries is required'],
      min: [1, 'Must have at least 1 beneficiary'],
    },
    ageGroup: {
      type: String,
      required: [true, 'Age group is required'],
      enum: ['children', 'adults', 'elderly', 'mixed'],
    },
    description: {
      type: String,
      required: [true, 'Beneficiary description is required'],
      maxlength: [500, 'Beneficiary description cannot exceed 500 characters'],
    },
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: ICampaign, value: Date) {
        return value > this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  urgent: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  updates: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Update title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Update content cannot exceed 2000 characters'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  milestones: [{
    amount: {
      type: Number,
      required: true,
      min: [1, 'Milestone amount must be positive'],
    },
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Milestone description cannot exceed 200 characters'],
    },
    achieved: {
      type: Boolean,
      default: false,
    },
    achievedAt: Date,
  }],
  expenses: [{
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Expense description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Expense amount cannot be negative'],
    },
    category: {
      type: String,
      required: true,
      enum: ['supplies', 'transportation', 'accommodation', 'food', 'medical', 'administrative', 'other'],
    },
    receipt: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  donorCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    replies: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
        maxlength: [500, 'Reply cannot exceed 500 characters'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  }],
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    website: String,
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    documents: [String],
  },
  settings: {
    allowAnonymousDonations: {
      type: Boolean,
      default: true,
    },
    showDonorList: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    autoThankYou: {
      type: Boolean,
      default: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  return Math.min(Math.round((this.currentAmount / this.goalAmount) * 100), 100);
});

// Virtual for remaining amount
campaignSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.goalAmount - this.currentAmount, 0);
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
});

// Method to get progress percentage
campaignSchema.methods.getProgressPercentage = function(): number {
  return Math.min(Math.round((this.currentAmount / this.goalAmount) * 100), 100);
};

// Method to check if campaign is expired
campaignSchema.methods.isExpired = function(): boolean {
  return new Date() > this.endDate;
};

// Method to check if campaign can receive donations
campaignSchema.methods.canReceiveDonations = function(): boolean {
  return this.status === 'active' && 
         !this.isExpired() && 
         this.currentAmount < this.goalAmount &&
         this.isActive;
};

// Method to add update
campaignSchema.methods.addUpdate = async function(
  title: string, 
  content: string, 
  images?: string[]
): Promise<void> {
  this.updates.push({
    title,
    content,
    images: images || [],
    createdAt: new Date(),
  });
  
  return this.save();
};

// Method to add milestone
campaignSchema.methods.addMilestone = async function(
  amount: number, 
  description: string
): Promise<void> {
  this.milestones.push({
    amount,
    description,
    achieved: false,
  });
  
  // Sort milestones by amount
  this.milestones.sort((a, b) => a.amount - b.amount);
  
  return this.save();
};

// Method to check and update milestones
campaignSchema.methods.checkMilestones = async function(): Promise<void> {
  let updated = false;
  
  for (const milestone of this.milestones) {
    if (!milestone.achieved && this.currentAmount >= milestone.amount) {
      milestone.achieved = true;
      milestone.achievedAt = new Date();
      updated = true;
    }
  }
  
  if (updated) {
    return this.save();
  }
};

// Method to add expense
campaignSchema.methods.addExpense = async function(
  description: string,
  amount: number,
  category: string,
  receipt?: string
): Promise<void> {
  this.expenses.push({
    description,
    amount,
    category,
    receipt,
    date: new Date(),
  });
  
  return this.save();
};

// Method to increment donor count
campaignSchema.methods.incrementDonorCount = async function(): Promise<void> {
  return this.updateOne({ $inc: { donorCount: 1 } });
};

// Method to increment view count
campaignSchema.methods.incrementViewCount = async function(): Promise<void> {
  return this.updateOne({ $inc: { viewCount: 1 } });
};

// Method to increment share count
campaignSchema.methods.incrementShareCount = async function(): Promise<void> {
  return this.updateOne({ $inc: { shareCount: 1 } });
};

// Method to add comment
campaignSchema.methods.addComment = async function(
  userId: mongoose.Types.ObjectId,
  content: string
): Promise<void> {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
  });
  
  return this.save();
};

// Pre-save middleware to update status based on conditions
campaignSchema.pre('save', function(next) {
  // Auto-complete campaign if goal is reached
  if (this.currentAmount >= this.goalAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  // Auto-cancel if expired and not completed
  if (this.isExpired() && this.status === 'active') {
    this.status = 'cancelled';
  }
  
  next();
});

// Indexes for performance
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ featured: 1 });
campaignSchema.index({ urgent: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ endDate: 1 });
campaignSchema.index({ organizer: 1 });
campaignSchema.index({ 'location.country': 1 });
campaignSchema.index({ 'verification.isVerified': 1 });

// Text index for search
campaignSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text',
});

// Geospatial index for location-based queries
campaignSchema.index({ 'location.coordinates': '2dsphere' });

// Export the model
export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;