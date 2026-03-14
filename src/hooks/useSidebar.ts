import { useState, useCallback, useEffect } from 'react';
import type { Chat } from '../types/api';
import { AnonymousChatService } from '../services/anonymousChatService';

export interface UseSidebarReturn {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  addChat: (chat: Chat) => void;
  clearError: () => void;
}

export const useSidebar = (): UseSidebarReturn => {
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
    updateChatTitle,
    deleteChat,
    addChat,
    clearError
  };
};
