/**
 * Custom hook for determining the AI provider to use in prompts
 * 
 * This hook encapsulates the logic for determining whether to specify
 * an AI provider in prompts based on Pro user status and key preferences.
 * When using Pro backend keys, we don't specify a provider to avoid mismatch.
 */

import { useMemo } from 'react';
import type { AIProvider } from '../utils/api';

export interface UsePromptProviderParams {
  isProUser?: boolean;
  useProKeys?: boolean;
  activeProvider: AIProvider | null;
}

export interface UsePromptProviderReturn {
  promptProvider: AIProvider | undefined;
}

/**
 * Hook that determines the appropriate AI provider to use in prompts
 * 
 * @param isProUser - Whether the current user is a Pro user (optional, defaults to false)
 * @param useProKeys - Whether to use Pro backend keys (optional, defaults to false)
 * @param activeProvider - The currently active AI provider
 * @returns The provider to use in prompts, or undefined if using Pro keys
 * 
 * @example
 * ```tsx
 * const { promptProvider } = usePromptProvider({
 *   isProUser,
 *   useProKeys,
 *   activeProvider
 * });
 * 
 * const prompt = generatePrompt(data, responseLanguage, glucoseUnit, promptProvider);
 * ```
 */
export function usePromptProvider({
  isProUser = false,
  useProKeys = false,
  activeProvider,
}: UsePromptProviderParams): UsePromptProviderReturn {
  const promptProvider = useMemo(() => {
    // When using Pro backend keys, don't specify a provider to avoid mismatch
    return (isProUser && useProKeys) ? undefined : (activeProvider || undefined);
  }, [isProUser, useProKeys, activeProvider]);

  return { promptProvider };
}
