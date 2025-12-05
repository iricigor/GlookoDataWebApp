/**
 * Types for the DailyBGReport component
 */

import type { GlucoseThresholds, RoCStats, RoCDataPoint, HourlyIOBData } from '../../types';
import type { HypoStats } from '../../utils/data/hypoDataUtils';
import type { BGColorScheme } from '../../hooks/useBGColorScheme';
import type { useStyles } from './styles';

/**
 * Props for the DailyBGReport component
 */
export interface DailyBGReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
  insulinDuration?: number;
  showDayNightShading: boolean;
}

/**
 * Common props for section components
 */
export interface SectionCommonProps {
  styles: ReturnType<typeof useStyles>;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
}

/**
 * Props for the Glucose Section component
 */
export interface GlucoseSectionProps extends SectionCommonProps {
  glucoseStats: { low: number; inRange: number; high: number; total: number };
  belowPercentage: string;
  inRangePercentage: string;
  abovePercentage: string;
  maxGlucose: number;
  setMaxGlucose: (value: number) => void;
  colorScheme: BGColorScheme;
  setColorScheme: (scheme: BGColorScheme) => void;
  glucoseChartData: Array<{
    time: string;
    timeMinutes: number;
    timeDecimal: number;
    value: number;
    originalValue: number;
    color: string;
  }>;
  showDayNightShading: boolean;
}

/**
 * Props for the RoC Section component
 */
export interface RoCSectionProps extends SectionCommonProps {
  rocStats: RoCStats;
  longestStablePeriod: number;
  rocChartData: Array<RoCDataPoint & { glucoseDisplay: number }>;
  rocGlucoseLineData: Array<{ timeDecimal: number; glucoseDisplay: number }>;
  rocGradientStops: Array<{ offset: string; color: string }>;
  rocYAxisDomain: [number, number];
  rocIntervalIndex: number;
  setRocIntervalIndex: (value: number) => void;
  rocMaxGlucose: number;
  setRocMaxGlucose: (value: number) => void;
  showDayNightShading: boolean;
}

/**
 * Props for the Hypo Section component
 */
export interface HypoSectionProps extends SectionCommonProps {
  hypoStats: HypoStats;
  hyposChartData: Array<{
    time: string;
    timeMinutes: number;
    timeDecimal: number;
    value: number;
    originalValue: number;
    rawValue?: number;
    color: string;
    index: number;
  }>;
  hyposGradientStops: Array<{ offset: string; color: string }>;
  nadirPoints: Array<{
    timeDecimal: number;
    value: number;
    originalValue: number;
    nadir: number;
    isSevere: boolean;
  }>;
  maxGlucose: number;
  showDayNightShading: boolean;
}

/**
 * Props for the IOB Section component
 */
export interface IOBSectionProps {
  styles: ReturnType<typeof useStyles>;
  hourlyIOBData: HourlyIOBData[];
  showDayNightShading: boolean;
}

/**
 * Data structure for timeline chart data points
 */
export interface TimelineDataPoint {
  hour: number;
  timeLabel: string;
  basalRate: number;
  bolusTotal: number;
}

/**
 * Glucose chart data point structure
 */
export interface GlucoseChartDataPoint {
  time: string;
  timeMinutes: number;
  timeDecimal: number;
  value: number;
  originalValue: number;
  color: string;
}
