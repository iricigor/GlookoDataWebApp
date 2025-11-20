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
  basalAmount: number;  // Total basal insulin delivered in this hour
  bolusAmount: number;  // Total bolus insulin delivered in this hour
}

/**
 * Calculate the remaining active insulin at a given time using linear decay
 * 
 * The insulin activity curve follows a linear decay model:
 * - Insulin activity decreases linearly over time
 * - After the duration, no insulin is active
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

  // Linear decay model
  // Formula: dose * (1 - t / duration)
  // This gives a straight line from dose at t=0 to 0 at t=duration
  const activeInsulin = dose * (1 - timeSinceAdministration / insulinDuration);

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

  // Separate basal and bolus readings
  const basalReadings = insulinReadings.filter(r => 
    r.insulinType === 'basal' && 
    r.timestamp >= lookbackTime && 
    r.timestamp <= currentTime
  );
  
  const bolusReadings = insulinReadings.filter(r => 
    r.insulinType === 'bolus' && 
    r.timestamp >= lookbackTime && 
    r.timestamp <= currentTime
  );

  // Calculate basal IOB: sum total basal delivered in the window, then apply decay to the total
  // This treats continuous basal as a single effective dose rather than many micro-doses
  const totalBasalDelivered = basalReadings.reduce((sum, r) => sum + r.dose, 0);
  if (totalBasalDelivered > 0) {
    // Use average time for the basal readings
    const avgBasalTime = basalReadings.reduce((sum, r) => sum + r.timestamp.getTime(), 0) / basalReadings.length;
    const timeSinceAvg = (currentTime.getTime() - avgBasalTime) / (1000 * 60 * 60);
    basalIOB = calculateActiveInsulin(totalBasalDelivered, timeSinceAvg, insulinDuration);
  }

  // Calculate bolus IOB using linear decay for each discrete dose
  for (const reading of bolusReadings) {
    const timeSinceAdministration = (currentTime.getTime() - reading.timestamp.getTime()) / (1000 * 60 * 60);
    const activeInsulin = calculateActiveInsulin(reading.dose, timeSinceAdministration, insulinDuration);
    bolusIOB += activeInsulin;
  }

  return {
    basalIOB: Math.round(basalIOB * 100) / 100, // Round to 2 decimal places
    bolusIOB: Math.round(bolusIOB * 100) / 100,
    totalIOB: Math.round((basalIOB + bolusIOB) * 100) / 100,
  };
}

/**
 * Generate IOB data points for a full day (24 hours) with hourly aggregation
 * 
 * @param insulinReadings - Array of all insulin readings
 * @param date - Date to generate IOB data for (YYYY-MM-DD format)
 * @param insulinDuration - Duration of insulin action in hours
 * @returns Array of IOB data points for each hour of the day
 */
export function calculateDailyIOB(
  insulinReadings: InsulinReading[],
  date: string,
  insulinDuration: number
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

  // Generate data points for each hour (24 data points)
  for (let hour = 0; hour < 24; hour++) {
    const hourStart = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    // Calculate insulin amounts added during this hour
    const hourReadings = relevantReadings.filter(
      r => r.timestamp >= hourStart && r.timestamp < hourEnd
    );
    
    // Calculate basal amount: use average rate (like Detailed Insulin page)
    // This represents the basal delivery rate in U/hr
    const basalReadings = hourReadings.filter(r => r.insulinType === 'basal');
    const basalAmount = basalReadings.length > 0
      ? basalReadings.reduce((sum, r) => sum + r.dose, 0) / basalReadings.length
      : 0;
    
    // Calculate bolus total for the hour (sum of all bolus doses)
    const bolusReadings = hourReadings.filter(r => r.insulinType === 'bolus');
    const bolusAmount = bolusReadings.reduce((sum, r) => sum + r.dose, 0);

    // Calculate IOB at the END of this hour
    const currentTime = hourEnd;
    const { basalIOB, bolusIOB, totalIOB } = calculateIOBAtTime(
      relevantReadings,
      currentTime,
      insulinDuration
    );

    // Format time label (start of hour)
    const timeLabel = `${String(hour).padStart(2, '0')}:00`;

    dataPoints.push({
      time: hourStart,
      timeLabel,
      basalIOB,
      bolusIOB,
      totalIOB,
      basalAmount: Math.round(basalAmount * 100) / 100,
      bolusAmount: Math.round(bolusAmount * 100) / 100,
    });
  }

  return dataPoints;
}
