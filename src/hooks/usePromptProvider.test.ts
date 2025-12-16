/**
 * Tests for usePromptProvider hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePromptProvider } from './usePromptProvider';
import type { AIProvider } from '../utils/api';

describe('usePromptProvider', () => {
  it('returns undefined when isProUser and useProKeys are both true', () => {
    const { result } = renderHook(() =>
      usePromptProvider({
        isProUser: true,
        useProKeys: true,
        activeProvider: 'gemini',
      })
    );

    expect(result.current.promptProvider).toBeUndefined();
  });

  it('returns activeProvider when isProUser is false', () => {
    const { result } = renderHook(() =>
      usePromptProvider({
        isProUser: false,
        useProKeys: false,
        activeProvider: 'gemini',
      })
    );

    expect(result.current.promptProvider).toBe('gemini');
  });

  it('returns activeProvider when useProKeys is false', () => {
    const { result } = renderHook(() =>
      usePromptProvider({
        isProUser: true,
        useProKeys: false,
        activeProvider: 'perplexity',
      })
    );

    expect(result.current.promptProvider).toBe('perplexity');
  });

  it('returns undefined when activeProvider is null and not using Pro keys', () => {
    const { result } = renderHook(() =>
      usePromptProvider({
        isProUser: false,
        useProKeys: false,
        activeProvider: null,
      })
    );

    expect(result.current.promptProvider).toBeUndefined();
  });

  it('returns all supported providers correctly', () => {
    const providers: AIProvider[] = ['perplexity', 'gemini', 'grok', 'deepseek'];

    providers.forEach((provider) => {
      const { result } = renderHook(() =>
        usePromptProvider({
          isProUser: false,
          useProKeys: false,
          activeProvider: provider,
        })
      );

      expect(result.current.promptProvider).toBe(provider);
    });
  });

  it('memoizes the result correctly', () => {
    const { result, rerender } = renderHook(
      ({ isProUser, useProKeys, activeProvider }) =>
        usePromptProvider({ isProUser, useProKeys, activeProvider }),
      {
        initialProps: {
          isProUser: false,
          useProKeys: false,
          activeProvider: 'gemini' as AIProvider,
        },
      }
    );

    const firstResult = result.current.promptProvider;

    // Rerender with same props - should return same reference
    rerender({
      isProUser: false,
      useProKeys: false,
      activeProvider: 'gemini' as AIProvider,
    });

    expect(result.current.promptProvider).toBe(firstResult);

    // Rerender with different props - should return different value
    rerender({
      isProUser: true,
      useProKeys: true,
      activeProvider: 'gemini' as AIProvider,
    });

    expect(result.current.promptProvider).not.toBe(firstResult);
    expect(result.current.promptProvider).toBeUndefined();
  });
});
