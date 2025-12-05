/**
 * Constants for the RoCReport component
 */

import type { RoCIntervalMinutes } from '../../utils/data/rocDataUtils';

// Time labels for X-axis formatting (show every 6 hours)
export const TIME_LABELS: Record<number, string> = {
  0: '12AM', 6: '6AM', 12: 'noon', 18: '6PM', 24: '12AM'
};

/**
 * Glucose thresholds for the RoC chart Y-axis scaling.
 * These are intentionally different from the configurable thresholds used
 * for time-in-range calculations. The RoC chart uses fixed values to ensure
 * consistent visualization:
 * - low/veryLow: 3.9/3.0 mmol/L for the dashed reference line
 */
export const CHART_GLUCOSE_THRESHOLDS = {
  low: 3.9,
  veryLow: 3.0,
} as const;

/**
 * Max glucose values for Y-axis toggle (matching other reports)
 */
export const MAX_GLUCOSE_VALUES = {
  mmol: { low: 16.0, high: 22.0 },
  mgdl: { low: 288, high: 396 },
} as const;

// RoC interval options mapping slider value to minutes
export const ROC_INTERVAL_OPTIONS: { value: number; label: string; minutes: RoCIntervalMinutes }[] = [
  { value: 0, label: '15min', minutes: 15 },
  { value: 1, label: '30min', minutes: 30 },
  { value: 2, label: '1h', minutes: 60 },
  { value: 3, label: '2h', minutes: 120 },
];

// Format X-axis labels (show every 6 hours)
export const formatXAxis = (value: number): string => {
  const hour = Math.floor(value);
  return TIME_LABELS[hour] || '';
};
