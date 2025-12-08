/**
 * Types and constants for HyposReport components
 */

import type { GlucoseUnit, UploadedFile, GlucoseThresholds } from '../../types';
import type { HypoStats } from '../../utils/data/hypoDataUtils';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api/aiApi';

/**
 * Max glucose values for Y-axis toggle
 */
export const MAX_GLUCOSE_VALUES = {
  mmol: { low: 16.0, high: 22.0 },
  mgdl: { low: 288, high: 396 },
} as const;

/**
 * Colors for hypo chart visualization
 */
export const HYPO_CHART_COLORS = {
  normal: '#4CAF50',     // Green for normal glucose
  low: '#FF6B6B',        // Light red for below low threshold
  veryLow: '#8B0000',    // Dark red for below veryLow threshold
  nadirDot: '#8B0000',   // Dark red for nadir dots
} as const;

/**
 * Time labels for X-axis formatting (show every 6 hours)
 * Using "Noon" instead of "12PM" for clarity
 */
export const TIME_LABELS: Record<number, string> = {
  0: '12AM', 6: '6AM', 12: 'Noon', 18: '6PM', 24: '12AM'
};

/**
 * Props for the main HyposReport component
 */
export interface HyposReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
  // AI configuration props (optional - AI features disabled if not provided)
  perplexityApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  deepseekApiKey?: string;
  selectedProvider?: AIProvider | null;
  responseLanguage?: ResponseLanguage;
  showGeekStats?: boolean;
}

/**
 * Props for the HyposStatsCards component
 */
export interface HyposStatsCardsProps {
  hypoStats: HypoStats | null;
  thresholds: GlucoseThresholds;
  glucoseUnit: GlucoseUnit;
  lbgi: number | null;
}

/**
 * LBGI risk thresholds for hypoglycemia risk assessment
 */
export const LBGI_THRESHOLDS = { low: 2.5, moderate: 5 };

/**
 * LBGI risk interpretation result
 */
export interface LBGIInterpretation {
  text: string;
  level: 'low' | 'moderate' | 'high';
}

/**
 * Get LBGI risk interpretation based on value
 * @param lbgi - Low Blood Glucose Index value
 * @returns Risk interpretation with text and level
 */
export function getLBGIInterpretation(lbgi: number): LBGIInterpretation {
  if (lbgi < LBGI_THRESHOLDS.low) return { text: 'Low Risk', level: 'low' };
  if (lbgi <= LBGI_THRESHOLDS.moderate) return { text: 'Moderate Risk', level: 'moderate' };
  return { text: 'High Risk', level: 'high' };
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  time: string;
  timeMinutes: number;
  timeDecimal: number;
  value: number;
  originalValue: number;
  rawValue: number;
  color: string;
  index: number;
}

/**
 * Nadir point data
 */
export interface NadirPoint {
  timeDecimal: number;
  value: number;
  originalValue: number;
  nadir: number;
  isSevere: boolean;
}

/**
 * Gradient stop for the glucose line
 */
export interface GradientStop {
  offset: string;
  color: string;
}

/**
 * Props for the HyposChart component
 */
export interface HyposChartProps {
  chartData: ChartDataPoint[];
  nadirPoints: NadirPoint[];
  gradientStops: GradientStop[];
  maxGlucose: number;
  setMaxGlucose: (value: number) => void;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  windowWidth: number;
}

/**
 * Props for the HyposChartLegend component
 * Currently no props needed, but interface defined for extensibility
 */
export type HyposChartLegendProps = Record<string, never>;

/**
 * Recharts scatter shape props with position coordinates
 */
export interface ScatterShapeProps {
  cx: number;
  cy: number;
}

/**
 * Tooltip payload data structure for chart tooltips
 */
export interface TooltipPayloadData {
  time: string;
  value: number;
  originalValue: number;
  rawValue?: number;
  color?: string;
}

/**
 * Props for the custom chart tooltip component
 */
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayloadData }>;
}
