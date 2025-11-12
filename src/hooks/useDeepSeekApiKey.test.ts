/**
 * Tests for useDeepSeekApiKey hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeepSeekApiKey } from './useDeepSeekApiKey';

describe('useDeepSeekApiKey', () => {
  const COOKIE_NAME = 'glooko-deepseek-api-key';

  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  afterEach(() => {
    // Clean up cookies after each test
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  it('should initialize with empty string when no cookie exists', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    
    expect(result.current.apiKey).toBe('');
  });

  it('should initialize with value from cookie if it exists', () => {
    // Set a cookie value
    const testApiKey = 'test-api-key-123';
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(testApiKey)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    
    const { result } = renderHook(() => useDeepSeekApiKey());
    
    expect(result.current.apiKey).toBe(testApiKey);
  });

  it('should update state and cookie when setApiKey is called', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    const newApiKey = 'new-test-key';
    
    act(() => {
      result.current.setApiKey(newApiKey);
    });
    
    expect(result.current.apiKey).toBe(newApiKey);
    
    // Verify cookie was set
    const cookies = document.cookie.split(';');
    const apiKeyCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
    expect(apiKeyCookie).toBeDefined();
    expect(apiKeyCookie).toContain(encodeURIComponent(newApiKey));
  });

  it('should handle special characters in API key', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    const specialKey = 'key-with-special=chars&more';
    
    act(() => {
      result.current.setApiKey(specialKey);
    });
    
    expect(result.current.apiKey).toBe(specialKey);
    
    // Re-render hook to verify cookie persistence
    const { result: result2 } = renderHook(() => useDeepSeekApiKey());
    expect(result2.current.apiKey).toBe(specialKey);
  });

  it('should clear API key when set to empty string', () => {
    const { result } = renderHook(() => useDeepSeekApiKey());
    
    // First set a key
    act(() => {
      result.current.setApiKey('test-key');
    });
    expect(result.current.apiKey).toBe('test-key');
    
    // Then clear it
    act(() => {
      result.current.setApiKey('');
    });
    expect(result.current.apiKey).toBe('');
  });

  it('should maintain same setApiKey reference across renders', () => {
    const { result, rerender } = renderHook(() => useDeepSeekApiKey());
    const firstSetApiKey = result.current.setApiKey;
    
    rerender();
    
    expect(result.current.setApiKey).toBe(firstSetApiKey);
  });
});
