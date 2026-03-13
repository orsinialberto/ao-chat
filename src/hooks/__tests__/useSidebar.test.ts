import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSidebar } from '../useSidebar';

const mockChats = [
  {
    id: '1',
    title: 'Test Chat 1',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: []
  },
  {
    id: '2',
    title: 'Test Chat 2',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: []
  }
];

vi.mock('../../services/anonymousChatService', () => ({
  AnonymousChatService: {
    getChats: vi.fn(() => []),
    getChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn(),
    addChat: vi.fn()
  }
}));

import { AnonymousChatService } from '../../services/anonymousChatService';

describe('useSidebar', () => {
  beforeEach(() => {
    vi.mocked(AnonymousChatService.getChats).mockReturnValue([]);
    vi.clearAllMocks();
  });

  it('should load chats from sessionStorage on mount', async () => {
    vi.mocked(AnonymousChatService.getChats).mockReturnValue(mockChats);

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(AnonymousChatService.getChats).toHaveBeenCalled();
    expect(result.current.chats).toEqual(mockChats);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should create new chat return null (chat created on first message)', async () => {
    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let createdChat;
    await act(async () => {
      createdChat = await result.current.createNewChat();
    });

    expect(createdChat).toBe(null);
  });

  it('should update chat title in sessionStorage', async () => {
    vi.mocked(AnonymousChatService.getChats).mockReturnValue([mockChats[0]]);

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateChatTitle('1', 'New Title');
    });

    expect(AnonymousChatService.updateChat).toHaveBeenCalledWith('1', { title: 'New Title' });
    expect(result.current.chats[0].title).toBe('New Title');
  });

  it('should delete chat from sessionStorage', async () => {
    vi.mocked(AnonymousChatService.getChats).mockReturnValue([mockChats[0]]);

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.chats).toHaveLength(1);

    await act(async () => {
      await result.current.deleteChat('1');
    });

    expect(AnonymousChatService.deleteChat).toHaveBeenCalledWith('1');
    expect(result.current.chats).toHaveLength(0);
  });

  it('should add chat to list and sessionStorage', async () => {
    const newChat = {
      id: '3',
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.addChat(newChat);
    });

    expect(AnonymousChatService.addChat).toHaveBeenCalledWith(newChat);
    expect(result.current.chats).toContainEqual(newChat);
  });

  it('should clear error', async () => {
    vi.mocked(AnonymousChatService.getChats).mockImplementation(() => {
      throw new Error('Test error');
    });

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
