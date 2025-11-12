/**
 * Tests for useDeepSeekApiKey hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeepSeekApiKey } from './useDeepSeekApiKey';

describe('useDeepSeekApiKey', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  });

  it('should initialize with empty string when no cookie exists', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    expect(result.current.apiKey).toBe('');
  });

  it('should initialize from cookie if it exists', () => {
    // Set a cookie before rendering the hook
    document.cookie = 'glooko-deepseek-api-key=test-key-123; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useDeepSeekApiKey());
    expect(result.current.apiKey).toBe('test-key-123');
  });

  it('should update state when setApiKey is called', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    
    act(() => {
      result.current.setApiKey('new-api-key');
    });
    
    expect(result.current.apiKey).toBe('new-api-key');
  });

  it('should save to cookie when setApiKey is called', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    
    act(() => {
      result.current.setApiKey('saved-key');
    });
    
    // Check that cookie was set
    const cookies = document.cookie.split(';');
    const apiKeyCookie = cookies.find(c => c.trim().startsWith('glooko-deepseek-api-key='));
    expect(apiKeyCookie).toBeDefined();
    expect(apiKeyCookie).toContain('saved-key');
  });

  it('should persist across hook re-renders', () => {
    const { result, rerender } = renderHook(() => useDeepSeekApiKey());
    
    act(() => {
      result.current.setApiKey('persistent-key');
    });
    
    // Re-render the hook
    rerender();
    
    expect(result.current.apiKey).toBe('persistent-key');
  });

  it('should handle special characters in API key', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    const specialKey = 'key-with-special-chars-!@#$%^&*()';
    
    act(() => {
      result.current.setApiKey(specialKey);
    });
    
    expect(result.current.apiKey).toBe(specialKey);
    
    // Verify it can be read back from cookie
    const { result: result2 } = renderHook(() => useDeepSeekApiKey());
    expect(result2.current.apiKey).toBe(specialKey);
  });
});
