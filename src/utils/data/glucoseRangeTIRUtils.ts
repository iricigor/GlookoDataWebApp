/**
 * TIR (Time In Range) calculation utilities for glucose range analysis
 * This module contains functions for calculating TIR by time periods and hours
 */

import type {
  GlucoseReading,
  RangeCategoryMode,
  GlucoseThresholds,
  TimePeriodTIRStats,
  HourlyTIRStats,
} from '../../types';
import { calculateGlucoseRangeStats, MS_PER_DAY } from './glucoseRangeCoreUtils';
import { filterReadingsToLastNDays } from './glucoseRangeGroupingUtils';

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
