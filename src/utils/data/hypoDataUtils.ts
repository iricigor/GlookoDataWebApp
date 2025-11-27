/**
 * Utility functions for hypoglycemia detection and analysis
 * 
 * Hypoglycemia (hypo) periods are detected based on:
 * - Start: Three consecutive readings below the low threshold
 * - End: Three consecutive readings above the low threshold AND at least 0.6 mmol/L above the nadir
 * - Nadir: The minimum glucose value during the hypo period
 * 
 * Severe hypoglycemia uses the veryLow threshold instead.
 */

import type { GlucoseReading, GlucoseThresholds } from '../../types';

/**
 * Recovery offset in mmol/L - readings must be this much above nadir to end a hypo period
 */
export const HYPO_RECOVERY_OFFSET = 0.6;

/**
 * Number of consecutive readings required to start or end a hypo period
 */
export const CONSECUTIVE_READINGS_REQUIRED = 3;

/**
 * Represents a hypoglycemia period with start/end times and statistics
 */
export interface HypoPeriod {
  /** Start time of the hypo period (timestamp of first low reading) */
  startTime: Date;
  /** End time of the hypo period (timestamp of first reading above recovery threshold) */
  endTime: Date;
  /** Duration of the hypo period in minutes */
  durationMinutes: number;
  /** The lowest glucose value (nadir) during the hypo period in mmol/L */
  nadir: number;
  /** Timestamp of the nadir reading */
  nadirTime: Date;
  /** Whether this is a severe hypo (below veryLow threshold) */
  isSevere: boolean;
  /** Index of the nadir reading in the original readings array (for chart markers) */
  nadirIndex: number;
  /** Time decimal of nadir for chart positioning (hour + minutes/60) */
  nadirTimeDecimal: number;
}

/**
 * Statistics about hypoglycemia events for a given time period
 */
export interface HypoStats {
  /** Number of severe hypo events */
  severeCount: number;
  /** Number of non-severe hypo events */
  nonSevereCount: number;
  /** Total number of hypo events */
  totalCount: number;
  /** Lowest glucose value across all hypo periods in mmol/L */
  lowestValue: number | null;
  /** Longest hypo duration in minutes */
  longestDurationMinutes: number;
  /** Total hypo duration in minutes */
  totalDurationMinutes: number;
  /** All detected hypo periods */
  hypoPeriods: HypoPeriod[];
}

/**
 * Detect hypoglycemia periods from a sorted array of glucose readings
 * 
 * Algorithm:
 * 1. Scan for sequences of 3+ consecutive readings below the threshold
 * 2. Once in a hypo period, track the nadir (minimum value)
 * 3. End the period when 3+ consecutive readings are:
 *    - Above the low threshold
 *    - At least 0.6 mmol/L above the nadir
 * 
 * @param readings - Array of glucose readings, sorted by timestamp
 * @param threshold - The glucose threshold for detecting hypo (e.g., thresholds.low or thresholds.veryLow)
 * @param isSevere - Whether this is detecting severe hypos (for marking purposes)
 * @returns Array of detected hypoglycemia periods
 */
export function detectHypoPeriods(
  readings: GlucoseReading[],
  threshold: number,
  isSevere: boolean = false
): HypoPeriod[] {
  if (readings.length < CONSECUTIVE_READINGS_REQUIRED) {
    return [];
  }

  const hypoPeriods: HypoPeriod[] = [];
  let inHypo = false;
  let hypoStartIndex = -1;
  let consecutiveBelowCount = 0;
  let consecutiveAboveCount = 0;
  let currentNadir = Infinity;
  let currentNadirIndex = -1;

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    const isBelow = reading.value < threshold;

    if (!inHypo) {
      // Not currently in a hypo period - look for start condition
      if (isBelow) {
        consecutiveBelowCount++;
        if (consecutiveBelowCount >= CONSECUTIVE_READINGS_REQUIRED) {
          // Start hypo period from the first of the consecutive readings
          inHypo = true;
          hypoStartIndex = i - (CONSECUTIVE_READINGS_REQUIRED - 1);
          currentNadir = reading.value;
          currentNadirIndex = i;
          
          // Check for lower readings in the initial sequence
          for (let j = hypoStartIndex; j < i; j++) {
            if (readings[j].value < currentNadir) {
              currentNadir = readings[j].value;
              currentNadirIndex = j;
            }
          }
          consecutiveAboveCount = 0;
        }
      } else {
        consecutiveBelowCount = 0;
      }
    } else {
      // Currently in a hypo period - track nadir and look for end condition
      if (reading.value < currentNadir) {
        currentNadir = reading.value;
        currentNadirIndex = i;
      }

      // Check for recovery: above threshold AND above nadir + offset
      const recoveryThreshold = Math.max(threshold, currentNadir + HYPO_RECOVERY_OFFSET);
      const isRecovered = reading.value >= recoveryThreshold;

      if (isRecovered) {
        consecutiveAboveCount++;
        if (consecutiveAboveCount >= CONSECUTIVE_READINGS_REQUIRED) {
          // End hypo period at the first of the consecutive recovery readings
          const endIndex = i - (CONSECUTIVE_READINGS_REQUIRED - 1);
          const startTime = readings[hypoStartIndex].timestamp;
          const endTime = readings[endIndex].timestamp;
          const nadirTime = readings[currentNadirIndex].timestamp;
          
          hypoPeriods.push({
            startTime,
            endTime,
            durationMinutes: (endTime.getTime() - startTime.getTime()) / (1000 * 60),
            nadir: currentNadir,
            nadirTime,
            isSevere,
            nadirIndex: currentNadirIndex,
            nadirTimeDecimal: nadirTime.getHours() + nadirTime.getMinutes() / 60,
          });

          // Reset for next potential hypo period
          inHypo = false;
          consecutiveBelowCount = 0;
          consecutiveAboveCount = 0;
          currentNadir = Infinity;
          currentNadirIndex = -1;
        }
      } else {
        consecutiveAboveCount = 0;
      }
    }
  }

  // Handle case where hypo period extends to end of data
  if (inHypo && hypoStartIndex >= 0) {
    const startTime = readings[hypoStartIndex].timestamp;
    const endTime = readings[readings.length - 1].timestamp;
    const nadirTime = readings[currentNadirIndex].timestamp;
    
    hypoPeriods.push({
      startTime,
      endTime,
      durationMinutes: (endTime.getTime() - startTime.getTime()) / (1000 * 60),
      nadir: currentNadir,
      nadirTime,
      isSevere,
      nadirIndex: currentNadirIndex,
      nadirTimeDecimal: nadirTime.getHours() + nadirTime.getMinutes() / 60,
    });
  }

  return hypoPeriods;
}

/**
 * Calculate comprehensive hypoglycemia statistics from glucose readings
 * 
 * This function detects both severe and non-severe hypos and returns
 * aggregated statistics useful for display in the HyposReport component.
 * 
 * @param readings - Array of glucose readings, sorted by timestamp
 * @param thresholds - Glucose thresholds with low and veryLow values
 * @returns Comprehensive hypo statistics
 */
export function calculateHypoStats(
  readings: GlucoseReading[],
  thresholds: GlucoseThresholds
): HypoStats {
  // Detect all hypos (below low threshold)
  const allHypos = detectHypoPeriods(readings, thresholds.low, false);
  
  // Mark severe status on all hypos where nadir went below veryLow
  const allHyposWithSeverity = allHypos.map(hypo => ({
    ...hypo,
    isSevere: hypo.nadir < thresholds.veryLow,
  }));
  
  // Non-severe hypos are those below low threshold but whose nadir never went below veryLow
  const nonSevereHypos = allHyposWithSeverity.filter(hypo => !hypo.isSevere);

  // Calculate aggregate statistics
  const allPeriods = allHyposWithSeverity;
  const lowestValue = allPeriods.length > 0 
    ? Math.min(...allPeriods.map(h => h.nadir))
    : null;
  const longestDurationMinutes = allPeriods.length > 0
    ? Math.max(...allPeriods.map(h => h.durationMinutes))
    : 0;
  const totalDurationMinutes = allPeriods.reduce((sum, h) => sum + h.durationMinutes, 0);

  return {
    severeCount: allHyposWithSeverity.filter(h => h.isSevere).length,
    nonSevereCount: nonSevereHypos.length,
    totalCount: allHyposWithSeverity.length,
    lowestValue,
    longestDurationMinutes,
    totalDurationMinutes,
    hypoPeriods: allHyposWithSeverity,
  };
}

/**
 * Format duration in minutes to a human-readable string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m", "45m", "2h")
 */
export function formatHypoDuration(minutes: number): string {
  if (minutes < 1) {
    return '< 1m';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}
