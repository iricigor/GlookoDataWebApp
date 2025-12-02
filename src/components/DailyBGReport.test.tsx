/**
 * Tests for DailyBGReport component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBGReport } from './DailyBGReport';
import type { UploadedFile } from '../types';

// Mock the data utility functions
vi.mock('../utils/data', () => ({
  extractGlucoseReadings: vi.fn().mockResolvedValue([]),
  extractInsulinReadings: vi.fn().mockResolvedValue([]),
  smoothGlucoseValues: vi.fn().mockReturnValue([]),
  displayGlucoseValue: vi.fn().mockReturnValue('5.0'),
  getUnitLabel: vi.fn().mockReturnValue('mmol/L'),
  convertGlucoseValue: vi.fn().mockReturnValue(5.0),
  formatGlucoseValue: vi.fn().mockReturnValue('5.0'),
  prepareInsulinTimelineData: vi.fn().mockReturnValue([]),
  prepareHourlyIOBData: vi.fn().mockReturnValue([]),
  getUniqueDates: vi.fn().mockReturnValue([]),
  filterReadingsByDate: vi.fn().mockReturnValue([]),
  calculateGlucoseRangeStats: vi.fn().mockReturnValue({ low: 0, inRange: 0, high: 0, total: 0 }),
  GLUCOSE_RANGE_COLORS: { low: '#ff0000', inRange: '#00ff00', high: '#ffff00' },
  MIN_PERCENTAGE_TO_DISPLAY: 5,
  // RoC related functions
  calculateRoC: vi.fn().mockReturnValue([]),
  calculateRoCStats: vi.fn().mockReturnValue({
    totalCount: 0,
    goodCount: 0,
    mediumCount: 0,
    badCount: 0,
    goodPercentage: 0,
    mediumPercentage: 0,
    badPercentage: 0,
    maxRoC: 0,
    sdRoC: 0,
  }),
  smoothRoCData: vi.fn().mockReturnValue([]),
  ROC_COLORS: { good: '#4CAF50', medium: '#FF9800', bad: '#F44336' },
  ROC_THRESHOLDS: { good: 0.3, medium: 0.55 },
  formatRoCValue: vi.fn().mockReturnValue('0.0'),
  getRoCColor: vi.fn().mockReturnValue('#4CAF50'),
  getRoCMedicalStandards: vi.fn().mockReturnValue({
    good: { threshold: '≤0.3 mmol/L/5 min', description: 'Stable' },
    medium: { threshold: '0.3-0.55 mmol/L/5 min', description: 'Moderate' },
    bad: { threshold: '>0.55 mmol/L/5 min', description: 'Rapid' },
  }),
  getLongestCategoryPeriod: vi.fn().mockReturnValue(0),
  formatDuration: vi.fn().mockReturnValue('0m'),
  // Hypo related functions
  calculateHypoStats: vi.fn().mockReturnValue({
    totalCount: 0,
    severeCount: 0,
    nonSevereCount: 0,
    lowestValue: null,
    longestDurationMinutes: 0,
    totalDurationMinutes: 0,
    hypoPeriods: [],
  }),
  formatHypoDuration: vi.fn().mockReturnValue('0m'),
}));

// Mock the hooks
vi.mock('../hooks/useGlucoseThresholds', () => ({
  useGlucoseThresholds: vi.fn().mockReturnValue({
    thresholds: { low: 3.9, high: 10.0, veryLow: 3.0, veryHigh: 13.9 },
  }),
}));

vi.mock('../hooks/useBGColorScheme', () => ({
  useBGColorScheme: vi.fn().mockReturnValue({
    colorScheme: 'monochrome',
    setColorScheme: vi.fn(),
  }),
}));

vi.mock('../hooks/useSelectedDate', () => ({
  useSelectedDate: vi.fn().mockReturnValue({
    selectedDate: undefined,
    setSelectedDate: vi.fn(),
  }),
}));

vi.mock('../utils/formatting', () => ({
  getGlucoseColor: vi.fn().mockReturnValue('#0078D4'),
  isDynamicColorScheme: vi.fn().mockReturnValue(false),
  COLOR_SCHEME_DESCRIPTORS: {
    monochrome: { name: 'Monochrome', description: 'Single color' },
    basic: { name: 'Basic', description: 'Basic colors' },
    hsv: { name: 'HSV', description: 'HSV colors' },
    clinical: { name: 'Clinical', description: 'Clinical colors' },
  },
}));

// Mock FluentUI components
vi.mock('@fluentui/react-components', async () => {
  const actual = await vi.importActual('@fluentui/react-components');
  return {
    ...actual,
    Spinner: ({ children }: { children?: React.ReactNode }) => <div data-testid="spinner">{children}</div>,
  };
});

describe('DailyBGReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "please select a file" message when no file is selected', () => {
    render(<DailyBGReport glucoseUnit="mmol/L" showDayNightShading={true} />);
    
    expect(screen.getByText(/please select a file to view the daily bg report/i)).toBeInTheDocument();
  });

  it('should show loading state when loading data', async () => {
    // Create a mock file that will trigger loading
    const mockFile: UploadedFile = {
      id: 'test-file-1',
      name: 'test.zip',
      size: 1024,
      uploadTime: new Date(),
      file: new File([], 'test.zip'),
    };

    // Mock extractGlucoseReadings to delay response
    const { extractGlucoseReadings } = await import('../utils/data');
    (extractGlucoseReadings as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<DailyBGReport selectedFile={mockFile} glucoseUnit="mmol/L" showDayNightShading={true} />);
    
    // Should show loading state
    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });

  it('should render with correct props', () => {
    const { container } = render(<DailyBGReport glucoseUnit="mmol/L" insulinDuration={5} showDayNightShading={true} />);
    
    expect(container).toBeInTheDocument();
  });
});
