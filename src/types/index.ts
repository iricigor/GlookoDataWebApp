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
}

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
}

/**
 * Parsed glucose reading from CSV data
 */
export interface GlucoseReading {
  timestamp: Date;
  value: number; // Glucose value in mg/dL
}
