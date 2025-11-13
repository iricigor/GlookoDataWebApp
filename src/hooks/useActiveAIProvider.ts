/**
 * Custom hook for managing active AI provider preference
 * 
 * This hook manages the user's preferred AI provider selection
 * with localStorage persistence
 */

import { useState, useCallback } from 'react';
import type { AIProvider } from '../utils/aiApi';

export interface UseActiveAIProviderReturn {
  selectedProvider: AIProvider | null;
  setSelectedProvider: (provider: AIProvider | null) => void;
}

const STORAGE_KEY = 'glooko-active-ai-provider';

/**
 * Get selected provider from localStorage
 */
function getProviderFromStorage(): AIProvider | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['perplexity', 'gemini', 'grok', 'deepseek'].includes(stored)) {
      return stored as AIProvider;
    }
  } catch (error) {
    console.error('Failed to read active provider from localStorage:', error);
  }
  return null;
}

/**
 * Save selected provider to localStorage
 */
function saveProviderToStorage(provider: AIProvider | null): void {
  try {
    if (provider === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, provider);
    }
  } catch (error) {
    console.error('Failed to save active provider to localStorage:', error);
  }
}

/**
 * Hook to manage active AI provider selection
 */
export function useActiveAIProvider(): UseActiveAIProviderReturn {
  const [selectedProvider, setSelectedProviderState] = useState<AIProvider | null>(() => {
    // Initialize from localStorage or default to null (auto-select)
    return getProviderFromStorage();
  });

  const setSelectedProvider = useCallback((provider: AIProvider | null) => {
    setSelectedProviderState(provider);
    saveProviderToStorage(provider);
  }, []);

  return {
    selectedProvider,
    setSelectedProvider,
  };
}
