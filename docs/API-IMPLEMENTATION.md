# API implementation guide

This document describes the API contracts the frontend expects for anonymous chat. A backend that implements these endpoints and response formats is compatible with the app.

## Base URL and configuration

- **Development**: Requests go to `/api`; Vite proxies them to the backend (e.g. `http://localhost:3001`). Configure with `VITE_API_PROXY_TARGET` in `.env`.
- **Production**: The frontend calls the URL in `VITE_API_URL` directly (e.g. `http://localhost:3001/api`).

All requests use `Content-Type: application/json`.

---

## 1. Create anonymous chat

**`POST /api/anonymous/chats`**

Creates a new anonymous chat.

### Request body

```json
{
  "title": "optional",
  "initialMessage": "optional"
}
```

- `title` (string, optional): Chat title.
- `initialMessage` (string, optional): The frontend does not send the first user message here; it creates the chat then sends the first message via the stream endpoint. You can use this field for other purposes (e.g. server-side title generation) if needed.

### Success response (200)

```json
{
  "success": true,
  "data": {
    "id": "chat-uuid-or-id",
    "title": "Optional title",
    "createdAt": "2025-03-13T12:00:00.000Z",
    "updatedAt": "2025-03-13T12:00:00.000Z",
    "messages": []
  }
}
```

`data` must be a **Chat** object: `id` (string), optional `title`, `createdAt` and `updatedAt` (ISO date strings), optional `messages` (array of **Message**).

### Error response (4xx/5xx)

JSON body in **ApiResponse** shape (no `data`):

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "errorType": "optional",
  "retryAfter": 60,
  "chatId": "id-if-chat-was-created-anyway"
}
```

- `error`: Code such as `RATE_LIMIT`, `SERVER_ERROR`. On network failure the client uses `NETWORK_ERROR`.
- `message`: Shown to the user.
- `chatId`: If the chat was created despite the error, the frontend can use this to load that chat (see `useChat.ts`).

---

## 2. Send message (streaming)

**`POST /api/anonymous/chats/:chatId/messages/stream`**

Sends a user message and streams the assistant reply. This is the only message endpoint used by the frontend.

### Request body

```json
{
  "chatId": "chat-id",
  "content": "User message text",
  "role": "user"
}
```

- `chatId` (string): Must match the `:chatId` in the URL.
- `content` (string): Message text.
- `role` (optional): `"user"` or `"system"`.

### Success response (200)

The response body is a **stream**. The client reads it with a `ReadableStream` and treats each line starting with `data: ` as a JSON payload.

- Lines are separated by `\n\n` (double newline); the client buffers and splits (see `consumeSSELine` / `processSSELine` in `api.ts`).
- Each valid line has the form: **`data: <JSON>`**.

Supported event types:

| type    | JSON example | Meaning |
|--------|----------------|--------|
| `chunk` | `{"type":"chunk","content":" text fragment "}` | Partial assistant reply; the client appends and updates the UI (typewriter effect). |
| `done`  | `{"type":"done","message":{ ... Message ... }}` | Final assistant message; the client replaces the streaming placeholder with this. |
| `error` | `{"type":"error","error":" message "}` | Error during streaming; the client calls `onError` and stops. |

The **Message** in `done` must match the shape below: `id`, `chatId`, `role`, `content`, optional `metadata`, `createdAt` (ISO string).

### HTTP error (4xx/5xx)

When the response is not `ok`, the client reads the body as JSON and expects at least:

```json
{
  "error": "Error message or code"
}
```

It passes this value to `onError`. Ensure the error response body is valid JSON.

---

## TypeScript type reference

These types (from `src/types/api.ts`) define the contracts the frontend uses:

```ts
interface Chat {
  id: string;
  title?: string;
  createdAt: Date;  // serialized as ISO string in JSON
  updatedAt: Date;
  messages?: Message[];
}

interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface CreateChatRequest {
  title?: string;
  initialMessage?: string;
}

interface CreateMessageRequest {
  chatId: string;
  content: string;
  role?: 'user' | 'system';
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: string;
  message?: string;
  retryAfter?: number;
  chatId?: string;
}
```

---

## Typical frontend flow

1. **New chat with first message**: `POST /anonymous/chats` (body with optional `title`) → get **Chat** → then `POST /anonymous/chats/:id/messages/stream` with the first user message; the client handles `chunk`, `done`, and `error` events.
2. **Message in existing chat**: Only `POST /anonymous/chats/:id/messages/stream` with a **CreateMessageRequest**.

The frontend does not send `initialMessage` in the create-chat body when using streaming; it always sends the first message via the stream endpoint.

---

## Files to reference in the repo

- **API client and parsing**: `src/services/api.ts` (`createAnonymousChat`, `sendAnonymousMessageStream`, and SSE parsing in `processSSELine`).
- **Types**: `src/types/api.ts`.
- **Usage**: `src/hooks/useChat.ts` (create chat and send message with typewriter effect).
- **URL configuration**: `src/contexts/ServiceContext.tsx`, `vite.config.ts` (proxy), `.env.example`.
