import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Heart, CreditCard, DollarSign, User, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { DonationFormData } from '../../types';

interface DonationFormProps {
  campaignId?: string;
  suggestedAmount?: number;
}

const DonationForm: React.FC<DonationFormProps> = ({ campaignId, suggestedAmount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(suggestedAmount || 0);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DonationFormData>({
    defaultValues: {
      amount: suggestedAmount || 0,
      currency: 'USD',
      isAnonymous: false,
      paymentMethod: 'stripe',
      isRecurring: false,
      campaignId: campaignId
    }
  });

  const isAnonymous = watch('isAnonymous');
  const isRecurring = watch('isRecurring');

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(0);
  };

  const onSubmit = async (data: DonationFormData) => {
    setIsProcessing(true);
    
    try {
      const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
      
      if (finalAmount < 1) {
        toast.error('Minimum donation amount is $1');
        return;
      }

      const donationData = {
        ...data,
        amount: finalAmount,
      };

      // Here you would integrate with your payment processor
      console.log('Processing donation:', donationData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Thank you for your generous donation!');
      
      // Reset form or redirect
      
    } catch (error) {
      toast.error('Failed to process donation. Please try again.');
      console.error('Donation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Heart className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Make a Donation</h2>
        <p className="text-gray-600">Your generosity can change a child's life forever</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Donation Amount (USD)
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {predefinedAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAmountSelect(amount)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedAmount === amount
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              step="0.01"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Recurring Donation */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="recurring"
            {...register('isRecurring')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
            Make this a monthly recurring donation
          </label>
        </div>

        {isRecurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              {...register('recurringFrequency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        {/* Anonymous Donation */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            {...register('isAnonymous')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
            Make this donation anonymous
          </label>
        </div>

        {/* Donor Information */}
        {!isAnonymous && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                {...register('donorName', { 
                  required: !isAnonymous ? 'Name is required' : false 
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.donorName && (
                <p className="mt-1 text-sm text-red-600">{errors.donorName.message}</p>
              )}
            </div>
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                {...register('donorEmail', { 
                  required: !isAnonymous ? 'Email is required' : false,
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.donorEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.donorEmail.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <textarea
            placeholder="Leave a message (optional)"
            {...register('message')}
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                paymentMethod === 'stripe'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Credit Card</span>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                paymentMethod === 'paypal'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-blue-600">PayPal</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || (!selectedAmount && !customAmount)}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" />
              <span>
                Donate ${customAmount || selectedAmount || 0}
                {isRecurring && ' Monthly'}
              </span>
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
          <p>Tax-deductible receipt will be sent to your email</p>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;