/**
 * Unit tests for UnifiedDailyReport component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnifiedDailyReport } from './UnifiedDailyReport';
import type { UploadedFile } from '../types';
import * as dataUtils from '../utils/data';

// Mock the data extraction functions
vi.mock('../utils/data', () => ({
  extractInsulinReadings: vi.fn(),
  extractGlucoseReadings: vi.fn(),
  prepareInsulinTimelineData: vi.fn(),
  filterReadingsByDate: vi.fn(),
}));

// Mock the child components
vi.mock('./UnifiedTimeline', () => ({
  UnifiedTimeline: () => <div data-testid="unified-timeline">Unified Timeline</div>,
}));

vi.mock('./DayNavigator', () => ({
  DayNavigator: () => <div data-testid="day-navigator">Day Navigator</div>,
}));

describe('UnifiedDailyReport', () => {
  const mockFile: UploadedFile = {
    id: 'test-file-1',
    name: 'test.zip',
    size: 1024,
    uploadTime: new Date('2025-01-01'),
    file: new File([], 'test.zip'),
    zipMetadata: {
      isValid: true,
      csvFiles: [],
    },
  };

  const mockInsulinReadings = [
    {
      timestamp: new Date('2025-01-14T10:00:00'),
      dose: 5.0,
      insulinType: 'bolus' as const,
    },
  ];

  const mockGlucoseReadings = [
    {
      timestamp: new Date('2025-01-14T10:00:00'),
      value: 7.5,
    },
  ];

  it('should render no data message when no file is selected', () => {
    render(<UnifiedDailyReport glucoseUnit="mmol/L" />);
    
    expect(screen.getByText(/please upload and select a file/i)).toBeInTheDocument();
  });

  it('should render loading state while fetching data', async () => {
    vi.mocked(dataUtils.extractInsulinReadings).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<UnifiedDailyReport selectedFile={mockFile} glucoseUnit="mmol/L" />);
    
    await waitFor(() => {
      expect(screen.getByText(/loading data/i)).toBeInTheDocument();
    });
  });

  it('should render no data message when insulin readings are empty', async () => {
    vi.mocked(dataUtils.extractInsulinReadings).mockResolvedValue([]);
    vi.mocked(dataUtils.extractGlucoseReadings).mockResolvedValue([]);

    render(<UnifiedDailyReport selectedFile={mockFile} glucoseUnit="mmol/L" />);
    
    await waitFor(() => {
      expect(screen.getByText(/no insulin data available/i)).toBeInTheDocument();
    });
  });

  it('should render day navigator and unified timeline when data is available', async () => {
    vi.mocked(dataUtils.extractInsulinReadings).mockResolvedValue(mockInsulinReadings);
    vi.mocked(dataUtils.extractGlucoseReadings).mockResolvedValue(mockGlucoseReadings);
    vi.mocked(dataUtils.prepareInsulinTimelineData).mockReturnValue([
      {
        hour: 10,
        timeLabel: '10:00',
        basalRate: 1.0,
        bolusTotal: 5.0,
      },
    ]);
    vi.mocked(dataUtils.filterReadingsByDate).mockReturnValue(mockGlucoseReadings);

    render(<UnifiedDailyReport selectedFile={mockFile} glucoseUnit="mmol/L" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('day-navigator')).toBeInTheDocument();
      expect(screen.getByTestId('unified-timeline')).toBeInTheDocument();
    });
  });

  it('should render unified timeline with insulin data when glucose data extraction fails', async () => {
    vi.mocked(dataUtils.extractInsulinReadings).mockResolvedValue(mockInsulinReadings);
    vi.mocked(dataUtils.extractGlucoseReadings).mockRejectedValue(new Error('No CGM data'));
    vi.mocked(dataUtils.prepareInsulinTimelineData).mockReturnValue([
      {
        hour: 10,
        timeLabel: '10:00',
        basalRate: 1.0,
        bolusTotal: 5.0,
      },
    ]);

    render(<UnifiedDailyReport selectedFile={mockFile} glucoseUnit="mmol/L" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('day-navigator')).toBeInTheDocument();
      expect(screen.getByTestId('unified-timeline')).toBeInTheDocument();
    });
  });
});
