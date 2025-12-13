/**
 * Unit tests for Admin component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../testUtils/i18nTestProvider';
import { screen, fireEvent } from '@testing-library/react';
import { Admin } from './Admin';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the useProUserCheck hook
vi.mock('../hooks/useProUserCheck', () => ({
  useProUserCheck: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';
import { useProUserCheck } from '../hooks/useProUserCheck';

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin page title and subtitle', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      userName: null,
      userEmail: null,
      userPhoto: null,
      accessToken: null,
      idToken: null,
      isInitialized: true,
      justLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: false,
      hasChecked: false,
      isProUser: false,
      secretValue: null,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrative access area')).toBeInTheDocument();
  });

  it('shows login prompt when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      userName: null,
      userEmail: null,
      userPhoto: null,
      accessToken: null,
      idToken: null,
      isInitialized: true,
      justLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: false,
      hasChecked: false,
      isProUser: false,
      secretValue: null,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Please login to access administrative features')).toBeInTheDocument();
    expect(screen.getByText('Login with Microsoft')).toBeInTheDocument();
  });

  it('shows loading state when checking Pro status', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      userName: 'Test User',
      userEmail: 'test@example.com',
      userPhoto: null,
      accessToken: 'test-access-token',
      idToken: 'test-token',
      isInitialized: true,
      justLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: true,
      hasChecked: false,
      isProUser: false,
      secretValue: null,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Login with Microsoft')).not.toBeInTheDocument();
    expect(screen.queryByText('Please login to access administrative features')).not.toBeInTheDocument();
  });

  it('shows Pro required message for non-Pro users', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      userName: 'Test User',
      userEmail: 'test@example.com',
      userPhoto: null,
      accessToken: 'test-access-token',
      idToken: 'test-token',
      isInitialized: true,
      justLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: false,
      hasChecked: true,
      isProUser: false,
      secretValue: null,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Pro User Access Required')).toBeInTheDocument();
    expect(screen.getByText(/This page is only accessible to Pro users/)).toBeInTheDocument();
    expect(screen.getByText('Apply for Pro Access')).toBeInTheDocument();
  });

  it('shows statistics for Pro users', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      userName: 'Test User',
      userEmail: 'test@example.com',
      userPhoto: null,
      accessToken: 'test-access-token',
      idToken: 'test-token',
      isInitialized: true,
      justLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: false,
      hasChecked: true,
      isProUser: true,
      secretValue: 'test-secret',
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('System Statistics')).toBeInTheDocument();
    expect(screen.getByText('Logged In Users')).toBeInTheDocument();
    expect(screen.getByText('Pro Users')).toBeInTheDocument();
    expect(screen.getByText('API Calls')).toBeInTheDocument();
    expect(screen.getByText('API Errors')).toBeInTheDocument();
    expect(screen.getByText(/Statistics will be available/)).toBeInTheDocument();
  });

  it('calls login function when login button is clicked', async () => {
    const mockLogin = vi.fn();
    
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      userName: null,
      userEmail: null,
      userPhoto: null,
      accessToken: null,
      idToken: null,
      isInitialized: true,
      justLoggedIn: false,
      login: mockLogin,
      logout: vi.fn(),
      acknowledgeLogin: vi.fn(),
    });

    vi.mocked(useProUserCheck).mockReturnValue({
      isChecking: false,
      hasChecked: false,
      isProUser: false,
      secretValue: null,
      hasError: false,
      errorMessage: null,
      performCheck: vi.fn(),
      resetState: vi.fn(),
    });

    renderWithProviders(<Admin />);
    const loginButton = screen.getByText('Login with Microsoft');
    
    fireEvent.click(loginButton);

    expect(mockLogin).toHaveBeenCalledOnce();
  });
});
