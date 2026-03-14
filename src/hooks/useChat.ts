import { useState, useCallback, useRef } from 'react';
import type { Chat, Message, CreateChatRequest, CreateMessageRequest, ApiResponse } from '../types/api';
import { AnonymousChatService } from '../services/anonymousChatService';
import { useServices } from '../contexts/ServiceContext';
import { t } from '../utils/i18n';

export interface UseChatReturn {
  // State
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Actions
  createChat: (request: CreateChatRequest) => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

/**
 * Convert API error response to localized error message
 */
function getErrorMessage(response: ApiResponse<any>, context: 'send' | 'load' | 'create'): string {
  // Handle specific error types
  if (response.errorType === 'LLM_UNAVAILABLE') {
    return context === 'create' 
      ? t('errors.llm_unavailable_on_create')
      : t('errors.llm_unavailable');
  }
  
  if (response.error === 'NETWORK_ERROR') {
    return t('errors.network_error');
  }
  
  // Use backend message if available, otherwise use localized defaults
  if (response.message) {
    return response.message;
  }
  
  // Fallback to context-specific errors
  switch (context) {
    case 'send':
    case 'create':
      return t('errors.failed_to_send');
    case 'load':
      return t('errors.failed_to_load');
    default:
      return t('errors.unknown_error');
  }
}

// Typewriter configuration
const TYPEWRITER_CHAR_DELAY_MS = 20;
const TYPEWRITER_CHUNK_SIZE = 2;

export const useChat = (): UseChatReturn => {
  const { apiService } = useServices();
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamingMessageIdRef = useRef<string | null>(null);
  
  // Refs for typewriter effect
  const pendingTextRef = useRef<string>(''); // Text waiting to be typed
  const displayedTextRef = useRef<string>(''); // Text already displayed
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingCompleteRef = useRef<boolean>(false); // Backend finished sending
  const finalMessageRef = useRef<Message | null>(null); // Final message from backend

  const createChat = useCallback(async (request: CreateChatRequest) => {
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    // Reset typewriter state
    pendingTextRef.current = '';
    displayedTextRef.current = '';
    streamingCompleteRef.current = false;
    finalMessageRef.current = null;
    
    const initialMessage = request.initialMessage?.trim();
    
    // Add user message immediately if initialMessage is provided
    let tempUserMessage: Message | null = null;
    if (initialMessage) {
      tempUserMessage = {
        id: `temp_${Date.now()}`,
        chatId: '', // Will be updated when chat is created
        role: 'user',
        content: initialMessage,
        createdAt: new Date()
      };
      setMessages([tempUserMessage]);
    }
    
    try {
      // Create chat WITHOUT initial message (we'll send it via streaming)
      const createRequest: CreateChatRequest = {
        title: request.title
        // Don't include initialMessage - we'll stream it
      };
      
      const response = await apiService.createAnonymousChat(createRequest);
      
      if (response.success && response.data) {
        const chat = response.data;
        setCurrentChat(chat);
        AnonymousChatService.addChat(chat);
        
        // If there's an initial message, send it via streaming with typewriter
        if (initialMessage) {
          // Update temp user message with correct chatId
          const userMessage: Message = {
            ...tempUserMessage!,
            chatId: chat.id
          };
          
          // Create placeholder for streaming assistant message
          const streamingMessageId = `streaming_${Date.now()}`;
          streamingMessageIdRef.current = streamingMessageId;

          const streamingMessage: Message = {
            id: streamingMessageId,
            chatId: chat.id,
            role: 'assistant',
            content: '',
            createdAt: new Date()
          };
          
          setMessages([userMessage, streamingMessage]);
          
          const messageRequest: CreateMessageRequest = {
            chatId: chat.id,
            content: initialMessage,
            role: 'user'
          };
          
          // Typewriter tick function for initial message
          const typewriterTick = () => {
            if (pendingTextRef.current.length > 0) {
              const chars = pendingTextRef.current.slice(0, TYPEWRITER_CHUNK_SIZE);
              pendingTextRef.current = pendingTextRef.current.slice(TYPEWRITER_CHUNK_SIZE);
              displayedTextRef.current += chars;
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === streamingMessageIdRef.current
                    ? { ...msg, content: displayedTextRef.current }
                    : msg
                )
              );
            } else if (streamingCompleteRef.current && finalMessageRef.current) {
              if (typewriterIntervalRef.current) {
                clearInterval(typewriterIntervalRef.current);
                typewriterIntervalRef.current = null;
              }
              
              const finalMsg = finalMessageRef.current;
              setMessages(prev => {
                const newMessages = prev.map(msg => 
                  msg.id === streamingMessageIdRef.current ? finalMsg : msg
                );
                const updatedChat: Chat = {
                  ...chat,
                  messages: newMessages,
                  updatedAt: new Date()
                };
                AnonymousChatService.updateChat(chat.id, updatedChat);
                setCurrentChat(updatedChat);
                return newMessages;
              });

              streamingMessageIdRef.current = null;
              setIsStreaming(false);
              setIsLoading(false);
            }
          };

          const startTypewriter = () => {
            if (!typewriterIntervalRef.current) {
              typewriterIntervalRef.current = setInterval(typewriterTick, TYPEWRITER_CHAR_DELAY_MS);
            }
          };
          
          const onChunk = (chunk: string) => {
            setIsStreaming(true);
            pendingTextRef.current += chunk;
            startTypewriter();
          };
          
          const onDone = (finalMessage: Message) => {
            streamingCompleteRef.current = true;
            finalMessageRef.current = finalMessage;
            
            if (!typewriterIntervalRef.current) {
              setMessages(prev => {
                const newMessages = prev.map(msg => 
                  msg.id === streamingMessageIdRef.current ? finalMessage : msg
                );
                const updatedChat: Chat = {
                  ...chat,
                  messages: newMessages,
                  updatedAt: new Date()
                };
                AnonymousChatService.updateChat(chat.id, updatedChat);
                setCurrentChat(updatedChat);
                return newMessages;
              });

              streamingMessageIdRef.current = null;
              setIsStreaming(false);
              setIsLoading(false);
            }
          };

          const onError = (errorMsg: string) => {
            if (typewriterIntervalRef.current) {
              clearInterval(typewriterIntervalRef.current);
              typewriterIntervalRef.current = null;
            }
            pendingTextRef.current = '';
            displayedTextRef.current = '';
            streamingCompleteRef.current = false;
            finalMessageRef.current = null;
            
            // Keep user message but remove streaming message
            setMessages(prev => prev.filter(msg =>
              msg.id !== streamingMessageIdRef.current
            ));
            streamingMessageIdRef.current = null;
            setError(errorMsg);
            setIsStreaming(false);
            setIsLoading(false);
          };

          try {
            await apiService.sendAnonymousMessageStream(chat.id, messageRequest, onChunk, onDone, onError);
          } catch (err) {
            onError(t('errors.unknown_error'));
          }
        } else {
          // No initial message, just set the empty chat
          setMessages(chat.messages || []);
          setIsLoading(false);
        }
      } else {
        // Remove temp message on error
        if (tempUserMessage) {
          setMessages([]);
        }
        
        if (response.chatId) {
          const savedChat = AnonymousChatService.getChat(response.chatId);
          if (savedChat) {
            setCurrentChat(savedChat);
            setMessages(savedChat.messages || []);
          }
        }
        
        setError(getErrorMessage(response, 'create'));
        setIsLoading(false);
      }
    } catch (err) {
      if (tempUserMessage) {
        setMessages([]);
      }
      setError(t('errors.unknown_error'));
      setIsLoading(false);
    }
  }, [apiService]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentChat || !content.trim()) return;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    // Reset typewriter state
    pendingTextRef.current = '';
    displayedTextRef.current = '';
    streamingCompleteRef.current = false;
    finalMessageRef.current = null;

    // Add user message immediately
    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      chatId: currentChat.id,
      role: 'user',
      content: content.trim(),
      createdAt: new Date()
    };

    // Create placeholder for streaming assistant message
    const streamingMessageId = `streaming_${Date.now()}`;
    streamingMessageIdRef.current = streamingMessageId;

    const streamingMessage: Message = {
      id: streamingMessageId,
      chatId: currentChat.id,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage, streamingMessage]);

    const request: CreateMessageRequest = {
      chatId: currentChat.id,
      content: content.trim(),
      role: 'user'
    };

    // Typewriter tick function - releases characters one at a time
    const typewriterTick = () => {
      if (pendingTextRef.current.length > 0) {
        // Take next character(s) from pending buffer
        const chars = pendingTextRef.current.slice(0, TYPEWRITER_CHUNK_SIZE);
        pendingTextRef.current = pendingTextRef.current.slice(TYPEWRITER_CHUNK_SIZE);
        displayedTextRef.current += chars;
        
        // Update message with displayed text
        setMessages(prev => 
          prev.map(msg => 
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: displayedTextRef.current }
              : msg
          )
        );
      } else if (streamingCompleteRef.current && finalMessageRef.current) {
        // No more pending text and streaming is complete - finalize
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        
        const finalMsg = finalMessageRef.current;
        setMessages(prev => {
          const newMessages = prev.map(msg => 
            msg.id === streamingMessageIdRef.current ? finalMsg : msg
          );
          
          if (currentChat) {
            const updatedChat: Chat = {
              ...currentChat,
              messages: newMessages,
              updatedAt: new Date()
            };
            AnonymousChatService.updateChat(currentChat.id, updatedChat);
            setCurrentChat(updatedChat);
          }
          return newMessages;
        });

        streamingMessageIdRef.current = null;
        setIsStreaming(false);
        setIsLoading(false);
      }
    };

    // Start typewriter interval
    const startTypewriter = () => {
      if (!typewriterIntervalRef.current) {
        typewriterIntervalRef.current = setInterval(typewriterTick, TYPEWRITER_CHAR_DELAY_MS);
      }
    };

    const onChunk = (chunk: string) => {
      // Set streaming to true on first chunk received
      setIsStreaming(true);
      
      // Add chunk to pending buffer
      pendingTextRef.current += chunk;
      
      // Start typewriter if not already running
      startTypewriter();
    };

    const onDone = (finalMessage: Message) => {
      // Mark streaming as complete and store final message
      streamingCompleteRef.current = true;
      finalMessageRef.current = finalMessage;
      
      // If typewriter is not running (no chunks received), finalize immediately
      if (!typewriterIntervalRef.current) {
        setMessages(prev => {
          const newMessages = prev.map(msg => 
            msg.id === streamingMessageIdRef.current ? finalMessage : msg
          );
          
          if (currentChat) {
            const updatedChat: Chat = {
              ...currentChat,
              messages: newMessages,
              updatedAt: new Date()
            };
            AnonymousChatService.updateChat(currentChat.id, updatedChat);
            setCurrentChat(updatedChat);
          }
          return newMessages;
        });

        streamingMessageIdRef.current = null;
        setIsStreaming(false);
        setIsLoading(false);
      }
      // Otherwise, typewriter will finalize when pending buffer is empty
    };

    const onError = (errorMsg: string) => {
      // Stop typewriter and clear state
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
      pendingTextRef.current = '';
      displayedTextRef.current = '';
      streamingCompleteRef.current = false;
      finalMessageRef.current = null;
      
      // Remove streaming message on error
      setMessages(prev => prev.filter(msg =>
        msg.id !== streamingMessageIdRef.current && msg.id !== userMessage.id
      ));
      streamingMessageIdRef.current = null;
      setError(errorMsg);
      setIsStreaming(false);
      setIsLoading(false);
    };

    try {
      await apiService.sendAnonymousMessageStream(currentChat.id, request, onChunk, onDone, onError);
    } catch (err) {
      onError(t('errors.unknown_error'));
    }
  }, [currentChat, apiService]);

  const loadChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const chat = AnonymousChatService.getChat(chatId);
      if (chat) {
        setCurrentChat(chat);
        setMessages(chat.messages || []);
      } else {
        setError(t('errors.failed_to_load'));
      }
    } catch (err) {
      setError(t('errors.unknown_error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetChat = useCallback(() => {
    setCurrentChat(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    currentChat,
    messages,
    isLoading,
    isStreaming,
    error,
    createChat,
    loadChat,
    sendMessage,
    clearError,
    resetChat
  };
};
