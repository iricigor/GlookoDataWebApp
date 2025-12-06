/**
 * Hook to detect mobile viewport
 * Returns true if viewport width is <= 767px
 */

import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  // Initialize state based on window width if available (for SSR compatibility)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 767;
    }
    return false;
  });

  useEffect(() => {
    // Debounce the resize handler to improve performance
    let timeoutId: NodeJS.Timeout;
    
    const checkIsMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 767);
      }, 150); // 150ms debounce delay
    };

    // Check on mount
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}
