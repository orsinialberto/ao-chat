# AO Chat — Frontend

React frontend for the AI Agent Chat application. Designed as a reusable, backend-agnostic chat UI that can connect to any compatible API.

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL (production builds) | `http://localhost:3001/api` |
| `VITE_API_PROXY_TARGET` | Backend target for Vite dev proxy | `http://localhost:3001` |

### Development

```bash
npm run dev
```

App runs on http://localhost:5173. API requests are proxied to the backend during development.

### Build

```bash
npm run build
npm run preview   # preview the production build locally
```

### Tests

```bash
npm test          # run tests
npm run test:ui   # interactive test UI
```

### Lint

```bash
npm run lint
npm run lint:fix
```

## Architecture

The frontend uses **dependency injection** so that the API client and auth service can be replaced when reusing this UI with a different backend.

### Key Concepts

- **`ServiceProvider`** — React Context that provides `ApiService` and `AuthService` to the component tree. Pass a custom `config` prop to override defaults.
- **`IAuthService`** — Interface in `src/types/auth.ts`. Implement it to provide your own authentication logic.
- **`ApiService`** — Accepts a `baseUrl` and an `IAuthService` instance via its constructor; no hardcoded singletons.

### Reuse in Another Project

```tsx
import { ServiceProvider } from './contexts/ServiceContext';
import { MyCustomAuth } from './my-auth';

const authService = new MyCustomAuth();

function App() {
  return (
    <ServiceProvider config={{ baseUrl: '/my-api', authService }}>
      {/* your routes */}
    </ServiceProvider>
  );
}
```

### Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## Documentation

- [Documentation Overview](./docs/README.md)
- [Frontend Architecture](./docs/architecture/frontend.md)
- [Frontend Testing](./docs/development/testing/frontend-testing.md)

## Related

- **Backend**: [ao-agent](https://github.com/orsinialberto/ao-agent) — Express.js + PostgreSQL + Gemini API backend
