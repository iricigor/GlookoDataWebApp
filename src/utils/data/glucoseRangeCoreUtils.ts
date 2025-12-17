/**
 * Core utility functions for glucose range analysis
 * This module contains basic categorization, statistics, and constants
 */

import type {
  GlucoseReading,
  GlucoseRangeStats,
  RangeCategoryMode,
  GlucoseThresholds,
} from '../../types';
import { MMOL_TO_MGDL } from './glucoseUnitUtils';

/**
 * Glucose range category colors (matching Glooko style)
 * These colors are used for visual representation of glucose ranges
 * in charts and summary bars
 */
export const GLUCOSE_RANGE_COLORS = {
  veryLow: '#8B0000', // Dark red
  low: '#D32F2F', // Red
  inRange: '#4CAF50', // Green
  high: '#FFB300', // Amber/Orange
  veryHigh: '#FF6F00', // Dark orange
} as const;

/**
 * Flux stability grade colors
 * Used to visually represent glucose stability based on CV%
 */
export const FLUX_GRADE_COLORS = {
  'A+': '#4CAF50', // Green - Extremely steady
  'A': '#4CAF50',  // Green - Very steady
  'B': '#8BC34A',  // Light green - Reasonably steady
  'C': '#FFB300',  // Amber - Moderate variability
  'D': '#FF9800',  // Orange - High variability
  'F': '#D32F2F',  // Red - Very high variability
} as const;

/**
 * Tolerance for unicorn detection (floating point comparison)
 * For 5 mmol/L unicorn: tolerance is 0.05 mmol/L
 * For 100 mg/dL unicorn: tolerance is 0.5 mg/dL (≈ 0.028 mmol/L)
 */
export const UNICORN_TOLERANCE_MMOL = 0.05;

/**
 * Tolerance for unicorn detection for 100 mg/dL readings
 * 0.5 mg/dL converted to mmol/L (0.5 / 18.0182 ≈ 0.028)
 */
export const UNICORN_TOLERANCE_100_MGDL = 0.5 / MMOL_TO_MGDL;

/**
 * Unicorn target value: 100 mg/dL in mmol/L (100 / 18.018 ≈ 5.55)
 */
export const UNICORN_100_MGDL_IN_MMOL = 100 / MMOL_TO_MGDL;

/**
 * Minimum percentage threshold to display percentage text in summary bars
 */
export const MIN_PERCENTAGE_TO_DISPLAY = 5;

/**
 * Minimum percentage threshold to display percentage text in period bars
 * A higher threshold is used for period bars as they are narrower
 */
export const MIN_PERCENTAGE_FOR_PERIOD_BAR = 8;

/**
 * Milliseconds per day constant
 */
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Categorize a glucose reading based on thresholds
 * 
 * @param value - Glucose value in mmol/L
 * @param thresholds - Glucose thresholds in mmol/L
 * @param mode - 3 or 5 category mode
 * @returns Category name
 */
export function categorizeGlucose(
  value: number,
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): string {
  // Use thresholds directly (already in mmol/L)
  const veryLowThreshold = thresholds.veryLow;
  const lowThreshold = thresholds.low;
  const highThreshold = thresholds.high;
  const veryHighThreshold = thresholds.veryHigh;

  if (mode === 5) {
    if (value < veryLowThreshold) return 'veryLow';
    if (value < lowThreshold) return 'low';
    if (value <= highThreshold) return 'inRange';
    if (value <= veryHighThreshold) return 'high';
    return 'veryHigh';
  } else {
    // 3-category mode
    // low < lowThreshold
    if (value < lowThreshold) return 'low';
    // inRange: lowThreshold <= value <= highThreshold
    if (value <= highThreshold) return 'inRange';
    // high > highThreshold
    return 'high';
  }
}

/**
 * Convert percentage to time format (hh:mm) rounded to 5-minute intervals
 * 
 * @param totalReadings - Total number of readings
 * @param actualReadings - Actual number of readings for the category
 * @returns Time string in "Xh Ym" format (e.g., "6h", "45m", "1h 10m")
 * 
 * @example
 * convertPercentageToTime(288, 72) // "6h" (72/288 = 25% of 24h = 6h)
 * convertPercentageToTime(288, 9) // "45m" (9/288 = 3% of 24h = 43.2m, rounded to 45m)
 * convertPercentageToTime(288, 14) // "1h 10m" (14/288 ≈ 5% of 24h = 1h 10m)
 */
export function convertPercentageToTime(
  totalReadings: number,
  actualReadings: number
): string {
  // Calculate minutes directly from actual readings
  // Assume CGM readings are 5 minutes apart (288 readings per day)
  const minutesPerReading = (24 * 60) / totalReadings;
  const totalMinutes = Math.round((actualReadings * minutesPerReading) / 5) * 5; // Round to nearest 5 minutes
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calculate glucose range statistics from readings
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds in mmol/L
 * @param mode - 3 or 5 category mode
 * @returns Statistics object
 */
export function calculateGlucoseRangeStats(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): GlucoseRangeStats {
  if (readings.length === 0) {
    return mode === 5
      ? { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, total: 0 }
      : { low: 0, inRange: 0, high: 0, total: 0 };
  }

  const counts: Record<string, number> = {
    veryLow: 0,
    low: 0,
    inRange: 0,
    high: 0,
    veryHigh: 0,
  };

  readings.forEach(reading => {
    const category = categorizeGlucose(reading.value, thresholds, mode);
    counts[category]++;
  });

  const stats: GlucoseRangeStats = {
    low: counts.low,
    inRange: counts.inRange,
    high: counts.high,
    total: readings.length,
  };

  if (mode === 5) {
    stats.veryLow = counts.veryLow;
    stats.veryHigh = counts.veryHigh;
  }

  return stats;
}

/**
 * Calculate percentage from count and total
 * 
 * @param count - Count value
 * @param total - Total value
 * @returns Percentage rounded to 1 decimal place
 */
export function calculatePercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10; // Round to 1 decimal place
}
