# AO Chat

React frontend for the AI Agent Chat application. Designed as a reusable, backend-agnostic chat UI that can connect to any compatible API. **Single anonymous mode**: no login or registration; chats are stored in session storage and sent to the backend via the anonymous API.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL (production builds) | `http://localhost:3001/api` |
| `VITE_API_PROXY_TARGET` | Backend target for Vite dev proxy | `http://localhost:3001` |

### 3. Development

```bash
npm run dev
```

App runs on http://localhost:5173. API requests are proxied to the backend during development.

### Build

```bash
npm run build
npm run preview   # preview the production build locally
```

### Running tests

```bash
npm test          # run tests
npm run test:ui   # interactive test UI
```

### Lint

```bash
npm run lint
npm run lint:fix
```

---

## Reuse in Another Project

Wrap your app with `ServiceProvider` and set the API base URL. No auth is required (anonymous mode only).

```tsx
import { ServiceProvider } from './contexts/ServiceContext';

function App() {
  return (
    <ServiceProvider config={{ baseUrl: '/my-api' }}>
      {/* your routes or <ChatInterface /> */}
    </ServiceProvider>
  );
}
```

---

## Documentation

- **Architecture**: overall frontend design and data flow — see `./docs/ARCHITECTURE.md`
- **API implementation**: how to implement the backend endpoints required by the chat — see `./docs/api-implementation.md`

