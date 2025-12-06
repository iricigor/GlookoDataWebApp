/**
 * Utility functions for Rate of Change (RoC) calculations
 * 
 * Medical standards for glucose Rate of Change (per 5 minutes):
 * - Good (stable): ≤0.3 mmol/L/5min (≤5 mg/dL/5min)
 * - Medium (moderate): 0.3-0.55 mmol/L/5min (5-10 mg/dL/5min)
 * - Bad (rapid): >0.55 mmol/L/5min (>10 mg/dL/5min)
 * 
 * Note: Original per-minute thresholds (0.06, 0.11) are multiplied by 5
 * to convert to per-5-minute units.
 * 
 * References:
 * - International consensus on use of CGM (Danne et al., 2017)
 * - Typical CGM arrow indicators use similar thresholds
 */

import type { GlucoseReading, RoCDataPoint, RoCStats, GlucoseUnit } from '../../types';
import { MMOL_TO_MGDL } from './glucoseUnitUtils';
import { formatGlucoseNumber } from '../formatting/formatters';

/**
 * Standard CGM measurement interval in minutes.
 * 
 * Most continuous glucose monitors (CGMs) take readings every 5 minutes.
 * This constant is used to normalize Rate of Change values to a per-5-minute
 * basis, making them more intuitive and comparable to CGM arrow indicators.
 * 
 * When RoC is expressed per minute (e.g., 0.1 mmol/L/min), multiplying by
 * this value converts it to per-5-minute units (e.g., 0.5 mmol/L/5min).
 */
export const ROC_TIME_SPAN_MINUTES = 5;

/**
 * Medical thresholds for Rate of Change (in mmol/L/5min)
 * These are the per-5-minute values used for display and categorization
 */
export const ROC_THRESHOLDS = {
  good: 0.3,     // ≤0.3 is stable/good (0.06 * 5)
  medium: 0.55,  // 0.3-0.55 is moderate (0.11 * 5)
  // >0.55 is rapid/bad
} as const;

/**
 * Legacy thresholds in per-minute units (used internally for calculations)
 */
export const ROC_THRESHOLDS_PER_MIN = {
  good: 0.06,    // ≤0.06 is stable/good
  medium: 0.11,  // 0.06-0.11 is moderate
  // >0.11 is rapid/bad
} as const;

/**
 * Colors for RoC categories
 */
export const ROC_COLORS = {
  good: '#4CAF50',    // Green - stable
  medium: '#FFB300',  // Amber - moderate change
  bad: '#D32F2F',     // Red - rapid change
} as const;

/**
 * Rapid change threshold for HSV color gradient (0.6 mmol/L/5min)
 * Values at or above this threshold will be displayed as pure red
 */
export const ROC_RAPID_CHANGE_THRESHOLD = 0.6;

/**
 * Convert HSV color values to an RGB color string.
 * 
 * This function uses the standard HSV to RGB conversion algorithm:
 * 1. Calculate chroma (c), intermediate value (x), and match value (m)
 * 2. Determine RGB components based on which 60° sector of the hue wheel we're in
 * 3. Apply the match value and scale to 0-255 range
 * 
 * @param h - Hue angle in degrees (0-360). 0/360 = red, 120 = green, 240 = blue
 * @param s - Saturation (0-1). 0 = grayscale, 1 = fully saturated
 * @param v - Value/brightness (0-1). 0 = black, 1 = full brightness
 * @returns RGB color string in format 'rgb(r, g, b)' where r, g, b are 0-255
 */
function hsvToRgb(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);
  
  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Get color for RoC value using HSV spectrum
 * Green (low/slow) to Red (high/fast) following the HSV color wheel
 * 
 * Color gradient: Zero is green (hue 120), gradually transitions to red (hue 0)
 * until the rapid change threshold (0.6 mmol/L/5min), above which it stays red.
 * 
 * @param absRoC - Absolute rate of change in mmol/L/5min
 * @returns RGB color string
 */
export function getRoCColor(absRoC: number): string {
  // Normalize RoC to 0-1 range based on rapid change threshold
  // Values at or above ROC_RAPID_CHANGE_THRESHOLD (0.6 mmol/L/5min) are capped at 1 (pure red)
  const normalizedRoC = Math.min(absRoC / ROC_RAPID_CHANGE_THRESHOLD, 1);
  
  // Hue goes from 120 (green) to 0 (red) as RoC increases
  // Following HSV color wheel: green (120°) → yellow (60°) → red (0°)
  const hue = 120 * (1 - normalizedRoC);
  
  return hsvToRgb(hue, 0.8, 0.9);
}

/**
 * Get slightly darker background color for RoC value using HSV spectrum
 * Same color gradient as getRoCColor but with lower brightness for background shading.
 * 
 * @param absRoC - Absolute rate of change in mmol/L/5min
 * @returns RGB color string with reduced brightness
 */
export function getRoCBackgroundColor(absRoC: number): string {
  // Normalize RoC to 0-1 range based on rapid change threshold
  const normalizedRoC = Math.min(absRoC / ROC_RAPID_CHANGE_THRESHOLD, 1);
  
  // Hue goes from 120 (green) to 0 (red) as RoC increases
  const hue = 120 * (1 - normalizedRoC);
  
  // Use lower value (0.5 instead of 0.9) for darker background
  return hsvToRgb(hue, 0.8, 0.5);
}

/**
 * Get color for RoC value using HSV spectrum (legacy per-minute version)
 * Converts from per-minute to per-5-minute before applying color gradient
 * 
 * @param absRoCPerMin - Absolute rate of change in mmol/L/min
 * @returns RGB color string
 */
export function getRoCColorPerMin(absRoCPerMin: number): string {
  // Convert per-minute to per-5-minute
  const absRoC5Min = absRoCPerMin * ROC_TIME_SPAN_MINUTES;
  return getRoCColor(absRoC5Min);
}

/**
 * Categorize RoC value based on medical standards
 * Uses per-5-minute thresholds for categorization
 * 
 * @param absRoC5min - Absolute rate of change in mmol/L/5min
 * @returns Category: 'good', 'medium', or 'bad'
 */
export function categorizeRoC(absRoC5min: number): 'good' | 'medium' | 'bad' {
  if (absRoC5min <= ROC_THRESHOLDS.good) {
    return 'good';
  } else if (absRoC5min <= ROC_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'bad';
  }
}

/**
 * Categorize RoC value based on medical standards (legacy per-minute version)
 * Converts from per-minute to per-5-minute before categorizing
 * 
 * @param absRoCPerMin - Absolute rate of change in mmol/L/min
 * @returns Category: 'good', 'medium', or 'bad'
 */
export function categorizeRoCPerMin(absRoCPerMin: number): 'good' | 'medium' | 'bad' {
  // Convert per-minute to per-5-minute
  const absRoC5Min = absRoCPerMin * ROC_TIME_SPAN_MINUTES;
  return categorizeRoC(absRoC5Min);
}

/**
 * Calculate Rate of Change from consecutive glucose readings
 * RoC values are stored in mmol/L/5min units for display
 * 
 * @param readings - Array of glucose readings sorted by timestamp
 * @returns Array of RoC data points with values in mmol/L/5min
 */
export function calculateRoC(readings: GlucoseReading[]): RoCDataPoint[] {
  if (readings.length < 2) {
    return [];
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const rocDataPoints: RoCDataPoint[] = [];

  for (let i = 1; i < sortedReadings.length; i++) {
    const current = sortedReadings[i];
    const previous = sortedReadings[i - 1];
    
    // Calculate time difference in minutes
    const timeDiffMs = current.timestamp.getTime() - previous.timestamp.getTime();
    const timeDiffMin = timeDiffMs / (1000 * 60);
    
    // Skip if time gap is too large (>30 minutes) or too small (<1 minute)
    if (timeDiffMin > 30 || timeDiffMin < 1) {
      continue;
    }
    
    // Calculate glucose change
    const glucoseChange = current.value - previous.value;
    
    // Calculate rate of change (mmol/L per minute)
    const rocPerMin = glucoseChange / timeDiffMin;
    const absRoCPerMin = Math.abs(rocPerMin);
    
    // Convert to per-5-minute values for storage and display
    const roc5min = absRoCPerMin * ROC_TIME_SPAN_MINUTES;
    const rocRaw5min = rocPerMin * ROC_TIME_SPAN_MINUTES;
    
    // Get time components for the data point (use midpoint)
    const hour = current.timestamp.getHours();
    const minute = current.timestamp.getMinutes();
    const timeDecimal = hour + minute / 60;
    const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    rocDataPoints.push({
      timestamp: current.timestamp,
      timeDecimal,
      timeLabel,
      roc: roc5min,  // Now in mmol/L/5min
      rocRaw: rocRaw5min,  // Now in mmol/L/5min
      glucoseValue: current.value,
      color: getRoCColor(roc5min),  // Uses per-5-min value
      category: categorizeRoC(roc5min),  // Uses per-5-min threshold
    });
  }

  return rocDataPoints;
}

/**
 * Valid RoC calculation interval options in minutes.
 * These represent the time window over which glucose change is measured:
 * - 15min: Short-term changes (3 CGM readings)
 * - 30min: Medium-term changes (6 CGM readings)
 * - 60min: Long-term changes (12 CGM readings)
 * - 120min: Extended changes (24 CGM readings)
 */
export type RoCIntervalMinutes = 15 | 30 | 60 | 120;

/**
 * Calculate Rate of Change from glucose readings over a specified time interval.
 * 
 * This function finds the glucose reading closest to the target interval before each reading
 * and calculates the rate of change between them. This allows for analyzing glucose trends
 * over longer time periods (15min, 30min, 1h, 2h) rather than just consecutive readings.
 * 
 * RoC values are stored in mmol/L/5min units for display to maintain consistency with
 * the standard CGM arrow indicators.
 * 
 * @param readings - Array of glucose readings sorted by timestamp
 * @param intervalMinutes - Time interval in minutes over which to calculate RoC (15, 30, 60, or 120)
 * @returns Array of RoC data points with values in mmol/L/5min
 */
export function calculateRoCWithInterval(readings: GlucoseReading[], intervalMinutes: RoCIntervalMinutes): RoCDataPoint[] {
  if (readings.length < 2) {
    return [];
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const rocDataPoints: RoCDataPoint[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;
  // Allow 20% tolerance for finding matching readings
  const toleranceMs = intervalMs * 0.2;

  for (let i = 0; i < sortedReadings.length; i++) {
    const current = sortedReadings[i];
    const targetTime = current.timestamp.getTime() - intervalMs;
    
    // Find the reading closest to the target time within tolerance
    let bestMatch: GlucoseReading | null = null;
    let bestTimeDiff = Infinity;
    
    for (let j = 0; j < i; j++) {
      const candidate = sortedReadings[j];
      const timeDiff = Math.abs(candidate.timestamp.getTime() - targetTime);
      
      if (timeDiff < bestTimeDiff && timeDiff <= toleranceMs) {
        bestMatch = candidate;
        bestTimeDiff = timeDiff;
      }
    }
    
    // Skip if no suitable reading found
    if (!bestMatch) {
      continue;
    }
    
    // Calculate time difference in minutes
    const timeDiffMs = current.timestamp.getTime() - bestMatch.timestamp.getTime();
    const timeDiffMin = timeDiffMs / (1000 * 60);
    
    // Calculate glucose change
    const glucoseChange = current.value - bestMatch.value;
    
    // Calculate rate of change (mmol/L per minute)
    const rocPerMin = glucoseChange / timeDiffMin;
    const absRoCPerMin = Math.abs(rocPerMin);
    
    // Convert to per-5-minute values for storage and display
    const roc5min = absRoCPerMin * ROC_TIME_SPAN_MINUTES;
    const rocRaw5min = rocPerMin * ROC_TIME_SPAN_MINUTES;
    
    // Get time components for the data point
    const hour = current.timestamp.getHours();
    const minute = current.timestamp.getMinutes();
    const timeDecimal = hour + minute / 60;
    const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    rocDataPoints.push({
      timestamp: current.timestamp,
      timeDecimal,
      timeLabel,
      roc: roc5min,
      rocRaw: rocRaw5min,
      glucoseValue: current.value,
      color: getRoCColor(roc5min),
      category: categorizeRoC(roc5min),
    });
  }

  return rocDataPoints;
}

/**
 * Filter RoC data points for a specific date
 * 
 * @param dataPoints - Array of RoC data points
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Filtered data points for that date
 */
export function filterRoCByDate(dataPoints: RoCDataPoint[], dateString: string): RoCDataPoint[] {
  return dataPoints.filter(point => {
    const year = point.timestamp.getFullYear();
    const month = String(point.timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(point.timestamp.getDate()).padStart(2, '0');
    const pointDate = `${year}-${month}-${day}`;
    return pointDate === dateString;
  });
}

/**
 * Calculate percentage rounded to 1 decimal place
 * 
 * @param count - Count of items
 * @param total - Total count
 * @returns Percentage rounded to 1 decimal place
 */
function calculateRoundedPercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

/**
 * Calculate RoC statistics for a set of data points
 * 
 * @param dataPoints - Array of RoC data points
 * @returns RoC statistics
 */
export function calculateRoCStats(dataPoints: RoCDataPoint[]): RoCStats {
  if (dataPoints.length === 0) {
    return {
      minRoC: 0,
      maxRoC: 0,
      sdRoC: 0,
      goodPercentage: 0,
      mediumPercentage: 0,
      badPercentage: 0,
      goodCount: 0,
      mediumCount: 0,
      badCount: 0,
      totalCount: 0,
    };
  }

  const rocValues = dataPoints.map(d => d.roc);
  const totalCount = rocValues.length;
  
  // Min and Max
  const minRoC = Math.min(...rocValues);
  const maxRoC = Math.max(...rocValues);
  
  // Mean
  const mean = rocValues.reduce((sum, val) => sum + val, 0) / totalCount;
  
  // Standard Deviation
  const squaredDiffs = rocValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / totalCount;
  const sdRoC = Math.sqrt(variance);
  
  // Count categories
  const goodCount = dataPoints.filter(d => d.category === 'good').length;
  const mediumCount = dataPoints.filter(d => d.category === 'medium').length;
  const badCount = dataPoints.filter(d => d.category === 'bad').length;
  
  // Calculate percentages using helper function
  const goodPercentage = calculateRoundedPercentage(goodCount, totalCount);
  const mediumPercentage = calculateRoundedPercentage(mediumCount, totalCount);
  const badPercentage = calculateRoundedPercentage(badCount, totalCount);

  return {
    minRoC,
    maxRoC,
    sdRoC,
    goodPercentage,
    mediumPercentage,
    badPercentage,
    goodCount,
    mediumCount,
    badCount,
    totalCount,
  };
}

/**
 * Get unique dates from RoC data points
 * 
 * @param dataPoints - Array of RoC data points
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getUniqueDatesFromRoC(dataPoints: RoCDataPoint[]): string[] {
  const dateSet = new Set<string>();
  
  dataPoints.forEach(point => {
    const year = point.timestamp.getFullYear();
    const month = String(point.timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(point.timestamp.getDate()).padStart(2, '0');
    dateSet.add(`${year}-${month}-${day}`);
  });
  
  return Array.from(dateSet).sort();
}

/**
 * Format RoC value for display based on unit
 * mmol/L: 1 decimal place
 * mg/dL: integers (RoC values are internally always in mmol/L units)
 * 
 * @param roc - Rate of change value in mmol/L/5min
 * @param unit - Glucose unit for formatting ('mmol/L' or 'mg/dL')
 * @returns Formatted string with appropriate precision
 */
export function formatRoCValue(roc: number, unit?: GlucoseUnit): string {
  if (unit === 'mg/dL') {
    // Convert to mg/dL using the standard conversion factor and return as integer
    const rocMgdl = roc * MMOL_TO_MGDL;
    return Math.round(rocMgdl).toString();
  }
  // mmol/L: 1 decimal place with localized formatting
  return formatGlucoseNumber(roc, 1);
}

/**
 * Get description of RoC medical standards
 * Thresholds are now in per-5-minute units
 * 
 * @param unit - Glucose unit for formatting ('mmol/L' or 'mg/dL'). Defaults to 'mmol/L'.
 * @returns Object with descriptions for each category
 */
export function getRoCMedicalStandards(unit?: GlucoseUnit): {
  good: { threshold: string; description: string };
  medium: { threshold: string; description: string };
  bad: { threshold: string; description: string };
} {
  if (unit === 'mg/dL') {
    // Convert thresholds: 0.3 * 18 ≈ 5, 0.55 * 18 ≈ 10
    return {
      good: {
        threshold: '≤5 mg/dL/5min',
        description: 'Stable - glucose changing slowly',
      },
      medium: {
        threshold: '5-10 mg/dL/5min',
        description: 'Moderate - glucose changing at moderate pace',
      },
      bad: {
        threshold: '>10 mg/dL/5min',
        description: 'Rapid - glucose changing quickly',
      },
    };
  }
  
  return {
    good: {
      threshold: '≤0.3 mmol/L/5min',
      description: 'Stable - glucose changing slowly',
    },
    medium: {
      threshold: '0.3-0.55 mmol/L/5min',
      description: 'Moderate - glucose changing at moderate pace',
    },
    bad: {
      threshold: '>0.55 mmol/L/5min',
      description: 'Rapid - glucose changing quickly',
    },
  };
}

/**
 * Apply 15-minute moving average smoothing to RoC data points.
 * Values are clamped to a minimum of 0 to prevent negative display.
 * Uses a sliding window approach for O(n) complexity.
 * 
 * @param dataPoints - Array of RoC data points
 * @returns Array of smoothed RoC data points
 */
export function smoothRoCData(dataPoints: RoCDataPoint[]): RoCDataPoint[] {
  if (dataPoints.length === 0) {
    return [];
  }

  // Sort by timestamp
  const sorted = [...dataPoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // 15-minute window in milliseconds (7.5 min each side)
  const halfWindowMs = 7.5 * 60 * 1000;

  // Use sliding window approach for O(n) complexity
  const result: RoCDataPoint[] = [];
  let windowSum = 0;
  let windowStart = 0;
  let windowEnd = 0;

  for (let i = 0; i < sorted.length; i++) {
    const pointTime = sorted[i].timestamp.getTime();
    const windowLower = pointTime - halfWindowMs;
    const windowUpper = pointTime + halfWindowMs;

    // Expand window end to include new points
    while (windowEnd < sorted.length && sorted[windowEnd].timestamp.getTime() <= windowUpper) {
      windowSum += sorted[windowEnd].roc;
      windowEnd++;
    }

    // Shrink window start to exclude old points
    while (windowStart < windowEnd && sorted[windowStart].timestamp.getTime() < windowLower) {
      windowSum -= sorted[windowStart].roc;
      windowStart++;
    }

    // Calculate average RoC for current window
    const windowCount = windowEnd - windowStart;
    const avgRoC = windowCount > 0 ? windowSum / windowCount : sorted[i].roc;

    // Clamp to minimum of 0 to prevent negative values
    const clampedRoC = Math.max(0, avgRoC);

    // Re-categorize and re-color based on smoothed value
    const category = categorizeRoC(clampedRoC);
    const color = getRoCColor(clampedRoC);

    result.push({
      ...sorted[i],
      roc: clampedRoC,
      color,
      category,
    });
  }

  return result;
}

/**
 * Calculate the longest continuous period in a specific category.
 * 
 * @param dataPoints - Array of RoC data points (should be sorted by time)
 * @param category - The category to look for ('good', 'medium', or 'bad')
 * @returns Duration in minutes of the longest continuous period in that category
 */
export function getLongestCategoryPeriod(
  dataPoints: RoCDataPoint[],
  category: 'good' | 'medium' | 'bad'
): number {
  if (dataPoints.length === 0) {
    return 0;
  }

  // Sort by timestamp
  const sorted = [...dataPoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  let longestDuration = 0;
  let currentStreak: RoCDataPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const point = sorted[i];
    
    if (point.category === category) {
      // Check if this point is consecutive (within 10 minutes of previous)
      if (currentStreak.length === 0) {
        currentStreak = [point];
      } else {
        const lastPoint = currentStreak[currentStreak.length - 1];
        const timeDiff = point.timestamp.getTime() - lastPoint.timestamp.getTime();
        
        // Consider consecutive if within 10 minutes (allowing for CGM gaps)
        if (timeDiff <= 10 * 60 * 1000) {
          currentStreak.push(point);
        } else {
          // Gap too large, calculate duration and start new streak
          if (currentStreak.length > 0) {
            const duration = (currentStreak[currentStreak.length - 1].timestamp.getTime() - 
                            currentStreak[0].timestamp.getTime()) / (60 * 1000);
            longestDuration = Math.max(longestDuration, duration);
          }
          currentStreak = [point];
        }
      }
    } else {
      // Different category, calculate current streak duration
      if (currentStreak.length > 0) {
        const duration = (currentStreak[currentStreak.length - 1].timestamp.getTime() - 
                        currentStreak[0].timestamp.getTime()) / (60 * 1000);
        longestDuration = Math.max(longestDuration, duration);
      }
      currentStreak = [];
    }
  }

  // Check final streak
  if (currentStreak.length > 0) {
    const duration = (currentStreak[currentStreak.length - 1].timestamp.getTime() - 
                    currentStreak[0].timestamp.getTime()) / (60 * 1000);
    longestDuration = Math.max(longestDuration, duration);
  }

  return Math.round(longestDuration);
}

/**
 * Format minutes as hours and minutes string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}
