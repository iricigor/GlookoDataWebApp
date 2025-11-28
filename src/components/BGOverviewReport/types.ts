/**
 * Types for BG Overview Report components
 */

import type { 
  RangeCategoryMode,
  GlucoseUnit,
} from '../../types';

/** Statistics for TIR (Time in Range) data */
export interface TIRStats {
  veryLow?: number;
  low: number;
  inRange: number;
  high: number;
  veryHigh?: number;
  total: number;
}

/** HbA1c statistics */
export interface HbA1cStats {
  hba1c: number | null;
  averageGlucose: number | null;
  daysWithData: number;
  cv: number | null;
}

/** Risk assessment statistics */
export interface RiskStats {
  lbgi: number | null;
  hbgi: number | null;
  bgri: number | null;
  jIndex: number | null;
}

/** Risk thresholds for LBGI, HBGI, and J-Index */
export const LBGI_THRESHOLDS = { low: 2.5, moderate: 5 };
export const HBGI_THRESHOLDS = { low: 4.5, moderate: 9 };
export const JINDEX_THRESHOLDS = { excellent: 20, good: 30, fair: 40 };

/** Risk interpretation result */
export interface RiskInterpretation {
  text: string;
  level: 'low' | 'moderate' | 'high';
}

/** Helper functions for risk interpretation */
export function getLBGIInterpretation(lbgi: number): RiskInterpretation {
  if (lbgi < LBGI_THRESHOLDS.low) return { text: 'Low Risk', level: 'low' };
  if (lbgi <= LBGI_THRESHOLDS.moderate) return { text: 'Moderate Risk', level: 'moderate' };
  return { text: 'High Risk', level: 'high' };
}

export function getHBGIInterpretation(hbgi: number): RiskInterpretation {
  if (hbgi < HBGI_THRESHOLDS.low) return { text: 'Low Risk', level: 'low' };
  if (hbgi <= HBGI_THRESHOLDS.moderate) return { text: 'Moderate Risk', level: 'moderate' };
  return { text: 'High Risk', level: 'high' };
}

export function getJIndexInterpretation(jIndex: number): RiskInterpretation {
  if (jIndex < JINDEX_THRESHOLDS.excellent) return { text: 'Excellent', level: 'low' };
  if (jIndex <= JINDEX_THRESHOLDS.good) return { text: 'Good', level: 'low' };
  if (jIndex <= JINDEX_THRESHOLDS.fair) return { text: 'Fair', level: 'moderate' };
  return { text: 'Poor', level: 'high' };
}

/** Common props for TIR-related components */
// Note: This interface is available for future use when components need to share these common props
export interface TIRComponentProps {
  categoryMode: RangeCategoryMode;
  glucoseUnit: GlucoseUnit;
}
