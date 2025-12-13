/**
 * Types for AI Analysis page components
 */

import type { 
  UploadedFile, 
  AIAnalysisResult, 
  DailyReport, 
  GlucoseReading, 
  InsulinReading, 
  GlucoseUnit, 
  GlucoseRangeStats 
} from '../../types';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api';
import type { HypoAnalysisDatasets } from '../../utils/data';

/** Props for the main AIAnalysis component */
export interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepseekApiKey: string;
  selectedProvider: AIProvider | null;
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  showGeekStats: boolean;
  existingAnalysis?: AIAnalysisResult;
  onAnalysisComplete: (fileId: string, response: string, inRangePercentage: number) => void;
  /** Whether the current user is a Pro user (for backend AI access) */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}

/** State for a single AI analysis prompt */
export interface AnalysisState {
  analyzing: boolean;
  response: string | null;
  error: string | null;
  cooldownActive: boolean;
  cooldownSeconds: number;
  ready: boolean;
  retryInfo?: string | null;
}

/** Initial state for analysis */
export const initialAnalysisState: AnalysisState = {
  analyzing: false,
  response: null,
  error: null,
  cooldownActive: false,
  cooldownSeconds: 0,
  ready: false,
  retryInfo: null,
};

/** Datasets for meal timing analysis */
export interface MealTimingDatasets {
  cgmReadings: GlucoseReading[];
  bolusReadings: InsulinReading[];
  basalReadings: InsulinReading[];
}

/** Common props for tab content components */
export interface TabContentProps {
  loading: boolean;
  hasApiKey: boolean;
  activeProvider: AIProvider | null;
  showGeekStats: boolean;
}

/** Props for Time in Range tab */
export interface TimeInRangeTabProps extends TabContentProps {
  inRangePercentage: number | null;
  glucoseStats: GlucoseRangeStats | null;
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  selectedFile?: UploadedFile;
  onAnalysisComplete: (fileId: string, response: string, inRangePercentage: number) => void;
  existingAnalysis?: AIAnalysisResult;
  /** Whether the current user is a Pro user */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}

/** Props for Glucose & Insulin tab */
export interface GlucoseInsulinTabProps extends TabContentProps {
  combinedDataset: DailyReport[];
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  /** Whether the current user is a Pro user */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}

/** Props for Meal Timing tab */
export interface MealTimingTabProps extends TabContentProps {
  mealTimingDatasets: MealTimingDatasets;
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  /** Whether the current user is a Pro user */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}

/** Props for Pump Settings tab */
export interface PumpSettingsTabProps extends TabContentProps {
  mealTimingDatasets: MealTimingDatasets;
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepseekApiKey: string;
  /** Whether the current user is a Pro user */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}

/** Props for Hypos tab */
export interface HyposTabProps extends TabContentProps {
  hypoDatasets: HypoAnalysisDatasets | null;
  responseLanguage: ResponseLanguage;
  glucoseUnit: GlucoseUnit;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepseekApiKey: string;
  /** Whether the current user is a Pro user */
  isProUser?: boolean;
  /** ID token for Pro user backend API authentication */
  idToken?: string | null;
}
