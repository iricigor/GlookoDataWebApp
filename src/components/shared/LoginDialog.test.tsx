import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginDialog } from './LoginDialog';

describe('LoginDialog', () => {
  it('should render login button', () => {
    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dialog when login button is clicked', () => {
    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);
    
    const button = screen.getByRole('button', { name: /login/i });
    fireEvent.click(button);
    
    expect(screen.getByText('This is a demonstration login dialog. Click "Login" to sign in as John Doe.')).toBeInTheDocument();
  });

  it('should call onLogin with "John Doe" when login is confirmed', () => {
    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click the Login button in the dialog
    const loginButtons = screen.getAllByRole('button', { name: /login/i });
    const confirmButton = loginButtons.find(btn => btn.textContent === 'Login' && btn !== openButton);
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);
    
    expect(onLogin).toHaveBeenCalledWith('John Doe');
  });

  it('should close dialog when cancel is clicked', () => {
    const onLogin = vi.fn();
    render(<LoginDialog onLogin={onLogin} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(openButton);
    
    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onLogin).not.toHaveBeenCalled();
  });
});
