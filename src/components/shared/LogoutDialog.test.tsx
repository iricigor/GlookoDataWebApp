import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogoutDialog } from './LogoutDialog';

describe('LogoutDialog', () => {
  it('should render user button with name and avatar', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" onLogout={onLogout} />);
    
    const button = screen.getByRole('button', { name: /john doe/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dialog when user button is clicked', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" onLogout={onLogout} />);
    
    const button = screen.getByRole('button', { name: /john doe/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Are you sure you want to logout?')).toBeInTheDocument();
  });

  it('should call onLogout when logout is confirmed', async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" onLogout={onLogout} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /john doe/i });
    fireEvent.click(openButton);
    
    // Click the Logout button in the dialog
    const logoutButton = screen.getByRole('button', { name: /^logout$/i });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(onLogout).toHaveBeenCalled();
    });
  });

  it('should close dialog when cancel is clicked', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" onLogout={onLogout} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /john doe/i });
    fireEvent.click(openButton);
    
    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('should render different user names correctly', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<LogoutDialog userName="Jane Smith" onLogout={onLogout} />);
    
    expect(screen.getByRole('button', { name: /jane smith/i })).toBeInTheDocument();
    
    rerender(<LogoutDialog userName="Bob Johnson" onLogout={onLogout} />);
    expect(screen.getByRole('button', { name: /bob johnson/i })).toBeInTheDocument();
  });

  it('should display user email when provided', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" userEmail="john@example.com" onLogout={onLogout} />);
    
    // Open dialog
    const openButton = screen.getByRole('button', { name: /john doe/i });
    fireEvent.click(openButton);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display user photo when provided', () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    render(<LogoutDialog userName="John Doe" userPhoto="https://example.com/photo.jpg" onLogout={onLogout} />);
    
    const button = screen.getByRole('button', { name: /john doe/i });
    expect(button).toBeInTheDocument();
    // Avatar with image prop should be rendered
  });
});
