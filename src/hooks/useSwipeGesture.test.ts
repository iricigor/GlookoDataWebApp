/**
 * Unit tests for useSwipeGesture custom hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeGesture } from './useSwipeGesture';

describe('useSwipeGesture', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  describe('initialization', () => {
    it('should return isSwiping as false initially', () => {
      const { result } = renderHook(() => 
        useSwipeGesture(element, {})
      );
      expect(result.current.isSwiping).toBe(false);
    });

    it('should work with null element', () => {
      const { result } = renderHook(() => 
        useSwipeGesture(null, {})
      );
      expect(result.current.isSwiping).toBe(false);
    });

    it('should not throw when disabled', () => {
      const { result } = renderHook(() => 
        useSwipeGesture(element, {}, { enabled: false })
      );
      expect(result.current.isSwiping).toBe(false);
    });
  });

  describe('touch events - swipe left', () => {
    it('should detect swipe left with sufficient distance', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      // Simulate swipe left
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should not detect swipe left with insufficient distance', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { minSwipeDistance: 100 })
      );

      // Simulate small swipe left (less than threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 70, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should not detect swipe left with excessive vertical movement', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { maxVerticalMovement: 50 })
      );

      // Simulate swipe with too much vertical movement
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 200 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('touch events - swipe right', () => {
    it('should detect swipe right with sufficient distance', () => {
      const onSwipeRight = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeRight })
      );

      // Simulate swipe right
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should not detect swipe right with insufficient distance', () => {
      const onSwipeRight = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeRight }, { minSwipeDistance: 100 })
      );

      // Simulate small swipe right
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 130, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should respect custom minSwipeDistance', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { minSwipeDistance: 150 })
      );

      // Swipe 100px (less than threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should respect custom maxVerticalMovement', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { maxVerticalMovement: 20 })
      );

      // Swipe with 30px vertical movement (more than threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 130 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should not register events when disabled', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { enabled: false })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should not call callback if only callback provided is opposite direction', () => {
      const onSwipeRight = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeRight })
      );

      // Swipe left
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should handle touchend without touchmove', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
      
      const { unmount } = renderHook(() => 
        useSwipeGesture(element, {})
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });
});
