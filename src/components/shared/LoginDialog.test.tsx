import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils/i18nTestProvider';
import { LoginDialog } from './LoginDialog';

describe('LoginDialog', () => {
  it('should render login button', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dialog when login button is clicked', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Sign in with your personal Microsoft account to access all features.')).toBeInTheDocument();
  });

  it('should show both Microsoft and Google sign-in buttons', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Check for both sign-in buttons
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('should call onLogin when Microsoft sign-in is clicked', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click the Sign in button in the dialog
    const signInButton = screen.getByRole('button', { name: /sign in with microsoft/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(onLogin).toHaveBeenCalled();
    });
  });

  it('should show coming soon message when Google sign-in is clicked', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click the Google sign-in button
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);
    
    // Check for coming soon message
    await waitFor(() => {
      expect(screen.getByText(/google sign-in will be available soon/i)).toBeInTheDocument();
    });
    
    // Should not call onLogin
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('should close dialog when cancel is clicked', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('should show loading state during login', async () => {
    const onLogin = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click the Sign in button
    const signInButton = screen.getByRole('button', { name: /sign in with microsoft/i });
    fireEvent.click(signInButton);
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
  });

  it('should disable buttons during loading', async () => {
    const onLogin = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderWithProviders(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click Microsoft sign-in
    const signInButton = screen.getByRole('button', { name: /sign in with microsoft/i });
    fireEvent.click(signInButton);
    
    // Check that buttons are disabled during loading
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(cancelButton).toBeDisabled();
      expect(googleButton).toBeDisabled();
    });
  });
});
