/**
 * Utility functions for data formatting and manipulation
 */

import { formatDate as formatDateLocalized, formatNumber as formatNumberLocalized } from './formatting/formatters';

/**
 * Format a date object to a readable string with localization
 * 
 * @param date - The date to format
 * @returns Formatted date string with proper locale (e.g., MM/DD/YYYY in English, DD.MM.YYYY in German)
 */
export function formatDate(date: Date): string {
  return formatDateLocalized(date);
}

/**
 * Format a number with specified decimal places and localization
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string with proper locale (e.g., 1,234.56 in English, 1.234,56 in German)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return formatNumberLocalized(value, decimals);
}

/**
 * Check if a value is empty (null, undefined, or empty string)
 * 
 * @param value - The value to check
 * @returns True if the value is empty
 */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Delay execution for specified milliseconds
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
