import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectEnvironment } from './environment';

describe('detectEnvironment', () => {
  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset location mock before each test
    delete (window as { location?: Location }).location;
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('should return "dev" for localhost', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('dev');
  });

  it('should return "dev" for 127.0.0.1', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: '127.0.0.1' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('dev');
  });

  it('should return "staging" for Azure Static Web Apps staging URL', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'wonderful-stone-071384103-767.westeurope.3.azurestaticapps.net' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('staging');
  });

  it('should return "staging" for any azurestaticapps.net domain', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'my-app-123.azurestaticapps.net' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('staging');
  });

  it('should return "prod" for glooko.iric.online', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'glooko.iric.online' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('prod');
  });

  it('should return "prod" for any other domain', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('prod');
  });

  it('should handle uppercase hostnames', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'LOCALHOST' },
      writable: true,
      configurable: true,
    });

    expect(detectEnvironment()).toBe('dev');
  });
});
