import { jwtDecode } from 'jwt-decode';
import type { IAuthService, JWTPayload } from '../types/auth';

const DEFAULT_TOKEN_KEY = 'ai_agent_jwt';

export class AuthService implements IAuthService {
  private tokenKey: string;

  constructor(tokenKey: string = DEFAULT_TOKEN_KEY) {
    this.tokenKey = tokenKey;
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }

  decodeToken(): JWTPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  isOAuthTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload || !payload.oauthToken || !payload.oauthTokenExpiry) {
      // No OAuth token, so it's not expired (not applicable)
      return false;
    }

    // oauthTokenExpiry is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.oauthTokenExpiry;
  }

  isTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    const jwtExpired = payload.exp < currentTime;
    const oauthExpired = this.isOAuthTokenExpired();
    return jwtExpired || oauthExpired;
  }

  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  getUser(): { userId: string; username: string; email: string } | null {
    const payload = this.decodeToken();
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    };
  }

  logout(): void {
    this.removeToken();
  }

  getTimeUntilExpiration(): number | null {
    const payload = this.decodeToken();
    if (!payload) {
      return null;
    }

    const currentTime = Date.now() / 1000;
    const timeRemaining = payload.exp - currentTime;
    return timeRemaining > 0 ? timeRemaining : 0;
  }
}

export const authService = new AuthService();

