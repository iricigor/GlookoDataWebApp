/**
 * Localized formatting utilities for dates, times, and numbers
 * 
 * This module provides functions to format dates, times, and numbers according to
 * the user's selected UI language. It uses the browser's built-in Intl API for
 * proper internationalization support.
 */

import i18n from '../../i18n';

/**
 * Get the current language code for formatting
 * Falls back to 'en' if i18n is not initialized
 */
function getLocale(): string {
  return i18n.language || 'en';
}

/**
 * Format a number with localized decimal and thousands separators
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted number string with proper separators
 * 
 * @example
 * // English: "1,234.56"
 * // German: "1.234,56"
 * formatNumber(1234.56, 2)
 */
export function formatNumber(value: number, decimals: number = 2, locale?: string): string {
  const currentLocale = locale || getLocale();
  return new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a date to a localized string
 * 
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted date string
 * 
 * @example
 * // English: "12/31/2023"
 * // German: "31.12.2023"
 * formatDate(new Date(2023, 11, 31))
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions, locale?: string): string {
  const currentLocale = locale || getLocale();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(date);
}

/**
 * Format a time to a localized string
 * 
 * @param date - The date/time to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted time string
 * 
 * @example
 * // English: "2:30 PM"
 * // German: "14:30"
 * formatTime(new Date(2023, 11, 31, 14, 30))
 */
export function formatTime(date: Date, options?: Intl.DateTimeFormatOptions, locale?: string): string {
  const currentLocale = locale || getLocale();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(date);
}

/**
 * Format a date and time to a localized string
 * 
 * @param date - The date/time to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted date and time string
 * 
 * @example
 * // English: "12/31/2023, 2:30 PM"
 * // German: "31.12.2023, 14:30"
 * formatDateTime(new Date(2023, 11, 31, 14, 30))
 */
export function formatDateTime(date: Date, options?: Intl.DateTimeFormatOptions, locale?: string): string {
  const currentLocale = locale || getLocale();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(date);
}

/**
 * Format a short time string for axis labels (e.g., "2:30 PM" or "14:30")
 * 
 * @param date - The date/time to format
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted short time string
 */
export function formatShortTime(date: Date, locale?: string): string {
  return formatTime(date, { hour: 'numeric', minute: '2-digit' }, locale);
}

/**
 * Format a short date string (e.g., "12/31" or "31.12")
 * 
 * @param date - The date to format
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted short date string
 */
export function formatShortDate(date: Date, locale?: string): string {
  return formatDate(date, { month: '2-digit', day: '2-digit' }, locale);
}

/**
 * Format a percentage with localized decimal separator
 * 
 * @param value - The value to format (e.g., 0.8567 for 85.67%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted percentage string
 * 
 * @example
 * // English: "85.7%"
 * // German: "85,7%"
 * formatPercentage(0.8567, 1)
 */
export function formatPercentage(value: number, decimals: number = 1, locale?: string): string {
  const currentLocale = locale || getLocale();
  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a glucose value with proper decimal places and localization
 * 
 * @param value - The glucose value to format
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted glucose value string
 * 
 * @example
 * // English: "5.5"
 * // German: "5,5"
 * formatGlucoseNumber(5.5, 1)
 */
export function formatGlucoseNumber(value: number, decimals: number = 1, locale?: string): string {
  return formatNumber(value, decimals, locale);
}

/**
 * Format an insulin dose value with proper decimal places and localization
 * 
 * @param value - The insulin dose to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Optional locale override (defaults to current UI language)
 * @returns Formatted insulin dose string
 * 
 * @example
 * // English: "2.50"
 * // German: "2,50"
 * formatInsulinDose(2.5, 2)
 */
export function formatInsulinDose(value: number, decimals: number = 2, locale?: string): string {
  return formatNumber(value, decimals, locale);
}
