/**
 * Tests for useResponseLanguage hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponseLanguage } from './useResponseLanguage';

describe('useResponseLanguage', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'glooko-response-language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should initialize with english as default', () => {
    const { result } = renderHook(() => useResponseLanguage());
    expect(result.current.responseLanguage).toBe('english');
  });

  it('should update language to czech', () => {
    const { result } = renderHook(() => useResponseLanguage());
    
    act(() => {
      result.current.setResponseLanguage('czech');
    });
    
    expect(result.current.responseLanguage).toBe('czech');
  });

  it('should update language to german', () => {
    const { result } = renderHook(() => useResponseLanguage());
    
    act(() => {
      result.current.setResponseLanguage('german');
    });
    
    expect(result.current.responseLanguage).toBe('german');
  });

  it('should update language to serbian', () => {
    const { result } = renderHook(() => useResponseLanguage());
    
    act(() => {
      result.current.setResponseLanguage('serbian');
    });
    
    expect(result.current.responseLanguage).toBe('serbian');
  });

  it('should update language to english', () => {
    const { result } = renderHook(() => useResponseLanguage());
    
    act(() => {
      result.current.setResponseLanguage('english');
    });
    
    expect(result.current.responseLanguage).toBe('english');
  });

  it('should persist language preference in cookie', () => {
    const { result } = renderHook(() => useResponseLanguage());
    
    act(() => {
      result.current.setResponseLanguage('czech');
    });
    
    expect(document.cookie).toContain('glooko-response-language=czech');
  });

  it('should read language from existing cookie', () => {
    // Set cookie before hook initialization
    document.cookie = 'glooko-response-language=czech; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useResponseLanguage());
    expect(result.current.responseLanguage).toBe('czech');
  });

  it('should use default if cookie has invalid value', () => {
    document.cookie = 'glooko-response-language=invalid; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useResponseLanguage());
    expect(result.current.responseLanguage).toBe('english');
  });
});
