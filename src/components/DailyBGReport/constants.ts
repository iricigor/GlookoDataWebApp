/**
 * Constants for the DailyBGReport component
 */

// Re-export ROC_INTERVAL_OPTIONS from RoCReport to avoid duplication
export { ROC_INTERVAL_OPTIONS } from '../RoCReport/constants';

// Hypo chart colors (defined at module level for dependency stability)
export const HYPO_CHART_COLORS = {
  normal: '#4CAF50',    // Green for normal glucose
  low: '#FFAB91',       // Light red for low
  veryLow: '#EF5350',   // Dark red for very low
  nadirDot: '#B71C1C',  // Darker red for nadir markers
};

// Format X-axis labels - unified format: 12AM, 6AM, noon, 6PM, 12AM
// Used with numeric XAxis (dataKey="timeDecimal" and "hour")
export const formatXAxis = (value: number): string => {
  const hour = Math.floor(value);
  const unifiedLabels: Record<number, string> = {
    0: '12AM', 6: '6AM', 12: 'noon', 18: '6PM', 24: '12AM'
  };
  return unifiedLabels[hour] || '';
};

// Format X-axis labels for IOB - same unified format
export const formatXAxisIOB = formatXAxis;
