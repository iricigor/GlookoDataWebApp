/**
 * Tests for useActiveAIProvider hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveAIProvider } from './useActiveAIProvider';

describe('useActiveAIProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with null when no stored value', () => {
    const { result } = renderHook(() => useActiveAIProvider());
    expect(result.current.selectedProvider).toBeNull();
  });

  it('should store and retrieve perplexity provider', () => {
    const { result } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result.current.setSelectedProvider('perplexity');
    });
    
    expect(result.current.selectedProvider).toBe('perplexity');
    expect(localStorage.getItem('glooko-active-ai-provider')).toBe('perplexity');
  });

  it('should store and retrieve gemini provider', () => {
    const { result } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result.current.setSelectedProvider('gemini');
    });
    
    expect(result.current.selectedProvider).toBe('gemini');
    expect(localStorage.getItem('glooko-active-ai-provider')).toBe('gemini');
  });

  it('should store and retrieve grok provider', () => {
    const { result } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result.current.setSelectedProvider('grok');
    });
    
    expect(result.current.selectedProvider).toBe('grok');
    expect(localStorage.getItem('glooko-active-ai-provider')).toBe('grok');
  });

  it('should store and retrieve deepseek provider', () => {
    const { result } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result.current.setSelectedProvider('deepseek');
    });
    
    expect(result.current.selectedProvider).toBe('deepseek');
    expect(localStorage.getItem('glooko-active-ai-provider')).toBe('deepseek');
  });

  it('should clear storage when set to null', () => {
    // First set a value
    const { result } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result.current.setSelectedProvider('perplexity');
    });
    
    expect(localStorage.getItem('glooko-active-ai-provider')).toBe('perplexity');
    
    // Then clear it
    act(() => {
      result.current.setSelectedProvider(null);
    });
    
    expect(result.current.selectedProvider).toBeNull();
    expect(localStorage.getItem('glooko-active-ai-provider')).toBeNull();
  });

  it('should persist across hook instances', () => {
    // Set value in first instance
    const { result: result1 } = renderHook(() => useActiveAIProvider());
    
    act(() => {
      result1.current.setSelectedProvider('grok');
    });
    
    // Create new instance and verify it loads the stored value
    const { result: result2 } = renderHook(() => useActiveAIProvider());
    expect(result2.current.selectedProvider).toBe('grok');
  });

  it('should handle invalid stored values gracefully', () => {
    // Set an invalid value directly in localStorage
    localStorage.setItem('glooko-active-ai-provider', 'invalid-provider');
    
    const { result } = renderHook(() => useActiveAIProvider());
    expect(result.current.selectedProvider).toBeNull();
  });
});
