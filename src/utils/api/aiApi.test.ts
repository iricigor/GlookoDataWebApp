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
  isRequestTooLargeError,
  verifyApiKey,
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
    it('should return "Perplexity AI" for perplexity provider', () => {
      expect(getProviderDisplayName('perplexity')).toBe('Perplexity AI');
    });

    it('should return "Google Gemini AI" for gemini provider', () => {
      expect(getProviderDisplayName('gemini')).toBe('Google Gemini AI');
    });

    it('should return "Grok AI" for grok provider', () => {
      expect(getProviderDisplayName('grok')).toBe('Grok AI');
    });

    it('should return "DeepSeek AI" for deepseek provider', () => {
      expect(getProviderDisplayName('deepseek')).toBe('DeepSeek AI');
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

  describe('isRequestTooLargeError', () => {
    it('should return false for undefined error', () => {
      expect(isRequestTooLargeError(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRequestTooLargeError('')).toBe(false);
    });

    it('should return false for unrelated error', () => {
      expect(isRequestTooLargeError('Network connection failed')).toBe(false);
    });

    it('should return true for "too large" error', () => {
      expect(isRequestTooLargeError('Request body too large')).toBe(true);
    });

    it('should return true for "too long" error', () => {
      expect(isRequestTooLargeError('Input text too long')).toBe(true);
    });

    it('should return true for "exceeds" error', () => {
      expect(isRequestTooLargeError('Input exceeds the allowed size')).toBe(true);
    });

    it('should return true for "maximum" error', () => {
      expect(isRequestTooLargeError('Reached maximum input length')).toBe(true);
    });

    it('should return true for "limit" error', () => {
      expect(isRequestTooLargeError('Size limit reached')).toBe(true);
    });

    it('should return true for token limit errors', () => {
      expect(isRequestTooLargeError('Token limit exceeded')).toBe(true);
      expect(isRequestTooLargeError('Max token limit')).toBe(true);
    });

    it('should return true for payload size errors', () => {
      expect(isRequestTooLargeError('Payload too large')).toBe(true);
    });

    it('should return true for request size errors', () => {
      expect(isRequestTooLargeError('Request size exceeded')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isRequestTooLargeError('TOO LARGE')).toBe(true);
      expect(isRequestTooLargeError('Too Long')).toBe(true);
      expect(isRequestTooLargeError('EXCEEDS')).toBe(true);
    });
  });

  describe('verifyApiKey', () => {
    it('should call verifyPerplexityApiKey for perplexity provider', async () => {
      const mockVerify = vi.spyOn(perplexityApi, 'verifyPerplexityApiKey').mockResolvedValue({ valid: true });
      
      const result = await verifyApiKey('perplexity', 'test-key');
      
      expect(mockVerify).toHaveBeenCalledWith('test-key');
      expect(result.valid).toBe(true);
    });

    it('should call verifyGeminiApiKey for gemini provider', async () => {
      const mockVerify = vi.spyOn(geminiApi, 'verifyGeminiApiKey').mockResolvedValue({ valid: true });
      
      const result = await verifyApiKey('gemini', 'test-key');
      
      expect(mockVerify).toHaveBeenCalledWith('test-key');
      expect(result.valid).toBe(true);
    });

    it('should call verifyGrokApiKey for grok provider', async () => {
      const mockVerify = vi.spyOn(grokApi, 'verifyGrokApiKey').mockResolvedValue({ valid: true });
      
      const result = await verifyApiKey('grok', 'test-key');
      
      expect(mockVerify).toHaveBeenCalledWith('test-key');
      expect(result.valid).toBe(true);
    });

    it('should call verifyDeepSeekApiKey for deepseek provider', async () => {
      const mockVerify = vi.spyOn(deepseekApi, 'verifyDeepSeekApiKey').mockResolvedValue({ valid: true });
      
      const result = await verifyApiKey('deepseek', 'test-key');
      
      expect(mockVerify).toHaveBeenCalledWith('test-key');
      expect(result.valid).toBe(true);
    });

    it('should return invalid result for verification failures', async () => {
      vi.spyOn(perplexityApi, 'verifyPerplexityApiKey').mockResolvedValue({ valid: false, error: 'Invalid API key' });
      
      const result = await verifyApiKey('perplexity', 'invalid-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return invalid for unknown provider', async () => {
      const result = await verifyApiKey('unknown' as AIProvider, 'test-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown provider: unknown');
    });
  });
});
