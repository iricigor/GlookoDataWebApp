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

  describe('mouse events - swipe left', () => {
    it('should detect mouse swipe left', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      // Simulate mouse swipe left
      const mouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should not detect mouse swipe left with insufficient distance', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft }, { minSwipeDistance: 100 })
      );

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 70, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 70, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('mouse events - swipe right', () => {
    it('should detect mouse swipe right', () => {
      const onSwipeRight = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeRight })
      );

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 200, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 200, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('text selection handling', () => {
    it('should not trigger swipe when text is selected during mouse drag', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      // Create text content that can be selected
      element.innerHTML = '<p>Some text to select</p>';
      
      // Simulate text selection by creating a selection before mouseup
      const range = document.createRange();
      range.selectNodeContents(element.firstChild!);
      const selection = window.getSelection();
      selection!.removeAllRanges();
      selection!.addRange(range);

      const mouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      // Should NOT call swipe callback when text is selected
      expect(onSwipeLeft).not.toHaveBeenCalled();

      // Clean up
      selection!.removeAllRanges();
    });

    it('should trigger swipe when no text is selected during mouse drag', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      // Ensure no text is selected
      const selection = window.getSelection();
      selection!.removeAllRanges();

      const mouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      // Should call swipe callback when no text is selected
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should trigger swipe right when no text is selected', () => {
      const onSwipeRight = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeRight })
      );

      // Ensure no text is selected
      const selection = window.getSelection();
      selection!.removeAllRanges();

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 200, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 200, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      // Should call swipe callback when no text is selected
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
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

    it('should handle mouseup without mousemove', () => {
      const onSwipeLeft = vi.fn();
      renderHook(() => 
        useSwipeGesture(element, { onSwipeLeft })
      );

      const mouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 100 });
      const mouseUp = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseUp);

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
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });
});
