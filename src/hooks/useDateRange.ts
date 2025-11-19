/**
 * Custom hook for managing date range selections across reports
 * 
 * This hook manages date range state with cookie persistence, keyed by file ID
 * to support multiple uploaded files and persist date selections when navigating
 * between pages.
 */

import { useState, useCallback, useEffect } from 'react';

export interface DateRangeState {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
}

export interface UseDateRangeReturn {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setDateRange: (minDate: string, maxDate: string, startDate?: string, endDate?: string) => void;
  clearDateRange: () => void;
}

const DATE_RANGE_COOKIE_PREFIX = 'glooko-date-range-';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Get date range from cookie for a specific file
 */
function getDateRangeFromCookie(fileId: string | undefined): DateRangeState | null {
  if (!fileId) return null;
  
  const cookies = document.cookie.split(';');
  const cookieName = `${DATE_RANGE_COOKIE_PREFIX}${fileId}`;
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      try {
        const parsed = JSON.parse(decodeURIComponent(value));
        // Validate the parsed object has all required fields
        if (
          typeof parsed.startDate === 'string' &&
          typeof parsed.endDate === 'string' &&
          typeof parsed.minDate === 'string' &&
          typeof parsed.maxDate === 'string'
        ) {
          return parsed as DateRangeState;
        }
      } catch {
        // Invalid JSON in cookie, ignore
      }
    }
  }
  return null;
}

/**
 * Save date range to cookie for a specific file
 */
function saveDateRangeToCookie(fileId: string | undefined, dateRange: DateRangeState): void {
  if (!fileId) return;
  
  const cookieName = `${DATE_RANGE_COOKIE_PREFIX}${fileId}`;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  const value = encodeURIComponent(JSON.stringify(dateRange));
  document.cookie = `${cookieName}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Clear date range from cookie for a specific file
 */
function clearDateRangeFromCookie(fileId: string | undefined): void {
  if (!fileId) return;
  
  const cookieName = `${DATE_RANGE_COOKIE_PREFIX}${fileId}`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

/**
 * Custom hook for managing date range selections
 * 
 * @param fileId - The ID of the currently selected file
 * @returns Date range state and setter functions
 * 
 * @example
 * ```tsx
 * function MyReport({ selectedFile }: { selectedFile?: UploadedFile }) {
 *   const { startDate, endDate, setStartDate, setEndDate, setDateRange } = useDateRange(selectedFile?.id);
 *   
 *   // Initialize date range when data is loaded
 *   useEffect(() => {
 *     if (dataLoaded) {
 *       setDateRange(minDateFromData, maxDateFromData);
 *     }
 *   }, [dataLoaded]);
 *   
 *   return (
 *     <Input
 *       type="date"
 *       value={startDate}
 *       onChange={(e) => setStartDate(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useDateRange(fileId: string | undefined): UseDateRangeReturn {
  // Initialize state from cookie or empty
  const [dateRange, setDateRangeState] = useState<DateRangeState>(() => {
    return getDateRangeFromCookie(fileId) || {
      startDate: '',
      endDate: '',
      minDate: '',
      maxDate: '',
    };
  });

  // Update state when fileId changes
  useEffect(() => {
    const savedRange = getDateRangeFromCookie(fileId);
    if (savedRange) {
      setDateRangeState(savedRange);
    } else {
      // Clear state when switching to a new file with no saved range
      setDateRangeState({
        startDate: '',
        endDate: '',
        minDate: '',
        maxDate: '',
      });
    }
  }, [fileId]);

  const setStartDate = useCallback((date: string) => {
    setDateRangeState(prev => {
      const newRange = { ...prev, startDate: date };
      saveDateRangeToCookie(fileId, newRange);
      return newRange;
    });
  }, [fileId]);

  const setEndDate = useCallback((date: string) => {
    setDateRangeState(prev => {
      const newRange = { ...prev, endDate: date };
      saveDateRangeToCookie(fileId, newRange);
      return newRange;
    });
  }, [fileId]);

  const setDateRange = useCallback((
    minDate: string,
    maxDate: string,
    startDate?: string,
    endDate?: string
  ) => {
    const newRange: DateRangeState = {
      minDate,
      maxDate,
      startDate: startDate ?? minDate,
      endDate: endDate ?? maxDate,
    };
    setDateRangeState(newRange);
    saveDateRangeToCookie(fileId, newRange);
  }, [fileId]);

  const clearDateRange = useCallback(() => {
    const emptyRange: DateRangeState = {
      startDate: '',
      endDate: '',
      minDate: '',
      maxDate: '',
    };
    setDateRangeState(emptyRange);
    clearDateRangeFromCookie(fileId);
  }, [fileId]);

  return {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    minDate: dateRange.minDate,
    maxDate: dateRange.maxDate,
    setStartDate,
    setEndDate,
    setDateRange,
    clearDateRange,
  };
}
