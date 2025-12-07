/**
 * Common type definitions for the application
 * 
 * This file contains shared TypeScript types and interfaces
 * used across multiple components.
 */

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Glooko data entry (example structure)
 */
export interface GlookoDataEntry {
  id: string;
  timestamp: Date;
  bloodGlucose?: number;
  insulinDose?: number;
  carbsIntake?: number;
  notes?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Loading state type
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Parsed metadata fields from CSV metadata line
 */
export interface ParsedMetadata {
  name?: string;        // Patient/user name
  dateRange?: string;   // Full date range string
  startDate?: string;   // Start date in YYYY-MM-DD format
  endDate?: string;     // End date in YYYY-MM-DD format
}

/**
 * CSV file metadata from ZIP
 */
export interface CsvFileMetadata {
  name: string;
  rowCount: number;
  columnNames?: string[];
  fileCount?: number; // Number of files merged (for grouped datasets)
  sourceFiles?: string[]; // Original file names (for grouped datasets)
  glucoseUnit?: GlucoseUnit | null; // Detected glucose unit for cgm/bg datasets
}

/**
 * ZIP file validation result
 */
export interface ZipMetadata {
  isValid: boolean;
  csvFiles: CsvFileMetadata[];
  error?: string;
  metadataLine?: string;
  parsedMetadata?: ParsedMetadata; // Parsed metadata fields
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadTime: Date;
  file: File;
  zipMetadata?: ZipMetadata;
  isPermanentlyCached?: boolean; // Whether file is saved in permanent browser cache
}

/**
 * Glucose unit type (mmol/L or mg/dL)
 */
export type GlucoseUnit = 'mmol/L' | 'mg/dL';

/**
 * Blood glucose thresholds (in mmol/L)
 */
export interface GlucoseThresholds {
  veryHigh: number;
  high: number;
  low: number;
  veryLow: number;
}

/**
 * Glucose data source type
 */
export type GlucoseDataSource = 'cgm' | 'bg';

/**
 * Glucose range category mode (3 or 5 categories)
 */
export type RangeCategoryMode = 3 | 5;

/**
 * Glucose range category for 3-category mode
 */
export type GlucoseRangeCategory3 = 'low' | 'inRange' | 'high';

/**
 * Glucose range category for 5-category mode
 */
export type GlucoseRangeCategory5 = 'veryLow' | 'low' | 'inRange' | 'high' | 'veryHigh';

/**
 * Glucose range statistics
 */
export interface GlucoseRangeStats {
  veryLow?: number;  // Count or percentage (only for 5-category mode)
  low: number;       // Count or percentage
  inRange: number;   // Count or percentage
  high: number;      // Count or percentage
  veryHigh?: number; // Count or percentage (only for 5-category mode)
  total: number;     // Total number of readings
}

/**
 * Day of week identifier
 */
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Workday' | 'Weekend';

/**
 * AGP day of week filter option (includes "All Days")
 */
export type AGPDayOfWeekFilter = 'All Days' | DayOfWeek;

/**
 * Glucose range report by day of week
 */
export interface DayOfWeekReport {
  day: DayOfWeek;
  stats: GlucoseRangeStats;
}

/**
 * Glucose range report by date
 */
export interface DailyReport {
  date: string; // YYYY-MM-DD format
  stats: GlucoseRangeStats;
  basalInsulin?: number; // Daily total basal dose in units
  bolusInsulin?: number; // Daily total bolus dose in units
  totalInsulin?: number; // Basal + Bolus in units
}

/**
 * Glucose range report by week
 */
export interface WeeklyReport {
  weekLabel: string; // e.g., "Oct 6-12"
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string;   // YYYY-MM-DD format
  stats: GlucoseRangeStats;
}

/**
 * Parsed insulin reading from CSV data
 */
export interface InsulinReading {
  timestamp: Date;
  dose: number;     // Dose in units
  insulinType: 'basal' | 'bolus'; // Type of insulin
}

/**
 * Daily insulin aggregation
 */
export interface DailyInsulinSummary {
  date: string;           // YYYY-MM-DD format
  basalTotal: number;     // Total basal dose in units
  bolusTotal: number;     // Total bolus dose in units
  totalInsulin: number;   // Basal + Bolus
}

/**
 * Hourly insulin data point for timeline chart
 */
export interface InsulinTimelineDataPoint {
  hour: number;           // Hour of day (0-23)
  timeLabel: string;      // Formatted time label (e.g., "00:00", "06:00")
  basalRate: number;      // Average basal rate for this hour in units
  bolusDoses: number[];   // All bolus doses during this hour
  bolusTotal: number;     // Total bolus for this hour in units
}

/**
 * Hourly IOB (Insulin On Board) data point
 */
export interface HourlyIOBData {
  hour: number;           // Hour of day (0-23)
  timeLabel: string;      // Formatted time label (e.g., "00:00", "06:00")
  basalInPreviousHour: number;  // Total basal insulin in previous hour (units)
  bolusInPreviousHour: number;  // Total bolus insulin in previous hour (units)
  activeIOB: number;      // Active IOB at this moment (units)
}

/**
 * Parsed glucose reading from CSV data
 */
export interface GlucoseReading {
  timestamp: Date;
  value: number; // Glucose value in mmol/L
}

/**
 * AGP (Ambulatory Glucose Profile) statistics for a 5-minute time period
 */
export interface AGPTimeSlotStats {
  timeSlot: string; // HH:MM format (e.g., "00:00", "00:05", "00:10")
  lowest: number;   // Minimum glucose value in mmol/L
  p10: number;      // 10th percentile in mmol/L
  p25: number;      // 25th percentile in mmol/L
  p50: number;      // 50th percentile (median) in mmol/L
  p75: number;      // 75th percentile in mmol/L
  p90: number;      // 90th percentile in mmol/L
  highest: number;  // Maximum glucose value in mmol/L
  count: number;    // Number of readings in this time slot
}

/**
 * AI analysis result for a file
 */
export interface AIAnalysisResult {
  fileId: string;
  response: string;
  timestamp: Date;
  inRangePercentage: number;
}

/**
 * Rate of Change (RoC) data point for glucose
 * Represents the speed of glucose change at a given time
 */
export interface RoCDataPoint {
  timestamp: Date;
  timeDecimal: number;    // Hour + minutes/60 for chart positioning
  timeLabel: string;      // Formatted time (e.g., "14:30")
  roc: number;            // Rate of change in mmol/L/min (absolute value)
  rocRaw: number;         // Original RoC value (can be negative)
  glucoseValue: number;   // Original glucose value in mmol/L
  color: string;          // Color based on RoC intensity (green to red)
  category: 'good' | 'medium' | 'bad';  // Medical category
}

/**
 * RoC statistics for a day
 */
export interface RoCStats {
  minRoC: number;         // Minimum absolute RoC (slowest change)
  maxRoC: number;         // Maximum absolute RoC (fastest change)
  sdRoC: number;          // Standard deviation of RoC
  goodPercentage: number; // Percentage of time with good (slow) RoC
  mediumPercentage: number; // Percentage of time with medium RoC
  badPercentage: number;  // Percentage of time with bad (fast) RoC
  goodCount: number;      // Count of good readings
  mediumCount: number;    // Count of medium readings
  badCount: number;       // Count of bad readings
  totalCount: number;     // Total readings
}

/**
 * Time in Range statistics for a specific time period
 */
export interface TimePeriodTIRStats {
  period: string;         // e.g., "90 days", "28 days", "7 days"
  days: number;           // Number of days in period
  stats: GlucoseRangeStats;
}

/**
 * Hourly Time in Range statistics (for 24-hour breakdown)
 */
export interface HourlyTIRStats {
  hour: number;           // Hour of day (0-23)
  hourLabel: string;      // Formatted hour label (e.g., "00:00", "06:00")
  stats: GlucoseRangeStats;
}

/**
 * User settings that are synced to cloud storage
 * 
 * These settings are saved to Azure Table Storage for logged-in users.
 * Format is compact JSON to minimize storage costs.
 */
export interface CloudUserSettings {
  /** Theme mode preference */
  themeMode: 'light' | 'dark' | 'system';
  /** Export format preference */
  exportFormat: 'csv' | 'tsv';
  /** AI response language preference */
  responseLanguage: 'english' | 'czech' | 'german' | 'serbian';
  /** Glucose unit preference */
  glucoseUnit: GlucoseUnit;
  /** Insulin duration for IOB calculations (hours) */
  insulinDuration: number;
  /** Glucose thresholds */
  glucoseThresholds: GlucoseThresholds;
}

/**
 * Complete user record stored in Azure Table Storage
 */
export interface UserSettingsRecord {
  /** User ID (object ID from Azure AD) */
  userId: string;
  /** User's email address (for reference only) */
  email: string;
  /** First login timestamp (ISO 8601) */
  firstLoginDate: string;
  /** Last login timestamp (ISO 8601) */
  lastLoginDate: string;
  /** Compact JSON settings data */
  settings: CloudUserSettings;
}
