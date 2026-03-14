import React from 'react';
import { ChatList } from './ChatList';
import { useSidebar } from '../../hooks/useSidebar';
import { Chat } from '../../services/api';

interface SidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAddChatReady?: (addChat: (chat: Chat) => void) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  onHomeClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentChatId,
  onChatSelect,
  onNewChat,
  onAddChatReady,
  isOpen = true,
  onToggle,
  onHomeClick
}) => {
  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      onNewChat();
    }
  };

  const {
    chats,
    isLoading,
    error,
    updateChatTitle,
    deleteChat,
    createNewChat,
    addChat,
    clearError
  } = useSidebar();

  const showEmptyState = !isLoading && !error && chats.length === 0;

  // Expose addChat to parent component
  React.useEffect(() => {
    if (onAddChatReady) {
      onAddChatReady(addChat);
    }
  }, [onAddChatReady, addChat]);

  const handleChatSelect = (chatId: string) => {
    // Just notify parent - ChatInterface will load the chat data
    // This avoids duplicate API calls
    onChatSelect(chatId);
  };

  const handleNewChat = async () => {
    await createNewChat();
    onNewChat();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        data-sidebar
        className={`
          fixed top-0 left-0 h-screen bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'w-72' : 'w-14'}
          overflow-hidden
        `}>
        <div className="flex flex-col h-full relative group/sidebar">
          {isOpen ? (
            <>
              {/* Header & quick actions */}
              <div className="pl-4 pr-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleHomeClick}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group/logo"
                    title="Go to home"
                  >
                    <img 
                      src="/images/ai-icon.png" 
                      alt="AI" 
                      className="w-10 h-10 group-hover/logo:scale-105 transition-transform"
                    />
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Workspace</p>
                      <span className="text-2xl font-light text-gray-800 dark:text-gray-100 tracking-wider whitespace-nowrap">AI Agent</span>
                    </div>
                  </button>

                  <div className="flex items-center -mr-4">
                    {onToggle && (
                      <button
                        onClick={onToggle}
                        className="sidebar-ghost-btn"
                        title="Close sidebar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="-ml-4 -mr-6 h-px bg-gray-200 dark:bg-gray-700/70" />

                <div className="space-y-1.5">
                  <button
                    onClick={handleNewChat}
                    className="sidebar-minimal-btn"
                    title="New Chat"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      New Chat
                    </span>
                  </button>
                </div>
              </div>

              {/* Chats Title */}
              <div className="pl-4 pr-6 pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Chats</p>
                <h1 className="text-lg font-medium text-gray-800 dark:text-gray-100">Inbox</h1>
              </div>
            </>
          ) : (
            <>
              {/* Header quando chiusa */}
              <div className="pt-4 pb-4 flex flex-col items-center gap-2">
                {/* AI Icon Button - torna alla home */}
                <button
                  onClick={handleHomeClick}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors group/logo"
                  title="Go to home"
                >
                  <img 
                    src="/images/ai-icon.png" 
                    alt="AI" 
                    className="w-8 h-8 group-hover/logo:scale-110 transition-transform"
                  />
                </button>

                {/* Toggle Button - sempre visibile quando chiusa */}
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Open sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {isOpen && (
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {showEmptyState ? (
                <div className="pl-4 pr-6 py-8 text-center text-gray-400 dark:text-gray-500">
                  <p className="text-sm">No chats yet</p>
                  <p className="text-xs mt-1">Create your first chat to get started</p>
                </div>
              ) : (
                <ChatList
                  chats={chats}
                  currentChatId={currentChatId}
                  isLoading={isLoading}
                  error={error}
                  onChatSelect={handleChatSelect}
                  onUpdateTitle={updateChatTitle}
                  onDeleteChat={deleteChat}
                  onClearError={clearError}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
