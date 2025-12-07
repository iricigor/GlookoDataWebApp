/**
 * Tests for useUILanguage hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUILanguage } from './useUILanguage';
import i18n from '../i18n';

// Mock i18n
vi.mock('../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
    language: 'en',
  },
}));

describe('useUILanguage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear mock calls
    vi.clearAllMocks();
  });

  it('should initialize with en as default', () => {
    const { result } = renderHook(() => useUILanguage());
    expect(result.current.uiLanguage).toBe('en');
  });

  it('should update language to de', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('de');
    });
    
    expect(result.current.uiLanguage).toBe('de');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
  });

  it('should update language to cs', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('cs');
    });
    
    expect(result.current.uiLanguage).toBe('cs');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('cs');
  });

  it('should update language to sr', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('sr');
    });
    
    expect(result.current.uiLanguage).toBe('sr');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('sr');
  });

  it('should update language to en', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('en');
    });
    
    expect(result.current.uiLanguage).toBe('en');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('should persist language preference in localStorage', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('de');
    });
    
    expect(localStorage.getItem('glookoUILanguagePreference')).toBe('de');
  });

  it('should read language from existing localStorage', () => {
    // Set localStorage before hook initialization
    localStorage.setItem('glookoUILanguagePreference', 'de');
    
    const { result } = renderHook(() => useUILanguage());
    expect(result.current.uiLanguage).toBe('de');
  });

  it('should read Serbian language from existing localStorage', () => {
    // Set localStorage before hook initialization
    localStorage.setItem('glookoUILanguagePreference', 'sr');
    
    const { result } = renderHook(() => useUILanguage());
    expect(result.current.uiLanguage).toBe('sr');
  });

  it('should use default if localStorage has invalid value', () => {
    localStorage.setItem('glookoUILanguagePreference', 'invalid');
    
    const { result } = renderHook(() => useUILanguage());
    expect(result.current.uiLanguage).toBe('en');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage error');
    });
    
    const { result } = renderHook(() => useUILanguage());
    expect(result.current.uiLanguage).toBe('en');
    
    // Restore original
    Storage.prototype.getItem = originalGetItem;
  });

  it('should change i18next language when updated', () => {
    const { result } = renderHook(() => useUILanguage());
    
    act(() => {
      result.current.setUILanguage('de');
    });
    
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
  });
});
