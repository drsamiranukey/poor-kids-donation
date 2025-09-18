import { useState, useCallback, useEffect, useContext, createContext, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';
import { StorageHelpers } from '../utils/helpers';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

export interface UseAuthReturn extends AuthState, AuthActions {}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Auth Context
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = StorageHelpers.getItem<string>('authToken');
      const user = StorageHelpers.getItem<User>('user');

      if (token && user) {
        // Set token in API service
        apiService.setAuthToken(token);
        
        try {
          // Verify token is still valid
          const response = await apiService.getCurrentUser();
          updateState({
            user: response.data,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          // Token is invalid, clear stored data
          StorageHelpers.removeItem('authToken');
          StorageHelpers.removeItem('user');
          updateState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } else {
        updateState({ loading: false });
      }
    };

    initializeAuth();
  }, [updateState]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.login(credentials);
      const { user, token } = response.data;

      // Store auth data
      StorageHelpers.setItem('authToken', token);
      StorageHelpers.setItem('user', user);
      
      // Set token in API service
      apiService.setAuthToken(token);

      updateState({
        user,
        isAuthenticated: true,
        loading: false,
      });

      toast.success(`Welcome back, ${user.firstName}!`);
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.register(data);
      const { user, token } = response.data;

      // Store auth data
      StorageHelpers.setItem('authToken', token);
      StorageHelpers.setItem('user', user);
      
      // Set token in API service
      apiService.setAuthToken(token);

      updateState({
        user,
        isAuthenticated: true,
        loading: false,
      });

      toast.success(`Welcome, ${user.firstName}! Please verify your email.`);
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const logout = useCallback(() => {
    // Clear stored data
    StorageHelpers.removeItem('authToken');
    StorageHelpers.removeItem('user');
    
    // Clear token from API service
    apiService.clearAuthToken();

    updateState({
      user: null,
      isAuthenticated: false,
      error: null,
    });

    toast.success('Logged out successfully');
  }, [updateState]);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    if (!state.user) return false;

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.updateProfile(data);
      const updatedUser = response.data;

      // Update stored user data
      StorageHelpers.setItem('user', updatedUser);

      updateState({
        user: updatedUser,
        loading: false,
      });

      toast.success('Profile updated successfully!');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [state.user, updateState]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      await apiService.changePassword(currentPassword, newPassword);

      updateState({ loading: false });
      toast.success('Password changed successfully!');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      await apiService.forgotPassword(email);

      updateState({ loading: false });
      toast.success('Password reset email sent! Check your inbox.');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      await apiService.resetPassword(token, newPassword);

      updateState({ loading: false });
      toast.success('Password reset successfully! You can now log in.');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response = await apiService.verifyEmail(token);
      const updatedUser = response.data;

      // Update stored user data
      StorageHelpers.setItem('user', updatedUser);

      updateState({
        user: updatedUser,
        loading: false,
      });

      toast.success('Email verified successfully!');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify email';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [updateState]);

  const resendVerification = useCallback(async (): Promise<boolean> => {
    if (!state.user?.email) return false;

    updateState({ loading: true, error: null });

    try {
      await apiService.resendVerification(state.user.email);

      updateState({ loading: false });
      toast.success('Verification email sent! Check your inbox.');
      return true;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email';
      updateState({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage);
      return false;
    }
  }, [state.user?.email, updateState]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiService.refreshToken();
      const { token, user } = response.data;

      // Update stored data
      StorageHelpers.setItem('authToken', token);
      StorageHelpers.setItem('user', user);
      
      // Set new token in API service
      apiService.setAuthToken(token);

      updateState({ user });
      return true;

    } catch (error) {
      // Token refresh failed, logout user
      logout();
      return false;
    }
  }, [updateState, logout]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const token = StorageHelpers.getItem<string>('authToken');
    if (!token) return;

    // Decode JWT to get expiration time (basic implementation)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Refresh token 5 minutes before expiration
      const refreshTime = Math.max(timeUntilExpiration - 5 * 60 * 1000, 0);

      const timeoutId = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, [state.isAuthenticated, refreshToken]);

  const contextValue: UseAuthReturn = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for components that need auth but don't want to throw if not in provider
export const useAuthOptional = (): UseAuthReturn | null => {
  try {
    return useAuth();
  } catch {
    return null;
  }
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show login form
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default useAuth;