/**
 * Utility functions for glucose range analysis
 */

import type {
  GlucoseReading,
  GlucoseRangeStats,
  DayOfWeekReport,
  DailyReport,
  RangeCategoryMode,
  DayOfWeek,
  GlucoseThresholds,
} from '../types';

/**
 * Categorize a glucose reading based on thresholds
 * 
 * @param value - Glucose value in mg/dL
 * @param thresholds - Glucose thresholds in mg/dL
 * @param mode - 3 or 5 category mode
 * @returns Category name
 */
export function categorizeGlucose(
  value: number,
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): string {
  // Convert thresholds from mmol/L to mg/dL (multiply by 18.018)
  const veryLowThreshold = thresholds.veryLow * 18.018;
  const lowThreshold = thresholds.low * 18.018;
  const highThreshold = thresholds.high * 18.018;
  const veryHighThreshold = thresholds.veryHigh * 18.018;

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
 * Calculate glucose range statistics from readings
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds in mg/dL
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
 * Get day of week from Date object
 * 
 * @param date - Date object
 * @returns Day of week string
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Check if a day is a workday (Monday-Friday)
 * 
 * @param day - Day of week
 * @returns True if workday, false otherwise
 */
export function isWorkday(day: DayOfWeek): boolean {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
}

/**
 * Group glucose readings by day of week
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @returns Array of day of week reports
 */
export function groupByDayOfWeek(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): DayOfWeekReport[] {
  // Group readings by day of week
  const dayGroups: Record<string, GlucoseReading[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  readings.forEach(reading => {
    const day = getDayOfWeek(reading.timestamp);
    dayGroups[day].push(reading);
  });

  // Calculate stats for each day
  const reports: DayOfWeekReport[] = [];
  
  (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DayOfWeek[]).forEach(day => {
    reports.push({
      day,
      stats: calculateGlucoseRangeStats(dayGroups[day], thresholds, mode),
    });
  });

  // Add workday aggregation
  const workdayReadings = readings.filter(r => isWorkday(getDayOfWeek(r.timestamp)));
  reports.push({
    day: 'Workday',
    stats: calculateGlucoseRangeStats(workdayReadings, thresholds, mode),
  });

  // Add weekend aggregation
  const weekendReadings = readings.filter(r => !isWorkday(getDayOfWeek(r.timestamp)));
  reports.push({
    day: 'Weekend',
    stats: calculateGlucoseRangeStats(weekendReadings, thresholds, mode),
  });

  return reports;
}

/**
 * Format date as YYYY-MM-DD
 * 
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group glucose readings by date
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @returns Array of daily reports sorted by date
 */
export function groupByDate(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): DailyReport[] {
  // Group readings by date
  const dateGroups: Record<string, GlucoseReading[]> = {};

  readings.forEach(reading => {
    const dateKey = formatDate(reading.timestamp);
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = [];
    }
    dateGroups[dateKey].push(reading);
  });

  // Calculate stats for each date and sort
  const reports: DailyReport[] = Object.keys(dateGroups)
    .sort() // Sort dates chronologically
    .map(date => ({
      date,
      stats: calculateGlucoseRangeStats(dateGroups[date], thresholds, mode),
    }));

  return reports;
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
