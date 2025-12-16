/**
 * Unit tests for glucose range utilities
 * 
 * This file maintains backward compatibility by re-importing and re-testing from the split modules.
 * The tests have been split into smaller, focused test files:
 * - glucoseRangeCoreUtils.test.ts: Tests for core categorization and stats
 * - glucoseRangeGroupingUtils.test.ts: Tests for grouping functions
 * - glucoseRangeTIRUtils.test.ts: Tests for TIR calculations
 * - glucoseRangeMetricsUtils.test.ts: Tests for advanced metrics
 * 
 * This file ensures all exports from glucoseRangeUtils still work correctly.
 */

import { describe, it, expect } from 'vitest';
import * as glucoseRangeUtils from './glucoseRangeUtils';

describe('glucoseRangeUtils - Backward Compatibility', () => {
  it('should export all functions from core utils', () => {
    expect(glucoseRangeUtils.categorizeGlucose).toBeDefined();
    expect(glucoseRangeUtils.calculateGlucoseRangeStats).toBeDefined();
    expect(glucoseRangeUtils.calculatePercentage).toBeDefined();
    expect(glucoseRangeUtils.convertPercentageToTime).toBeDefined();
  });

  it('should export all constants from core utils', () => {
    expect(glucoseRangeUtils.GLUCOSE_RANGE_COLORS).toBeDefined();
    expect(glucoseRangeUtils.FLUX_GRADE_COLORS).toBeDefined();
    expect(glucoseRangeUtils.MS_PER_DAY).toBeDefined();
  });

  it('should export all functions from grouping utils', () => {
    expect(glucoseRangeUtils.getDayOfWeek).toBeDefined();
    expect(glucoseRangeUtils.isWorkday).toBeDefined();
    expect(glucoseRangeUtils.groupByDayOfWeek).toBeDefined();
    expect(glucoseRangeUtils.formatDate).toBeDefined();
    expect(glucoseRangeUtils.groupByDate).toBeDefined();
    expect(glucoseRangeUtils.groupByWeek).toBeDefined();
    expect(glucoseRangeUtils.filterReadingsToLastNDays).toBeDefined();
  });

  it('should export all functions from TIR utils', () => {
    expect(glucoseRangeUtils.calculateTIRByTimePeriods).toBeDefined();
    expect(glucoseRangeUtils.calculateHourlyTIR).toBeDefined();
    expect(glucoseRangeUtils.calculateHourlyTIRGrouped).toBeDefined();
  });

  it('should export all functions from metrics utils', () => {
    expect(glucoseRangeUtils.calculateAverageGlucose).toBeDefined();
    expect(glucoseRangeUtils.calculateEstimatedHbA1c).toBeDefined();
    expect(glucoseRangeUtils.convertHbA1cToMmolMol).toBeDefined();
    expect(glucoseRangeUtils.calculateDaysWithData).toBeDefined();
    expect(glucoseRangeUtils.calculateCV).toBeDefined();
    expect(glucoseRangeUtils.calculateBGRI).toBeDefined();
    expect(glucoseRangeUtils.calculateJIndex).toBeDefined();
    expect(glucoseRangeUtils.calculateMedianGlucose).toBeDefined();
    expect(glucoseRangeUtils.calculateQuartiles).toBeDefined();
    expect(glucoseRangeUtils.countHighLowIncidents).toBeDefined();
    expect(glucoseRangeUtils.countUnicorns).toBeDefined();
    expect(glucoseRangeUtils.calculateFlux).toBeDefined();
    expect(glucoseRangeUtils.calculateWakeupAverage).toBeDefined();
    expect(glucoseRangeUtils.calculateBedtimeAverage).toBeDefined();
  });

  it('should export all constants from metrics utils', () => {
    expect(glucoseRangeUtils.MIN_DAYS_FOR_RELIABLE_HBA1C).toBeDefined();
    expect(glucoseRangeUtils.CV_TARGET_THRESHOLD).toBeDefined();
  });
});
