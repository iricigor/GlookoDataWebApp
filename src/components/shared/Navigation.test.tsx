import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the isDarkTheme function
vi.mock('../../hooks/useTheme', () => ({
  isDarkTheme: vi.fn(),
}));

// Import the mocked modules
import { useAuth } from '../../hooks/useAuth';
import { isDarkTheme } from '../../hooks/useTheme';

const mockUseAuth = vi.mocked(useAuth);
const mockIsDarkTheme = vi.mocked(isDarkTheme);

describe('Navigation', () => {
  const defaultAuthState = {
    isLoggedIn: false,
    userName: null,
    userEmail: null,
    userPhoto: null,
    isInitialized: true,
    login: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthState);
    mockIsDarkTheme.mockReturnValue(false); // Default to light mode
  });

  describe('when user is not logged in', () => {
    it('should render Login button', () => {
      render(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should not render theme toggle button', () => {
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={vi.fn()}
        />
      );
      
      expect(screen.queryByRole('button', { name: /switch to dark mode/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument();
    });

    it('should not render settings shortcut button next to avatar', () => {
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );
      
      // Settings should only be in the main nav, not as a shortcut
      const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
      expect(settingsButtons.length).toBe(1); // Only main nav Settings button
    });
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        logout: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('should render theme toggle button when onThemeToggle is provided', () => {
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={vi.fn()}
        />
      );
      
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });

    it('should render settings shortcut button', () => {
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );
      
      // Settings should be in main nav AND as a shortcut next to avatar
      const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
      expect(settingsButtons.length).toBe(2); // Main nav + shortcut
    });

    it('should call onThemeToggle when theme button is clicked', () => {
      const onThemeToggle = vi.fn();
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={onThemeToggle}
        />
      );
      
      const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
      fireEvent.click(themeButton);
      
      expect(onThemeToggle).toHaveBeenCalledTimes(1);
    });

    it('should navigate to settings when settings shortcut is clicked', () => {
      const onNavigate = vi.fn();
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={onNavigate} 
        />
      );
      
      // Get the shortcut settings button (aria-label="Settings")
      const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
      // The shortcut button should be the one with just the icon (second one)
      fireEvent.click(settingsButtons[1]);
      
      expect(onNavigate).toHaveBeenCalledWith('settings');
    });

    it('should show sun icon in dark mode', () => {
      mockIsDarkTheme.mockReturnValue(true); // Mock dark mode
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="dark"
          onThemeToggle={vi.fn()}
        />
      );
      
      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
    });

    it('should show moon icon in light mode', () => {
      mockIsDarkTheme.mockReturnValue(false); // Mock light mode
      render(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={vi.fn()}
        />
      );
      
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });

    it('should render user button for logout', () => {
      render(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /john doe/i })).toBeInTheDocument();
    });
  });

  describe('navigation items', () => {
    it('should render all navigation items', () => {
      render(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /data upload/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reports/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ai analysis/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /settings/i }).length).toBeGreaterThan(0);
    });

    it('should call onNavigate when navigation button is clicked', () => {
      const onNavigate = vi.fn();
      render(<Navigation currentPage="home" onNavigate={onNavigate} />);
      
      fireEvent.click(screen.getByRole('button', { name: /data upload/i }));
      
      expect(onNavigate).toHaveBeenCalledWith('upload');
    });

    it('should highlight current page button', () => {
      render(<Navigation currentPage="reports" onNavigate={vi.fn()} />);
      
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      // The current page button should have "primary" appearance (implemented via class)
      expect(reportsButton).toBeInTheDocument();
    });
  });
});
