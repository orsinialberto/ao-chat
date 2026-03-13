import { useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/sidebar'
import type { Chat } from './types/api'
import { ServiceProvider } from './contexts/ServiceContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

function ThemeFloatingToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      onClick={toggleTheme}
      title={label}
      aria-pressed={theme === 'dark'}
      className="fixed top-6 right-6 z-[60] rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700 transition-colors"
    >
      {theme === 'dark' ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Light
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Dark
        </span>
      )}
    </button>
  )
}

/**
 * Main App Component
 * Sidebar + chat area. Single anonymous mode (no auth).
 */
function MainApp() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [resetKey, setResetKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const addChatToSidebarRef = useRef<((chat: Chat) => void) | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleHomeClick = () => {
    setCurrentChatId(undefined)
    setResetKey(prev => prev + 1)
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleAddChatReady = (addChat: (chat: Chat) => void) => {
    addChatToSidebarRef.current = addChat
  }

  if (location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 overflow-hidden transition-colors">
      <ThemeFloatingToggle />
      <div className="flex h-screen">
        <Sidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onAddChatReady={handleAddChatReady}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onHomeClick={handleHomeClick}
        />

        <main className="flex-1 overflow-hidden flex justify-center items-center py-6">
          <div className="w-full max-w-4xl px-4">
            <ChatInterface
              key={resetKey}
              currentChatId={currentChatId}
              onChatCreated={(chat) => {
                if (addChatToSidebarRef.current) {
                  addChatToSidebarRef.current(chat)
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ServiceProvider>
          <Routes>
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </ServiceProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
