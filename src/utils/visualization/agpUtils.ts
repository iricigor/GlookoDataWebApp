/**
 * Utility functions for AGP (Ambulatory Glucose Profile) analysis
 */

import type { GlucoseReading, AGPTimeSlotStats, AGPDayOfWeekFilter } from '../../types';

/**
 * Calculate percentile value from sorted array of numbers
 * Uses linear interpolation between closest ranks
 * 
 * @param sortedValues - Array of numbers sorted in ascending order
 * @param percentile - Percentile to calculate (0-100)
 * @returns Percentile value
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Format time slot as HH:MM
 * 
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0, 5, 10, ..., 55)
 * @returns Formatted time string
 */
export function formatTimeSlot(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Get time slot key for a timestamp
 * Rounds down to nearest 5-minute interval
 * 
 * @param timestamp - Date object
 * @returns Time slot key in HH:MM format
 */
export function getTimeSlotKey(timestamp: Date): string {
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  return formatTimeSlot(hours, roundedMinutes);
}

/**
 * Calculate AGP statistics for all 5-minute time slots in a day
 * 
 * @param readings - Array of glucose readings
 * @returns Array of AGP time slot statistics (288 time slots)
 */
export function calculateAGPStats(readings: GlucoseReading[]): AGPTimeSlotStats[] {
  // Group readings by 5-minute time slots
  const timeSlotGroups: Record<string, number[]> = {};

  // Initialize all 288 time slots (24 hours * 12 five-minute intervals)
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeSlot = formatTimeSlot(hour, minute);
      timeSlotGroups[timeSlot] = [];
    }
  }

  // Group readings by time slot
  readings.forEach(reading => {
    const timeSlot = getTimeSlotKey(reading.timestamp);
    if (timeSlotGroups[timeSlot]) {
      timeSlotGroups[timeSlot].push(reading.value);
    }
  });

  // Calculate statistics for each time slot
  const stats: AGPTimeSlotStats[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeSlot = formatTimeSlot(hour, minute);
      const values = timeSlotGroups[timeSlot];

      if (values.length === 0) {
        // No data for this time slot
        stats.push({
          timeSlot,
          lowest: 0,
          p10: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p90: 0,
          highest: 0,
          count: 0,
        });
      } else {
        // Sort values for percentile calculation
        const sortedValues = [...values].sort((a, b) => a - b);

        stats.push({
          timeSlot,
          lowest: sortedValues[0],
          p10: calculatePercentile(sortedValues, 10),
          p25: calculatePercentile(sortedValues, 25),
          p50: calculatePercentile(sortedValues, 50),
          p75: calculatePercentile(sortedValues, 75),
          p90: calculatePercentile(sortedValues, 90),
          highest: sortedValues[sortedValues.length - 1],
          count: values.length,
        });
      }
    }
  }

  return stats;
}

/**
 * Filter glucose readings by day of week
 * 
 * @param readings - Array of glucose readings
 * @param dayFilter - Day of week filter
 * @returns Filtered array of glucose readings
 */
export function filterReadingsByDayOfWeek(
  readings: GlucoseReading[],
  dayFilter: AGPDayOfWeekFilter
): GlucoseReading[] {
  if (dayFilter === 'All Days') {
    return readings;
  }

  return readings.filter(reading => {
    const dayOfWeek = reading.timestamp.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayFilter === 'Workday') {
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    }
    
    if (dayFilter === 'Weekend') {
      return dayOfWeek === 0 || dayOfWeek === 6; // Saturday or Sunday
    }
    
    // Map day names to day numbers
    const dayMap: Record<string, number> = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    
    return dayOfWeek === dayMap[dayFilter];
  });
}

/**
 * Filter glucose readings by time range
 * 
 * @param readings - Array of glucose readings
 * @param startTime - Start time in HH:MM format (e.g., "08:00")
 * @param endTime - End time in HH:MM format (e.g., "22:00")
 * @returns Filtered array of glucose readings
 */
export function filterReadingsByTimeRange(
  readings: GlucoseReading[],
  startTime: string,
  endTime: string
): GlucoseReading[] {
  if (!startTime || !endTime) {
    return readings;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return readings.filter(reading => {
    const hour = reading.timestamp.getHours();
    const minute = reading.timestamp.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    // Handle case where time range crosses midnight
    if (startMinutes <= endMinutes) {
      return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
    } else {
      return totalMinutes >= startMinutes || totalMinutes <= endMinutes;
    }
  });
}
