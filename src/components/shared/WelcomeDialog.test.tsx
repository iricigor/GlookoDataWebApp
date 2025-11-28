/**
 * Tests for WelcomeDialog component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { WelcomeDialog } from './WelcomeDialog';

// Wrapper to provide FluentProvider context
function renderWithProvider(component: React.ReactNode) {
  return render(
    <FluentProvider theme={webLightTheme}>
      {component}
    </FluentProvider>
  );
}

describe('WelcomeDialog', () => {
  it('should not render when closed', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={false} onClose={onClose} />);
    
    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} />);
    
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('should display generic welcome message when no user name provided', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} />);
    
    expect(screen.getByText('Welcome to our app!')).toBeInTheDocument();
  });

  it('should display personalized welcome message when user name provided', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} userName="John" />);
    
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
  });

  it('should display generic message when user name is null', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} userName={null} />);
    
    expect(screen.getByText('Welcome to our app!')).toBeInTheDocument();
  });

  it('should display the welcome description', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} />);
    
    expect(screen.getByText(/Thank you for joining us/)).toBeInTheDocument();
  });

  it('should call onClose when OK button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} />);
    
    const okButton = screen.getByRole('button', { name: /OK/i });
    fireEvent.click(okButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have an OK button', () => {
    const onClose = vi.fn();
    renderWithProvider(<WelcomeDialog open={true} onClose={onClose} />);
    
    const okButton = screen.getByRole('button', { name: /OK/i });
    expect(okButton).toBeInTheDocument();
  });
});
