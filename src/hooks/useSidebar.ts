import { useState, useCallback, useEffect } from 'react';
import type { Chat } from '../types/api';
import { AnonymousChatService } from '../services/anonymousChatService';

export interface UseSidebarReturn {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<Chat | null>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  createNewChat: () => Promise<Chat | null>;
  addChat: (chat: Chat) => void;
  clearError: () => void;
}

export interface UseSidebarOptions {
  /** @deprecated Single anonymous mode only; option kept for API compatibility */
  isAnonymous?: boolean;
}

export const useSidebar = (_options: UseSidebarOptions = {}): UseSidebarReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const anonymousChats = AnonymousChatService.getChats();
      setChats(anonymousChats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectChat = useCallback(async (chatId: string): Promise<Chat | null> => {
    try {
      const chat = AnonymousChatService.getChat(chatId);
      if (chat) return chat;
      setError('Chat not found');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      AnonymousChatService.updateChat(chatId, { title });
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, title } : chat
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      AnonymousChatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    // Chat is created on first message; no pre-creation
    return null;
  }, []);

  const addChat = useCallback((chat: Chat) => {
    setChats(prev => {
      if (prev.some(c => c.id === chat.id)) return prev;
      return [chat, ...prev];
    });
    AnonymousChatService.addChat(chat);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    isLoading,
    error,
    loadChats,
    selectChat,
    updateChatTitle,
    deleteChat,
    createNewChat,
    addChat,
    clearError
  };
};
