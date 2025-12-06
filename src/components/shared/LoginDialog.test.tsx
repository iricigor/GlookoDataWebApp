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

  it('should call onLogin when login is confirmed', async () => {
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
});
