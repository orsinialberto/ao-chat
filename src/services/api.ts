import type { IAuthService } from '../types/auth';
import type {
  Chat,
  Message,
  CreateChatRequest,
  CreateMessageRequest,
  ApiResponse,
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ChangePasswordRequest,
} from '../types/api';

export type {
  Chat,
  Message,
  CreateChatRequest,
  CreateMessageRequest,
  ApiResponse,
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ChangePasswordRequest,
};

export interface ApiClientConfig {
  baseUrl: string;
  authService?: IAuthService;
}

export class ApiService {
  private baseUrl: string;
  private auth?: IAuthService;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.auth = config.authService;
  }

  private async requestPublic<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: headers as HeadersInit,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          errorType: data.errorType,
          message: data.message,
          retryAfter: data.retryAfter,
          chatId: data.chatId
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      if (this.auth?.hasToken() && this.auth.isTokenExpired()) {
        const payload = this.auth.decodeToken();
        const isOAuthExpired = payload?.oauthTokenExpiry && 
          Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry;
        
        console.log(isOAuthExpired ? 'OAuth token expired, switching to anonymous mode' : 'Token expired (JWT), switching to anonymous mode');
        this.auth.removeToken();
        
        return {
          success: false,
          error: isOAuthExpired ? 'OAUTH_TOKEN_EXPIRED' : 'TOKEN_EXPIRED',
          message: isOAuthExpired 
            ? 'OAuth token has expired. You are now using anonymous mode.'
            : 'Your session has expired. You are now using anonymous mode.'
        };
      }

      const token = this.auth?.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: headers as HeadersInit,
      });

      const data = await response.json();

      if (response.status === 401) {
        if (data.error === 'OAUTH_TOKEN_EXPIRED') {
          console.log('OAuth token expired, switching to anonymous mode');
          this.auth?.removeToken();
          return {
            success: false,
            error: 'OAUTH_TOKEN_EXPIRED',
            message: data.message || 'OAuth token has expired. You are now using anonymous mode.'
          };
        }
        
        console.log('Unauthorized, switching to anonymous mode');
        this.auth?.removeToken();
        return {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required. You are now using anonymous mode.'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          errorType: data.errorType,
          message: data.message,
          retryAfter: data.retryAfter,
          chatId: data.chatId
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createChat(request: CreateChatRequest): Promise<ApiResponse<Chat>> {
    return this.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChats(): Promise<ApiResponse<Chat[]>> {
    return this.request<Chat[]>('/chats');
  }

  async getChat(chatId: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chats/${chatId}`);
  }

  async sendMessage(chatId: string, request: CreateMessageRequest): Promise<ApiResponse<Message>> {
    return this.request<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateChat(chatId: string, title: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async deleteChat(chatId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  async register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/account', {
      method: 'DELETE',
    });
  }

  async createAnonymousChat(request: CreateChatRequest): Promise<ApiResponse<Chat>> {
    return this.requestPublic<Chat>('/anonymous/chats', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendAnonymousMessage(chatId: string, request: CreateMessageRequest): Promise<ApiResponse<Message>> {
    return this.requestPublic<Message>(`/anonymous/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Authenticated streaming via SSE.
   * Checks token expiry before sending, then reads the SSE stream.
   */
  async sendMessageStream(
    chatId: string,
    request: CreateMessageRequest,
    onChunk: (chunk: string) => void,
    onDone: (message: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (this.auth?.hasToken() && this.auth.isTokenExpired()) {
        this.auth.removeToken();
        onError('Your session has expired. You are now using anonymous mode.');
        return;
      }

      const token = this.auth?.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }

      await this.consumeSSEStream(response, onChunk, onDone, onError);
    } catch (error) {
      console.error('Streaming request failed:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /** Anonymous streaming via SSE (no auth token). */
  async sendAnonymousMessageStream(
    chatId: string,
    request: CreateMessageRequest,
    onChunk: (chunk: string) => void,
    onDone: (message: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${this.baseUrl}/anonymous/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }

      await this.consumeSSEStream(response, onChunk, onDone, onError);
    } catch (error) {
      console.error('Streaming request failed:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async consumeSSEStream(
    response: Response,
    onChunk: (chunk: string) => void,
    onDone: (message: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('No response body');
      return;
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        this.processSSELine(line, onChunk, onDone, onError);
      }
    }

    if (buffer.startsWith('data: ')) {
      this.processSSELine(buffer, onChunk, onDone, onError);
    }
  }

  private processSSELine(
    line: string,
    onChunk: (chunk: string) => void,
    onDone: (message: Message) => void,
    onError: (error: string) => void
  ): void {
    if (!line.startsWith('data: ')) return;
    try {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'chunk') {
        onChunk(data.content);
      } else if (data.type === 'done') {
        onDone(data.message);
      } else if (data.type === 'error') {
        onError(data.error);
      }
    } catch (e) {
      console.error('Failed to parse SSE data:', e);
    }
  }

  async migrateAnonymousChats(chats: Chat[]): Promise<ApiResponse<{ migratedChats: Chat[] }>> {
    return this.request<{ migratedChats: Chat[] }>('/chats/migrate', {
      method: 'POST',
      body: JSON.stringify({ chats }),
    });
  }

  async testGeminiConnection(): Promise<ApiResponse> {
    return this.request('/test/gemini');
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}
