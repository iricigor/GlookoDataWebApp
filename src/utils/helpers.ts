/**
 * Utility functions for data formatting and manipulation
 */

/**
 * Format a date object to a readable string
 * 
 * @param date - The date to format
 * @returns Formatted date string (MM/DD/YYYY)
 */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format a number with specified decimal places
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
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
