/**
 * Utility functions for calculating Insulin On Board (IOB)
 * 
 * IOB represents the amount of active insulin still working in the body.
 * This uses an exponential decay model based on the insulin duration setting.
 */

import type { InsulinReading } from '../../types';

/**
 * IOB data point for a specific time
 */
export interface IOBDataPoint {
  time: Date;           // Timestamp of the data point
  timeLabel: string;    // Formatted time label (HH:MM)
  basalIOB: number;     // IOB from basal insulin in units
  bolusIOB: number;     // IOB from bolus insulin in units
  totalIOB: number;     // Total IOB in units
}

/**
 * Calculate the remaining active insulin at a given time using exponential decay
 * 
 * The insulin activity curve follows an exponential decay model:
 * - Peak activity occurs shortly after administration
 * - Activity decreases exponentially over time
 * - Duration parameter controls how long insulin remains active
 * 
 * @param dose - The insulin dose in units
 * @param timeSinceAdministration - Time elapsed since dose administration (in hours)
 * @param insulinDuration - Total duration of insulin action (in hours)
 * @returns Amount of active insulin remaining (in units)
 */
function calculateActiveInsulin(
  dose: number,
  timeSinceAdministration: number,
  insulinDuration: number
): number {
  // If time exceeds duration, no insulin is active
  if (timeSinceAdministration >= insulinDuration) {
    return 0;
  }

  // If time is negative (reading in the future), no insulin is active
  if (timeSinceAdministration < 0) {
    return 0;
  }

  // Exponential decay model
  // Formula: dose * e^(-k * t) where k is the decay constant
  // k = ln(2) / half-life, we use half-life as duration/2 for a reasonable model
  const halfLife = insulinDuration / 2;
  const decayConstant = Math.LN2 / halfLife;
  const activeInsulin = dose * Math.exp(-decayConstant * timeSinceAdministration);

  return activeInsulin;
}

/**
 * Calculate IOB for a specific date and time
 * 
 * @param insulinReadings - Array of all insulin readings
 * @param currentTime - The time to calculate IOB for
 * @param insulinDuration - Duration of insulin action in hours
 * @returns IOB breakdown by type
 */
export function calculateIOBAtTime(
  insulinReadings: InsulinReading[],
  currentTime: Date,
  insulinDuration: number
): { basalIOB: number; bolusIOB: number; totalIOB: number } {
  let basalIOB = 0;
  let bolusIOB = 0;

  // Look back at all insulin readings within the insulin duration window
  const lookbackTime = new Date(currentTime.getTime() - insulinDuration * 60 * 60 * 1000);

  for (const reading of insulinReadings) {
    // Skip readings outside the lookback window
    if (reading.timestamp < lookbackTime || reading.timestamp > currentTime) {
      continue;
    }

    // Calculate time since this dose was administered (in hours)
    const timeSinceAdministration = (currentTime.getTime() - reading.timestamp.getTime()) / (1000 * 60 * 60);

    // Calculate active insulin for this dose
    const activeInsulin = calculateActiveInsulin(reading.dose, timeSinceAdministration, insulinDuration);

    // Add to the appropriate category
    if (reading.insulinType === 'basal') {
      basalIOB += activeInsulin;
    } else {
      bolusIOB += activeInsulin;
    }
  }

  return {
    basalIOB: Math.round(basalIOB * 100) / 100, // Round to 2 decimal places
    bolusIOB: Math.round(bolusIOB * 100) / 100,
    totalIOB: Math.round((basalIOB + bolusIOB) * 100) / 100,
  };
}

/**
 * Generate IOB data points for a full day (24 hours)
 * 
 * @param insulinReadings - Array of all insulin readings
 * @param date - Date to generate IOB data for (YYYY-MM-DD format)
 * @param insulinDuration - Duration of insulin action in hours
 * @param intervalMinutes - Time interval between data points (default 15 minutes)
 * @returns Array of IOB data points for the day
 */
export function calculateDailyIOB(
  insulinReadings: InsulinReading[],
  date: string,
  insulinDuration: number,
  intervalMinutes: number = 15
): IOBDataPoint[] {
  const dataPoints: IOBDataPoint[] = [];
  
  // Parse the date string
  const [year, month, day] = date.split('-').map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  // Filter readings relevant to this day plus lookback period
  const lookbackHours = insulinDuration;
  const lookbackStart = new Date(startOfDay.getTime() - lookbackHours * 60 * 60 * 1000);
  const relevantReadings = insulinReadings.filter(
    reading => reading.timestamp >= lookbackStart && reading.timestamp <= endOfDay
  );

  // Generate data points at regular intervals
  const totalMinutes = 24 * 60; // 1440 minutes in a day
  const numberOfPoints = Math.floor(totalMinutes / intervalMinutes);

  for (let i = 0; i <= numberOfPoints; i++) {
    const minutesFromStart = i * intervalMinutes;
    const currentTime = new Date(startOfDay.getTime() + minutesFromStart * 60 * 1000);

    // Calculate IOB at this time
    const { basalIOB, bolusIOB, totalIOB } = calculateIOBAtTime(
      relevantReadings,
      currentTime,
      insulinDuration
    );

    // Format time label
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    dataPoints.push({
      time: currentTime,
      timeLabel,
      basalIOB,
      bolusIOB,
      totalIOB,
    });
  }

  return dataPoints;
}
