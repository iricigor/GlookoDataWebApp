import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { WelcomeDialog } from './WelcomeDialog';

// Helper to render with FluentProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      {component}
    </FluentProvider>
  );
};

describe('WelcomeDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateSettings = vi.fn();
  const mockUserEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when open is false', () => {
    const { container } = renderWithProvider(
      <WelcomeDialog
        open={false}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Dialog should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should render welcome message when opened', async () => {
    mockOnCreateSettings.mockResolvedValue(true);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Should show welcome title
    expect(screen.getByText('Welcome to Glooko Data Web App!')).toBeInTheDocument();
    
    // Should show first-time login message
    expect(screen.getByText(/This is your first time using our application/i)).toBeInTheDocument();
  });

  it('should automatically call onCreateSettings when opened', async () => {
    mockOnCreateSettings.mockResolvedValue(true);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Should call createSettings automatically
    await waitFor(() => {
      expect(mockOnCreateSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state while creating settings', async () => {
    // Mock a delayed response
    mockOnCreateSettings.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Should show loading message
    await waitFor(() => {
      expect(screen.getByText(/Creating your settings storage/i)).toBeInTheDocument();
    });
    
    // Should show spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show success message and countdown after successful creation', async () => {
    mockOnCreateSettings.mockResolvedValue(true);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    });
    
    // Should show countdown
    expect(screen.getByText(/This dialog will close automatically in 10 seconds/i)).toBeInTheDocument();
  });

  it('should countdown from 10 to 0 and auto-close', async () => {
    mockOnCreateSettings.mockResolvedValue(true);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/10 seconds/i)).toBeInTheDocument();
    });
    
    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText(/9 seconds/i)).toBeInTheDocument();
    });
    
    // Advance timer by 9 more seconds (total 10)
    vi.advanceTimersByTime(9000);
    
    // Should call onClose after countdown
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should allow manual close during countdown', async () => {
    mockOnCreateSettings.mockResolvedValue(true);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Wait for success and close button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Should call onClose immediately
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show error message when creation fails', async () => {
    mockOnCreateSettings.mockResolvedValue(false);
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to create settings storage/i)).toBeInTheDocument();
    });
    
    // Should show close button
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should show error message when creation throws', async () => {
    mockOnCreateSettings.mockRejectedValue(new Error('Network error'));
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should display user email in the message', async () => {
    mockOnCreateSettings.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    
    renderWithProvider(
      <WelcomeDialog
        open={true}
        userEmail={mockUserEmail}
        onClose={mockOnClose}
        onCreateSettings={mockOnCreateSettings}
      />
    );
    
    // Should show user email during creation
    await waitFor(() => {
      expect(screen.getByText(new RegExp(mockUserEmail))).toBeInTheDocument();
    });
  });
});
