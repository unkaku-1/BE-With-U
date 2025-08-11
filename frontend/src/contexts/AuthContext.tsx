import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'support';
  language: 'ja' | 'zh' | 'en';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// API functions
const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('bewithU-token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('bewithU-refresh-token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('bewithU-token');
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expired');
      }
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('bewithU-token');
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile update failed');
    }

    return response.json();
  },
};

// Context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const tokenManager = {
  getToken: () => localStorage.getItem('bewithU-token'),
  setToken: (token: string) => localStorage.setItem('bewithU-token', token),
  removeToken: () => localStorage.removeItem('bewithU-token'),
  
  getRefreshToken: () => localStorage.getItem('bewithU-refresh-token'),
  setRefreshToken: (token: string) => localStorage.setItem('bewithU-refresh-token', token),
  removeRefreshToken: () => localStorage.removeItem('bewithU-refresh-token'),
  
  getExpiresAt: () => localStorage.getItem('bewithU-expires-at'),
  setExpiresAt: (expiresAt: string) => localStorage.setItem('bewithU-expires-at', expiresAt),
  removeExpiresAt: () => localStorage.removeItem('bewithU-expires-at'),
  
  isTokenExpired: () => {
    const expiresAt = tokenManager.getExpiresAt();
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  },
  
  clearAll: () => {
    tokenManager.removeToken();
    tokenManager.removeRefreshToken();
    tokenManager.removeExpiresAt();
  },
};

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const isAuthenticated = !!user && !!tokenManager.getToken();

  // Login mutation
  const loginMutation = useMutation(authAPI.login, {
    onSuccess: (data) => {
      tokenManager.setToken(data.token);
      tokenManager.setRefreshToken(data.refreshToken);
      tokenManager.setExpiresAt(data.expiresAt);
      setUser(data.user);
      toast.success('ログインしました');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'ログインに失敗しました');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation(authAPI.logout, {
    onSuccess: () => {
      tokenManager.clearAll();
      setUser(null);
      queryClient.clear();
      toast.success('ログアウトしました');
    },
    onError: () => {
      // Clear tokens even if logout request fails
      tokenManager.clearAll();
      setUser(null);
      queryClient.clear();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(authAPI.updateProfile, {
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData('currentUser', updatedUser);
      toast.success('プロフィールを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'プロフィールの更新に失敗しました');
    },
  });

  // Check authentication status
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const token = tokenManager.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (tokenManager.isTokenExpired()) {
        try {
          // Try to refresh token
          const refreshData = await authAPI.refreshToken();
          tokenManager.setToken(refreshData.token);
          tokenManager.setRefreshToken(refreshData.refreshToken);
          tokenManager.setExpiresAt(refreshData.expiresAt);
          setUser(refreshData.user);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          tokenManager.clearAll();
          setUser(null);
        }
      } else {
        // Token is valid, get current user
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
        } catch (userError) {
          // Failed to get user, clear tokens
          tokenManager.clearAll();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenManager.clearAll();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      const expiresAt = tokenManager.getExpiresAt();
      if (!expiresAt) return;

      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      const timeUntilExpiration = expirationTime - currentTime;

      // Refresh token 5 minutes before expiration
      if (timeUntilExpiration <= 5 * 60 * 1000 && timeUntilExpiration > 0) {
        authAPI.refreshToken()
          .then((data) => {
            tokenManager.setToken(data.token);
            tokenManager.setRefreshToken(data.refreshToken);
            tokenManager.setExpiresAt(data.expiresAt);
            setUser(data.user);
          })
          .catch(() => {
            // Refresh failed, logout user
            logoutMutation.mutate();
          });
      }
    };

    // Check immediately and then every minute
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logoutMutation]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

