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
    
    expect(screen.getByText('Selected Data Package')).toBeInTheDocument();
    expect(screen.getByText(/No data package selected/)).toBeInTheDocument();
  });

  it('should render file metadata when file is selected', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    expect(screen.getByText('Selected Data Package')).toBeInTheDocument();
    expect(screen.getByText('test-data.zip')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
  });

  it('should display correct number of data sets', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    expect(screen.getByText('Data Sets:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display total rows correctly', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    expect(screen.getByText('Total Rows:')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display metadata line when available', () => {
    render(<SelectedFileMetadata selectedFile={mockFile} />);
    
    expect(screen.getByText('Package Metadata:')).toBeInTheDocument();
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
    
    expect(screen.queryByText('Package Metadata:')).not.toBeInTheDocument();
  });

  it('should format file size correctly', () => {
    const smallFile: UploadedFile = {
      ...mockFile,
      size: 512,
    };

    render(<SelectedFileMetadata selectedFile={smallFile} />);
    expect(screen.getByText('512 Bytes')).toBeInTheDocument();
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
    expect(screen.getByText('600')).toBeInTheDocument();
  });
});
