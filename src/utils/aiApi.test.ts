/**
 * Tests for unified AI API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAIApi, getProviderDisplayName, determineActiveProvider, type AIProvider } from './aiApi';
import * as perplexityApi from './perplexityApi';
import * as geminiApi from './geminiApi';
import * as grokApi from './grokApi';

describe('aiApi', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('callAIApi', () => {
    it('should call Perplexity API when provider is perplexity', async () => {
      const mockResult = { success: true, content: 'Perplexity response' };
      const spy = vi.spyOn(perplexityApi, 'callPerplexityApi').mockResolvedValue(mockResult);

      const result = await callAIApi('perplexity', 'test-key', 'test prompt');

      expect(spy).toHaveBeenCalledWith('test-key', 'test prompt');
      expect(result).toEqual(mockResult);
    });

    it('should call Gemini API when provider is gemini', async () => {
      const mockResult = { success: true, content: 'Gemini response' };
      const spy = vi.spyOn(geminiApi, 'callGeminiApi').mockResolvedValue(mockResult);

      const result = await callAIApi('gemini', 'test-key', 'test prompt');

      expect(spy).toHaveBeenCalledWith('test-key', 'test prompt');
      expect(result).toEqual(mockResult);
    });

    it('should call Grok API when provider is grok', async () => {
      const mockResult = { success: true, content: 'Grok response' };
      const spy = vi.spyOn(grokApi, 'callGrokApi').mockResolvedValue(mockResult);

      const result = await callAIApi('grok', 'test-key', 'test prompt');

      expect(spy).toHaveBeenCalledWith('test-key', 'test prompt');
      expect(result).toEqual(mockResult);
    });

    it('should return error for unknown provider', async () => {
      const result = await callAIApi('unknown' as AIProvider, 'test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown AI provider');
      expect(result.errorType).toBe('unknown');
    });
  });

  describe('getProviderDisplayName', () => {
    it('should return "Perplexity" for perplexity provider', () => {
      expect(getProviderDisplayName('perplexity')).toBe('Perplexity');
    });

    it('should return "Google Gemini" for gemini provider', () => {
      expect(getProviderDisplayName('gemini')).toBe('Google Gemini');
    });

    it('should return "Grok AI" for grok provider', () => {
      expect(getProviderDisplayName('grok')).toBe('Grok AI');
    });

    it('should return the provider value for unknown providers', () => {
      expect(getProviderDisplayName('unknown' as AIProvider)).toBe('unknown');
    });
  });

  describe('determineActiveProvider', () => {
    it('should return perplexity when only Perplexity key is provided', () => {
      const result = determineActiveProvider('perplexity-key', '', '');
      expect(result).toBe('perplexity');
    });

    it('should return grok when only Grok key is provided', () => {
      const result = determineActiveProvider('', '', 'grok-key');
      expect(result).toBe('grok');
    });

    it('should return gemini when only Gemini key is provided', () => {
      const result = determineActiveProvider('', 'gemini-key', '');
      expect(result).toBe('gemini');
    });

    it('should prioritize Perplexity when all keys are provided', () => {
      const result = determineActiveProvider('perplexity-key', 'gemini-key', 'grok-key');
      expect(result).toBe('perplexity');
    });

    it('should prioritize Grok over Gemini when both are provided', () => {
      const result = determineActiveProvider('', 'gemini-key', 'grok-key');
      expect(result).toBe('grok');
    });

    it('should return null when no keys are provided', () => {
      const result = determineActiveProvider('', '', '');
      expect(result).toBe(null);
    });

    it('should return null when keys are only whitespace', () => {
      const result = determineActiveProvider('  ', '  ', '  ');
      expect(result).toBe(null);
    });

    it('should treat whitespace-only Perplexity key as empty', () => {
      const result = determineActiveProvider('  ', 'gemini-key', 'grok-key');
      expect(result).toBe('grok');
    });

    it('should treat whitespace-only Grok key as empty', () => {
      const result = determineActiveProvider('  ', 'gemini-key', '  ');
      expect(result).toBe('gemini');
    });

    it('should treat whitespace-only Gemini key as empty', () => {
      const result = determineActiveProvider('perplexity-key', '  ', '  ');
      expect(result).toBe('perplexity');
    });
  });
});
