/**
 * Tests for useCookieConsent hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookieConsent } from './useCookieConsent';

describe('useCookieConsent', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any console.warn mocks
    vi.restoreAllMocks();
  });

  it('should return false initially when no consent stored', () => {
    const { result } = renderHook(() => useCookieConsent());
    
    expect(result.current.hasConsented).toBe(false);
  });

  it('should return true when consent was previously stored', () => {
    // Set consent in localStorage
    localStorage.setItem('glooko-cookie-consent-acknowledged', 'true');
    
    const { result } = renderHook(() => useCookieConsent());
    
    expect(result.current.hasConsented).toBe(true);
  });

  it('should update hasConsented when acknowledgeConsent is called', () => {
    const { result } = renderHook(() => useCookieConsent());
    
    expect(result.current.hasConsented).toBe(false);
    
    act(() => {
      result.current.acknowledgeConsent();
    });
    
    expect(result.current.hasConsented).toBe(true);
    expect(localStorage.getItem('glooko-cookie-consent-acknowledged')).toBe('true');
  });

  it('should persist consent across hook re-renders', () => {
    const { result, rerender } = renderHook(() => useCookieConsent());
    
    act(() => {
      result.current.acknowledgeConsent();
    });
    
    rerender();
    
    expect(result.current.hasConsented).toBe(true);
  });

  it('should handle localStorage not available gracefully', () => {
    // Mock localStorage to throw error
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    
    const { result } = renderHook(() => useCookieConsent());
    
    expect(result.current.hasConsented).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    getItemSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should handle localStorage write failure gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage write failed');
    });
    
    const { result } = renderHook(() => useCookieConsent());
    
    act(() => {
      result.current.acknowledgeConsent();
    });
    
    // Should not crash, but state should still update
    expect(result.current.hasConsented).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    setItemSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should return false for invalid stored values', () => {
    localStorage.setItem('glooko-cookie-consent-acknowledged', 'invalid');
    
    const { result } = renderHook(() => useCookieConsent());
    
    expect(result.current.hasConsented).toBe(false);
  });
});
