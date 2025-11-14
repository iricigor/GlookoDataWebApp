/**
 * Utility functions for glucose range analysis
 */

import type {
  GlucoseReading,
  GlucoseRangeStats,
  DayOfWeekReport,
  DailyReport,
  WeeklyReport,
  RangeCategoryMode,
  DayOfWeek,
  GlucoseThresholds,
} from '../../types';

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
 * Minimum percentage threshold to display percentage text in summary bars
 */
export const MIN_PERCENTAGE_TO_DISPLAY = 5;

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
 * Get the start of the week (Monday) for a given date
 * 
 * @param date - Date object
 * @returns Date object representing the Monday of that week
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 * 
 * @param date - Date object
 * @returns Date object representing the Sunday of that week
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Format a week range as "MMM D-D" (e.g., "Oct 6-12")
 * 
 * @param startDate - Week start date
 * @param endDate - Week end date
 * @returns Formatted week range string
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[startDate.getMonth()];
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  
  // If in same month
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    // Different months
    const endMonth = months[endDate.getMonth()];
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
  }
}

/**
 * Group glucose readings by week
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @returns Array of weekly reports sorted by date
 */
export function groupByWeek(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): WeeklyReport[] {
  // Group readings by week
  const weekGroups: Record<string, GlucoseReading[]> = {};

  readings.forEach(reading => {
    const weekStart = getWeekStart(reading.timestamp);
    const weekKey = formatDate(weekStart);
    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = [];
    }
    weekGroups[weekKey].push(reading);
  });

  // Calculate stats for each week and sort
  const reports: WeeklyReport[] = Object.keys(weekGroups)
    .sort() // Sort weeks chronologically
    .map(weekStartKey => {
      const weekStartDate = new Date(weekStartKey);
      const weekEndDate = getWeekEnd(weekStartDate);
      
      return {
        weekLabel: formatWeekRange(weekStartDate, weekEndDate),
        weekStart: weekStartKey,
        weekEnd: formatDate(weekEndDate),
        stats: calculateGlucoseRangeStats(weekGroups[weekStartKey], thresholds, mode),
      };
    });

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

/**
 * Get all unique dates from glucose readings, sorted chronologically
 * 
 * @param readings - Array of glucose readings
 * @returns Array of date strings in YYYY-MM-DD format, sorted from oldest to newest
 */
export function getUniqueDates(readings: GlucoseReading[]): string[] {
  const dateSet = new Set<string>();
  
  readings.forEach(reading => {
    const dateKey = formatDate(reading.timestamp);
    dateSet.add(dateKey);
  });
  
  return Array.from(dateSet).sort();
}

/**
 * Filter glucose readings for a specific date
 * 
 * @param readings - Array of glucose readings
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Array of readings for that date
 */
export function filterReadingsByDate(readings: GlucoseReading[], dateString: string): GlucoseReading[] {
  return readings.filter(reading => {
    const readingDate = formatDate(reading.timestamp);
    return readingDate === dateString;
  });
}

/**
 * Format date for display (e.g., "Monday, 17-11-2025")
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string with day of week
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
  const dayOfWeek = getDayOfWeek(date);
  const [year, month, day] = dateString.split('-');
  return `${dayOfWeek}, ${day}-${month}-${year}`;
}
