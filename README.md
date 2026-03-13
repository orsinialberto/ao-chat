# AO Chat

React frontend for the AI Agent Chat application. Designed as a reusable, backend-agnostic chat UI that can connect to any compatible API.

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

---

## Documentation

- [Documentation Overview](./docs/README.md)
- [Frontend Architecture](./docs/architecture/frontend.md)
- [Frontend Testing](./docs/development/testing/frontend-testing.md)

