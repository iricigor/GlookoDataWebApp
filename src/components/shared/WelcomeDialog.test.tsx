/**
 * Tests for WelcomeDialog component
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils/i18nTestProvider';
import { WelcomeDialog } from './WelcomeDialog';

describe('WelcomeDialog', () => {
  it('should not render when closed', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={false} onAccept={onAccept} onCancel={onCancel} />);
    
    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('should display generic welcome message when no user name provided', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    expect(screen.getByText('Welcome to our app!')).toBeInTheDocument();
  });

  it('should display personalized welcome message when user name provided', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} userName="John" />);
    
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
  });

  it('should display generic message when user name is null', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} userName={null} />);
    
    expect(screen.getByText('Welcome to our app!')).toBeInTheDocument();
  });

  it('should display cloud settings explanation', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    expect(screen.getByText(/Cloud Settings Sync/)).toBeInTheDocument();
    expect(screen.getByText(/Privacy First/)).toBeInTheDocument();
  });

  it('should call onAccept when Save Settings button is clicked', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    const saveButton = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveButton);
    
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('should have both Save Settings and Cancel buttons', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<WelcomeDialog open={true} onAccept={onAccept} onCancel={onCancel} />);
    
    expect(screen.getByRole('button', { name: /Save Settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
