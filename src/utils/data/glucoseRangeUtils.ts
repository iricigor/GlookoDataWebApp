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
  TimePeriodTIRStats,
  HourlyTIRStats,
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

/**
 * Filter readings to only include those from the last N days relative to the data's max date
 * 
 * @param readings - Array of glucose readings
 * @param days - Number of days to include
 * @param referenceDate - Optional reference date (defaults to max date in readings)
 * @returns Filtered array of readings
 */
export function filterReadingsToLastNDays(
  readings: GlucoseReading[],
  days: number,
  referenceDate?: Date
): GlucoseReading[] {
  if (readings.length === 0) return [];
  
  // Use provided reference date or find max date from readings
  const maxDate = referenceDate ?? new Date(Math.max(...readings.map(r => r.timestamp.getTime())));
  
  // Calculate the start date (days ago from max date)
  const startDate = new Date(maxDate);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  // Set end of max date for comparison
  const endDate = new Date(maxDate);
  endDate.setHours(23, 59, 59, 999);
  
  return readings.filter(r => {
    const timestamp = r.timestamp.getTime();
    return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
  });
}

/**
 * Calculate TIR statistics for multiple time periods
 * Returns stats for periods that are smaller than or equal to the total days in the data
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @param referenceDate - Optional reference date for calculating periods
 * @returns Array of TimePeriodTIRStats for applicable periods
 */
export function calculateTIRByTimePeriods(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3,
  referenceDate?: Date
): TimePeriodTIRStats[] {
  if (readings.length === 0) return [];
  
  // Standard time periods to show
  const periods = [90, 28, 14, 7, 3];
  
  // Calculate the total days span in the data
  const timestamps = readings.map(r => r.timestamp.getTime());
  const minDate = new Date(Math.min(...timestamps));
  const maxDate = referenceDate ?? new Date(Math.max(...timestamps));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / MS_PER_DAY);
  
  // Filter periods to only include those smaller than or equal to total days
  const applicablePeriods = periods.filter(p => p <= totalDays);
  
  // Calculate stats for each applicable period
  const result: TimePeriodTIRStats[] = applicablePeriods.map(days => {
    const periodReadings = filterReadingsToLastNDays(readings, days, maxDate);
    const stats = calculateGlucoseRangeStats(periodReadings, thresholds, mode);
    
    return {
      period: `${days} days`,
      days,
      stats,
    };
  });
  
  return result;
}

/**
 * Calculate TIR statistics grouped by hour of day (0-23)
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @returns Array of 24 HourlyTIRStats, one for each hour
 */
export function calculateHourlyTIR(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3
): HourlyTIRStats[] {
  // Initialize buckets for each hour
  const hourlyBuckets: GlucoseReading[][] = Array.from({ length: 24 }, () => []);
  
  // Group readings by hour
  readings.forEach(reading => {
    const hour = reading.timestamp.getHours();
    hourlyBuckets[hour].push(reading);
  });
  
  // Calculate stats for each hour
  return hourlyBuckets.map((hourReadings, hour) => {
    const stats = calculateGlucoseRangeStats(hourReadings, thresholds, mode);
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
    
    return {
      hour,
      hourLabel,
      stats,
    };
  });
}

/**
 * Calculate TIR statistics grouped by hour ranges (e.g., 2-hour, 3-hour groups)
 * 
 * @param readings - Array of glucose readings
 * @param thresholds - Glucose thresholds
 * @param mode - 3 or 5 category mode
 * @param groupSize - Number of hours per group (1, 2, 3, 4, or 6)
 * @returns Array of HourlyTIRStats for each hour group
 */
export function calculateHourlyTIRGrouped(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  mode: RangeCategoryMode = 3,
  groupSize: 1 | 2 | 3 | 4 | 6 = 1
): HourlyTIRStats[] {
  if (groupSize === 1) {
    return calculateHourlyTIR(readings, thresholds, mode);
  }
  
  const groupCount = 24 / groupSize;
  const groupBuckets: GlucoseReading[][] = Array.from({ length: groupCount }, () => []);
  
  // Group readings by hour group
  readings.forEach(reading => {
    const hour = reading.timestamp.getHours();
    const groupIndex = Math.floor(hour / groupSize);
    groupBuckets[groupIndex].push(reading);
  });
  
  // Calculate stats for each group
  return groupBuckets.map((groupReadings, index) => {
    const startHour = index * groupSize;
    const endHour = startHour + groupSize - 1;
    const stats = calculateGlucoseRangeStats(groupReadings, thresholds, mode);
    const hourLabel = `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:59`;
    
    return {
      hour: startHour,
      hourLabel,
      stats,
    };
  });
}

/**
 * Calculate average glucose from readings
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Average glucose value in mmol/L, or null if no readings
 */
export function calculateAverageGlucose(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  
  const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
  return sum / readings.length;
}

/**
 * Calculate estimated HbA1c from average glucose
 * Uses the standard medical formula: HbA1c (%) = (eAG mmol/L + 2.59) / 1.59
 * This is the ADA-endorsed formula for converting average glucose to HbA1c
 * 
 * @param averageGlucoseMmol - Average glucose in mmol/L
 * @returns Estimated HbA1c percentage
 */
export function calculateEstimatedHbA1c(averageGlucoseMmol: number): number {
  // Formula: HbA1c (%) = (average glucose mmol/L + 2.59) / 1.59
  // Source: American Diabetes Association (ADA)
  return (averageGlucoseMmol + 2.59) / 1.59;
}

/**
 * Convert HbA1c from percentage (NGSP) to mmol/mol (IFCC)
 * Uses the standard conversion formula: mmol/mol = (HbA1c % - 2.15) × 10.929
 * 
 * @param hba1cPercent - HbA1c value in percentage (NGSP units)
 * @returns HbA1c value in mmol/mol (IFCC units)
 */
export function convertHbA1cToMmolMol(hba1cPercent: number): number {
  // Formula: mmol/mol = (HbA1c % - 2.15) × 10.929
  // Source: IFCC standardization
  return (hba1cPercent - 2.15) * 10.929;
}

/**
 * Calculate the number of unique days in glucose readings
 * 
 * @param readings - Array of glucose readings
 * @returns Number of unique days with readings
 */
export function calculateDaysWithData(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  
  const uniqueDays = new Set<string>();
  readings.forEach(reading => {
    const dateKey = formatDate(reading.timestamp);
    uniqueDays.add(dateKey);
  });
  
  return uniqueDays.size;
}

/**
 * Minimum number of days recommended for reliable HbA1c estimation
 */
export const MIN_DAYS_FOR_RELIABLE_HBA1C = 60;

/**
 * Target CV% threshold for stable glycemic control
 * Values ≤36% indicate stable control, >36% indicates high glycemic variability
 */
export const CV_TARGET_THRESHOLD = 36;

/**
 * Calculate Coefficient of Variation (CV%) from glucose readings
 * CV% = (Standard Deviation / Mean) × 100
 * 
 * This is a standard CGM metric recommended by international consensus.
 * Target: ≤36% indicates stable glycemic control
 * >36% indicates high glycemic variability and increased hypoglycemia risk
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns CV% value, or null if insufficient readings (need at least 2)
 */
export function calculateCV(readings: GlucoseReading[]): number | null {
  // Need at least 2 readings to calculate standard deviation
  if (readings.length < 2) return null;
  
  const mean = calculateAverageGlucose(readings);
  if (!mean || mean === 0) return null;
  
  // Calculate sample standard deviation (using n-1 for sample variance - Bessel's correction)
  const sumSquaredDiffs = readings.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0);
  const sd = Math.sqrt(sumSquaredDiffs / (readings.length - 1));
  
  return (sd / mean) * 100;
}

/**
 * Blood Glucose Risk Index result containing LBGI, HBGI, and BGRI
 */
export interface BGRIResult {
  lbgi: number;   // Low Blood Glucose Index (hypoglycemia risk)
  hbgi: number;   // High Blood Glucose Index (hyperglycemia risk)
  bgri: number;   // Blood Glucose Risk Index (LBGI + HBGI)
}

/**
 * Calculate the symmetric risk function for a glucose value
 * Based on the Kovatchev et al. risk function
 * 
 * @param glucoseMgdl - Glucose value in mg/dL (must be > 0)
 * @returns Risk value (negative = hypo risk, positive = hyper risk)
 */
function calculateRiskValue(glucoseMgdl: number): number {
  // The risk function is based on logarithmic transformation
  // Formula: risk = ((ln(glucose) ** 1.084) - 5.381) * 1.509
  // where ** represents exponentiation (Math.pow)
  // This creates a symmetric risk scale where:
  // - Negative values indicate hypoglycemia risk
  // - Positive values indicate hyperglycemia risk
  // - Zero is approximately at euglycemic level (~112.5 mg/dL)
  return (Math.pow(Math.log(glucoseMgdl), 1.084) - 5.381) * 1.509;
}

/**
 * Calculate Low Blood Glucose Index (LBGI), High Blood Glucose Index (HBGI),
 * and Blood Glucose Risk Index (BGRI) from glucose readings.
 * 
 * LBGI: Measures the risk/severity of hypoglycemia
 * HBGI: Measures the risk/severity of hyperglycemia
 * BGRI: Combined risk index (LBGI + HBGI)
 * 
 * These are validated risk indices used in diabetes research:
 * - LBGI predicts future hypoglycemic events
 * - HBGI correlates with HbA1c and long-term complications
 * - Both use a symmetric transformation of the glucose scale
 * 
 * Risk interpretation:
 * - LBGI < 2.5: Low hypoglycemia risk
 * - LBGI 2.5-5: Moderate hypoglycemia risk
 * - LBGI > 5: High hypoglycemia risk
 * - HBGI < 4.5: Low hyperglycemia risk
 * - HBGI 4.5-9: Moderate hyperglycemia risk
 * - HBGI > 9: High hyperglycemia risk
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Object containing LBGI, HBGI, and BGRI values, or null if no valid readings
 */
export function calculateBGRI(readings: GlucoseReading[]): BGRIResult | null {
  if (readings.length === 0) return null;
  
  let totalLbgi = 0;
  let totalHbgi = 0;
  let validCount = 0;
  
  for (const reading of readings) {
    // Convert mmol/L to mg/dL for the standard formula
    const glucoseMgdl = reading.value * MMOL_TO_MGDL;
    
    // Skip invalid values (must be positive for logarithm)
    if (glucoseMgdl <= 0) continue;
    
    const risk = calculateRiskValue(glucoseMgdl);
    
    // LBGI component: 10 * risk^2 when risk < 0 (hypoglycemia)
    // HBGI component: 10 * risk^2 when risk > 0 (hyperglycemia)
    if (risk < 0) {
      totalLbgi += 10 * Math.pow(risk, 2);
    } else {
      totalHbgi += 10 * Math.pow(risk, 2);
    }
    
    validCount++;
  }
  
  if (validCount === 0) return null;
  
  const lbgi = totalLbgi / validCount;
  const hbgi = totalHbgi / validCount;
  const bgri = lbgi + hbgi;
  
  return { lbgi, hbgi, bgri };
}

/**
 * Calculate Low Blood Glucose Index (LBGI) from glucose readings
 * Convenience function that returns only LBGI
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns LBGI value, or null if no valid readings
 */
export function calculateLBGI(readings: GlucoseReading[]): number | null {
  const result = calculateBGRI(readings);
  return result?.lbgi ?? null;
}

/**
 * Calculate High Blood Glucose Index (HBGI) from glucose readings
 * Convenience function that returns only HBGI
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns HBGI value, or null if no valid readings
 */
export function calculateHBGI(readings: GlucoseReading[]): number | null {
  const result = calculateBGRI(readings);
  return result?.hbgi ?? null;
}

/**
 * Calculate J-Index from glucose readings
 * J-Index = 0.001 × (Mean + SD)²
 * 
 * The J-Index is a simple composite metric that combines average glucose
 * and variability into a single number. Higher values indicate poorer
 * glycemic control.
 * 
 * Reference ranges (approximate):
 * - < 20: Excellent control
 * - 20-30: Good control
 * - 30-40: Fair control
 * - > 40: Poor control
 * 
 * Note: The formula uses mg/dL units for standard interpretation
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns J-Index value, or null if insufficient readings (need at least 2)
 */
export function calculateJIndex(readings: GlucoseReading[]): number | null {
  // Need at least 2 readings to calculate standard deviation
  if (readings.length < 2) return null;
  
  const mean = calculateAverageGlucose(readings);
  if (!mean || mean === 0) return null;
  
  // Calculate sample standard deviation (using n-1 for sample variance)
  const sumSquaredDiffs = readings.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0);
  const sd = Math.sqrt(sumSquaredDiffs / (readings.length - 1));
  
  // Convert to mg/dL for standard J-index calculation
  const meanMgdl = mean * MMOL_TO_MGDL;
  const sdMgdl = sd * MMOL_TO_MGDL;
  
  return 0.001 * Math.pow(meanMgdl + sdMgdl, 2);
}

/**
 * Calculate median glucose value from readings
 * The median is the 'middle' value when all values are sorted
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Median glucose value in mmol/L, or null if no readings
 */
export function calculateMedianGlucose(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  
  const sortedValues = readings.map(r => r.value).sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

/**
 * Calculate standard deviation of glucose values
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Standard deviation in mmol/L, or null if insufficient readings
 */
export function calculateStandardDeviation(readings: GlucoseReading[]): number | null {
  if (readings.length < 2) return null;
  
  const mean = calculateAverageGlucose(readings);
  if (!mean) return null;
  
  const sumSquaredDiffs = readings.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / (readings.length - 1));
}

/**
 * Quartile statistics for glucose readings
 */
export interface QuartileStats {
  q25: number;  // 25th percentile
  q50: number;  // 50th percentile (median)
  q75: number;  // 75th percentile
  min: number;  // Minimum value
  max: number;  // Maximum value
}

/**
 * Calculate quartiles (25%, 50%, 75%) from glucose readings
 * Quartiles help indicate the variability in glucose values
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Quartile statistics, or null if no readings
 */
export function calculateQuartiles(readings: GlucoseReading[]): QuartileStats | null {
  if (readings.length === 0) return null;
  
  const sortedValues = readings.map(r => r.value).sort((a, b) => a - b);
  const n = sortedValues.length;
  
  // Helper function to calculate percentile
  const percentile = (arr: number[], p: number): number => {
    const index = (p / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return arr[lower];
    return arr[lower] + (arr[upper] - arr[lower]) * (index - lower);
  };
  
  return {
    q25: percentile(sortedValues, 25),
    q50: percentile(sortedValues, 50),
    q75: percentile(sortedValues, 75),
    min: sortedValues[0],
    max: sortedValues[n - 1],
  };
}

/**
 * High/Low incident statistics
 */
export interface HighLowIncidents {
  highCount: number;   // Number of high incidents (going above range)
  lowCount: number;    // Number of low incidents (going below range)
  veryHighCount: number;
  veryLowCount: number;
}

/**
 * Count high and low incidents
 * An incident is when the glucose value goes outside the configured normal range
 * This counts the number of times glucose transitions into each zone
 * 
 * @param readings - Array of glucose readings (values in mmol/L), should be sorted by time
 * @param thresholds - Glucose thresholds in mmol/L
 * @returns High/Low incident counts
 */
export function countHighLowIncidents(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds
): HighLowIncidents {
  if (readings.length === 0) {
    return { highCount: 0, lowCount: 0, veryHighCount: 0, veryLowCount: 0 };
  }
  
  // Sort readings by timestamp
  const sortedReadings = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  let highCount = 0;
  let lowCount = 0;
  let veryHighCount = 0;
  let veryLowCount = 0;
  
  let previousCategory: string | null = null;
  
  for (const reading of sortedReadings) {
    const currentCategory = categorizeGlucose(reading.value, thresholds, 5);
    
    if (previousCategory !== null && currentCategory !== previousCategory) {
      // Transition detected
      if (currentCategory === 'high' && previousCategory !== 'veryHigh') {
        highCount++;
      } else if (currentCategory === 'veryHigh') {
        veryHighCount++;
      } else if (currentCategory === 'low' && previousCategory !== 'veryLow') {
        lowCount++;
      } else if (currentCategory === 'veryLow') {
        veryLowCount++;
      }
    }
    
    previousCategory = currentCategory;
  }
  
  return { highCount, lowCount, veryHighCount, veryLowCount };
}

/**
 * Count "unicorns" - glucose values that are exactly 100 mg/dL (+/- 0.5)
 * or exactly 5 mmol/L (+/- 0.05)
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Number of unicorn readings
 */
export function countUnicorns(readings: GlucoseReading[]): number {
  return readings.filter(r => {
    const value = r.value;
    // 5.0 mmol/L is considered a "perfect" reading in mmol/L systems (tolerance: +/- 0.05)
    // 100 mg/dL (≈ 5.5506 mmol/L) is considered a "perfect" reading in mg/dL systems (tolerance: +/- 0.5 mg/dL)
    return Math.abs(value - 5.0) < UNICORN_TOLERANCE_MMOL || 
           Math.abs(value - UNICORN_100_MGDL_IN_MMOL) < UNICORN_TOLERANCE_100_MGDL;
  }).length;
}

/**
 * Flux grade type (A+ to F)
 */
export type FluxGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Flux grade result with interpretation
 */
export interface FluxResult {
  grade: FluxGrade;
  score: number;  // Underlying numeric score
  description: string;
}

/**
 * Calculate Flux grade - measures how steady glucose values are
 * Based on the coefficient of variation (CV) and rate of change
 * A+ indicates very steady values, F indicates frequently changing values
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Flux grade result
 */
export function calculateFlux(readings: GlucoseReading[]): FluxResult | null {
  if (readings.length < 2) return null;
  
  const cv = calculateCV(readings);
  if (cv === null) return null;
  
  // Grade based on CV% thresholds
  // Lower CV = more stable glucose = better grade
  let grade: FluxGrade;
  let description: string;
  
  if (cv <= 20) {
    grade = 'A+';
    description = 'Extremely steady glucose values';
  } else if (cv <= 26) {
    grade = 'A';
    description = 'Very steady glucose values';
  } else if (cv <= 33) {
    grade = 'B';
    description = 'Reasonably steady glucose values';
  } else if (cv <= 40) {
    grade = 'C';
    description = 'Moderate glucose variability';
  } else if (cv <= 50) {
    grade = 'D';
    description = 'High glucose variability';
  } else {
    grade = 'F';
    description = 'Very high glucose variability';
  }
  
  return { grade, score: cv, description };
}

/**
 * Calculate average glucose at wake up time (6-9 AM)
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Average glucose at wake up time, or null if no readings
 */
export function calculateWakeupAverage(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  
  // Filter readings between 6 AM and 9 AM
  const wakeupReadings = readings.filter(r => {
    const hour = r.timestamp.getHours();
    return hour >= 6 && hour < 9;
  });
  
  if (wakeupReadings.length === 0) return null;
  
  const sum = wakeupReadings.reduce((acc, r) => acc + r.value, 0);
  return sum / wakeupReadings.length;
}

/**
 * Calculate average glucose at bedtime (9 PM - 12 AM)
 * 
 * @param readings - Array of glucose readings (values in mmol/L)
 * @returns Average glucose at bedtime, or null if no readings
 */
export function calculateBedtimeAverage(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  
  // Filter readings between 9 PM (21:00) and midnight (24:00)
  const bedtimeReadings = readings.filter(r => {
    const hour = r.timestamp.getHours();
    return hour >= 21 && hour <= 23;
  });
  
  if (bedtimeReadings.length === 0) return null;
  
  const sum = bedtimeReadings.reduce((acc, r) => acc + r.value, 0);
  return sum / bedtimeReadings.length;
}
