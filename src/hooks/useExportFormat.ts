/**
 * Custom hook for managing export format preferences (CSV/TSV)
 * 
 * This hook manages export format state with cookie persistence
 */

import { useState, useCallback } from 'react';

export type ExportFormat = 'csv' | 'tsv';

export interface UseExportFormatReturn {
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
}

const EXPORT_FORMAT_COOKIE_NAME = 'glooko-export-format';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get export format preference from cookie
 */
function getFormatFromCookie(): ExportFormat | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === EXPORT_FORMAT_COOKIE_NAME) {
      const formatValue = value as ExportFormat;
      if (formatValue === 'csv' || formatValue === 'tsv') {
        return formatValue;
      }
    }
  }
  return null;
}

/**
 * Save export format preference to cookie
 */
function saveFormatToCookie(format: ExportFormat): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  document.cookie = `${EXPORT_FORMAT_COOKIE_NAME}=${format}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Hook to manage export format preference
 */
export function useExportFormat(): UseExportFormatReturn {
  const [exportFormat, setExportFormatState] = useState<ExportFormat>(() => {
    // Initialize from cookie or default to CSV
    return getFormatFromCookie() || 'csv';
  });

  const setExportFormat = useCallback((format: ExportFormat) => {
    setExportFormatState(format);
    saveFormatToCookie(format);
  }, []);

  return {
    exportFormat,
    setExportFormat,
  };
}
