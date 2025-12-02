/**
 * Utility functions for extracting detailed hypoglycemia event data for AI analysis
 * on the Reports page (daily view).
 * 
 * This module provides functions to extract comprehensive per-event data following
 * the schema defined in the feature request:
 * - Core event identification and summary
 * - Dynamics (rate of change, time to nadir)
 * - Bolus context (last 2 boluses before event)
 * - Basal context (hourly basal units)
 * - Context (time of day)
 * - CGM curve data (readings at specific time points)
 */

import type { GlucoseReading, GlucoseThresholds, InsulinReading } from '../../types';
import { calculateHypoStats } from './hypoDataUtils';
import { mmolToMgdl } from './glucoseUnitUtils';
import { convertToDelimitedFormat } from './csvUtils';

/**
 * Detailed hypo event data for AI analysis
 * Based on the schema from the feature request
 */
export interface DetailedHypoEvent {
  // CORE - Identification and Event Summary
  eventId: string;                    // Unique identifier (e.g., E-001)
  startTime: Date;                    // Exact moment glucose dropped below threshold
  nadirValueMgdl: number;             // Lowest glucose value in mg/dL
  durationMins: number;               // Total time below threshold in minutes
  
  // DYNAMICS - Speed and Severity
  maxRoCMgdlMin: number | null;       // Steepest 5-min rate of drop in 60 mins before
  timeToNadirMins: number;            // Time from start to nadir
  initialRoCMgdlMin: number | null;   // Rate of change in last 10 mins before start
  
  // BOLUS - Last 2 boluses before event
  lastBolusUnits: number | null;      // Most recent bolus dose
  lastBolusMinsPrior: number | null;  // Minutes from last bolus to start
  secondBolusUnits: number | null;    // Second-most recent bolus
  secondBolusMinsPrior: number | null;// Minutes from second bolus to start
  
  // BASAL - Hourly totals before event
  programmedBasalUhr: number | null;  // Standard basal rate for the hour
  basalUnitsH5Prior: number | null;   // Total basal in 5th hour before
  basalUnitsH3Prior: number | null;   // Total basal in 3rd hour before
  basalUnitsH1Prior: number | null;   // Total basal in 1st hour before
  
  // CONTEXT
  timeOfDayCode: number;              // Hour of day (0-23)
  
  // CGM CURVE - Readings at specific times
  gTMinus60: number | null;           // Glucose 60 mins before start
  gTMinus30: number | null;           // Glucose 30 mins before start
  gTMinus10: number | null;           // Glucose 10 mins before start
  gNadirPlus15: number | null;        // Glucose 15 mins after nadir
}

/**
 * Response from AI for a single day's hypo analysis
 */
export interface DailyHypoAIResponse {
  date: string;                       // YYYY-MM-DD format
  eventAnalyses: EventAnalysis[];     // Analysis for each event on this day
}

/**
 * AI analysis for a single hypo event
 */
export interface EventAnalysis {
  date?: string;                      // YYYY-MM-DD format (included in JSON response)
  eventTime: string;                  // HH:MM format
  nadirValue: string;                 // X mg/dL
  primarySuspect: string;             // Category of suspected cause
  deductedMealTime: string | null;    // Approximate meal time or null
  actionableInsight: string;          // Specific recommendation
}

/**
 * Raw JSON response item from AI
 */
interface AIResponseItem {
  date: string;
  eventTime: string;
  nadirValue: string;
  primarySuspect: string;
  deductedMealTime: string | null;
  actionableInsight: string;
}

/**
 * Find the closest glucose reading to a target time within a window
 */
function findClosestReading(
  readings: GlucoseReading[],
  targetTime: Date,
  maxDiffMs: number = 5 * 60 * 1000 // 5 minutes default
): GlucoseReading | null {
  let closest: GlucoseReading | null = null;
  let minDiff = Infinity;
  
  for (const reading of readings) {
    const diff = Math.abs(reading.timestamp.getTime() - targetTime.getTime());
    if (diff < minDiff && diff <= maxDiffMs) {
      minDiff = diff;
      closest = reading;
    }
  }
  
  return closest;
}

/**
 * Calculate the steepest 5-minute rate of glucose drop in the 60 minutes before event
 */
function calculateMaxRateOfChange(
  readings: GlucoseReading[],
  eventStartTime: Date
): number | null {
  const windowStart = new Date(eventStartTime.getTime() - 60 * 60 * 1000); // 60 mins before
  
  // Filter readings in the window and sort by time
  const windowReadings = readings
    .filter(r => r.timestamp >= windowStart && r.timestamp <= eventStartTime)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  if (windowReadings.length < 2) return null;
  
  let maxDropRate = 0;
  
  for (let i = 0; i < windowReadings.length - 1; i++) {
    for (let j = i + 1; j < windowReadings.length; j++) {
      const timeDiffMs = windowReadings[j].timestamp.getTime() - windowReadings[i].timestamp.getTime();
      const timeDiffMins = timeDiffMs / (60 * 1000);
      
      // Only consider pairs roughly 5 minutes apart
      if (timeDiffMins >= 4 && timeDiffMins <= 6) {
        const glucoseDrop = windowReadings[i].value - windowReadings[j].value; // positive = dropping
        const rate = glucoseDrop / timeDiffMins; // mmol/L per min
        const rateMgdl = mmolToMgdl(rate); // Convert to mg/dL per min
        
        if (rateMgdl > maxDropRate) {
          maxDropRate = rateMgdl;
        }
      }
    }
  }
  
  return maxDropRate > 0 ? Math.round(maxDropRate * 100) / 100 : null;
}

/**
 * Calculate the rate of change in the last 10 minutes before event start
 */
function calculateInitialRateOfChange(
  readings: GlucoseReading[],
  eventStartTime: Date
): number | null {
  const windowStart = new Date(eventStartTime.getTime() - 15 * 60 * 1000); // 15 mins before
  const windowEnd = new Date(eventStartTime.getTime() - 5 * 60 * 1000); // 5 mins before
  
  // Find reading at ~10 mins before
  const startReading = findClosestReading(readings, windowStart, 5 * 60 * 1000);
  const endReading = findClosestReading(readings, windowEnd, 5 * 60 * 1000);
  
  if (!startReading || !endReading) return null;
  
  const timeDiffMins = (endReading.timestamp.getTime() - startReading.timestamp.getTime()) / (60 * 1000);
  if (timeDiffMins === 0) return null;
  
  const glucoseDrop = startReading.value - endReading.value;
  const rateMmol = glucoseDrop / timeDiffMins;
  return Math.round(mmolToMgdl(rateMmol) * 100) / 100;
}

/**
 * Find boluses before an event within a time window
 */
function findBolusesBefore(
  bolusReadings: InsulinReading[],
  eventStartTime: Date,
  maxHoursBefore: number = 6
): { bolus: InsulinReading; minutesBefore: number }[] {
  const windowStart = new Date(eventStartTime.getTime() - maxHoursBefore * 60 * 60 * 1000);
  
  return bolusReadings
    .filter(b => b.timestamp >= windowStart && b.timestamp < eventStartTime)
    .map(b => ({
      bolus: b,
      minutesBefore: Math.round((eventStartTime.getTime() - b.timestamp.getTime()) / (60 * 1000))
    }))
    .sort((a, b) => a.minutesBefore - b.minutesBefore); // Sort by most recent first
}

/**
 * Calculate total basal units delivered in a specific hour window before event
 */
function calculateBasalInHour(
  basalReadings: InsulinReading[],
  eventStartTime: Date,
  hoursBefore: number
): number | null {
  const hourStart = new Date(eventStartTime.getTime() - (hoursBefore * 60 * 60 * 1000));
  const hourEnd = new Date(eventStartTime.getTime() - ((hoursBefore - 1) * 60 * 60 * 1000));
  
  const hourBasal = basalReadings
    .filter(b => b.timestamp >= hourStart && b.timestamp < hourEnd)
    .reduce((sum, b) => sum + b.dose, 0);
  
  return hourBasal > 0 ? Math.round(hourBasal * 100) / 100 : null;
}

/**
 * Get glucose reading at a specific time offset from event
 */
function getGlucoseAtOffset(
  readings: GlucoseReading[],
  referenceTime: Date,
  offsetMinutes: number
): number | null {
  const targetTime = new Date(referenceTime.getTime() + offsetMinutes * 60 * 1000);
  const reading = findClosestReading(readings, targetTime, 5 * 60 * 1000); // 5 min tolerance
  
  if (reading) {
    return Math.round(mmolToMgdl(reading.value));
  }
  return null;
}

/**
 * Extract detailed hypo event data for a single day
 */
export function extractDetailedHypoEvents(
  glucoseReadings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  bolusReadings: InsulinReading[] = [],
  basalReadings: InsulinReading[] = [],
  dateFilter?: string
): DetailedHypoEvent[] {
  // Sort readings by timestamp
  const sortedReadings = [...glucoseReadings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate hypo stats to get detected periods
  const hypoStats = calculateHypoStats(sortedReadings, thresholds);
  
  if (hypoStats.hypoPeriods.length === 0) {
    return [];
  }
  
  // Filter by date if specified
  let periods = hypoStats.hypoPeriods;
  if (dateFilter) {
    periods = periods.filter(p => {
      const dateStr = p.startTime.toISOString().split('T')[0];
      return dateStr === dateFilter;
    });
  }
  
  const detailedEvents: DetailedHypoEvent[] = [];
  
  periods.forEach((period, index) => {
    const eventId = `E-${String(index + 1).padStart(3, '0')}`;
    
    // Find boluses before event
    const boluses = findBolusesBefore(bolusReadings, period.startTime, 6);
    const lastBolus = boluses.length > 0 ? boluses[0] : null;
    const secondBolus = boluses.length > 1 ? boluses[1] : null;
    
    // Calculate basal in specific hours
    const basalH1 = calculateBasalInHour(basalReadings, period.startTime, 1);
    const basalH3 = calculateBasalInHour(basalReadings, period.startTime, 3);
    const basalH5 = calculateBasalInHour(basalReadings, period.startTime, 5);
    
    // Get programmed basal rate (using H1 as proxy)
    const programmedBasal = basalH1;
    
    const event: DetailedHypoEvent = {
      // CORE
      eventId,
      startTime: period.startTime,
      nadirValueMgdl: Math.round(mmolToMgdl(period.nadir)),
      durationMins: Math.round(period.durationMinutes),
      
      // DYNAMICS
      maxRoCMgdlMin: calculateMaxRateOfChange(sortedReadings, period.startTime),
      timeToNadirMins: Math.round(
        (period.nadirTime.getTime() - period.startTime.getTime()) / (60 * 1000)
      ),
      initialRoCMgdlMin: calculateInitialRateOfChange(sortedReadings, period.startTime),
      
      // BOLUS
      lastBolusUnits: lastBolus ? Math.round(lastBolus.bolus.dose * 10) / 10 : null,
      lastBolusMinsPrior: lastBolus ? lastBolus.minutesBefore : null,
      secondBolusUnits: secondBolus ? Math.round(secondBolus.bolus.dose * 10) / 10 : null,
      secondBolusMinsPrior: secondBolus ? secondBolus.minutesBefore : null,
      
      // BASAL
      programmedBasalUhr: programmedBasal,
      basalUnitsH5Prior: basalH5,
      basalUnitsH3Prior: basalH3,
      basalUnitsH1Prior: basalH1,
      
      // CONTEXT
      timeOfDayCode: period.startTime.getHours(),
      
      // CGM CURVE
      gTMinus60: getGlucoseAtOffset(sortedReadings, period.startTime, -60),
      gTMinus30: getGlucoseAtOffset(sortedReadings, period.startTime, -30),
      gTMinus10: getGlucoseAtOffset(sortedReadings, period.startTime, -10),
      gNadirPlus15: getGlucoseAtOffset(sortedReadings, period.nadirTime, 15),
    };
    
    detailedEvents.push(event);
  });
  
  return detailedEvents;
}

/**
 * Convert detailed hypo events to CSV format for AI prompts
 */
export function convertDetailedHypoEventsToCSV(events: DetailedHypoEvent[]): string {
  if (events.length === 0) {
    return '';
  }
  
  const headers = [
    'Event_ID',
    'Start_Time',
    'Nadir_Value_mg_dL',
    'Duration_Mins',
    'Max_RoC_mg_dL_min',
    'Time_To_Nadir_Mins',
    'Initial_RoC_mg_dL_min',
    'Last_Bolus_Units',
    'Last_Bolus_Mins_Prior',
    'Second_Bolus_Units',
    'Second_Bolus_Mins_Prior',
    'Programmed_Basal_U_hr',
    'Basal_Units_H5_Prior',
    'Basal_Units_H3_Prior',
    'Basal_Units_H1_Prior',
    'Time_of_Day_Code',
    'G_T_Minus_60',
    'G_T_Minus_30',
    'G_T_Minus_10',
    'G_Nadir_Plus_15',
  ];
  
  const rows: (string | number)[][] = [headers];
  
  events.forEach(event => {
    rows.push([
      event.eventId,
      event.startTime.toISOString(),
      event.nadirValueMgdl,
      event.durationMins,
      event.maxRoCMgdlMin ?? 'N/A',
      event.timeToNadirMins,
      event.initialRoCMgdlMin ?? 'N/A',
      event.lastBolusUnits ?? 'N/A',
      event.lastBolusMinsPrior ?? 'N/A',
      event.secondBolusUnits ?? 'N/A',
      event.secondBolusMinsPrior ?? 'N/A',
      event.programmedBasalUhr ?? 'N/A',
      event.basalUnitsH5Prior ?? 'N/A',
      event.basalUnitsH3Prior ?? 'N/A',
      event.basalUnitsH1Prior ?? 'N/A',
      event.timeOfDayCode,
      event.gTMinus60 ?? 'N/A',
      event.gTMinus30 ?? 'N/A',
      event.gTMinus10 ?? 'N/A',
      event.gNadirPlus15 ?? 'N/A',
    ]);
  });
  
  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Get count of hypo events for a specific date
 */
export function getHypoEventCountForDate(
  glucoseReadings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  date: string
): number {
  const sortedReadings = [...glucoseReadings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  const hypoStats = calculateHypoStats(sortedReadings, thresholds);
  
  return hypoStats.hypoPeriods.filter(p => {
    const dateStr = p.startTime.toISOString().split('T')[0];
    return dateStr === date;
  }).length;
}

/**
 * Check if there are any hypo events for a specific date
 */
export function hasHypoEventsForDate(
  glucoseReadings: GlucoseReading[],
  thresholds: GlucoseThresholds,
  date: string
): boolean {
  return getHypoEventCountForDate(glucoseReadings, thresholds, date) > 0;
}

/**
 * Parse AI response to extract per-event analysis
 * Returns a map of date -> event analyses
 * 
 * Attempts JSON parsing first (preferred), falls back to markdown table regex if JSON fails
 */
export function parseHypoAIResponseByDate(response: string): Map<string, EventAnalysis[]> {
  // Try JSON parsing first (preferred method)
  const jsonResult = tryParseJsonResponse(response);
  if (jsonResult.size > 0) {
    return jsonResult;
  }
  
  // Fallback to markdown table regex parsing
  return parseMarkdownTableResponse(response);
}

/**
 * Validate that an item has all required fields for EventAnalysis
 */
function isValidAIResponseItem(item: unknown): item is AIResponseItem {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.date === 'string' &&
    typeof obj.eventTime === 'string' &&
    typeof obj.nadirValue === 'string' &&
    typeof obj.primarySuspect === 'string' &&
    (obj.deductedMealTime === null || typeof obj.deductedMealTime === 'string') &&
    typeof obj.actionableInsight === 'string'
  );
}

/**
 * Try to parse JSON response from AI
 * Returns a Map of date -> event analyses, or empty Map if parsing fails
 */
function tryParseJsonResponse(response: string): Map<string, EventAnalysis[]> {
  const result = new Map<string, EventAnalysis[]>();
  
  // Look for JSON array in markdown code block
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const match = jsonBlockRegex.exec(response);
  
  if (!match) {
    // Also try to find raw JSON array without code block
    const rawJsonRegex = /\[\s*\{[\s\S]*?\}\s*\]/;
    const rawMatch = rawJsonRegex.exec(response);
    if (!rawMatch) {
      return result;
    }
    return parseJsonArray(rawMatch[0], result);
  }
  
  return parseJsonArray(match[1].trim(), result);
}

/**
 * Parse JSON array string and populate the result map
 */
function parseJsonArray(jsonString: string, result: Map<string, EventAnalysis[]>): Map<string, EventAnalysis[]> {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      return result;
    }
    
    for (const item of parsed) {
      if (!isValidAIResponseItem(item)) {
        continue;
      }
      
      const analysis: EventAnalysis = {
        date: item.date,
        eventTime: item.eventTime,
        nadirValue: item.nadirValue,
        primarySuspect: item.primarySuspect,
        deductedMealTime: item.deductedMealTime,
        actionableInsight: item.actionableInsight,
      };
      
      if (!result.has(item.date)) {
        result.set(item.date, []);
      }
      result.get(item.date)!.push(analysis);
    }
  } catch {
    // JSON parsing failed, return empty result
    return result;
  }
  
  return result;
}

/**
 * Parse markdown table response (legacy fallback)
 * Returns a map of date -> event analyses
 */
function parseMarkdownTableResponse(response: string): Map<string, EventAnalysis[]> {
  const result = new Map<string, EventAnalysis[]>();
  
  // Look for markdown table with the expected columns
  // | Date | Event Time | Nadir Value | Primary Suspect | Deducted Meal Time | Actionable Insight |
  const tableRegex = /\|[\s]*(\d{4}-\d{2}-\d{2})[\s]*\|[\s]*(\d{1,2}:\d{2})[\s]*\|[\s]*([^|]+)[\s]*\|[\s]*([^|]+)[\s]*\|[\s]*([^|]+)[\s]*\|[\s]*([^|]+)[\s]*\|/g;
  
  let match;
  while ((match = tableRegex.exec(response)) !== null) {
    const date = match[1].trim();
    const eventTime = match[2].trim();
    const nadirValue = match[3].trim();
    const primarySuspect = match[4].trim();
    const mealTime = match[5].trim();
    const insight = match[6].trim();
    
    const analysis: EventAnalysis = {
      date,
      eventTime,
      nadirValue,
      primarySuspect,
      deductedMealTime: mealTime === 'N/A' ? null : mealTime,
      actionableInsight: insight,
    };
    
    if (!result.has(date)) {
      result.set(date, []);
    }
    result.get(date)!.push(analysis);
  }
  
  return result;
}
