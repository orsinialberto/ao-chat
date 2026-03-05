# Frontend Testing - AI Agent Chat

## 📋 Overview

The AI Agent Chat frontend uses **Vitest** as the testing framework to ensure quality and reliability of React components.

## 🧪 Test Types

### 1. Component Tests
Tests for React components that verify rendering and interaction:

- **MarkdownRenderer**: markdown content rendering
- **ChatItem**: chat list items
- **DeleteChatModal**: chat deletion modal
- **Sidebar**: navigation sidebar

### 2. Hook Tests
Tests for custom hooks:
- **useSidebar**: sidebar management

## 🚀 How to Run Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests in Watch Mode
```bash
cd frontend
npm test -- --watch
```

### Run Tests with Interactive UI
```bash
cd frontend
npm run test:ui
```

This launches Vitest's web interface to view tests and coverage interactively.

### Run a Specific Test
```bash
cd frontend
npm test MarkdownRenderer.test
# or
npm test sidebar
```

## ⚙️ Configuration

### Configuration Files
- **`vitest.config.ts`**: Vitest main configuration
- **`src/test/setup.ts`**: test environment setup with Testing Library

### Vitest Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

## 📝 Test Structure

### Example: Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders basic markdown correctly', () => {
    const content = '# Hello World\n\nThis is **bold** text.';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Hello World');
  });
});
```

### Example: Hook Test
```typescript
import { renderHook, act } from '@testing-library/react';
import { useSidebar } from '../useSidebar';

describe('useSidebar', () => {
  it('toggles sidebar visibility', () => {
    const { result } = renderHook(() => useSidebar());
    
    act(() => {
      result.current.toggleSidebar();
    });
    
    expect(result.current.isOpen).toBe(true);
  });
});
```

## 📊 Coverage

Tests currently cover:
- ✅ Sidebar components (4 test files)
- ✅ MarkdownRenderer (1 test file)
- ✅ useSidebar hook (1 test file)

**Total**: 6 test files with ~15+ test cases

## 🔧 Tools Used

- **Vitest**: testing framework
- **@testing-library/react**: utilities for testing React
- **@testing-library/jest-dom**: custom matchers
- **@vitest/ui**: graphical interface for tests
- **jsdom**: DOM environment for tests

## 🐛 Troubleshooting

### Error: "Cannot find module"
Make sure you have installed the dependencies:
```bash
cd frontend
npm install
```

### Error: "Cannot find '@testing-library/react'"
Install development dependencies:
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Tests don't detect changes
Run the cleanup command:
```bash
cd frontend
rm -rf node_modules/.vite
npm test
```

## 📈 Future Improvements

- [ ] Add tests for ChatInterface
- [ ] Add tests for Header
- [ ] Add tests for API services
- [ ] Increase test coverage
- [ ] Add E2E integration tests
- [ ] Integrate CI/CD tests with GitHub Actions

---

*For more information, see [Best Practices](../best-practices.md)*

