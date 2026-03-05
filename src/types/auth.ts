export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  oauthToken?: string;
  oauthTokenExpiry?: number;
  exp: number;
}

export interface IAuthService {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  hasToken(): boolean;
  isAuthenticated(): boolean;
  isTokenExpired(): boolean;
  isOAuthTokenExpired(): boolean;
  decodeToken(): JWTPayload | null;
  getUser(): { userId: string; username: string; email: string } | null;
  logout(): void;
  getTimeUntilExpiration(): number | null;
}
