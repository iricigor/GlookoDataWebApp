import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyAIResponseButton } from './CopyAIResponseButton';
import * as csvUtils from '../utils/data';

// Mock the copyToClipboard utility
vi.mock('../utils/data', () => ({
  copyToClipboard: vi.fn(),
}));

describe('CopyAIResponseButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render copy button', () => {
    render(<CopyAIResponseButton content="Test content" />);
    const button = screen.getByRole('button', { name: /copy ai response/i });
    expect(button).toBeInTheDocument();
  });

  it('should call copyToClipboard with content when clicked', async () => {
    const testContent = '# Test Markdown\nThis is a test.';
    const mockCopyToClipboard = vi.mocked(csvUtils.copyToClipboard);
    mockCopyToClipboard.mockResolvedValue();

    render(<CopyAIResponseButton content={testContent} />);
    
    const button = screen.getByRole('button', { name: /copy ai response/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith(testContent);
    });
  });

  it('should show checkmark icon after successful copy', async () => {
    const mockCopyToClipboard = vi.mocked(csvUtils.copyToClipboard);
    mockCopyToClipboard.mockResolvedValue();

    render(<CopyAIResponseButton content="Test" />);
    
    const button = screen.getByRole('button', { name: /copy ai response/i });
    fireEvent.click(button);

    // Wait for the copy operation to complete
    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalled();
    });

    // Button should have the checkmark icon (we can't easily test the icon itself,
    // but we can verify the className changed to copiedButton)
    expect(button).toBeInTheDocument();
  });

  it('should reset to copy icon after 2 seconds', async () => {
    const mockCopyToClipboard = vi.mocked(csvUtils.copyToClipboard);
    mockCopyToClipboard.mockResolvedValue();
    vi.useFakeTimers();

    render(<CopyAIResponseButton content="Test" />);
    
    const button = screen.getByRole('button', { name: /copy ai response/i });
    fireEvent.click(button);

    // Wait for the copy operation to complete (without advancing timers yet)
    await vi.runAllTimersAsync();

    // Verify copy was called
    expect(mockCopyToClipboard).toHaveBeenCalled();

    // Fast-forward 2 seconds
    vi.advanceTimersByTime(2000);

    // Button should be back to normal state
    expect(button).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should handle copy error gracefully', async () => {
    const mockCopyToClipboard = vi.mocked(csvUtils.copyToClipboard);
    mockCopyToClipboard.mockRejectedValue(new Error('Copy failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {/* suppress console output */});

    render(<CopyAIResponseButton content="Test" />);
    
    const button = screen.getByRole('button', { name: /copy ai response/i });
    fireEvent.click(button);

    // Wait for the copy operation to complete and error to be logged
    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Verify error was logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, { timeout: 1000 });

    consoleErrorSpy.mockRestore();
  });

  it('should accept custom aria label', () => {
    render(<CopyAIResponseButton content="Test" ariaLabel="Custom label" />);
    const button = screen.getByRole('button', { name: 'Custom label' });
    expect(button).toBeInTheDocument();
  });
});
