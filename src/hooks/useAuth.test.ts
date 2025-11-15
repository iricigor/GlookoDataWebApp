import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with logged out state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userName).toBeNull();
  });

  it('should login with user name', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('John Doe');
    });
    
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.userName).toBe('John Doe');
  });

  it('should logout', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('John Doe');
    });
    
    expect(result.current.isLoggedIn).toBe(true);
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userName).toBeNull();
  });

  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('John Doe');
    });
    
    const stored = localStorage.getItem('glooko-auth-state');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual({
      isLoggedIn: true,
      userName: 'John Doe',
    });
  });

  it('should load state from localStorage on initialization', () => {
    localStorage.setItem('glooko-auth-state', JSON.stringify({
      isLoggedIn: true,
      userName: 'Jane Smith',
    }));
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.userName).toBe('Jane Smith');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('glooko-auth-state', 'invalid json');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userName).toBeNull();
    
    consoleErrorSpy.mockRestore();
  });
});
