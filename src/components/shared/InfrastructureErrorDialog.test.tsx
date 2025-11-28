/**
 * Tests for InfrastructureErrorDialog component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { InfrastructureErrorDialog } from './InfrastructureErrorDialog';

// Wrapper to provide FluentProvider context
function renderWithProvider(component: React.ReactNode) {
  return render(
    <FluentProvider theme={webLightTheme}>
      {component}
    </FluentProvider>
  );
}

describe('InfrastructureErrorDialog', () => {
  it('should not render when closed', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={false} 
        onClose={onClose} 
        errorMessage="Test error"
      />
    );
    
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Test error"
      />
    );
    
    // Title appears in header and in the content
    expect(screen.getAllByText('Something went wrong').length).toBeGreaterThan(0);
  });

  it('should display infrastructure error message', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Cannot connect to Table Storage"
        errorType="infrastructure"
      />
    );
    
    expect(screen.getAllByText('Service Unavailable').length).toBeGreaterThan(0);
    expect(screen.getByText(/infrastructure is being set up/)).toBeInTheDocument();
    expect(screen.getByText('Cannot connect to Table Storage')).toBeInTheDocument();
  });

  it('should display network error message', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Network timeout"
        errorType="network"
      />
    );
    
    expect(screen.getAllByText('Network Error').length).toBeGreaterThan(0);
    expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
  });

  it('should display unauthorized error message', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Token expired"
        errorType="unauthorized"
      />
    );
    
    expect(screen.getAllByText('Access Denied').length).toBeGreaterThan(0);
    expect(screen.getByText(/session may have expired/)).toBeInTheDocument();
  });

  it('should display generic error message for unknown type', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Some error"
        errorType="unknown"
      />
    );
    
    expect(screen.getAllByText('Something went wrong').length).toBeGreaterThan(0);
    expect(screen.getByText(/error occurred while connecting/)).toBeInTheDocument();
  });

  it('should display error details', () => {
    const onClose = vi.fn();
    const errorMessage = 'Detailed error: Connection refused at port 443';
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage={errorMessage}
      />
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should call onClose when OK button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Test error"
      />
    );
    
    const okButton = screen.getByRole('button', { name: /OK/i });
    fireEvent.click(okButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have an OK button', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Test error"
      />
    );
    
    const okButton = screen.getByRole('button', { name: /OK/i });
    expect(okButton).toBeInTheDocument();
  });

  it('should default to unknown error type when not provided', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <InfrastructureErrorDialog 
        open={true} 
        onClose={onClose} 
        errorMessage="Some error"
      />
    );
    
    expect(screen.getAllByText('Something went wrong').length).toBeGreaterThan(0);
  });
});
