/**
 * Utility functions for glucose range analysis
 * 
 * This file maintains backward compatibility by re-exporting all functions from the split modules.
 * The implementation has been split into smaller, focused modules:
 * - glucoseRangeCoreUtils: Core categorization, stats, and constants
 * - glucoseRangeGroupingUtils: Date/time grouping functions
 * - glucoseRangeTIRUtils: Time In Range (TIR) calculations
 * - glucoseRangeMetricsUtils: Advanced metrics (HbA1c, CV, BGRI, etc.)
 */

// Re-export everything from core utils
export * from './glucoseRangeCoreUtils';

// Re-export everything from grouping utils
export * from './glucoseRangeGroupingUtils';

// Re-export everything from TIR utils
export * from './glucoseRangeTIRUtils';

// Re-export everything from metrics utils
export * from './glucoseRangeMetricsUtils';
