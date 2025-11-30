/**
 * Utility functions for extracting hypoglycemia data for AI analysis
 * 
 * This module provides functions to:
 * 1. Extract CGM data around hypo events (+/-1 hour)
 * 2. Calculate daily hypo summaries with statistics
 * 3. Convert data to CSV format for AI prompts
 */

import type { GlucoseReading, GlucoseThresholds } from '../../types';
import { calculateHypoStats, type HypoPeriod } from './hypoDataUtils';
import { getUniqueDates, filterReadingsByDate, calculateLBGI } from './glucoseRangeUtils';
import { convertToDelimitedFormat } from './csvUtils';

/**
 * Time window in milliseconds for extracting CGM data around hypo events
 * Default: 1 hour before and 1 hour after
 */
const HYPO_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Represents CGM data surrounding a hypo event
 */
export interface HypoEventData {
  /** Unique identifier for the hypo event */
  eventId: number;
  /** The hypo period this data surrounds */
  hypoPeriod: HypoPeriod;
  /** CGM readings from 1 hour before to 1 hour after the hypo period */
  readings: HypoEventReading[];
}

/**
 * Represents a single CGM reading with context relative to hypo nadir
 */
export interface HypoEventReading {
  /** Original timestamp */
  timestamp: Date;
  /** Glucose value in mmol/L */
  value: number;
  /** Whether this reading is the nadir of the hypo period */
  isNadir: boolean;
  /** Minutes relative to the nadir (negative = before, positive = after) */
  minutesFromNadir: number;
  /** Event ID for grouping */
  eventId: number;
}

/**
 * Daily summary of hypoglycemia statistics
 */
export interface DailyHypoSummary {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of week (Monday, Tuesday, etc.) */
  dayOfWeek: string;
  /** Number of severe hypo events */
  severeCount: number;
  /** Number of non-severe hypo events */
  nonSevereCount: number;
  /** Total number of hypo events */
  totalCount: number;
  /** Lowest glucose value of the day (mmol/L), null if no hypos */
  lowestValue: number | null;
  /** Duration of longest hypo in minutes */
  longestDurationMinutes: number;
  /** Total time in hypo for the day in minutes */
  totalDurationMinutes: number;
  /** Low Blood Glucose Index for the day */
  lbgi: number;
}

/**
 * Complete hypo analysis datasets for AI
 */
export interface HypoAnalysisDatasets {
  /** CGM readings around each hypo event */
  hypoEvents: HypoEventData[];
  /** Daily summary statistics */
  dailySummaries: DailyHypoSummary[];
  /** Overall statistics across all data */
  overallStats: {
    totalDays: number;
    daysWithHypos: number;
    totalHypoEvents: number;
    totalSevereEvents: number;
    averageLBGI: number;
    daysWithLBGIAbove2_5: number;
    daysWithLBGIAbove5_0: number;
  };
}

/**
 * Extract CGM data surrounding hypo events
 * Returns readings from 1 hour before to 1 hour after each hypo period
 * 
 * @param allReadings - All glucose readings, sorted by timestamp
 * @param hypoPeriods - Detected hypo periods
 * @returns Array of hypo event data with surrounding CGM readings
 */
export function extractHypoEventData(
  allReadings: GlucoseReading[],
  hypoPeriods: HypoPeriod[]
): HypoEventData[] {
  if (allReadings.length === 0 || hypoPeriods.length === 0) {
    return [];
  }

  const events: HypoEventData[] = [];

  hypoPeriods.forEach((period, index) => {
    const eventId = index + 1;
    
    // Calculate time window (1 hour before start to 1 hour after end)
    const windowStart = new Date(period.startTime.getTime() - HYPO_WINDOW_MS);
    const windowEnd = new Date(period.endTime.getTime() + HYPO_WINDOW_MS);
    
    // Find readings within the window
    const windowReadings = allReadings.filter(
      r => r.timestamp >= windowStart && r.timestamp <= windowEnd
    );
    
    // Convert to HypoEventReading with context
    const readings: HypoEventReading[] = windowReadings.map(reading => {
      const minutesFromNadir = (reading.timestamp.getTime() - period.nadirTime.getTime()) / (1000 * 60);
      const isNadir = Math.abs(reading.timestamp.getTime() - period.nadirTime.getTime()) < 60000; // Within 1 minute
      
      return {
        timestamp: reading.timestamp,
        value: reading.value,
        isNadir,
        minutesFromNadir: Math.round(minutesFromNadir),
        eventId,
      };
    });
    
    events.push({
      eventId,
      hypoPeriod: period,
      readings,
    });
  });

  return events;
}

/**
 * Calculate daily hypo summaries from glucose readings
 * 
 * @param allReadings - All glucose readings, sorted by timestamp
 * @param thresholds - Glucose thresholds for hypo detection
 * @returns Array of daily hypo summaries
 */
export function calculateDailyHypoSummaries(
  allReadings: GlucoseReading[],
  thresholds: GlucoseThresholds
): DailyHypoSummary[] {
  if (allReadings.length === 0) {
    return [];
  }

  const uniqueDates = getUniqueDates(allReadings);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const summaries: DailyHypoSummary[] = [];

  uniqueDates.forEach(dateStr => {
    const dayReadings = filterReadingsByDate(allReadings, dateStr)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (dayReadings.length === 0) {
      return;
    }

    const hypoStats = calculateHypoStats(dayReadings, thresholds);
    const lbgiValue = calculateLBGI(dayReadings);
    const date = new Date(dateStr);
    const dayOfWeek = dayNames[date.getDay()];

    summaries.push({
      date: dateStr,
      dayOfWeek,
      severeCount: hypoStats.severeCount,
      nonSevereCount: hypoStats.nonSevereCount,
      totalCount: hypoStats.totalCount,
      lowestValue: hypoStats.lowestValue,
      longestDurationMinutes: hypoStats.longestDurationMinutes,
      totalDurationMinutes: hypoStats.totalDurationMinutes,
      lbgi: lbgiValue ?? 0,
    });
  });

  return summaries;
}

/**
 * Calculate overall statistics from daily summaries
 * 
 * @param dailySummaries - Array of daily hypo summaries
 * @returns Overall statistics object
 */
export function calculateOverallHypoStats(
  dailySummaries: DailyHypoSummary[]
): HypoAnalysisDatasets['overallStats'] {
  if (dailySummaries.length === 0) {
    return {
      totalDays: 0,
      daysWithHypos: 0,
      totalHypoEvents: 0,
      totalSevereEvents: 0,
      averageLBGI: 0,
      daysWithLBGIAbove2_5: 0,
      daysWithLBGIAbove5_0: 0,
    };
  }

  const totalDays = dailySummaries.length;
  const daysWithHypos = dailySummaries.filter(d => d.totalCount > 0).length;
  const totalHypoEvents = dailySummaries.reduce((sum, d) => sum + d.totalCount, 0);
  const totalSevereEvents = dailySummaries.reduce((sum, d) => sum + d.severeCount, 0);
  const averageLBGI = dailySummaries.reduce((sum, d) => sum + d.lbgi, 0) / totalDays;
  const daysWithLBGIAbove2_5 = dailySummaries.filter(d => d.lbgi > 2.5).length;
  const daysWithLBGIAbove5_0 = dailySummaries.filter(d => d.lbgi > 5.0).length;

  return {
    totalDays,
    daysWithHypos,
    totalHypoEvents,
    totalSevereEvents,
    averageLBGI: Math.round(averageLBGI * 100) / 100,
    daysWithLBGIAbove2_5,
    daysWithLBGIAbove5_0,
  };
}

/**
 * Extract complete hypo analysis datasets for AI
 * 
 * @param allReadings - All glucose readings, sorted by timestamp
 * @param thresholds - Glucose thresholds for hypo detection
 * @returns Complete hypo analysis datasets
 */
export function extractHypoAnalysisDatasets(
  allReadings: GlucoseReading[],
  thresholds: GlucoseThresholds
): HypoAnalysisDatasets {
  // Sort readings by timestamp
  const sortedReadings = [...allReadings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Calculate stats for all readings to get all hypo periods
  const overallHypoStats = calculateHypoStats(sortedReadings, thresholds);
  
  // Extract hypo event data with surrounding CGM readings
  const hypoEvents = extractHypoEventData(sortedReadings, overallHypoStats.hypoPeriods);
  
  // Calculate daily summaries
  const dailySummaries = calculateDailyHypoSummaries(sortedReadings, thresholds);
  
  // Calculate overall stats
  const overallStats = calculateOverallHypoStats(dailySummaries);

  return {
    hypoEvents,
    dailySummaries,
    overallStats,
  };
}

/**
 * Convert hypo event readings to CSV format for AI prompts
 * 
 * @param hypoEvents - Array of hypo events with surrounding CGM data
 * @returns CSV formatted string
 */
export function convertHypoEventsToCSV(hypoEvents: HypoEventData[]): string {
  if (!hypoEvents || hypoEvents.length === 0) {
    return '';
  }

  const headers = [
    'Event ID',
    'Timestamp',
    'CGM Glucose Value (mmol/L)',
    'Is Nadir',
    'Minutes From Nadir',
  ];

  const rows: (string | number)[][] = [headers];

  hypoEvents.forEach(event => {
    event.readings.forEach(reading => {
      rows.push([
        reading.eventId,
        reading.timestamp.toISOString(),
        reading.value.toFixed(1),
        reading.isNadir ? 'true' : 'false',
        reading.minutesFromNadir,
      ]);
    });
  });

  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Convert daily hypo summaries to CSV format for AI prompts
 * 
 * @param summaries - Array of daily hypo summaries
 * @returns CSV formatted string
 */
export function convertHypoSummariesToCSV(summaries: DailyHypoSummary[]): string {
  if (!summaries || summaries.length === 0) {
    return '';
  }

  const headers = [
    'Date',
    'Day Of Week',
    'Severe Count',
    'Non-Severe Count',
    'Total Count',
    'Lowest Value (mmol/L)',
    'Longest Duration (min)',
    'Total Duration (min)',
    'LBGI',
  ];

  const rows: (string | number)[][] = [headers];

  summaries.forEach(summary => {
    rows.push([
      summary.date,
      summary.dayOfWeek,
      summary.severeCount,
      summary.nonSevereCount,
      summary.totalCount,
      summary.lowestValue !== null ? summary.lowestValue.toFixed(1) : 'N/A',
      Math.round(summary.longestDurationMinutes),
      Math.round(summary.totalDurationMinutes),
      summary.lbgi.toFixed(2),
    ]);
  });

  return convertToDelimitedFormat(rows, 'csv');
}
