import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Donation, 
  Campaign, 
  DonationFormData, 
  ContactFormData,
  ApiResponse 
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<ApiResponse<null>> {
    const response = await this.api.post('/auth/logout');
    localStorage.removeItem('authToken');
    return response.data;
  }

  // User methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  async updateUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/users/me', userData);
    return response.data;
  }

  // Campaign methods
  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    const response = await this.api.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.api.get(`/campaigns/${id}`);
    return response.data;
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await this.api.post('/campaigns', campaignData);
    return response.data;
  }

  async updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await this.api.put(`/campaigns/${id}`, campaignData);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<ApiResponse<null>> {
    const response = await this.api.delete(`/campaigns/${id}`);
    return response.data;
  }

  // Donation methods
  async createDonation(donationData: DonationFormData): Promise<ApiResponse<Donation>> {
    const response = await this.api.post('/donations', donationData);
    return response.data;
  }

  async getDonations(userId?: string): Promise<ApiResponse<Donation[]>> {
    const url = userId ? `/donations?userId=${userId}` : '/donations';
    const response = await this.api.get(url);
    return response.data;
  }

  async getDonation(id: string): Promise<ApiResponse<Donation>> {
    const response = await this.api.get(`/donations/${id}`);
    return response.data;
  }

  async updateDonation(id: string, donationData: Partial<Donation>): Promise<ApiResponse<Donation>> {
    const response = await this.api.put(`/donations/${id}`, donationData);
    return response.data;
  }

  // Payment methods
  async createPaymentIntent(amount: number, currency: string = 'USD'): Promise<ApiResponse<{ clientSecret: string }>> {
    const response = await this.api.post('/payments/create-intent', { amount, currency });
    return response.data;
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/payments/confirm', { 
      paymentIntentId, 
      paymentMethodId 
    });
    return response.data;
  }

  // Contact methods
  async submitContactForm(contactData: ContactFormData): Promise<ApiResponse<null>> {
    const response = await this.api.post('/contact', contactData);
    return response.data;
  }

  // Statistics methods
  async getStats(): Promise<ApiResponse<{
    totalDonations: number;
    totalDonors: number;
    totalCampaigns: number;
    totalBeneficiaries: number;
  }>> {
    const response = await this.api.get('/stats');
    return response.data;
  }

  async getCampaignStats(campaignId: string): Promise<ApiResponse<{
    totalAmount: number;
    donorCount: number;
    averageDonation: number;
    recentDonations: Donation[];
  }>> {
    const response = await this.api.get(`/campaigns/${campaignId}/stats`);
    return response.data;
  }

  // Newsletter subscription
  async subscribeNewsletter(email: string): Promise<ApiResponse<null>> {
    const response = await this.api.post('/newsletter/subscribe', { email });
    return response.data;
  }

  async unsubscribeNewsletter(email: string): Promise<ApiResponse<null>> {
    const response = await this.api.post('/newsletter/unsubscribe', { email });
    return response.data;
  }

  // File upload
  async uploadFile(file: File, type: 'campaign' | 'profile' | 'document'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;