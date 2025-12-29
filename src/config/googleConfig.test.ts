import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('googleConfig', () => {
  beforeEach(() => {
    // Clear module cache to allow re-importing with different env values
    vi.resetModules();
  });

  it('should export isGoogleAuthAvailable as true when VITE_GOOGLE_CLIENT_ID is set', async () => {
    // Mock the environment variable
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
    
    // Dynamically import the module with the mocked env
    const { isGoogleAuthAvailable, googleClientId } = await import('./googleConfig');
    
    expect(isGoogleAuthAvailable).toBe(true);
    expect(googleClientId).toBe('test-client-id');
  });

  it('should export isGoogleAuthAvailable as false when VITE_GOOGLE_CLIENT_ID is not set', async () => {
    // Mock the environment variable as empty
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    
    // Spy on console.warn to verify the warning is logged
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Dynamically import the module with the mocked env
    const { isGoogleAuthAvailable, googleClientId } = await import('./googleConfig');
    
    expect(isGoogleAuthAvailable).toBe(false);
    expect(googleClientId).toBe('');
    
    // Verify that a warning was logged
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_GOOGLE_CLIENT_ID environment variable is not configured')
    );
    
    warnSpy.mockRestore();
  });

  it('should log warning message when Google auth is not configured', async () => {
    // Mock the environment variable as empty
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    
    // Spy on console.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Dynamically import the module
    await import('./googleConfig');
    
    // Verify the warning message contains key information
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Google authentication will be disabled')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('GOOGLE_AUTH_SETUP.md')
    );
    
    warnSpy.mockRestore();
  });
});
