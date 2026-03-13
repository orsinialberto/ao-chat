import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../api';

(globalThis as any).fetch = vi.fn() as unknown as typeof fetch;

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('should create anonymous chat via requestPublic', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockChat })
    });

    const apiService = new ApiService({ baseUrl: '/api' });
    const result = await apiService.createAnonymousChat({ title: 'New Chat' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockChat);
    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      '/api/anonymous/chats',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' })
      })
    );
  });

  it('should return error on failed request', async () => {
    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'SERVER_ERROR', message: 'Internal error' })
    });

    const apiService = new ApiService({ baseUrl: '/api' });
    const result = await apiService.createAnonymousChat({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('SERVER_ERROR');
    expect(result.message).toBe('Internal error');
  });

  it('should handle network error', async () => {
    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network failed'));

    const apiService = new ApiService({ baseUrl: '/api' });
    const result = await apiService.createAnonymousChat({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('NETWORK_ERROR');
  });
});
