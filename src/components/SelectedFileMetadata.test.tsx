import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectedFileMetadata } from './SelectedFileMetadata';
import type { UploadedFile } from '../types';

describe('SelectedFileMetadata', () => {
  const mockFile: UploadedFile = {
    id: 'test-1',
    name: 'test-data.zip',
    size: 1024 * 1024 * 2.5, // 2.5 MB
    uploadTime: new Date('2025-01-01T12:00:00'),
    file: new File([], 'test-data.zip'),
    zipMetadata: {
      isValid: true,
      csvFiles: [
        {
          name: 'glucose.csv',
          rowCount: 100,
          columnNames: ['timestamp', 'value'],
        },
        {
          name: 'insulin.csv',
          rowCount: 50,
          columnNames: ['timestamp', 'dose'],
        },
      ],
      metadataLine: 'Test metadata line',
    },
  };

  it('should render no selection message when no file is selected', () => {
    render(<SelectedFileMetadata />);
    
    // Should show no selection message directly (no accordion)
    expect(screen.getByText(/No data package selected/)).toBeInTheDocument();
  });

  it('should render file metadata when file is selected', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    // File name and size should be in header and metadata
    const fileNameElements = screen.getAllByText('test-data.zip');
    expect(fileNameElements.length).toBeGreaterThan(0);
    const fileSizeElements = screen.getAllByText(/2.5 MB/);
    expect(fileSizeElements.length).toBeGreaterThan(0);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('File Name:')).toBeInTheDocument();
  });

  it('should display correct number of data sets', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Data Sets:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display total rows correctly', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Total Rows:')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display metadata line when available', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Raw Metadata:')).toBeInTheDocument();
    expect(screen.getByText('Test metadata line')).toBeInTheDocument();
  });

  it('should not display data sets info for invalid files', () => {
    const invalidFile: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        isValid: false,
        csvFiles: [],
        error: 'Invalid ZIP',
      },
    };

    render(<SelectedFileMetadata selectedFile={invalidFile} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.queryByText('Data Sets:')).not.toBeInTheDocument();
    expect(screen.queryByText('Total Rows:')).not.toBeInTheDocument();
  });

  it('should not display metadata line when not available', () => {
    const fileWithoutMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        metadataLine: undefined,
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithoutMetadata} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.queryByText('Raw Metadata:')).not.toBeInTheDocument();
  });

  it('should format file size correctly', () => {
    const smallFile: UploadedFile = {
      ...mockFile,
      size: 512,
    };

    render(<SelectedFileMetadata selectedFile={smallFile} />);
    // Use getAllByText since "512 Bytes" appears in both header and File Size value
    const elements = screen.getAllByText(/512 Bytes/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should calculate total rows from multiple CSV files', () => {
    const multiFileData: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        isValid: true,
        csvFiles: [
          { name: 'file1.csv', rowCount: 100 },
          { name: 'file2.csv', rowCount: 200 },
          { name: 'file3.csv', rowCount: 300 },
        ],
      },
    };

    render(<SelectedFileMetadata selectedFile={multiFileData} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('should display parsed patient name when available', () => {
    const fileWithParsedMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        parsedMetadata: {
          name: 'John Doe',
          dateRange: '2025-01-01 - 2025-01-31',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithParsedMetadata} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Patient Name:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display parsed date range when available', () => {
    const fileWithParsedMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        parsedMetadata: {
          name: 'John Doe',
          dateRange: '2025-01-01 - 2025-01-31',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithParsedMetadata} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Date Range:')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01 - 2025-01-31')).toBeInTheDocument();
  });

  it('should display raw metadata label when parsed metadata is available', () => {
    const fileWithParsedMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        metadataLine: 'Name:John Doe, Date Range:2025-01-01 - 2025-01-31',
        parsedMetadata: {
          name: 'John Doe',
          dateRange: '2025-01-01 - 2025-01-31',
        },
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithParsedMetadata} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Raw Metadata:')).toBeInTheDocument();
  });

  it('should handle partial parsed metadata (name only)', () => {
    const fileWithPartialMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        parsedMetadata: {
          name: 'Jane Smith',
        },
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithPartialMetadata} />);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.getByText('Patient Name:')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Date Range:')).not.toBeInTheDocument();
  });

  it('should handle partial parsed metadata (date range only)', () => {
    const fileWithPartialMetadata: UploadedFile = {
      ...mockFile,
      zipMetadata: {
        ...mockFile.zipMetadata!,
        parsedMetadata: {
          dateRange: '2025-02-01 - 2025-02-28',
        },
      },
    };

    render(<SelectedFileMetadata selectedFile={fileWithPartialMetadata} />);
    
    // Date range should be in header and in metadata grid
    const elements = screen.getAllByText(/2025-02-01 - 2025-02-28/);
    expect(elements.length).toBeGreaterThan(0);
    
    // Metadata should be visible directly (no accordion)
    expect(screen.queryByText('Patient Name:')).not.toBeInTheDocument();
    expect(screen.getByText('Date Range:')).toBeInTheDocument();
  });
});
