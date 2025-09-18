import mongoose, { Document, Schema } from 'mongoose';

// Donation interface
export interface IDonation extends Document {
  _id: mongoose.Types.ObjectId;
  donor: mongoose.Types.ObjectId;
  campaign: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto';
  paymentIntentId?: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  isAnonymous: boolean;
  message?: string;
  dedicatedTo?: {
    name: string;
    email?: string;
    message?: string;
  };
  recurringDonation?: {
    isRecurring: boolean;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDonationDate?: Date;
    subscriptionId?: string;
    isActive: boolean;
  };
  fees: {
    platformFee: number;
    paymentProcessingFee: number;
    totalFees: number;
  };
  netAmount: number;
  receipt: {
    receiptNumber: string;
    receiptUrl?: string;
    emailSent: boolean;
    emailSentAt?: Date;
  };
  refund?: {
    refundId: string;
    refundAmount: number;
    refundReason: string;
    refundedAt: Date;
    refundedBy: mongoose.Types.ObjectId;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
    campaign?: string;
    referrer?: string;
  };
  taxDeductible: boolean;
  thankYouSent: boolean;
  thankYouSentAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generateReceiptNumber(): string;
  calculateFees(): void;
  markAsCompleted(): Promise<void>;
  markAsFailed(reason?: string): Promise<void>;
  processRefund(amount: number, reason: string, refundedBy: mongoose.Types.ObjectId): Promise<void>;
  sendThankYou(): Promise<void>;
  getPublicInfo(): any;
}

// Donation schema
const donationSchema = new Schema<IDonation>({
  donor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor is required'],
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [1, 'Donation amount must be at least $1'],
    max: [100000, 'Donation amount cannot exceed $100,000'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'],
    default: 'USD',
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['stripe', 'paypal', 'bank_transfer', 'crypto'],
      message: 'Please select a valid payment method',
    },
  },
  paymentIntentId: {
    type: String,
    sparse: true, // Allow multiple null values
  },
  transactionId: {
    type: String,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true,
  },
  dedicatedTo: {
    name: {
      type: String,
      maxlength: [100, 'Dedication name cannot exceed 100 characters'],
      trim: true,
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    message: {
      type: String,
      maxlength: [300, 'Dedication message cannot exceed 300 characters'],
      trim: true,
    },
  },
  recurringDonation: {
    isRecurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    },
    nextDonationDate: Date,
    subscriptionId: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0,
      min: [0, 'Platform fee cannot be negative'],
    },
    paymentProcessingFee: {
      type: Number,
      default: 0,
      min: [0, 'Payment processing fee cannot be negative'],
    },
    totalFees: {
      type: Number,
      default: 0,
      min: [0, 'Total fees cannot be negative'],
    },
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative'],
  },
  receipt: {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
    },
    receiptUrl: String,
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
  },
  refund: {
    refundId: String,
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: String,
    campaign: String,
    referrer: String,
  },
  taxDeductible: {
    type: Boolean,
    default: true,
  },
  thankYouSent: {
    type: Boolean,
    default: false,
  },
  thankYouSentAt: Date,
  completedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for fee percentage
donationSchema.virtual('feePercentage').get(function() {
  return this.amount > 0 ? Math.round((this.fees.totalFees / this.amount) * 100 * 100) / 100 : 0;
});

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Pre-save middleware to generate receipt number and calculate fees
donationSchema.pre('save', function(next) {
  // Generate receipt number if not exists
  if (!this.receipt.receiptNumber) {
    this.receipt.receiptNumber = this.generateReceiptNumber();
  }
  
  // Calculate fees if not already calculated
  if (this.fees.totalFees === 0) {
    this.calculateFees();
  }
  
  next();
});

// Method to generate receipt number
donationSchema.methods.generateReceiptNumber = function(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  return `PKD-${year}${month}${day}-${random}`;
};

// Method to calculate fees
donationSchema.methods.calculateFees = function(): void {
  const amount = this.amount;
  
  // Platform fee (2.5% of donation)
  this.fees.platformFee = Math.round(amount * 0.025 * 100) / 100;
  
  // Payment processing fees based on payment method
  let processingFeeRate = 0;
  switch (this.paymentMethod) {
    case 'stripe':
      processingFeeRate = 0.029; // 2.9% + $0.30
      this.fees.paymentProcessingFee = Math.round((amount * processingFeeRate + 0.30) * 100) / 100;
      break;
    case 'paypal':
      processingFeeRate = 0.0349; // 3.49% + $0.49
      this.fees.paymentProcessingFee = Math.round((amount * processingFeeRate + 0.49) * 100) / 100;
      break;
    case 'bank_transfer':
      this.fees.paymentProcessingFee = 1.00; // Flat $1.00 fee
      break;
    case 'crypto':
      processingFeeRate = 0.01; // 1% fee
      this.fees.paymentProcessingFee = Math.round(amount * processingFeeRate * 100) / 100;
      break;
    default:
      this.fees.paymentProcessingFee = 0;
  }
  
  // Total fees
  this.fees.totalFees = Math.round((this.fees.platformFee + this.fees.paymentProcessingFee) * 100) / 100;
  
  // Net amount (amount minus fees)
  this.netAmount = Math.round((amount - this.fees.totalFees) * 100) / 100;
};

// Method to mark donation as completed
donationSchema.methods.markAsCompleted = async function(): Promise<void> {
  this.status = 'completed';
  
  // Update campaign's current amount
  await mongoose.model('Campaign').findByIdAndUpdate(
    this.campaign,
    { 
      $inc: { currentAmount: this.netAmount },
    }
  );
  
  // Update user's donation stats
  await mongoose.model('User').findByIdAndUpdate(
    this.donor,
    {
      $inc: {
        'donationStats.totalDonated': this.amount,
        'donationStats.donationCount': 1,
      },
      $set: {
        'donationStats.lastDonation': new Date(),
      },
    }
  );
  
  return this.save();
};

// Method to mark donation as failed
donationSchema.methods.markAsFailed = async function(reason?: string): Promise<void> {
  this.status = 'failed';
  
  if (reason) {
    this.metadata.failureReason = reason;
  }
  
  return this.save();
};

// Method to process refund
donationSchema.methods.processRefund = async function(
  amount: number,
  reason: string,
  refundedBy: mongoose.Types.ObjectId
): Promise<void> {
  this.status = 'refunded';
  this.refund = {
    refundId: `refund_${Date.now()}`,
    refundAmount: amount,
    refundReason: reason,
    refundedAt: new Date(),
    refundedBy,
  };
  
  // Update campaign's current amount
  await mongoose.model('Campaign').findByIdAndUpdate(
    this.campaign,
    { 
      $inc: { currentAmount: -amount },
    }
  );
  
  // Update user's donation stats
  await mongoose.model('User').findByIdAndUpdate(
    this.donor,
    {
      $inc: {
        'donationStats.totalDonated': -amount,
        'donationStats.donationCount': -1,
      },
    }
  );
  
  return this.save();
};

// Method to send thank you
donationSchema.methods.sendThankYou = async function(): Promise<void> {
  this.thankYouSent = true;
  this.thankYouSentAt = new Date();
  
  return this.save();
};

// Method to get public donation info
donationSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    amount: this.isAnonymous ? null : this.amount,
    formattedAmount: this.isAnonymous ? null : this.formattedAmount,
    donor: this.isAnonymous ? 'Anonymous' : this.donor,
    message: this.message,
    dedicatedTo: this.dedicatedTo,
    createdAt: this.createdAt,
  };
};

// Indexes for performance
donationSchema.index({ donor: 1 });
donationSchema.index({ campaign: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ paymentIntentId: 1 });
donationSchema.index({ transactionId: 1 });
donationSchema.index({ 'receipt.receiptNumber': 1 }, { unique: true });
donationSchema.index({ 'recurringDonation.subscriptionId': 1 });
donationSchema.index({ 'recurringDonation.nextDonationDate': 1 });

// Compound indexes
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ campaign: 1, status: 1 });
donationSchema.index({ status: 1, createdAt: -1 });

// Export the model
export const Donation = mongoose.model<IDonation>('Donation', donationSchema);

export default Donation;