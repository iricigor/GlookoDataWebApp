/**
 * Custom hook for detecting swipe gestures on touch and mouse devices
 * 
 * This hook enables horizontal swipe navigation for mobile devices
 */

import { useEffect, useRef, useCallback } from 'react';

export interface SwipeGestureConfig {
  /** Minimum distance in pixels for a swipe to be detected (default: 50) */
  minSwipeDistance?: number;
  /** Maximum vertical movement allowed for horizontal swipe (default: 100) */
  maxVerticalMovement?: number;
  /** Whether to enable the swipe gesture (default: true) */
  enabled?: boolean;
}

export interface SwipeGestureCallbacks {
  /** Callback when swipe left is detected */
  onSwipeLeft?: () => void;
  /** Callback when swipe right is detected */
  onSwipeRight?: () => void;
}

export interface UseSwipeGestureReturn {
  /** Whether a swipe is currently in progress */
  isSwiping: boolean;
}

/**
 * Custom hook for detecting horizontal swipe gestures
 * 
 * @param element - The element to attach swipe listeners to (default: document.body)
 * @param callbacks - Swipe direction callbacks
 * @param config - Configuration options
 * @returns Object with swipe state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useSwipeGesture(document.body, {
 *     onSwipeLeft: () => console.log('Swiped left'),
 *     onSwipeRight: () => console.log('Swiped right')
 *   });
 *   return <div>Swipe to navigate</div>;
 * }
 * ```
 */
export function useSwipeGesture(
  element: HTMLElement | null,
  callbacks: SwipeGestureCallbacks,
  config: SwipeGestureConfig = {}
): UseSwipeGestureReturn {
  const {
    minSwipeDistance = 50,
    maxVerticalMovement = 100,
    enabled = true,
  } = config;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);
    
    // If horizontal movement is significant and vertical is minimal, it's a swipe
    if (deltaX > 10 && deltaX > deltaY) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) {
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    // Check if horizontal movement is sufficient and vertical is within limits
    if (Math.abs(deltaX) >= minSwipeDistance && deltaY <= maxVerticalMovement) {
      if (deltaX > 0 && callbacks.onSwipeRight) {
        callbacks.onSwipeRight();
      } else if (deltaX < 0 && callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft();
      }
    }

    isSwiping.current = false;
  }, [callbacks, minSwipeDistance, maxVerticalMovement]);

  // Mouse event handlers for desktop testing
  const mouseStartX = useRef<number>(0);
  const mouseStartY = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
    isMouseDown.current = true;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown.current) return;
    
    const deltaX = Math.abs(e.clientX - mouseStartX.current);
    const deltaY = Math.abs(e.clientY - mouseStartY.current);
    
    if (deltaX > 10 && deltaX > deltaY) {
      isSwiping.current = true;
    }
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isMouseDown.current || !isSwiping.current) {
      isMouseDown.current = false;
      isSwiping.current = false;
      return;
    }

    const deltaX = e.clientX - mouseStartX.current;
    const deltaY = Math.abs(e.clientY - mouseStartY.current);

    if (Math.abs(deltaX) >= minSwipeDistance && deltaY <= maxVerticalMovement) {
      if (deltaX > 0 && callbacks.onSwipeRight) {
        callbacks.onSwipeRight();
      } else if (deltaX < 0 && callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft();
      }
    }

    isMouseDown.current = false;
    isSwiping.current = false;
  }, [callbacks, minSwipeDistance, maxVerticalMovement]);

  useEffect(() => {
    if (!element || !enabled) {
      return;
    }

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [element, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isSwiping: isSwiping.current,
  };
}
