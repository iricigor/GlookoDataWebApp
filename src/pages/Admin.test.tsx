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

import { useAuth } from '../hooks/useAuth';

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin page title and subtitle', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      idToken: null,
      userEmail: null,
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrative access area')).toBeInTheDocument();
  });

  it('shows login prompt when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      idToken: null,
      userEmail: null,
    });

    renderWithProviders(<Admin />);

    expect(screen.getByText('Please login to access administrative features')).toBeInTheDocument();
    expect(screen.getByText('Login with Microsoft')).toBeInTheDocument();
  });

  it('shows loading state when user is logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      login: vi.fn(),
      logout: vi.fn(),
      idToken: 'test-token',
      userEmail: 'test@example.com',
    });

    renderWithProviders(<Admin />);

    // When logged in, the login button should not be visible
    expect(screen.queryByText('Login with Microsoft')).not.toBeInTheDocument();
    expect(screen.queryByText('Please login to access administrative features')).not.toBeInTheDocument();
  });

  it('calls login function when login button is clicked', async () => {
    const mockLogin = vi.fn();
    
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      login: mockLogin,
      logout: vi.fn(),
      idToken: null,
      userEmail: null,
    });

    renderWithProviders(<Admin />);
    const loginButton = screen.getByText('Login with Microsoft');
    
    fireEvent.click(loginButton);

    expect(mockLogin).toHaveBeenCalledOnce();
  });
});
