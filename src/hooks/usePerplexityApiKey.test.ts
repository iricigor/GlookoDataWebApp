/**
 * Tests for usePerplexityApiKey hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerplexityApiKey } from './usePerplexityApiKey';

describe('usePerplexityApiKey', () => {
  // Clear cookies before each test
  beforeEach(() => {
    document.cookie = 'glooko-perplexity-api-key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should initialize with empty string when no cookie exists', () => {
    const { result } = renderHook(() => usePerplexityApiKey());
    expect(result.current.apiKey).toBe('');
  });

  it('should load API key from cookie', () => {
    // Set cookie with a test API key
    document.cookie = 'glooko-perplexity-api-key=test-api-key-123; path=/;';
    
    const { result } = renderHook(() => usePerplexityApiKey());
    expect(result.current.apiKey).toBe('test-api-key-123');
  });

  it('should update API key and persist to cookie', () => {
    const { result } = renderHook(() => usePerplexityApiKey());
    
    act(() => {
      result.current.setApiKey('new-api-key-456');
    });
    
    expect(result.current.apiKey).toBe('new-api-key-456');
    
    // Verify cookie was set
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('glooko-perplexity-api-key='))
      ?.split('=')[1];
    
    expect(decodeURIComponent(cookieValue || '')).toBe('new-api-key-456');
  });

  it('should handle empty string as API key', () => {
    const { result } = renderHook(() => usePerplexityApiKey());
    
    act(() => {
      result.current.setApiKey('some-key');
    });
    
    expect(result.current.apiKey).toBe('some-key');
    
    act(() => {
      result.current.setApiKey('');
    });
    
    expect(result.current.apiKey).toBe('');
  });

  it('should handle special characters in API key', () => {
    const { result } = renderHook(() => usePerplexityApiKey());
    const specialKey = 'key-with-special-chars-!@#$%^&*()';
    
    act(() => {
      result.current.setApiKey(specialKey);
    });
    
    expect(result.current.apiKey).toBe(specialKey);
    
    // Re-render hook to verify persistence
    const { result: result2 } = renderHook(() => usePerplexityApiKey());
    expect(result2.current.apiKey).toBe(specialKey);
  });

  it('should persist API key across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => usePerplexityApiKey());
    
    act(() => {
      result1.current.setApiKey('persistent-key');
    });
    
    // Create new hook instance
    const { result: result2 } = renderHook(() => usePerplexityApiKey());
    expect(result2.current.apiKey).toBe('persistent-key');
  });
});
