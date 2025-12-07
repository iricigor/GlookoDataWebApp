/**
 * Tests for useResponseLanguage hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponseLanguage, mapUILanguageToResponseLanguage } from './useResponseLanguage';

describe('useResponseLanguage', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'glooko-response-language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'glooko-sync-ai-with-ui=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should initialize with english as default for EN UI and sync enabled', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    expect(result.current.responseLanguage).toBe('english');
    expect(result.current.syncWithUILanguage).toBe(true);
  });

  it('should initialize with german when UI is DE and sync enabled', () => {
    const { result } = renderHook(() => useResponseLanguage('de'));
    expect(result.current.responseLanguage).toBe('german');
    expect(result.current.syncWithUILanguage).toBe(true);
  });

  it('should initialize with czech when UI is CS and sync enabled', () => {
    const { result } = renderHook(() => useResponseLanguage('cs'));
    expect(result.current.responseLanguage).toBe('czech');
    expect(result.current.syncWithUILanguage).toBe(true);
  });

  it('should initialize with serbian when UI is SR and sync enabled', () => {
    const { result } = renderHook(() => useResponseLanguage('sr'));
    expect(result.current.responseLanguage).toBe('serbian');
    expect(result.current.syncWithUILanguage).toBe(true);
  });

  it('should update language to czech and disable sync', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    
    expect(result.current.syncWithUILanguage).toBe(true); // starts with sync enabled
    
    act(() => {
      result.current.setResponseLanguage('czech');
    });
    
    expect(result.current.responseLanguage).toBe('czech');
    expect(result.current.syncWithUILanguage).toBe(false); // sync disabled after manual selection
  });

  it('should update language to german and disable sync', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    
    act(() => {
      result.current.setResponseLanguage('german');
    });
    
    expect(result.current.responseLanguage).toBe('german');
    expect(result.current.syncWithUILanguage).toBe(false);
  });

  it('should update language to serbian and disable sync', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    
    act(() => {
      result.current.setResponseLanguage('serbian');
    });
    
    expect(result.current.responseLanguage).toBe('serbian');
    expect(result.current.syncWithUILanguage).toBe(false);
  });

  it('should update language to english', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    
    act(() => {
      result.current.setResponseLanguage('english');
    });
    
    expect(result.current.responseLanguage).toBe('english');
  });

  it('should persist language preference in cookie and disable sync', () => {
    const { result } = renderHook(() => useResponseLanguage('en'));
    
    act(() => {
      result.current.setResponseLanguage('czech');
    });
    
    expect(document.cookie).toContain('glooko-response-language=czech');
    expect(document.cookie).toContain('glooko-sync-ai-with-ui=false');
  });

  it('should read language from existing cookie', () => {
    // Set cookie before hook initialization
    document.cookie = 'glooko-response-language=czech; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useResponseLanguage('en'));
    expect(result.current.responseLanguage).toBe('czech');
  });

  it('should use default if cookie has invalid value', () => {
    document.cookie = 'glooko-response-language=invalid; path=/; SameSite=Strict';
    
    const { result } = renderHook(() => useResponseLanguage('en'));
    expect(result.current.responseLanguage).toBe('english');
  });

  it('should sync language when UI language changes and sync is enabled', () => {
    const { result, rerender } = renderHook(
      ({ uiLanguage }) => useResponseLanguage(uiLanguage),
      { initialProps: { uiLanguage: 'en' as 'en' | 'de' } }
    );
    
    expect(result.current.responseLanguage).toBe('english');
    
    // Change UI language to German
    rerender({ uiLanguage: 'de' as 'en' | 'de' });
    
    expect(result.current.responseLanguage).toBe('german');
  });

  it('should not sync language when sync is disabled', () => {
    const { result, rerender } = renderHook(
      ({ uiLanguage }) => useResponseLanguage(uiLanguage),
      { initialProps: { uiLanguage: 'en' as 'en' | 'de' } }
    );
    
    // Disable sync
    act(() => {
      result.current.setSyncWithUILanguage(false);
    });
    
    // Change UI language to German
    rerender({ uiLanguage: 'de' as 'en' | 'de' });
    
    // Should still be English because sync is disabled
    expect(result.current.responseLanguage).toBe('english');
  });

  it('should immediately sync when enabling sync', () => {
    const { result } = renderHook(() => useResponseLanguage('de'));
    
    // Disable sync first
    act(() => {
      result.current.setSyncWithUILanguage(false);
    });
    
    // Set to English manually
    act(() => {
      result.current.setResponseLanguage('english');
    });
    
    expect(result.current.responseLanguage).toBe('english');
    
    // Re-enable sync - should immediately change to German (UI language)
    act(() => {
      result.current.setSyncWithUILanguage(true);
    });
    
    expect(result.current.responseLanguage).toBe('german');
  });
});

describe('mapUILanguageToResponseLanguage', () => {
  it('should map en to english', () => {
    expect(mapUILanguageToResponseLanguage('en')).toBe('english');
  });

  it('should map de to german', () => {
    expect(mapUILanguageToResponseLanguage('de')).toBe('german');
  });

  it('should map cs to czech', () => {
    expect(mapUILanguageToResponseLanguage('cs')).toBe('czech');
  });

  it('should map sr to serbian', () => {
    expect(mapUILanguageToResponseLanguage('sr')).toBe('serbian');
  });
});
