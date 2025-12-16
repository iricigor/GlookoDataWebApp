/**
 * Advanced metrics and statistical calculations for glucose range analysis
 * This module contains HbA1c, CV, BGRI, J-Index, quartiles, incidents, and other metrics
 */

import type {
  GlucoseReading,
  GlucoseThresholds,
} from '../../types';
import { MMOL_TO_MGDL } from './glucoseUnitUtils';
import {
  categorizeGlucose,
  UNICORN_TOLERANCE_MMOL,
  UNICORN_TOLERANCE_100_MGDL,
  UNICORN_100_MGDL_IN_MMOL,
} from './glucoseRangeCoreUtils';
import { formatDate } from './glucoseRangeGroupingUtils';

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
