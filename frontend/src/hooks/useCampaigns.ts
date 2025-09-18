import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';
import { Campaign, CampaignFormData } from '../types';

interface UseCampaignsState {
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  featuredCampaigns: Campaign[];
  currentCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseCampaignsActions {
  getCampaigns: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) => Promise<void>;
  getCampaignById: (id: string) => Promise<Campaign | null>;
  createCampaign: (data: CampaignFormData) => Promise<Campaign | null>;
  updateCampaign: (id: string, data: Partial<CampaignFormData>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
  getActiveCampaigns: () => Promise<void>;
  getFeaturedCampaigns: () => Promise<void>;
  searchCampaigns: (query: string) => Promise<Campaign[]>;
  getCampaignsByCategory: (category: string) => Promise<Campaign[]>;
  updateCampaignStatus: (id: string, status: Campaign['status']) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export interface UseCampaignsReturn extends UseCampaignsState, UseCampaignsActions {}

const initialState: UseCampaignsState = {
  campaigns: [],
  activeCampaigns: [],
  featuredCampaigns: [],
  currentCampaign: null,
  loading: false,
  error: null,
  submitting: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const useCampaigns = (): UseCampaignsReturn => {
  const [state, setState] = useState<UseCampaignsState>(initialState);

  const updateState = useCallback((updates: Partial<UseCampaignsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const getCampaigns = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getCampaigns(params);
      const { campaigns, pagination } = response.data;

      updateState({
        campaigns,
        pagination,
        loading: false,
      });

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch campaigns',
        loading: false,
      });
    }
  }, [updateState]);

  const getCampaignById = useCallback(async (id: string): Promise<Campaign | null> => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getCampaignById(id);
      const campaign = response.data;

      updateState({
        currentCampaign: campaign,
        loading: false,
      });

      return campaign;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch campaign',
        loading: false,
      });
      return null;
    }
  }, [updateState]);

  const createCampaign = useCallback(async (data: CampaignFormData): Promise<Campaign | null> => {
    updateState({ submitting: true, error: null });

    try {
      const response = await apiService.createCampaign(data);
      const campaign = response.data;

      updateState({
        campaigns: [campaign, ...state.campaigns],
        submitting: false,
      });

      toast.success('Campaign created successfully!');
      return campaign;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to create campaign',
        submitting: false,
      });
      toast.error('Failed to create campaign');
      return null;
    }
  }, [state.campaigns, updateState]);

  const updateCampaign = useCallback(async (id: string, data: Partial<CampaignFormData>): Promise<Campaign | null> => {
    updateState({ submitting: true, error: null });

    try {
      const response = await apiService.updateCampaign(id, data);
      const updatedCampaign = response.data;

      updateState({
        campaigns: state.campaigns.map(c => c.id === id ? updatedCampaign : c),
        currentCampaign: state.currentCampaign?.id === id ? updatedCampaign : state.currentCampaign,
        submitting: false,
      });

      toast.success('Campaign updated successfully!');
      return updatedCampaign;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to update campaign',
        submitting: false,
      });
      toast.error('Failed to update campaign');
      return null;
    }
  }, [state.campaigns, state.currentCampaign, updateState]);

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      await apiService.deleteCampaign(id);

      updateState({
        campaigns: state.campaigns.filter(c => c.id !== id),
        activeCampaigns: state.activeCampaigns.filter(c => c.id !== id),
        featuredCampaigns: state.featuredCampaigns.filter(c => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
        submitting: false,
      });

      toast.success('Campaign deleted successfully!');
      return true;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to delete campaign',
        submitting: false,
      });
      toast.error('Failed to delete campaign');
      return false;
    }
  }, [state.campaigns, state.activeCampaigns, state.featuredCampaigns, state.currentCampaign, updateState]);

  const getActiveCampaigns = useCallback(async () => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getCampaigns({ status: 'active' });
      const campaigns = response.data.campaigns;

      updateState({
        activeCampaigns: campaigns,
        loading: false,
      });

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch active campaigns',
        loading: false,
      });
    }
  }, [updateState]);

  const getFeaturedCampaigns = useCallback(async () => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.api.get('/campaigns/featured');
      const campaigns = response.data;

      updateState({
        featuredCampaigns: campaigns,
        loading: false,
      });

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to fetch featured campaigns',
        loading: false,
      });
    }
  }, [updateState]);

  const searchCampaigns = useCallback(async (query: string): Promise<Campaign[]> => {
    try {
      const response = await apiService.getCampaigns({ search: query });
      return response.data.campaigns;

    } catch (error: any) {
      toast.error('Failed to search campaigns');
      return [];
    }
  }, []);

  const getCampaignsByCategory = useCallback(async (category: string): Promise<Campaign[]> => {
    try {
      const response = await apiService.getCampaigns({ category });
      return response.data.campaigns;

    } catch (error: any) {
      toast.error('Failed to fetch campaigns by category');
      return [];
    }
  }, []);

  const updateCampaignStatus = useCallback(async (id: string, status: Campaign['status']): Promise<boolean> => {
    updateState({ submitting: true, error: null });

    try {
      const response = await apiService.api.patch(`/campaigns/${id}/status`, { status });
      const updatedCampaign = response.data;

      updateState({
        campaigns: state.campaigns.map(c => c.id === id ? updatedCampaign : c),
        activeCampaigns: status === 'active' 
          ? [...state.activeCampaigns.filter(c => c.id !== id), updatedCampaign]
          : state.activeCampaigns.filter(c => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? updatedCampaign : state.currentCampaign,
        submitting: false,
      });

      toast.success(`Campaign ${status} successfully!`);
      return true;

    } catch (error: any) {
      updateState({
        error: error.response?.data?.message || 'Failed to update campaign status',
        submitting: false,
      });
      toast.error('Failed to update campaign status');
      return false;
    }
  }, [state.campaigns, state.activeCampaigns, state.currentCampaign, updateState]);

  // Calculate campaign statistics
  const getCampaignStats = useCallback(() => {
    const totalCampaigns = state.campaigns.length;
    const activeCampaigns = state.campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = state.campaigns.filter(c => c.status === 'completed').length;
    
    const totalRaised = state.campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
    const totalGoal = state.campaigns.reduce((sum, c) => sum + c.goalAmount, 0);
    
    const averageProgress = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;
    
    const topCampaign = state.campaigns.reduce((top, campaign) => {
      const progress = (campaign.raisedAmount / campaign.goalAmount) * 100;
      const topProgress = top ? (top.raisedAmount / top.goalAmount) * 100 : 0;
      return progress > topProgress ? campaign : top;
    }, null as Campaign | null);

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalRaised,
      totalGoal,
      averageProgress,
      topCampaign,
    };
  }, [state.campaigns]);

  // Get campaigns by status
  const getCampaignsByStatus = useCallback((status: Campaign['status']) => {
    return state.campaigns.filter(c => c.status === status);
  }, [state.campaigns]);

  // Get urgent campaigns (ending soon)
  const getUrgentCampaigns = useCallback((daysThreshold: number = 7) => {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    
    return state.campaigns.filter(c => {
      const endDate = new Date(c.endDate);
      return c.status === 'active' && endDate <= threshold && endDate > now;
    });
  }, [state.campaigns]);

  // Get campaigns by progress percentage
  const getCampaignsByProgress = useCallback((minProgress: number, maxProgress: number = 100) => {
    return state.campaigns.filter(c => {
      const progress = (c.raisedAmount / c.goalAmount) * 100;
      return progress >= minProgress && progress <= maxProgress;
    });
  }, [state.campaigns]);

  // Auto-refresh active campaigns periodically
  useEffect(() => {
    if (state.activeCampaigns.length > 0) {
      const interval = setInterval(() => {
        getActiveCampaigns();
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [state.activeCampaigns.length, getActiveCampaigns]);

  return {
    ...state,
    getCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getActiveCampaigns,
    getFeaturedCampaigns,
    searchCampaigns,
    getCampaignsByCategory,
    updateCampaignStatus,
    clearError,
    reset,
    // Additional utility methods
    getCampaignStats,
    getCampaignsByStatus,
    getUrgentCampaigns,
    getCampaignsByProgress,
  };
};

export default useCampaigns;