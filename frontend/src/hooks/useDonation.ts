import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';
import paymentService from '../services/payment';
import { Donation, DonationFormData, PaymentMethod } from '../types';

interface UseDonationState {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  paymentMethods: PaymentMethod[];
}

interface UseDonationActions {
  createDonation: (data: DonationFormData) => Promise<Donation | null>;
  getDonations: (userId?: string) => Promise<void>;
  getDonationById: (id: string) => Promise<Donation | null>;
  updateDonation: (id: string, data: Partial<Donation>) => Promise<Donation | null>;
  cancelRecurringDonation: (subscriptionId: string) => Promise<boolean>;
  getPaymentMethods: (userId: string) => Promise<void>;
  savePaymentMethod: (paymentMethodId: string, userId: string) => Promise<boolean>;
  deletePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  processRefund: (donationId: string, amount?: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export interface UseDonationReturn extends UseDonationState, UseDonationActions {}

const initialState: UseDonationState = {
  donations: [],
  loading: false,
  error: null,
  submitting: false,
  paymentMethods: [],
};

export const useDonation = (): UseDonationReturn => {
  const [state, setState] = useState<UseDonationState>(initialState);

  const updateState = useCallback((updates: Partial<UseDonationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const createDonation = useCallback(async (data: DonationFormData): Promise<Donation | null> => {
    updateState({ submitting: true, error: null });

    try {
      // Validate donation amount
      if (!paymentService.validateAmount(data.amount * 100)) {
        throw new Error('Invalid donation amount');
      }

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(
        data.amount * 100, // Convert to cents
        data.currency || 'USD'
      );

      // Create donation record
      const donationData = {
        ...data,
        paymentIntentId: paymentIntent.id,
        status: 'pending' as const,
      };

      const response = await apiService.createDonation(donationData);
      const donation = response.data;

      // Update local state
      updateState({
        donations: [donation, ...state.donations],
        submitting: false,
      });

      toast.success('Donation created successfully!');
      return donation;

    } catch (error: any) {
      const errorMessage = paymentService.handlePaymentError(error);
      updateState({ 
        error: errorMessage, 
        submitting: false 
      });
      toast.error(errorMessage);
      return null;
    }
  }, [state.donations, updateState]);

  const getDonations = useCallback(async (userId?: string): Promise<void> => {
    updateState({ loading: true, error: null });

    try {
      const response = userId 
        ? await apiService.getUserDonations(userId)
        : await apiService.getDonations();

      updateState({
        donations: response.data,
        loading: false,
      });

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch donations',
        loading: false,
      });
    }
  }, [updateState]);

  const getDonationById = useCallback(async (id: string): Promise<Donation | null> => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getDonationById(id);
      const donation = response.data;

      // Update donation in local state if it exists
      updateState({
        donations: state.donations.map(d => d.id === id ? donation : d),
        loading: false,
      });

      return donation;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch donation',
        loading: false,
      });
      return null;
    }
  }, [state.donations, updateState]);

  const updateDonation = useCallback(async (id: string, data: Partial<Donation>): Promise<Donation | null> => {
    updateState({ submitting: true, error: null });

    try {
      const response = await apiService.updateDonation(id, data);
      const updatedDonation = response.data;

      // Update local state
      updateState({
        donations: state.donations.map(d => d.id === id ? updatedDonation : d),
        submitting: false,
      });

      toast.success('Donation updated successfully!');
      return updatedDonation;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to update donation',
        submitting: false,
      });
      toast.error('Failed to update donation');
      return null;
    }
  }, [state.donations, updateState]);

  const cancelRecurringDonation = useCallback(async (subscriptionId: string): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      await paymentService.cancelRecurringPayment(subscriptionId);

      // Update local state - mark recurring donations as cancelled
      updateState({
        donations: state.donations.map(d => 
          d.subscriptionId === subscriptionId 
            ? { ...d, status: 'cancelled' as const, isRecurring: false }
            : d
        ),
        submitting: false,
      });

      toast.success('Recurring donation cancelled successfully!');
      return true;

    } catch (error: any) {
      updateState({
        error: error.message || 'Failed to cancel recurring donation',
        submitting: false,
      });
      toast.error('Failed to cancel recurring donation');
      return false;
    }
  }, [state.donations, updateState]);

  const getPaymentMethods = useCallback(async (userId: string): Promise<void> => {
    updateState({ loading: true, error: null });

    try {
      const paymentMethods = await paymentService.getPaymentMethods(userId);
      updateState({
        paymentMethods,
        loading: false,
      });

    } catch (error: any) {
      updateState({
        error: error.message || 'Failed to fetch payment methods',
        loading: false,
      });
    }
  }, [updateState]);

  const savePaymentMethod = useCallback(async (paymentMethodId: string, userId: string): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      const savedMethod = await paymentService.savePaymentMethod(paymentMethodId, userId);
      
      updateState({
        paymentMethods: [...state.paymentMethods, savedMethod],
        submitting: false,
      });

      toast.success('Payment method saved successfully!');
      return true;

    } catch (error: any) {
      updateState({
        error: error.message || 'Failed to save payment method',
        submitting: false,
      });
      toast.error('Failed to save payment method');
      return false;
    }
  }, [state.paymentMethods, updateState]);

  const deletePaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      await paymentService.deletePaymentMethod(paymentMethodId);
      
      updateState({
        paymentMethods: state.paymentMethods.filter(pm => pm.id !== paymentMethodId),
        submitting: false,
      });

      toast.success('Payment method deleted successfully!');
      return true;

    } catch (error: any) {
      updateState({
        error: error.message || 'Failed to delete payment method',
        submitting: false,
      });
      toast.error('Failed to delete payment method');
      return false;
    }
  }, [state.paymentMethods, updateState]);

  const processRefund = useCallback(async (donationId: string, amount?: number): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      const response = await apiService.api.post(`/donations/${donationId}/refund`, {
        amount: amount ? amount * 100 : undefined, // Convert to cents if provided
      });

      // Update local state
      const refundedDonation = response.data;
      updateState({
        donations: state.donations.map(d => 
          d.id === donationId ? refundedDonation : d
        ),
        submitting: false,
      });

      toast.success('Refund processed successfully!');
      return true;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to process refund',
        submitting: false,
      });
      toast.error('Failed to process refund');
      return false;
    }
  }, [state.donations, updateState]);

  // Calculate donation statistics
  const getDonationStats = useCallback(() => {
    const totalAmount = state.donations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);

    const totalDonations = state.donations.filter(d => d.status === 'completed').length;
    
    const recurringDonations = state.donations.filter(d => d.isRecurring && d.status !== 'cancelled').length;
    
    const thisMonthDonations = state.donations.filter(d => {
      const donationDate = new Date(d.createdAt);
      const now = new Date();
      return donationDate.getMonth() === now.getMonth() && 
             donationDate.getFullYear() === now.getFullYear() &&
             d.status === 'completed';
    });

    const thisMonthAmount = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalAmount,
      totalDonations,
      recurringDonations,
      thisMonthAmount,
      thisMonthCount: thisMonthDonations.length,
      averageDonation: totalDonations > 0 ? totalAmount / totalDonations : 0,
    };
  }, [state.donations]);

  // Get donations by status
  const getDonationsByStatus = useCallback((status: Donation['status']) => {
    return state.donations.filter(d => d.status === status);
  }, [state.donations]);

  // Get recent donations
  const getRecentDonations = useCallback((limit: number = 5) => {
    return state.donations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [state.donations]);

  return {
    ...state,
    createDonation,
    getDonations,
    getDonationById,
    updateDonation,
    cancelRecurringDonation,
    getPaymentMethods,
    savePaymentMethod,
    deletePaymentMethod,
    processRefund,
    clearError,
    reset,
    // Additional utility methods
    getDonationStats,
    getDonationsByStatus,
    getRecentDonations,
  };
};

export default useDonation;