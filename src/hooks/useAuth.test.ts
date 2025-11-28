import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock MSAL browser
vi.mock('@azure/msal-browser', () => {
  return {
    PublicClientApplication: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      handleRedirectPromise: vi.fn().mockResolvedValue(null),
      getAllAccounts: vi.fn().mockReturnValue([]),
      loginPopup: vi.fn().mockResolvedValue({
        account: {
          name: 'John Doe',
          username: 'john@example.com',
          homeAccountId: '123',
          environment: 'login.microsoft.com',
          tenantId: 'test-tenant',
          localAccountId: '123',
        },
        accessToken: 'test-access-token',
      }),
      logoutPopup: vi.fn().mockResolvedValue(undefined),
      acquireTokenSilent: vi.fn().mockResolvedValue({
        accessToken: 'test-access-token',
      }),
    })),
    LogLevel: {
      Error: 0,
      Warning: 1,
      Info: 2,
      Verbose: 3,
    },
  };
});

// Mock graph utils
vi.mock('../utils/graphUtils', () => ({
  fetchUserPhoto: vi.fn().mockResolvedValue(null),
  getUserDisplayName: vi.fn().mockImplementation((account) => account.name || 'User'),
  getUserEmail: vi.fn().mockImplementation((account) => account.username || ''),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with logged out state', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.userName).toBeNull();
  });

  it('should login with Microsoft account', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.userName).toBe('John Doe');
      expect(result.current.userEmail).toBe('john@example.com');
    });
  });

  it('should logout', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });
    
    await act(async () => {
      await result.current.logout();
    });
    
    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.userName).toBeNull();
    });
  });

  it('should have correct return values', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    expect(result.current).toHaveProperty('isLoggedIn');
    expect(result.current).toHaveProperty('userName');
    expect(result.current).toHaveProperty('userEmail');
    expect(result.current).toHaveProperty('userPhoto');
    expect(result.current).toHaveProperty('accessToken');
    expect(result.current).toHaveProperty('isInitialized');
    expect(result.current).toHaveProperty('justLoggedIn');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('acknowledgeLogin');
  });

  it('should set justLoggedIn to true after login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    expect(result.current.justLoggedIn).toBe(false);
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.justLoggedIn).toBe(true);
    });
  });

  it('should clear justLoggedIn when acknowledgeLogin is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.justLoggedIn).toBe(true);
    });
    
    act(() => {
      result.current.acknowledgeLogin();
    });
    
    expect(result.current.justLoggedIn).toBe(false);
  });

  it('should provide access token after login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    expect(result.current.accessToken).toBeNull();
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.accessToken).toBe('test-access-token');
    });
  });

  it('should clear accessToken on logout', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    await act(async () => {
      await result.current.login();
    });
    
    await waitFor(() => {
      expect(result.current.accessToken).toBe('test-access-token');
    });
    
    await act(async () => {
      await result.current.logout();
    });
    
    await waitFor(() => {
      expect(result.current.accessToken).toBeNull();
    });
  });
});
