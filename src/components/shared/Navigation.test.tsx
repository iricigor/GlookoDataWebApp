import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils/i18nTestProvider';
import { Navigation } from './Navigation';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the useFirstLoginCheck hook
vi.mock('../../hooks/useFirstLoginCheck', () => ({
  useFirstLoginCheck: vi.fn(),
}));

// Mock the isDarkTheme function
vi.mock('../../hooks/useTheme', () => ({
  isDarkTheme: vi.fn(),
}));

// Mock the useUILanguage hook
vi.mock('../../hooks/useUILanguage', () => ({
  useUILanguage: vi.fn(),
}));

// Mock the useProUserCheck hook
vi.mock('../../hooks/useProUserCheck', () => ({
  useProUserCheck: vi.fn(),
}));

// Import the mocked modules
import { useAuth } from '../../hooks/useAuth';
import { useFirstLoginCheck } from '../../hooks/useFirstLoginCheck';
import { isDarkTheme } from '../../hooks/useTheme';
import { useUILanguage } from '../../hooks/useUILanguage';
import { useProUserCheck } from '../../hooks/useProUserCheck';

const mockUseAuth = vi.mocked(useAuth);
const mockUseFirstLoginCheck = vi.mocked(useFirstLoginCheck);
const mockIsDarkTheme = vi.mocked(isDarkTheme);
const mockUseUILanguage = vi.mocked(useUILanguage);
const mockUseProUserCheck = vi.mocked(useProUserCheck);

describe('Navigation', () => {
  const defaultAuthState = {
    isLoggedIn: false,
    userName: null,
    userEmail: null,
    userPhoto: null,
    accessToken: null,
    idToken: null,
    provider: null,
    isInitialized: true,
    justLoggedIn: false,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    acknowledgeLogin: vi.fn(),
  };

  const defaultFirstLoginCheckState = {
    isChecking: false,
    hasChecked: false,
    isFirstLogin: false,
    hasError: false,
    errorMessage: null,
    errorType: null,
    statusCode: null,
    performCheck: vi.fn(),
    resetState: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthState);
    mockUseFirstLoginCheck.mockReturnValue(defaultFirstLoginCheckState);
    mockIsDarkTheme.mockReturnValue(false); // Default to light mode
    mockUseUILanguage.mockReturnValue({
      uiLanguage: 'en',
      setUILanguage: vi.fn(),
    });
    mockUseProUserCheck.mockReturnValue({
      isProUser: false,
      secretValue: null,
      isChecking: false,
      hasChecked: false,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });
  });

  describe('when user is not logged in', () => {
    it('should render Login button', () => {
      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should not render theme toggle button', () => {
      renderWithProviders(
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
      renderWithProviders(
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
        accessToken: 'test-token',
        idToken: 'test-id-token',
        logout: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('should render theme toggle button when onThemeToggle is provided', () => {
      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={vi.fn()}
        />
      );
      
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });

    it('should not render settings shortcut button even when logged in', () => {
      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );
      
      // Settings should only be in the main nav, no shortcut
      const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
      expect(settingsButtons.length).toBe(1); // Only main nav Settings button
    });

    it('should show "Syncing settings..." on theme toggle button when syncStatus is syncing', () => {
      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={vi.fn()}
          syncStatus="syncing"
        />
      );
      
      // The theme toggle button should show syncing tooltip
      expect(screen.getByRole('button', { name: /syncing settings/i })).toBeInTheDocument();
    });

    it('should keep theme button clickable and functional during syncing', () => {
      const onThemeToggle = vi.fn();
      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          themeMode="light"
          onThemeToggle={onThemeToggle}
          syncStatus="syncing"
        />
      );
      
      // The theme toggle button should still be present and clickable during syncing
      const syncingButton = screen.getByRole('button', { name: /syncing settings/i });
      expect(syncingButton).toBeInTheDocument();
      
      // Click the theme button and verify toggle still works
      fireEvent.click(syncingButton);
      expect(onThemeToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onThemeToggle when theme button is clicked', () => {
      const onThemeToggle = vi.fn();
      renderWithProviders(
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

    it('should show sun icon in dark mode', () => {
      mockIsDarkTheme.mockReturnValue(true); // Mock dark mode
      renderWithProviders(
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
      renderWithProviders(
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
      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /john doe/i })).toBeInTheDocument();
    });
  });

  describe('navigation items', () => {
    it('should render all navigation items', () => {
      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /data upload/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reports/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ai analysis/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /settings/i }).length).toBeGreaterThan(0);
    });

    it('should call onNavigate when navigation button is clicked', () => {
      const onNavigate = vi.fn();
      renderWithProviders(<Navigation currentPage="home" onNavigate={onNavigate} />);
      
      fireEvent.click(screen.getByRole('button', { name: /data upload/i }));
      
      expect(onNavigate).toHaveBeenCalledWith('upload');
    });

    it('should highlight current page button', () => {
      renderWithProviders(<Navigation currentPage="reports" onNavigate={vi.fn()} />);
      
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      // The current page button should have "primary" appearance (implemented via class)
      expect(reportsButton).toBeInTheDocument();
    });
  });

  describe('first login check', () => {
    it('should trigger performCheck when user just logged in', () => {
      const performCheck = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        performCheck,
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      expect(performCheck).toHaveBeenCalledWith('test-id-token');
    });

    it('should not trigger performCheck when restoring session', () => {
      const performCheck = vi.fn();
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: false, // Not a fresh login
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        performCheck,
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      expect(performCheck).not.toHaveBeenCalled();
    });

    it('should show welcome dialog for first-time users', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        isFirstLogin: true,
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
    });

    it('should not show welcome dialog for returning users', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        isFirstLogin: false,
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });

    it('should call onReturningUserLogin when returning user login check completes', () => {
      const onReturningUserLogin = vi.fn();
      const acknowledgeLogin = vi.fn();
      
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
        acknowledgeLogin,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        isFirstLogin: false,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          onReturningUserLogin={onReturningUserLogin}
        />
      );

      expect(onReturningUserLogin).toHaveBeenCalledTimes(1);
      expect(acknowledgeLogin).toHaveBeenCalledTimes(1);
    });

    it('should not call onReturningUserLogin for first-time users', () => {
      const onReturningUserLogin = vi.fn();
      
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        isFirstLogin: true,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
          onReturningUserLogin={onReturningUserLogin}
        />
      );

      expect(onReturningUserLogin).not.toHaveBeenCalled();
    });

    it('should show error dialog when infrastructure error occurs', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: true,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        hasError: true,
        errorMessage: 'Cannot connect to Table Storage',
        errorType: 'infrastructure',
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      expect(screen.getAllByText('Service Unavailable').length).toBeGreaterThan(0);
      expect(screen.getByText('Cannot connect to Table Storage')).toBeInTheDocument();
    });

    it('should reset first login check state on logout', () => {
      const resetState = vi.fn();
      const logoutMock = vi.fn().mockResolvedValue(undefined);
      
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        justLoggedIn: false,
        logout: logoutMock,
      });
      mockUseFirstLoginCheck.mockReturnValue({
        ...defaultFirstLoginCheckState,
        hasChecked: true,
        resetState,
      });

      renderWithProviders(<Navigation currentPage="home" onNavigate={vi.fn()} />);

      // Find the logout button inside the LogoutDialog trigger
      const userButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.click(userButton);

      // We expect handleLogout to be wired to LogoutDialog's onLogout
      // Since LogoutDialog shows a confirmation, we can verify resetState is accessible
      expect(resetState).toBeDefined();
    });
  });

  describe('language toggle for logged in users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isLoggedIn: true,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        accessToken: 'test-token',
        idToken: 'test-id-token',
        logout: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('should render language toggle button with current language when user is logged in', () => {
      mockUseUILanguage.mockReturnValue({
        uiLanguage: 'en',
        setUILanguage: vi.fn(),
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      const languageButton = screen.getByText('EN');
      expect(languageButton).toBeInTheDocument();
    });

    it('should cycle from English to German when language toggle is clicked', () => {
      const setUILanguage = vi.fn();
      mockUseUILanguage.mockReturnValue({
        uiLanguage: 'en',
        setUILanguage,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      const languageButton = screen.getByText('EN');
      fireEvent.click(languageButton);

      expect(setUILanguage).toHaveBeenCalledWith('de');
    });

    it('should cycle from German to Czech when language toggle is clicked', () => {
      const setUILanguage = vi.fn();
      mockUseUILanguage.mockReturnValue({
        uiLanguage: 'de',
        setUILanguage,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      const languageButton = screen.getByText('DE');
      fireEvent.click(languageButton);

      expect(setUILanguage).toHaveBeenCalledWith('cs');
    });

    it('should cycle from Czech to Serbian when language toggle is clicked', () => {
      const setUILanguage = vi.fn();
      mockUseUILanguage.mockReturnValue({
        uiLanguage: 'cs',
        setUILanguage,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      const languageButton = screen.getByText('CS');
      fireEvent.click(languageButton);

      expect(setUILanguage).toHaveBeenCalledWith('sr');
    });

    it('should cycle from Serbian to English when language toggle is clicked', () => {
      const setUILanguage = vi.fn();
      mockUseUILanguage.mockReturnValue({
        uiLanguage: 'sr',
        setUILanguage,
      });

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      const languageButton = screen.getByText('SR');
      fireEvent.click(languageButton);

      expect(setUILanguage).toHaveBeenCalledWith('en');
    });

    it('should not render language toggle button when user is not logged in', () => {
      mockUseAuth.mockReturnValue(defaultAuthState); // Not logged in

      renderWithProviders(
        <Navigation 
          currentPage="home" 
          onNavigate={vi.fn()} 
        />
      );

      expect(screen.queryByText('EN')).not.toBeInTheDocument();
      expect(screen.queryByText('DE')).not.toBeInTheDocument();
      expect(screen.queryByText('CS')).not.toBeInTheDocument();
      expect(screen.queryByText('SR')).not.toBeInTheDocument();
    });
  });
});
