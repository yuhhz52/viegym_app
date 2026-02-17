import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/api';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔄 Checking auth status...');
      
      // Try token auth first (for OAuth flow)
      try {
        console.log('📋 Trying token auth...');
        const response = await apiClient.getUserInfo();
        console.log('✅ Token auth successful:', response.result);
        setUser(response.result);
        setIsLoading(false);
        return;
      } catch (tokenError: any) {
        console.log('⚠️ Token auth failed:', tokenError);
        
        // If token is expired (401), try to refresh
        if (tokenError?.status === 401 || tokenError?.isAuthError) {
          console.log('🔄 Token expired, attempting refresh...');
          try {
            const refreshed = await apiClient.refreshToken();
            if (refreshed) {
              console.log('✅ Token refreshed successfully');
              // Try getting user info again
              const response = await apiClient.getUserInfo();
              setUser(response.result);
              setIsLoading(false);
              return;
            }
          } catch (refreshError) {
            console.log('❌ Token refresh failed:', refreshError);
          }
        }
      }

      // Fallback to cookies (alternative OAuth method)
      try {
        console.log('🍪 Trying cookie auth...');
        const userInfo = await apiClient.getMyInfoWithCookies();
        console.log('✅ Cookie auth successful:', userInfo);
        setUser(userInfo);
        setIsLoading(false);
        return;
      } catch (cookieError) {
        console.log('⚠️ Cookie auth failed:', cookieError);
      }

      // No auth method worked
      console.log('❌ All auth methods failed');
      setUser(null);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await apiClient.login({ email, password });
      await checkAuth();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await apiClient.register(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
