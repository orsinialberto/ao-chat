import type {
  Chat,
  Message,
  CreateChatRequest,
  CreateMessageRequest,
  ApiResponse,
} from '../types/api';

export type {
  Chat,
  Message,
  CreateChatRequest,
  CreateMessageRequest,
  ApiResponse,
};

export interface ApiClientConfig {
  baseUrl: string;
}

export class ApiService {
  private baseUrl: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
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
}
