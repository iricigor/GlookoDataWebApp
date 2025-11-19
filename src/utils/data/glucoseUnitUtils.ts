/**
 * Utility functions for glucose unit conversion between mmol/L and mg/dL
 */

import type { GlucoseUnit } from '../../types';

/**
 * Conversion factor from mmol/L to mg/dL
 * 1 mmol/L = 18.018 mg/dL (commonly rounded to 18)
 */
export const MMOL_TO_MGDL = 18.018;

/**
 * Convert glucose value from mmol/L to mg/dL
 * @param mmolValue - Glucose value in mmol/L
 * @returns Glucose value in mg/dL, rounded to nearest integer
 */
export function mmolToMgdl(mmolValue: number): number {
  return Math.round(mmolValue * MMOL_TO_MGDL);
}

/**
 * Convert glucose value from mg/dL to mmol/L
 * @param mgdlValue - Glucose value in mg/dL
 * @returns Glucose value in mmol/L, rounded to 1 decimal place
 */
export function mgdlToMmol(mgdlValue: number): number {
  return Math.round((mgdlValue / MMOL_TO_MGDL) * 10) / 10;
}

/**
 * Convert glucose value based on target unit
 * @param value - Glucose value in mmol/L (internal storage format)
 * @param targetUnit - Target unit for display
 * @returns Glucose value converted to target unit
 */
export function convertGlucoseValue(value: number, targetUnit: GlucoseUnit): number {
  if (targetUnit === 'mg/dL') {
    return mmolToMgdl(value);
  }
  return value;
}

/**
 * Format glucose value with appropriate precision based on unit
 * @param value - Glucose value in the specified unit
 * @param unit - Unit of the value (mmol/L or mg/dL)
 * @returns Formatted string with appropriate decimal places
 */
export function formatGlucoseValue(value: number, unit: GlucoseUnit): string {
  if (unit === 'mg/dL') {
    return Math.round(value).toString();
  }
  return value.toFixed(1);
}

/**
 * Convert and format glucose value in one step
 * @param mmolValue - Glucose value in mmol/L (internal storage format)
 * @param targetUnit - Target unit for display
 * @returns Formatted string in target unit
 */
export function displayGlucoseValue(mmolValue: number, targetUnit: GlucoseUnit): string {
  const convertedValue = convertGlucoseValue(mmolValue, targetUnit);
  return formatGlucoseValue(convertedValue, targetUnit);
}

/**
 * Get the unit label for display
 * @param unit - Glucose unit
 * @returns Display label (e.g., "mmol/L" or "mg/dL")
 */
export function getUnitLabel(unit: GlucoseUnit): string {
  return unit;
}
