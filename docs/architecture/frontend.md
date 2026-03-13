# Frontend Architecture

## 📋 Overview

The frontend is a modern React application built with TypeScript, providing a responsive chat interface with AI agents. It uses React Query for state management and Tailwind CSS for styling.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├──────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   App.tsx     │  │ ServiceProvider │  │ React Query│  │
│  └───────────────┘  └─────────────────┘  └────────────┘  │
│         │                   │                  │         │
│  ┌──────▼──────────────────────────────────────▼───────┐ │
│  │            Components Layer                         │ │
│  │  ┌─────────────┐  ┌────────────┐                     │ │
│  │  │ChatInterface│  │  Sidebar   │                     │ │
│  │  └─────────────┘  └────────────┘                     │ │
│  └─────────────────────────────────────────────────────┘ │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │       Services Layer (injected via context)         │ │
│  │  ┌────────────┐  ┌────────────┐                      │ │
│  │  │ ApiService │  │  hooks/    │                      │ │
│  │  │ (baseUrl)  │  │            │                      │ │
│  │  └────────────┘  └────────────┘                      │ │
│  └─────────────────────────────────────────────────────┘ │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │     Backend API – anonymous only (configurable URL) │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - UI framework with hooks and functional components
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **React Router v7** - Client-side routing
- **React Query (TanStack Query)** - Server state management
- **Tailwind CSS** - Utility-first CSS framework

### Key Libraries
- **react-markdown** - Markdown rendering
- **recharts** - Chart visualization
- **@headlessui/react** - Accessible UI components

## 📁 Project Structure

```
ao-chat/
├── src/
│   ├── components/                 # React components
│   │   ├── sidebar/                # Sidebar components
│   │   │   ├── Sidebar.tsx
│   │   │   └── ChatList.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── TextArea.tsx
│   ├── contexts/
│   │   └── ServiceContext.tsx      # ApiService provider (baseUrl)
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useTranslation.ts
│   ├── services/
│   │   ├── api.ts                  # ApiService (anonymous API only)
│   │   └── anonymousChatService.ts # Session storage for chat list
│   ├── types/
│   │   └── api.ts                  # API request/response types
│   ├── utils/
│   ├── styles/
│   │   ├── index.css
│   │   └── markdown.css
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Component Architecture

### Main Components

#### 1. **App.tsx**
- Root component with routing
- Sets up `ServiceProvider` and `QueryClientProvider`
- Single route: `/*` → MainApp (anonymous chat only, no auth)

#### 2. **MainApp** (within App.tsx)
- Main application container
- Manages sidebar state and current chat selection
- Contains `Sidebar` and main content area

#### 3. **ChatInterface** (`components/ChatInterface.tsx`)
- Main chat interface component
- Features:
  - Message display with markdown rendering
  - **Real-time streaming display** - AI responses appear token-by-token
  - "AI is thinking..." indicator before streaming starts
  - **Smooth auto-scroll** during streaming
  - Input area with auto-resize
  - Model selection dropdown (Gemini models)
  - Loading states (`isLoading`, `isStreaming`)
  - Error handling
  - Copy and download message functionality

#### 4. **Sidebar** (`components/sidebar/Sidebar.tsx`)
- Chat navigation sidebar
- Features:
  - List of chats (from session storage)
  - New chat button
  - Chat selection
  - Responsive design (collapsible on mobile)

#### 5. **MarkdownRenderer** (`components/MarkdownRenderer.tsx`)
- Renders markdown content with syntax highlighting
- Supports:
  - Code blocks with syntax highlighting
  - Tables (GFM)
  - Links and images
  - Sanitized HTML for security

## 🔄 State Management

### React Query (TanStack Query)

Used for server state management:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Benefits:**
- Automatic caching
- Background refetching
- Error retry logic
- Loading states

### Custom Hooks

#### **useChat** (`hooks/useChat.ts`)
- Manages chat-related state and operations
- **Supports HTTP streaming** for real-time AI responses
- Provides:
  - `currentChat` - Current chat object
  - `messages` - Messages array
  - `isLoading` - Loading state (true while waiting for response)
  - `isStreaming` - Streaming state (true while receiving chunks)
  - `error` - Error state
  - `createChat()` - Create new chat
  - `loadChat()` - Load existing chat
  - `sendMessage()` - Send message with streaming support
  - `clearError()` - Clear error state
  - `resetChat()` - Reset chat state

**Streaming Flow:**
1. User sends message → `isLoading=true`, `isStreaming=false`
2. First chunk arrives → `isStreaming=true`, message content updates incrementally
3. Streaming completes → `isLoading=false`, `isStreaming=false`

#### **useTranslation** (`hooks/useTranslation.ts`)
- Internationalization support
- Provides `t()` function for translations
- Supports multiple languages (EN, IT, ES, FR, DE)

## 🌐 API Integration

### API Service (`services/api.ts`)

`ApiService` is a configurable class that accepts an `ApiClientConfig`:

```typescript
interface ApiClientConfig {
  baseUrl: string;
}
```

Services are provided via `ServiceProvider` and consumed via `useServices()`. Anonymous-only: no auth or tokens.

Main features:
- Configurable base URL (via `VITE_API_URL` env var or config)
- Error handling
- **HTTP Streaming (SSE)** for AI responses

**Key Methods:**

*REST:*
- `createAnonymousChat(request)` - Create new anonymous chat
- `sendAnonymousMessage(chatId, request)` - Send message (REST)

*Streaming (SSE):*
- `sendAnonymousMessageStream(chatId, request, onChunk, onDone, onError)` - Streaming for AI responses

**Streaming Request Flow:**
```
Component → sendAnonymousMessageStream()
  ↓
POST /anonymous/chats/:id/messages/stream (no auth header)
  ↓
Read response as ReadableStream
  ↓
Parse SSE events (data: {...})
  ↓
Call onChunk() for each chunk → onDone() when complete
```

**SSE Event Types:**
- `chunk`: Partial AI response content
- `done`: Complete message object
- `error`: Error message

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive design with breakpoints
- Custom color palette
- Dark mode support (future)

### Custom Styles
- `styles/index.css` - Global styles
- `styles/markdown.css` - Markdown-specific styles

## 🔒 Security

### Client-Side Security
- JWT token stored in localStorage (HTTPS required in production)
- Token expiration checked before requests
- Automatic logout on token expiration
- Protected routes with `ProtectedRoute` component
- XSS protection in markdown rendering (sanitization)

## 📱 Responsive Design

- **Desktop**: Full sidebar (300px fixed width)
- **Tablet**: Collapsible sidebar
- **Mobile**: Drawer overlay sidebar
- Breakpoints: `sm`, `md`, `lg`, `xl`

## 🚀 Performance Optimizations

1. **React Query Caching**: Reduces unnecessary API calls
2. **Code Splitting**: Lazy loading for routes (future)
3. **Memoization**: React.memo for expensive components
4. **Virtual Scrolling**: For long message lists (future)

## 🧪 Testing

See [Frontend Testing Documentation](../development/testing/frontend-testing.md) for details.

## 📚 Related Documentation

- [Markdown Support](../features/markdown-support.md) - Markdown rendering details
- [Chart Visualization](../features/chart-visualization.md) - Interactive charts
- [Chat Sidebar](../features/chat-sidebar.md) - Sidebar navigation
- [Pastel Colors](../features/pastel-colors.md) - UI color palette

