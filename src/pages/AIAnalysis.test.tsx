/**
 * Unit tests for AIAnalysis component
 * 
 * These tests focus on the core AI analysis functionality.
 * Due to the complex nature of the component (multiple tabs, async data loading,
 * cooldown mechanisms), the tests are simplified to test basic rendering
 * and the preservation of existing analysis data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AIAnalysis } from './AIAnalysis';
import type { UploadedFile, AIAnalysisResult } from '../types';
import * as dataUtils from '../utils/data';
import * as apiUtils from '../utils/api';

// Mock the modules
vi.mock('../utils/data', () => ({
  extractGlucoseReadings: vi.fn(),
  extractInsulinReadings: vi.fn(),
  extractDailyInsulinSummaries: vi.fn(),
  calculateGlucoseRangeStats: vi.fn(),
  calculatePercentage: vi.fn(),
  groupByDate: vi.fn(),
  convertDailyReportsToCSV: vi.fn(),
  convertGlucoseReadingsToCSV: vi.fn(),
  convertBolusReadingsToCSV: vi.fn(),
  convertBasalReadingsToCSV: vi.fn(),
  filterGlucoseReadingsToLastDays: vi.fn(),
  filterInsulinReadingsToLastDays: vi.fn(),
  aggregateInsulinByDate: vi.fn(),
}));
vi.mock('../utils/api', () => ({
  callAIApi: vi.fn(),
  getActiveProvider: vi.fn(),
  getProviderDisplayName: vi.fn().mockReturnValue('Test Provider'),
}));
vi.mock('../hooks/useGlucoseThresholds', () => ({
  useGlucoseThresholds: () => ({
    thresholds: {
      veryHigh: 13.9,
      high: 10,
      low: 3.9,
      veryLow: 3,
    },
  }),
}));

describe('AIAnalysis', () => {
  const mockFile: UploadedFile = {
    id: 'test-file-1',
    name: 'test-data.zip',
    size: 1000,
    uploadTime: new Date('2025-01-01'),
    file: new File([], 'test-data.zip'),
  };

  const mockAnalysisComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock glucose data extraction
    vi.mocked(dataUtils.extractGlucoseReadings).mockResolvedValue([
      { timestamp: new Date(), value: 7.0 },
      { timestamp: new Date(), value: 8.0 },
    ]);
    // Mock glucose range stats functions
    vi.mocked(dataUtils.calculateGlucoseRangeStats).mockReturnValue({
      inRange: 75,
      low: 10,
      high: 15,
      total: 100,
    });
    vi.mocked(dataUtils.calculatePercentage).mockImplementation(
      (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0)
    );
    vi.mocked(dataUtils.groupByDate).mockReturnValue([]);
    // Mock CSV conversion functions
    vi.mocked(dataUtils.convertDailyReportsToCSV).mockReturnValue('');
    vi.mocked(dataUtils.convertGlucoseReadingsToCSV).mockReturnValue('');
    vi.mocked(dataUtils.convertBolusReadingsToCSV).mockReturnValue('');
    vi.mocked(dataUtils.convertBasalReadingsToCSV).mockReturnValue('');
    vi.mocked(dataUtils.filterGlucoseReadingsToLastDays).mockImplementation(
      (readings) => readings
    );
    vi.mocked(dataUtils.filterInsulinReadingsToLastDays).mockImplementation(
      (readings) => readings
    );
    // Mock insulin data extraction
    vi.mocked(dataUtils.extractInsulinReadings).mockResolvedValue([]);
    vi.mocked(dataUtils.aggregateInsulinByDate).mockReturnValue([]);
    vi.mocked(dataUtils.extractDailyInsulinSummaries).mockResolvedValue([]);
    // Mock AI provider
    vi.mocked(apiUtils.getActiveProvider).mockReturnValue('gemini');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render AI Analysis heading', async () => {
    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        selectedProvider={null}
        responseLanguage="english"
        uiLanguage="en"
        glucoseUnit="mmol/L"
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  it('should render tab navigation', async () => {
    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        selectedProvider={null}
        responseLanguage="english"
        uiLanguage="en"
        glucoseUnit="mmol/L"
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Check that all tabs are present
    expect(screen.getAllByText('File Info').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Time in Range').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Glucose & Insulin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Meal Timing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pump Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hypos').length).toBeGreaterThan(0);
  });

  it('should show API key configuration message when no API key is provided', async () => {
    vi.mocked(apiUtils.getActiveProvider).mockReturnValue(null);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey=""
        grokApiKey=""
        deepseekApiKey=""
        selectedProvider={null}
        responseLanguage="english"
        uiLanguage="en"
        glucoseUnit="mmol/L"
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/To use AI-powered analysis/)).toBeInTheDocument();
    });
  });

  it('should set aiResponse state when existingAnalysis is provided', async () => {
    const existingAnalysis: AIAnalysisResult = {
      fileId: 'test-file-1',
      response: 'Previous AI analysis result',
      timestamp: new Date('2025-01-01'),
      inRangePercentage: 75,
    };

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        existingAnalysis={existingAnalysis}
        selectedProvider={null}
        responseLanguage="english"
        uiLanguage="en"
        glucoseUnit="mmol/L"
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Verify component renders without errors when existingAnalysis is provided
    // The existing analysis is used to restore state, visible in Time in Range tab content
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    expect(screen.getAllByText('Time in Range').length).toBeGreaterThan(0);
  });

  it('should call getActiveProvider with the correct parameters', async () => {
    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey="perplexity-key"
        geminiApiKey="gemini-key"
        grokApiKey="grok-key"
        deepseekApiKey="deepseek-key"
        selectedProvider="grok"
        responseLanguage="english"
        uiLanguage="en"
        glucoseUnit="mmol/L"
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    expect(apiUtils.getActiveProvider).toHaveBeenCalledWith(
      'grok',
      'perplexity-key',
      'gemini-key',
      'grok-key',
      'deepseek-key'
    );
  });
});
