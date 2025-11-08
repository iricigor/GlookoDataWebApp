/**
 * Unit tests for useCounter custom hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../hooks/useCounter';

describe('useCounter', () => {
  describe('initialization', () => {
    it('should initialize with default value of 0', () => {
      const { result } = renderHook(() => useCounter());
      expect(result.current.count).toBe(0);
    });

    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => useCounter(10));
      expect(result.current.count).toBe(10);
    });

    it('should initialize with negative value', () => {
      const { result } = renderHook(() => useCounter(-5));
      expect(result.current.count).toBe(-5);
    });
  });

  describe('increment', () => {
    it('should increment count by 1', () => {
      const { result } = renderHook(() => useCounter(0));
      
      act(() => {
        result.current.increment();
      });
      
      expect(result.current.count).toBe(1);
    });

    it('should increment multiple times', () => {
      const { result } = renderHook(() => useCounter(0));
      
      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });
      
      expect(result.current.count).toBe(3);
    });

    it('should increment from negative value', () => {
      const { result } = renderHook(() => useCounter(-3));
      
      act(() => {
        result.current.increment();
      });
      
      expect(result.current.count).toBe(-2);
    });
  });

  describe('decrement', () => {
    it('should decrement count by 1', () => {
      const { result } = renderHook(() => useCounter(5));
      
      act(() => {
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(4);
    });

    it('should decrement multiple times', () => {
      const { result } = renderHook(() => useCounter(10));
      
      act(() => {
        result.current.decrement();
        result.current.decrement();
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(7);
    });

    it('should allow count to go negative', () => {
      const { result } = renderHook(() => useCounter(1));
      
      act(() => {
        result.current.decrement();
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(-1);
    });
  });

  describe('reset', () => {
    it('should reset count to initial value', () => {
      const { result } = renderHook(() => useCounter(5));
      
      act(() => {
        result.current.increment();
        result.current.increment();
      });
      
      expect(result.current.count).toBe(7);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.count).toBe(5);
    });

    it('should reset to 0 when no initial value provided', () => {
      const { result } = renderHook(() => useCounter());
      
      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });
      
      expect(result.current.count).toBe(3);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.count).toBe(0);
    });

    it('should reset after decrementing', () => {
      const { result } = renderHook(() => useCounter(10));
      
      act(() => {
        result.current.decrement();
        result.current.decrement();
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(7);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.count).toBe(10);
    });
  });

  describe('combined operations', () => {
    it('should handle increment and decrement together', () => {
      const { result } = renderHook(() => useCounter(0));
      
      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(1);
    });

    it('should handle complex sequence of operations', () => {
      const { result } = renderHook(() => useCounter(5));
      
      act(() => {
        result.current.increment(); // 6
        result.current.increment(); // 7
        result.current.decrement(); // 6
        result.current.increment(); // 7
        result.current.reset();     // 5
        result.current.decrement(); // 4
      });
      
      expect(result.current.count).toBe(4);
    });
  });

  describe('function stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useCounter(0));
      
      const firstIncrement = result.current.increment;
      const firstDecrement = result.current.decrement;
      const firstReset = result.current.reset;
      
      // Trigger a re-render by incrementing
      act(() => {
        result.current.increment();
      });
      
      rerender();
      
      // Function references should remain the same
      expect(result.current.increment).toBe(firstIncrement);
      expect(result.current.decrement).toBe(firstDecrement);
      expect(result.current.reset).toBe(firstReset);
    });

    it('should update reset function when initial value changes', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useCounter(initialValue),
        { initialProps: { initialValue: 0 } }
      );
      
      const firstReset = result.current.reset;
      
      // Change the initial value
      rerender({ initialValue: 10 });
      
      // Reset function should be updated (different reference)
      expect(result.current.reset).not.toBe(firstReset);
      
      // Reset should use new initial value
      act(() => {
        result.current.increment();
        result.current.reset();
      });
      
      expect(result.current.count).toBe(10);
    });
  });

  describe('return value structure', () => {
    it('should return object with correct properties', () => {
      const { result } = renderHook(() => useCounter());
      
      expect(result.current).toHaveProperty('count');
      expect(result.current).toHaveProperty('increment');
      expect(result.current).toHaveProperty('decrement');
      expect(result.current).toHaveProperty('reset');
    });

    it('should have functions as correct types', () => {
      const { result } = renderHook(() => useCounter());
      
      expect(typeof result.current.increment).toBe('function');
      expect(typeof result.current.decrement).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.count).toBe('number');
    });
  });
});
