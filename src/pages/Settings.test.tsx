/**
 * Unit tests for Settings component
 * 
 * These tests focus on the AI provider auto-switch notification functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from './Settings';
import type { AIProvider } from '../utils/api';
import * as apiUtils from '../utils/api';

// Mock the API utilities
vi.mock('../utils/api', () => ({
  getActiveProvider: vi.fn(),
  getAvailableProviders: vi.fn(),
  getProviderDisplayName: vi.fn().mockImplementation((provider: AIProvider) => {
    const names: Record<AIProvider, string> = {
      perplexity: 'Perplexity AI',
      gemini: 'Google Gemini AI',
      grok: 'Grok AI',
      deepseek: 'DeepSeek AI',
    };
    return names[provider] || provider;
  }),
  verifyApiKey: vi.fn(),
}));

// Mock version utils
vi.mock('../utils/version', () => ({
  getVersionInfo: () => ({
    version: '1.0.0',
    buildId: 'test',
    buildDate: '2025-01-01',
    fullVersion: '1.0.0-test',
    releaseUrl: null,
  }),
  formatBuildDate: () => 'January 1, 2025',
}));

describe('Settings', () => {
  const mockProps = {
    themeMode: 'light' as const,
    onThemeChange: vi.fn(),
    showDayNightShading: true,
    onShowDayNightShadingChange: vi.fn(),
    exportFormat: 'csv' as const,
    onExportFormatChange: vi.fn(),
    uiLanguage: 'en' as const,
    onUILanguageChange: vi.fn(),
    responseLanguage: 'english' as const,
    onResponseLanguageChange: vi.fn(),
    syncWithUILanguage: true,
    onSyncWithUILanguageChange: vi.fn(),
    glucoseUnit: 'mmol/L' as const,
    onGlucoseUnitChange: vi.fn(),
    glucoseThresholds: {
      veryHigh: 13.9,
      high: 10,
      low: 3.9,
      veryLow: 3,
    },
    onGlucoseThresholdsChange: vi.fn(),
    insulinDuration: 4,
    onInsulinDurationChange: vi.fn(),
    perplexityApiKey: 'test-perplexity-key',
    onPerplexityApiKeyChange: vi.fn(),
    geminiApiKey: 'test-gemini-key',
    onGeminiApiKeyChange: vi.fn(),
    grokApiKey: '',
    onGrokApiKeyChange: vi.fn(),
    deepseekApiKey: '',
    onDeepSeekApiKeyChange: vi.fn(),
    selectedProvider: 'perplexity' as const,
    onSelectedProviderChange: vi.fn(),
    onProviderAutoSwitch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiUtils.getActiveProvider).mockReturnValue('perplexity');
    vi.mocked(apiUtils.getAvailableProviders).mockReturnValue(['perplexity', 'gemini']);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render Settings heading', () => {
    render(<Settings {...mockProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render General tab by default', () => {
    render(<Settings {...mockProps} />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('should switch to AI Settings tab when clicked', async () => {
    render(<Settings {...mockProps} />);
    
    const aiTab = screen.getByRole('tab', { name: 'AI Settings' });
    fireEvent.click(aiTab);
    
    await waitFor(() => {
      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    });
  });

  describe('Provider Auto-Switch', () => {
    it('should call onProviderAutoSwitch when key verification fails and provider switches', async () => {
      // Mock verification to fail
      vi.mocked(apiUtils.verifyApiKey).mockResolvedValue({ valid: false, error: 'Invalid key' });
      
      render(<Settings {...mockProps} />);
      
      // Navigate to AI Settings tab
      const aiTab = screen.getByRole('tab', { name: 'AI Settings' });
      fireEvent.click(aiTab);
      
      // Wait for the tab to render
      await waitFor(() => {
        expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      });
      
      // Find and click the verify button for Perplexity
      const verifyButtons = screen.getAllByRole('button', { name: /verify|Click to verify/i });
      const perplexityVerifyButton = verifyButtons[0];
      
      fireEvent.click(perplexityVerifyButton);
      
      // Wait for verification and auto-switch
      await waitFor(() => {
        expect(apiUtils.verifyApiKey).toHaveBeenCalledWith('perplexity', 'test-perplexity-key');
      });
      
      await waitFor(() => {
        expect(mockProps.onSelectedProviderChange).toHaveBeenCalledWith('gemini');
        expect(mockProps.onProviderAutoSwitch).toHaveBeenCalledWith('perplexity', 'gemini');
      });
    });

    it('should not call onProviderAutoSwitch when key verification succeeds', async () => {
      // Mock verification to succeed
      vi.mocked(apiUtils.verifyApiKey).mockResolvedValue({ valid: true });
      
      render(<Settings {...mockProps} />);
      
      // Navigate to AI Settings tab
      const aiTab = screen.getByRole('tab', { name: 'AI Settings' });
      fireEvent.click(aiTab);
      
      await waitFor(() => {
        expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      });
      
      // Find and click the verify button
      const verifyButtons = screen.getAllByRole('button', { name: /verify|Click to verify/i });
      const perplexityVerifyButton = verifyButtons[0];
      
      fireEvent.click(perplexityVerifyButton);
      
      await waitFor(() => {
        expect(apiUtils.verifyApiKey).toHaveBeenCalled();
      });
      
      // Should not trigger auto-switch on success
      expect(mockProps.onProviderAutoSwitch).not.toHaveBeenCalled();
    });

    it('should not call onProviderAutoSwitch when failed provider is not active', async () => {
      // Active provider is gemini, but we verify perplexity
      vi.mocked(apiUtils.getActiveProvider).mockReturnValue('gemini');
      vi.mocked(apiUtils.verifyApiKey).mockResolvedValue({ valid: false, error: 'Invalid key' });
      
      const propsWithGeminiActive = {
        ...mockProps,
        selectedProvider: 'gemini' as const,
      };
      
      render(<Settings {...propsWithGeminiActive} />);
      
      // Navigate to AI Settings tab
      const aiTab = screen.getByRole('tab', { name: 'AI Settings' });
      fireEvent.click(aiTab);
      
      await waitFor(() => {
        expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      });
      
      // Find and click the verify button for Perplexity (not the active provider)
      const verifyButtons = screen.getAllByRole('button', { name: /verify|Click to verify/i });
      const perplexityVerifyButton = verifyButtons[0];
      
      fireEvent.click(perplexityVerifyButton);
      
      await waitFor(() => {
        expect(apiUtils.verifyApiKey).toHaveBeenCalled();
      });
      
      // Should not switch because perplexity is not the active provider
      expect(mockProps.onProviderAutoSwitch).not.toHaveBeenCalled();
    });
  });
});
