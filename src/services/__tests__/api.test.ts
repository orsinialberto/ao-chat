import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiService } from '../api';
import type { IAuthService } from '../../types/auth';

const mockAuthService: IAuthService = {
  hasToken: vi.fn(),
  isTokenExpired: vi.fn(),
  decodeToken: vi.fn(),
  removeToken: vi.fn(),
  getToken: vi.fn(),
  setToken: vi.fn(),
  isAuthenticated: vi.fn(),
  isOAuthTokenExpired: vi.fn(),
  getUser: vi.fn(),
  logout: vi.fn(),
  getTimeUntilExpiration: vi.fn(),
};

const mockedAuth = vi.mocked(mockAuthService);

// Mock fetch
(globalThis as any).fetch = vi.fn() as unknown as typeof fetch;

function createApiService() {
  return new ApiService({ baseUrl: '/api', authService: mockAuthService });
}

describe('ApiService - Token Expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ((globalThis as any).fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Expiration Handling - Anonymous Mode', () => {
    it('should detect OAuth token expiration and switch to anonymous mode', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(true);
      mockedAuth.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime,
        exp: futureTime
      });

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAUTH_TOKEN_EXPIRED');
      expect(result.message).toBe('OAuth token has expired. You are now using anonymous mode.');
    });

    it('should detect JWT token expiration and switch to anonymous mode', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(true);
      mockedAuth.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime
      });

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
      expect(result.message).toBe('Your session has expired. You are now using anonymous mode.');
    });

    it('should handle expired token when oauthTokenExpiry is not present', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(true);
      mockedAuth.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime
      });

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should handle expired token when decodeToken returns null', async () => {
      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(true);
      mockedAuth.decodeToken.mockReturnValue(null);

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should proceed with request when token is valid', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', title: 'Test Chat' }]
      };

      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(false);
      mockedAuth.getToken.mockReturnValue('valid-token');
      
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe('Backend OAuth Token Expiration Response', () => {
    it('should handle OAUTH_TOKEN_EXPIRED error from backend and switch to anonymous mode', async () => {
      mockedAuth.hasToken.mockReturnValue(true);
      mockedAuth.isTokenExpired.mockReturnValue(false);
      mockedAuth.getToken.mockReturnValue('valid-token');

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'OAUTH_TOKEN_EXPIRED',
          message: 'OAuth token has expired. You are now using anonymous mode.'
        })
      });

      const apiService = createApiService();
      const result = await apiService.getChats();

      expect(mockedAuth.removeToken).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAUTH_TOKEN_EXPIRED');
      expect(result.message).toBe('OAuth token has expired. You are now using anonymous mode.');
    });
  });
});
