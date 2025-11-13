import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AIAnalysis } from './AIAnalysis';
import type { UploadedFile, AIAnalysisResult } from '../types';
import * as glucoseDataUtils from '../utils/glucoseDataUtils';
import * as insulinDataUtils from '../utils/insulinDataUtils';
import * as aiApi from '../utils/aiApi';

// Mock the modules
vi.mock('../utils/glucoseDataUtils');
vi.mock('../utils/insulinDataUtils');
vi.mock('../utils/aiApi');
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

  // Helper function to get the first "Analyze with AI" button (Time in Range Analysis)
  const getFirstAnalyzeButton = () => {
    const buttons = screen.getAllByText('Analyze with AI');
    return buttons[0];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock glucose data extraction
    vi.mocked(glucoseDataUtils.extractGlucoseReadings).mockResolvedValue([
      { timestamp: new Date(), value: 7.0 },
      { timestamp: new Date(), value: 8.0 },
    ]);
    // Mock insulin data extraction
    vi.mocked(insulinDataUtils.extractInsulinReadings).mockResolvedValue([]);
    vi.mocked(insulinDataUtils.aggregateInsulinByDate).mockReturnValue([]);
    // Mock AI provider
    vi.mocked(aiApi.determineActiveProvider).mockReturnValue('gemini');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show "Analyze with AI" button initially', async () => {
    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    });
  });

  it('should change button text to "Click to enable new analysis" after successful analysis', async () => {
    const mockResponse = {
      success: true,
      content: 'This is a test AI response',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Wait for the button to be available (after data loads)
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click the analyze button
    const analyzeButton = getFirstAnalyzeButton();
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('This is a test AI response')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check button text changed
    await waitFor(() => {
      expect(screen.getByText('Click to enable new analysis')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should return button to "Analyze with AI" after cooldown completes', async () => {
    const mockResponse = {
      success: true,
      content: 'This is a test AI response',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Wait for the button to be available
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click to start first analysis
    fireEvent.click(getFirstAnalyzeButton());

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('This is a test AI response')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Button should now show "Click to enable new analysis"
    await waitFor(() => {
      expect(screen.getByText('Click to enable new analysis')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click to enable new analysis (starts cooldown)
    fireEvent.click(screen.getByText('Click to enable new analysis'));

    // Should show cooldown message
    await waitFor(() => {
      expect(screen.getByText(/Please wait \d+ second/)).toBeInTheDocument();
    });

    // Wait for cooldown to complete naturally (using real time)
    await waitFor(() => {
      expect(screen.queryByText(/Please wait/)).not.toBeInTheDocument();
    }, { timeout: 4000 });

    // Button should return to "Analyze with AI"
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });
  }, 10000); // 10 second timeout for this test

  it('should show cooldown when clicking button after successful analysis', async () => {
    const mockResponse = {
      success: true,
      content: 'This is a test AI response',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Wait for the button and click it
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });
    fireEvent.click(getFirstAnalyzeButton());

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Click to enable new analysis')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click again to trigger cooldown
    fireEvent.click(screen.getByText('Click to enable new analysis'));

    // Check cooldown message appears
    await waitFor(() => {
      expect(screen.getByText(/Please wait \d+ second/)).toBeInTheDocument();
    });
  });

  it('should preserve AI response when navigating away and back', async () => {
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
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // The existing analysis should be displayed
    await waitFor(() => {
      expect(screen.getByText('Previous AI analysis result')).toBeInTheDocument();
    });
  });

  it('should keep previous response on API error', async () => {
    const mockSuccessResponse = {
      success: true,
      content: 'Successful analysis',
    };
    const mockErrorResponse = {
      success: false,
      error: 'API error occurred',
    };

    // First call succeeds
    vi.mocked(aiApi.callAIApi).mockResolvedValueOnce(mockSuccessResponse);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // First analysis
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });
    fireEvent.click(getFirstAnalyzeButton());

    await waitFor(() => {
      expect(screen.getByText('Successful analysis')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Second call fails
    vi.mocked(aiApi.callAIApi).mockResolvedValueOnce(mockErrorResponse);

    // Trigger cooldown and wait for it to complete
    await waitFor(() => {
      expect(screen.getByText('Click to enable new analysis')).toBeInTheDocument();
    }, { timeout: 2000 });
    fireEvent.click(screen.getByText('Click to enable new analysis'));
    
    // Wait for cooldown to start
    await waitFor(() => {
      expect(screen.getByText(/Please wait/)).toBeInTheDocument();
    });

    // Wait for cooldown to complete naturally (using real time)
    await waitFor(() => {
      expect(screen.queryByText(/Please wait/)).not.toBeInTheDocument();
    }, { timeout: 4000 });

    // Button should now show "Analyze with AI"
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click analyze again
    fireEvent.click(getFirstAnalyzeButton());

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/API error occurred/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Previous response should still be visible
    expect(screen.getByText('Successful analysis')).toBeInTheDocument();
  }, 10000); // 10 second timeout for this test

  it('should call onAnalysisComplete with correct parameters', async () => {
    const mockResponse = {
      success: true,
      content: 'Test analysis result',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey="test-key"
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    });

    fireEvent.click(getFirstAnalyzeButton());

    await waitFor(() => {
      expect(mockAnalysisComplete).toHaveBeenCalledWith(
        'test-file-1',
        'Test analysis result',
        expect.any(Number)
      );
    });
  });

  it('should use Grok API key when Grok is the active provider', async () => {
    const mockResponse = {
      success: true,
      content: 'Grok AI response',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);
    vi.mocked(aiApi.determineActiveProvider).mockReturnValue('grok');

    render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey=""
        grokApiKey="test-grok-key"
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Wait for the button to be available
    await waitFor(() => {
      expect(getFirstAnalyzeButton()).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click analyze
    fireEvent.click(getFirstAnalyzeButton());

    // Verify callAIApi was called with correct provider and API key
    await waitFor(() => {
      expect(aiApi.callAIApi).toHaveBeenCalledWith(
        'grok',
        'test-grok-key',
        expect.any(String)
      );
    });
  });

  it('should use correct API key for each provider in Meal Timing analysis', async () => {
    const mockResponse = {
      success: true,
      content: 'Meal timing analysis',
    };
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);
    
    // Mock insulin readings for meal timing
    vi.mocked(insulinDataUtils.extractInsulinReadings).mockResolvedValue([
      { timestamp: new Date(), dose: 5.0, insulinType: 'bolus' },
    ]);

    // Test with Grok
    vi.mocked(aiApi.determineActiveProvider).mockReturnValue('grok');
    const { rerender } = render(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey=""
        geminiApiKey=""
        grokApiKey="test-grok-key"
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Switch to Meal Timing tab
    await waitFor(() => {
      expect(screen.getByText('Meal Timing')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Meal Timing'));

    // Wait for the Analyze button on Meal Timing tab
    await waitFor(() => {
      const analyzeButtons = screen.getAllByText('Analyze with AI');
      expect(analyzeButtons.length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Click the last analyze button (Meal Timing tab)
    const analyzeButtons = screen.getAllByText('Analyze with AI');
    fireEvent.click(analyzeButtons[analyzeButtons.length - 1]);

    // Verify callAIApi was called with Grok provider and key
    await waitFor(() => {
      expect(aiApi.callAIApi).toHaveBeenCalledWith(
        'grok',
        'test-grok-key',
        expect.any(String)
      );
    }, { timeout: 2000 });

    // Clear mocks for next test
    vi.clearAllMocks();
    vi.mocked(aiApi.callAIApi).mockResolvedValue(mockResponse);

    // Test with Perplexity
    vi.mocked(aiApi.determineActiveProvider).mockReturnValue('perplexity');
    rerender(
      <AIAnalysis
        selectedFile={mockFile}
        perplexityApiKey="test-perplexity-key"
        geminiApiKey=""
        grokApiKey=""
        deepseekApiKey=""
        onAnalysisComplete={mockAnalysisComplete}
      />
    );

    // Switch back to Meal Timing tab
    await waitFor(() => {
      expect(screen.getByText('Meal Timing')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Meal Timing'));

    await waitFor(() => {
      const analyzeButtons = screen.getAllByText('Analyze with AI');
      expect(analyzeButtons.length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    const analyzeButtons2 = screen.getAllByText('Analyze with AI');
    fireEvent.click(analyzeButtons2[analyzeButtons2.length - 1]);

    // Verify callAIApi was called with Perplexity provider and key
    await waitFor(() => {
      expect(aiApi.callAIApi).toHaveBeenCalledWith(
        'perplexity',
        'test-perplexity-key',
        expect.any(String)
      );
    }, { timeout: 2000 });
  }, 15000); // Longer timeout for complex test
});
