/**
 * Tests for DownloadCsvButton component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { DownloadCsvButton } from './DownloadCsvButton';

describe('DownloadCsvButton', () => {
  const mockData: (string | number)[][] = [
    ['Name', 'Age', 'City'],
    ['Alice', 30, 'New York'],
    ['Bob', 25, 'San Francisco'],
  ];

  const renderComponent = (props: React.ComponentProps<typeof DownloadCsvButton>) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <DownloadCsvButton {...props} />
      </FluentProvider>
    );
  };

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL if they don't exist
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }
  });

  it('should render download button with default props', () => {
    renderComponent({ data: mockData });
    
    const button = screen.getByRole('button', { name: /download as csv/i });
    expect(button).toBeInTheDocument();
  });

  it('should render with custom aria label', () => {
    renderComponent({ data: mockData, ariaLabel: 'Download custom data' });
    
    const button = screen.getByRole('button', { name: /download custom data/i });
    expect(button).toBeInTheDocument();
  });

  it('should support TSV format', () => {
    renderComponent({ data: mockData, format: 'tsv', fileName: 'test-file' });
    
    const button = screen.getByRole('button', { name: /download as tsv/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    renderComponent({ data: [] });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Click should not throw error
    fireEvent.click(button);
    expect(button).toBeInTheDocument();
  });

  it('should show button when rendered', () => {
    renderComponent({ data: mockData, fileName: 'my-file' });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
