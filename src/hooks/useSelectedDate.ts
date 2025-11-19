/**
 * Custom hook for managing selected date with cookie persistence
 * Used for single-date selection in daily reports (CGM, Insulin)
 */

import { useState, useEffect } from 'react';

const SELECTED_DATE_COOKIE_PREFIX = 'selectedDate_';

interface UseSelectedDateReturn {
  selectedDate: string | undefined;
  setSelectedDate: (date: string | undefined) => void;
}

/**
 * Get selected date from cookie for a specific file
 */
function getSelectedDateFromCookie(fileId: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  const cookieName = `${SELECTED_DATE_COOKIE_PREFIX}${fileId}`;
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      try {
        return decodeURIComponent(value);
      } catch {
        // Invalid cookie value, ignore
        return undefined;
      }
    }
  }
  
  return undefined;
}

/**
 * Save selected date to cookie for a specific file
 */
function saveSelectedDateToCookie(fileId: string, date: string | undefined): void {
  if (typeof document === 'undefined') return;
  
  const cookieName = `${SELECTED_DATE_COOKIE_PREFIX}${fileId}`;
  
  if (date) {
    const encodedDate = encodeURIComponent(date);
    document.cookie = `${cookieName}=${encodedDate}; max-age=31536000; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${cookieName}=; max-age=0; path=/; SameSite=Lax`;
  }
}

/**
 * Hook to manage selected date with cookie persistence
 * @param fileId - Unique identifier for the file to scope the date selection
 * @returns Object with selectedDate and setSelectedDate
 */
export function useSelectedDate(fileId: string | undefined): UseSelectedDateReturn {
  const [selectedDate, setSelectedDateState] = useState<string | undefined>(undefined);

  // Load from cookie on mount or when fileId changes
  useEffect(() => {
    if (!fileId) {
      setSelectedDateState(undefined);
      return;
    }

    const savedDate = getSelectedDateFromCookie(fileId);
    setSelectedDateState(savedDate);
  }, [fileId]);

  // Save to cookie when date changes
  const setSelectedDate = (date: string | undefined) => {
    setSelectedDateState(date);
    
    if (fileId) {
      saveSelectedDateToCookie(fileId, date);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
  };
}
