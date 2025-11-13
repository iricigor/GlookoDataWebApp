/**
 * Tests for unified AI API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  callAIApi, 
  getProviderDisplayName, 
  determineActiveProvider, 
  getActiveProvider,
  getAvailableProviders,
  type AIProvider 
} from './aiApi';
import * as perplexityApi from './perplexityApi';
import * as geminiApi from './geminiApi';
import * as grokApi from './grokApi';
import * as deepseekApi from './deepseekApi';

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

    it('should call DeepSeek API when provider is deepseek', async () => {
      const mockResult = { success: true, content: 'DeepSeek response' };
      const spy = vi.spyOn(deepseekApi, 'callDeepSeekApi').mockResolvedValue(mockResult);

      const result = await callAIApi('deepseek', 'test-key', 'test prompt');

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

    it('should return "DeepSeek" for deepseek provider', () => {
      expect(getProviderDisplayName('deepseek')).toBe('DeepSeek');
    });

    it('should return the provider value for unknown providers', () => {
      expect(getProviderDisplayName('unknown' as AIProvider)).toBe('unknown');
    });
  });

  describe('determineActiveProvider', () => {
    it('should return perplexity when only Perplexity key is provided', () => {
      const result = determineActiveProvider('perplexity-key', '', '', '');
      expect(result).toBe('perplexity');
    });

    it('should return grok when only Grok key is provided', () => {
      const result = determineActiveProvider('', '', 'grok-key', '');
      expect(result).toBe('grok');
    });

    it('should return deepseek when only DeepSeek key is provided', () => {
      const result = determineActiveProvider('', '', '', 'deepseek-key');
      expect(result).toBe('deepseek');
    });

    it('should return gemini when only Gemini key is provided', () => {
      const result = determineActiveProvider('', 'gemini-key', '', '');
      expect(result).toBe('gemini');
    });

    it('should prioritize Perplexity when all keys are provided', () => {
      const result = determineActiveProvider('perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('perplexity');
    });

    it('should prioritize Grok over DeepSeek when both are provided', () => {
      const result = determineActiveProvider('', '', 'grok-key', 'deepseek-key');
      expect(result).toBe('grok');
    });

    it('should prioritize DeepSeek over Gemini when both are provided', () => {
      const result = determineActiveProvider('', 'gemini-key', '', 'deepseek-key');
      expect(result).toBe('deepseek');
    });

    it('should return null when no keys are provided', () => {
      const result = determineActiveProvider('', '', '', '');
      expect(result).toBe(null);
    });

    it('should return null when keys are only whitespace', () => {
      const result = determineActiveProvider('  ', '  ', '  ', '  ');
      expect(result).toBe(null);
    });

    it('should treat whitespace-only Perplexity key as empty', () => {
      const result = determineActiveProvider('  ', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('grok');
    });

    it('should treat whitespace-only Grok key as empty', () => {
      const result = determineActiveProvider('  ', 'gemini-key', '  ', 'deepseek-key');
      expect(result).toBe('deepseek');
    });

    it('should treat whitespace-only DeepSeek key as empty', () => {
      const result = determineActiveProvider('  ', 'gemini-key', '  ', '  ');
      expect(result).toBe('gemini');
    });

    it('should treat whitespace-only Gemini key as empty', () => {
      const result = determineActiveProvider('perplexity-key', '  ', '  ', '  ');
      expect(result).toBe('perplexity');
    });
  });

  describe('getActiveProvider', () => {
    it('should use manually selected provider when it has a key', () => {
      const result = getActiveProvider('gemini', 'perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('gemini');
    });

    it('should use manually selected grok when it has a key', () => {
      const result = getActiveProvider('grok', 'perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('grok');
    });

    it('should use manually selected deepseek when it has a key', () => {
      const result = getActiveProvider('deepseek', 'perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('deepseek');
    });

    it('should fall back to auto-selection when selected provider has no key', () => {
      const result = getActiveProvider('gemini', 'perplexity-key', '', 'grok-key', 'deepseek-key');
      expect(result).toBe('perplexity');
    });

    it('should fall back to auto-selection when no provider is selected', () => {
      const result = getActiveProvider(null, 'perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('perplexity');
    });

    it('should return null when selected provider has no key and no other keys available', () => {
      const result = getActiveProvider('gemini', '', '', '', '');
      expect(result).toBe(null);
    });

    it('should ignore whitespace-only keys for selected provider', () => {
      const result = getActiveProvider('perplexity', '  ', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toBe('grok');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all providers when all keys are provided', () => {
      const result = getAvailableProviders('perplexity-key', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toEqual(['perplexity', 'grok', 'deepseek', 'gemini']);
    });

    it('should return only perplexity when only Perplexity key is provided', () => {
      const result = getAvailableProviders('perplexity-key', '', '', '');
      expect(result).toEqual(['perplexity']);
    });

    it('should return only grok when only Grok key is provided', () => {
      const result = getAvailableProviders('', '', 'grok-key', '');
      expect(result).toEqual(['grok']);
    });

    it('should return only deepseek when only DeepSeek key is provided', () => {
      const result = getAvailableProviders('', '', '', 'deepseek-key');
      expect(result).toEqual(['deepseek']);
    });

    it('should return only gemini when only Gemini key is provided', () => {
      const result = getAvailableProviders('', 'gemini-key', '', '');
      expect(result).toEqual(['gemini']);
    });

    it('should return empty array when no keys are provided', () => {
      const result = getAvailableProviders('', '', '', '');
      expect(result).toEqual([]);
    });

    it('should ignore whitespace-only keys', () => {
      const result = getAvailableProviders('  ', 'gemini-key', '  ', 'deepseek-key');
      expect(result).toEqual(['deepseek', 'gemini']);
    });

    it('should return providers in priority order', () => {
      const result = getAvailableProviders('', 'gemini-key', 'grok-key', 'deepseek-key');
      expect(result).toEqual(['grok', 'deepseek', 'gemini']);
    });
  });
});
