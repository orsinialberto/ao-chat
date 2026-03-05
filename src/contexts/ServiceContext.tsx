import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ApiService } from '../services/api';
import type { ApiClientConfig } from '../services/api';
import type { IAuthService } from '../types/auth';
import { AuthService } from '../services/authService';

interface ServiceContextType {
  apiService: ApiService;
  authService: IAuthService;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

interface ServiceProviderProps {
  config?: ApiClientConfig;
  children: ReactNode;
}

const DEFAULT_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

/**
 * Provides ApiService and AuthService to the component tree.
 * Pass a custom `config` to override the default backend URL or auth implementation.
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ config, children }) => {
  const value = useMemo<ServiceContextType>(() => {
    const authService = config?.authService ?? new AuthService();
    const baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
    const apiService = new ApiService({ baseUrl, authService });
    return { apiService, authService };
  }, [config]);

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};

export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
