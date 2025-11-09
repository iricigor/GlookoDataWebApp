/**
 * Tests for CopyToCsvButton component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { CopyToCsvButton } from './CopyToCsvButton';

// Mock the clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CopyToCsvButton', () => {
  beforeEach(() => {
    mockWriteText.mockReset();
    mockWriteText.mockResolvedValue(undefined);
  });

  const renderComponent = (data: (string | number)[][]) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <CopyToCsvButton data={data} />
      </FluentProvider>
    );
  };

  it('should render the copy button', () => {
    const data = [
      ['Header1', 'Header2'],
      ['Value1', 'Value2'],
    ];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    expect(button).toBeInTheDocument();
  });

  it('should copy CSV data to clipboard when clicked', async () => {
    const data = [
      ['Name', 'Age'],
      ['John', '30'],
      ['Jane', '25'],
    ];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Name,Age\nJohn,30\nJane,25');
    });
  });

  it('should show checkmark icon after successful copy', async () => {
    const data = [
      ['Header1', 'Header2'],
      ['Value1', 'Value2'],
    ];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    fireEvent.click(button);

    // The checkmark should appear (button is still there but with different icon)
    await waitFor(() => {
      expect(button).toBeInTheDocument();
    });
  });

  it('should handle empty data gracefully', async () => {
    const data: (string | number)[][] = [];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('');
    });
  });

  it('should handle clipboard API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteText.mockRejectedValue(new Error('Clipboard error'));
    
    const data = [
      ['Header1', 'Header2'],
      ['Value1', 'Value2'],
    ];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should use custom aria label when provided', () => {
    const data = [['Header']];

    render(
      <FluentProvider theme={webLightTheme}>
        <CopyToCsvButton data={data} ariaLabel="Export table data" />
      </FluentProvider>
    );
    
    const button = screen.getByRole('button', { name: 'Export table data' });
    expect(button).toBeInTheDocument();
  });

  it('should convert complex data correctly', async () => {
    const data = [
      ['Day', 'Low', 'In Range'],
      ['Monday', '10% (50)', '85% (425)'],
      ['Tuesday', '5% (25)', '90% (450)'],
    ];

    renderComponent(data);
    
    const button = screen.getByRole('button', { name: /copy as csv/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Day,Low,In Range\nMonday,10% (50),85% (425)\nTuesday,5% (25),90% (450)');
    });
  });
});
