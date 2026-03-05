import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Chat } from '../types/api';
import { AnonymousChatService } from '../services/anonymousChatService';
import { useServices } from './ServiceContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { apiService, authService } = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const userInfo = authService.getUser();
        if (userInfo) {
          setUser({
            id: userInfo.userId,
            username: userInfo.username,
            email: userInfo.email,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [authService]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user && !authService.isAuthenticated()) {
        console.log('Session expired, switching to anonymous mode');
        authService.removeToken();
        setUser(null);
      } else if (authService.hasToken() && authService.isTokenExpired()) {
        const payload = authService.decodeToken();
        const isOAuthExpired = payload?.oauthTokenExpiry && 
          Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry;
        
        console.log(isOAuthExpired 
          ? 'OAuth token expired detected by periodic check, switching to anonymous mode'
          : 'Token expired detected by periodic check, switching to anonymous mode');
        authService.removeToken();
        setUser(null);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, authService]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.newValue === null && user && !authService.hasToken()) {
        console.log('Token removed from storage, switching to anonymous mode');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const checkTokenRemoval = setInterval(() => {
      if (user && !authService.hasToken()) {
        console.log('Token removed, switching to anonymous mode');
        setUser(null);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkTokenRemoval);
    };
  }, [user, authService]);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }> => {
    try {
      const response = await apiService.login({ usernameOrEmail, password });

      if (response.success && response.data) {
        authService.setToken(response.data.token);
        setUser(response.data.user);

        const anonymousChats = AnonymousChatService.getChats();
        let migratedChats: Chat[] = [];
        
        if (anonymousChats.length > 0) {
          try {
            const migrateResponse = await apiService.migrateAnonymousChats(anonymousChats);
            if (migrateResponse.success && migrateResponse.data?.migratedChats) {
              migratedChats = migrateResponse.data.migratedChats;
              AnonymousChatService.clearChats();
            } else {
              console.error('Failed to migrate anonymous chats:', migrateResponse.error);
            }
          } catch (migrateError) {
            console.error('Error migrating anonymous chats:', migrateError);
          }
        }

        return { success: true, migratedChats };
      } else {
        return {
          success: false,
          error: response.message || response.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }> => {
    try {
      const response = await apiService.register({ username, email, password });

      if (response.success && response.data) {
        authService.setToken(response.data.token);
        setUser(response.data.user);

        const anonymousChats = AnonymousChatService.getChats();
        let migratedChats: Chat[] = [];
        
        if (anonymousChats.length > 0) {
          try {
            const migrateResponse = await apiService.migrateAnonymousChats(anonymousChats);
            if (migrateResponse.success && migrateResponse.data?.migratedChats) {
              migratedChats = migrateResponse.data.migratedChats;
              AnonymousChatService.clearChats();
            } else {
              console.error('Failed to migrate anonymous chats:', migrateResponse.error);
            }
          } catch (migrateError) {
            console.error('Error migrating anonymous chats:', migrateError);
          }
        }

        return { success: true, migratedChats };
      } else {
        return {
          success: false,
          error: response.message || response.error || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  const logout = () => {
    apiService.logout().catch(err => console.error('Logout error:', err));
    authService.removeToken();
    
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    
    setUser(null);
    
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
