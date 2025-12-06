import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../testUtils/i18nTestProvider';
import { FileList } from './FileList';
import type { UploadedFile } from '../../../types';
import type { ExportFormat } from '../../../hooks/useExportFormat';

describe('FileList', () => {
  const mockOnRemoveFile = vi.fn();
  const mockOnClearAll = vi.fn();
  const mockOnAddFiles = vi.fn();
  const defaultExportFormat: ExportFormat = 'csv';
  const defaultIsLoadingDemoData = false;

  const createMockFile = (csvFiles: Array<{ name: string; rowCount: number }>): UploadedFile => ({
    id: 'test-file-1',
    name: 'test-data.zip',
    size: 1024,
    uploadTime: new Date('2025-01-01'),
    file: new File([''], 'test-data.zip'),
    zipMetadata: {
      isValid: true,
      csvFiles: csvFiles.map(csv => ({
        name: csv.name,
        rowCount: csv.rowCount,
        columnNames: ['col1', 'col2'],
      })),
      metadataLine: 'Test metadata',
    },
  });

  describe('data set color based on row count', () => {
    it('should render data set with 0 rows', () => {
      const files = [createMockFile([{ name: 'empty-data', rowCount: 0 }])];
      const { container } = renderWithProviders(<FileList files={files} onRemoveFile={mockOnRemoveFile} onClearAll={mockOnClearAll} onAddFiles={mockOnAddFiles} exportFormat={defaultExportFormat} isLoadingDemoData={defaultIsLoadingDemoData} />);
      
      // Component should render without errors
      expect(container.querySelector('table')).toBeTruthy();
      expect(screen.getByText('test-data.zip')).toBeTruthy();
    });

    it('should render data set with 1-9 rows', () => {
      const files = [createMockFile([{ name: 'small-data', rowCount: 5 }])];
      const { container } = renderWithProviders(<FileList files={files} onRemoveFile={mockOnRemoveFile} onClearAll={mockOnClearAll} onAddFiles={mockOnAddFiles} exportFormat={defaultExportFormat} isLoadingDemoData={defaultIsLoadingDemoData} />);
      
      expect(container.querySelector('table')).toBeTruthy();
      expect(screen.getByText('test-data.zip')).toBeTruthy();
    });

    it('should render data set with 10+ rows', () => {
      const files = [createMockFile([{ name: 'large-data', rowCount: 100 }])];
      const { container } = renderWithProviders(<FileList files={files} onRemoveFile={mockOnRemoveFile} onClearAll={mockOnClearAll} onAddFiles={mockOnAddFiles} exportFormat={defaultExportFormat} isLoadingDemoData={defaultIsLoadingDemoData} />);
      
      expect(container.querySelector('table')).toBeTruthy();
      expect(screen.getByText('test-data.zip')).toBeTruthy();
    });

    it('should render multiple data sets with different row counts', () => {
      const files = [createMockFile([
        { name: 'empty-data', rowCount: 0 },
        { name: 'small-data', rowCount: 5 },
        { name: 'large-data', rowCount: 100 },
      ])];
      const { container } = renderWithProviders(<FileList files={files} onRemoveFile={mockOnRemoveFile} onClearAll={mockOnClearAll} onAddFiles={mockOnAddFiles} exportFormat={defaultExportFormat} isLoadingDemoData={defaultIsLoadingDemoData} />);
      
      expect(container.querySelector('table')).toBeTruthy();
      expect(screen.getByText('test-data.zip')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should display empty state when no files are uploaded', () => {
      renderWithProviders(<FileList files={[]} onRemoveFile={mockOnRemoveFile} onClearAll={mockOnClearAll} onAddFiles={mockOnAddFiles} exportFormat={defaultExportFormat} isLoadingDemoData={defaultIsLoadingDemoData} />);
      
      expect(screen.getByText('No files uploaded yet. Upload ZIP files to get started.')).toBeTruthy();
    });
  });
});
