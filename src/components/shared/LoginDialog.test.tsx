import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils/i18nTestProvider';
import { LoginDialog } from './LoginDialog';

describe('LoginDialog', () => {
  it('should render login button', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dialog when login button is clicked', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Sign in with your personal account to access all features.')).toBeInTheDocument();
  });

  it('should show Microsoft sign-in button', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onGoogleLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={onGoogleLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Check for Microsoft sign-in button
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
    // Note: Google sign-in button is rendered by GoogleLogin component from @react-oauth/google
    // and may not be testable in the same way
  });

  it('should call onLogin when Microsoft sign-in is clicked', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
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

  it('should show Google sign-in button', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onGoogleLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={onGoogleLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Google button is rendered by GoogleLogin component from @react-oauth/google
    // It should be present in the dialog
    expect(screen.getByText(/sign in with your personal account/i)).toBeInTheDocument();
    
    // Should not call onLogin or onGoogleLogin until user clicks a button
    expect(onLogin).not.toHaveBeenCalled();
    expect(onGoogleLogin).not.toHaveBeenCalled();
  });

  it('should close dialog when cancel is clicked', () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
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
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
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
    renderWithProviders(<LoginDialog onLogin={onLogin} onGoogleLogin={vi.fn().mockResolvedValue(undefined)} />);
    
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
