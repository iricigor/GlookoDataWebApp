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
 * Parsed metadata from CSV file header
 */
export interface ParsedMetadata {
  name?: string;
  dateRange?: string;
  [key: string]: string | undefined; // Allow additional metadata fields
}

/**
 * ZIP file validation result
 */
export interface ZipMetadata {
  isValid: boolean;
  csvFiles: CsvFileMetadata[];
  error?: string;
  metadataLine?: string;
  parsedMetadata?: ParsedMetadata;
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
