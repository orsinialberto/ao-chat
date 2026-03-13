# Architecture

High-level architecture of the AO Chat frontend: a React SPA for anonymous AI chat, backend-agnostic and driven by a streaming API.

## Overview

- **Type**: Single-page application (SPA), React 18 + TypeScript.
- **Mode**: Anonymous only; no authentication. Chats are created and sent via the anonymous API; the client keeps a local copy in session storage for the sidebar and current view.
- **Backend**: Any HTTP backend that implements the API contract (see `api-implementation.md`) for creating chats and streaming messages.

## Tech stack

- **Build**: Vite
- **UI**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS (+ custom CSS for chat and markdown)
- **Routing**: React Router v6
- **Data / API**: Fetch API via `ApiService`, React Query as infrastructure (used for future data fetching needs)
- **State**: React state + context (theme, services) and session storage (chat list)

## Directory layout

```text
src/
├── main.tsx                 # Entry: React root, QueryClient, global styles
├── App.tsx                  # Router, ThemeProvider, ServiceProvider, MainApp (layout)
├── components/              # UI components
│   ├── ChatInterface.tsx    # Main chat area: message list + input, uses useChat
│   ├── MarkdownRenderer.tsx # Renders assistant markdown (GFM, code, charts, maps)
│   ├── ChartRenderer.tsx    # Recharts-based charts from markdown code blocks
│   ├── MapRenderer.tsx      # Leaflet maps from markdown code blocks
│   ├── Dialog.tsx, TextArea.tsx
│   └── sidebar/             # Chat list, new chat, delete modal
├── contexts/
│   ├── ServiceContext.tsx   # Provides ApiService (injectable baseUrl)
│   └── ThemeContext.tsx     # Light/dark theme (localStorage + system preference)
├── hooks/
│   ├── useChat.ts           # Chat lifecycle: create, load, send message, streaming + typewriter
│   ├── useSidebar.ts        # Sidebar state and actions (chat list, select, rename, delete)
│   └── useTranslation.ts    # Thin wrapper over i18n for UI strings
├── services/
│   ├── api.ts               # ApiService: createAnonymousChat, sendAnonymousMessageStream (SSE)
│   └── anonymousChatService.ts  # Session-storage persistence for chat list
├── types/
│   └── api.ts               # Chat, Message, CreateChatRequest, CreateMessageRequest, ApiResponse
├── utils/
│   └── i18n.ts              # Simple i18n (detect language, translations, t())
└── styles/
    ├── index.css            # Tailwind + global and theme styles
    └── markdown.css         # Markdown content styles
```

## Data flow

### 1. Entry and providers

- `main.tsx` mounts the React app with `ReactDOM.createRoot`, wraps it in `QueryClientProvider`, and loads global CSS.
- `App.tsx` wraps the routed app tree in:
  - `ThemeProvider` (global light/dark theme)
  - `Router` (React Router)
  - `ServiceProvider` (provides `ApiService` with the correct base URL)

### 2. Layout and routing

- `MainApp` (inside `App.tsx`) manages:
  - `currentChatId`: which chat is currently active.
  - `resetKey`: used to reset `ChatInterface` when starting a completely new conversation.
  - `sidebarOpen`: toggleable sidebar visibility.
  - A ref callback from the sidebar to allow the chat area to push newly created chats into the sidebar list.
- React Router is effectively used with a single route (`/`); navigation is simple and always redirects back to `/`.

### 3. Sidebar and chat list

- `Sidebar` uses the `useSidebar` hook:
  - Loads chats from `AnonymousChatService.getChats()` (session storage) on startup.
  - Exposes actions to select, rename, delete, and add chats.
- `AnonymousChatService` is responsible for persisting chats in `sessionStorage`:
  - Serializes `Chat` and `Message` objects, converting `Date` to ISO strings.
  - On load, reconstructs `Date` instances from ISO strings.
  - Provides `getChats`, `getChat`, `addChat`, `updateChat`, `deleteChat`, and `clearChats`.

### 4. Chat area and messaging

- `ChatInterface` is the main chat UI:
  - Uses `useChat` to manage `currentChat`, `messages`, `isLoading`, `isStreaming`, and errors.
  - Renders messages using `MarkdownRenderer` (for assistant messages) and simple styled bubbles for user messages.
  - Provides a `TextArea` input with auto-resize and keyboard shortcuts (e.g. Enter to send).
- `useChat` orchestrates the chat lifecycle:
  - Uses `ApiService` (via `useServices`) for HTTP calls.
  - Uses `AnonymousChatService` to keep the sidebar’s chat list in sync with the latest messages and timestamps.
  - **createChat**:
    - Optionally displays the user’s first message immediately as a temporary message.
    - Calls `ApiService.createAnonymousChat` to create a new chat on the backend.
    - On success, stores the chat in `AnonymousChatService` and, if there was an initial message, sends it via the streaming endpoint.
  - **loadChat**:
    - Fetches a chat from `AnonymousChatService` by id and sets it as `currentChat`.
  - **sendMessage**:
    - When a chat is active, sends a new user message via `ApiService.sendAnonymousMessageStream`.
    - Handles streaming chunks with a typewriter effect: chunks are buffered, then appended to a streaming assistant message until the backend signals `done`.
    - On completion, replaces the temporary streaming message with the final `Message` from the backend and updates `AnonymousChatService`.

### 5. Backend communication

All network traffic is centralized in `ApiService` (`src/services/api.ts`):

- `requestPublic<T>`: internal helper that wraps `fetch`, normalizes JSON responses, and returns an `ApiResponse<T>` with `success`/`error`/`message` fields.
- `createAnonymousChat(request: CreateChatRequest)`:
  - `POST /anonymous/chats` with the chat title (and optional `initialMessage` for backend use).
  - Returns `ApiResponse<Chat>`.
- `sendAnonymousMessageStream(chatId, request, onChunk, onDone, onError)`:
  - `POST /anonymous/chats/:chatId/messages/stream` with a `CreateMessageRequest`.
  - Consumes a server-sent event–style stream:
    - `chunk` events (partial content)
    - `done` event (final assistant `Message`)
    - `error` events

The base URL is configured in `ServiceContext`:

- In development: `baseUrl = '/api'` (proxied by Vite to `VITE_API_PROXY_TARGET`).
- In production: `baseUrl = VITE_API_URL` or `http://localhost:3001/api` if not set.

## Cross-cutting concerns

### Theming

- `ThemeContext` manages a global `theme` state (`light` or `dark`).
- The theme is:
  - Read from `localStorage` on startup.
  - If not previously set, inferred from the system preference via `window.matchMedia`.
  - Persisted back to `localStorage` when changed.
- The provider toggles the `dark` class on `document.documentElement`, allowing Tailwind’s `dark:` variants to take effect.
- A floating button in `App.tsx` lets the user switch between light and dark modes.

### Internationalization

- `utils/i18n.ts` implements a small i18n system:
  - Detects browser language.
  - Provides translation dictionaries.
  - Exposes a `t(key)` function.
- `useTranslation` is a hook that returns `{ t }` for components.
- Error messages and some UI text in `useChat` and `ChatInterface` use `t()` for localization.

### Testing

- Unit and component tests are written with Vitest and Testing Library:
  - `src/services/__tests__/api.test.ts`: tests `ApiService` behavior.
  - `src/hooks/__tests__/useSidebar.test.ts`: tests sidebar logic using a mocked `AnonymousChatService`.
  - `src/components/sidebar/__tests__/*.test.tsx`: tests sidebar UI and interactions.
  - `src/components/__tests__/ChartRenderer.test.tsx` and `MarkdownRenderer.test.tsx`: ensure chart and markdown rendering work as expected.

## Configuration and environment

- `.env.example` exposes two main variables:
  - `VITE_API_URL`: backend API base URL for production builds.
  - `VITE_API_PROXY_TARGET`: backend target for Vite’s dev proxy.
- `vite.config.ts` configures:
  - An alias `@` to `src`.
  - A dev server proxy for `/api` → `VITE_API_PROXY_TARGET`.
  - Bundle splitting for large vendors (React, markdown, charts, maps).

## Integration points

To integrate a backend with this frontend:

- Implement the endpoints and formats described in `api-implementation.md`.
- Configure `VITE_API_URL` / `VITE_API_PROXY_TARGET` as needed.
- Optionally extend or replace the anonymous API with authenticated endpoints by adding new methods in `ApiService` and wiring them into `useChat` or new hooks.

