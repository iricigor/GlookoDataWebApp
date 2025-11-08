/**
 * Sample custom hook demonstrating React hooks best practices
 * 
 * This hook manages a simple counter state and provides increment/decrement functions
 */

import { useState, useCallback } from 'react';

export interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing counter state
 * 
 * @param initialValue - Initial counter value (default: 0)
 * @returns Counter state and control functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { count, increment, decrement } = useCounter(0);
 *   return <Button onClick={increment}>Count: {count}</Button>;
 * }
 * ```
 */
export function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
  };
}
