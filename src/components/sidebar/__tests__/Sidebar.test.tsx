import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser', email: 'test@test.com' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useSidebar', () => ({
  useSidebar: () => ({
    chats: [
      {
        id: '1',
        title: 'Test Chat 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      },
      {
        id: '2',
        title: 'Test Chat 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      }
    ],
    isLoading: false,
    error: null,
    updateChatTitle: vi.fn(),
    deleteChat: vi.fn(),
    createNewChat: vi.fn().mockResolvedValue({ id: '3' }),
    addChat: vi.fn(),
    clearError: vi.fn(),
    loadChats: vi.fn()
  })
}));

describe('Sidebar', () => {
  const mockOnChatSelect = vi.fn();
  const mockOnNewChat = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sidebar with chat list', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByTitle('New Chat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search chats')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
  });

  it('should show close button when onToggle is provided', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      </MemoryRouter>
    );
    expect(screen.getByTitle('Close sidebar')).toBeInTheDocument();
  });

  it('should not show close button when onToggle is not provided', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={true}
        />
      </MemoryRouter>
    );

    expect(screen.queryByTitle('Close sidebar')).toBeNull();
  });

  it('should call onToggle when close button is clicked', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Close sidebar'));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show mobile overlay when open', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={true}
          onToggle={mockOnToggle}
        />
      </MemoryRouter>
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-black.z-40');
    expect(overlay).toBeInTheDocument();
  });

  it('should not show mobile overlay when closed', () => {
    render(
      <MemoryRouter>
        <Sidebar
          currentChatId="1"
          onChatSelect={mockOnChatSelect}
          onNewChat={mockOnNewChat}
          isOpen={false}
          onToggle={mockOnToggle}
        />
      </MemoryRouter>
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-black.z-40');
    expect(overlay).not.toBeInTheDocument();
  });
});
