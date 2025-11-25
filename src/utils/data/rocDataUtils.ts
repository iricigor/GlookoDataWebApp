/**
 * Utility functions for Rate of Change (RoC) calculations
 * 
 * Medical standards for glucose Rate of Change:
 * - Good (stable): ≤0.06 mmol/L/min (≤1 mg/dL/min)
 * - Medium (moderate): 0.06-0.11 mmol/L/min (1-2 mg/dL/min)
 * - Bad (rapid): >0.11 mmol/L/min (>2 mg/dL/min)
 * 
 * References:
 * - International consensus on use of CGM (Danne et al., 2017)
 * - Typical CGM arrow indicators use similar thresholds
 */

import type { GlucoseReading, RoCDataPoint, RoCStats } from '../../types';

/**
 * Medical thresholds for Rate of Change (in mmol/L/min)
 */
export const ROC_THRESHOLDS = {
  good: 0.06,    // ≤0.06 is stable/good
  medium: 0.11,  // 0.06-0.11 is moderate
  // >0.11 is rapid/bad
} as const;

/**
 * Colors for RoC categories
 */
export const ROC_COLORS = {
  good: '#4CAF50',    // Green - stable
  medium: '#FFB300',  // Amber - moderate change
  bad: '#D32F2F',     // Red - rapid change
} as const;

/**
 * Convert HSV to RGB color string
 * 
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param v - Value (0-1)
 * @returns RGB color string
 */
function hsvToRgb(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);
  
  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Get color for RoC value using HSV spectrum
 * Green (low/slow) to Red (high/fast)
 * 
 * @param absRoC - Absolute rate of change in mmol/L/min
 * @returns RGB color string
 */
export function getRoCColor(absRoC: number): string {
  // Map RoC to hue: 0 (slow) -> 120 (green), >0.11+ -> 0 (red)
  // Using inverse mapping: low values = green (120), high values = red (0)
  const maxRoC = 0.15; // Cap for color calculation (anything above is deep red)
  const normalizedRoC = Math.min(absRoC / maxRoC, 1);
  
  // Hue goes from 120 (green) to 0 (red) as RoC increases
  const hue = 120 * (1 - normalizedRoC);
  
  return hsvToRgb(hue, 0.8, 0.9);
}

/**
 * Categorize RoC value based on medical standards
 * 
 * @param absRoC - Absolute rate of change in mmol/L/min
 * @returns Category: 'good', 'medium', or 'bad'
 */
export function categorizeRoC(absRoC: number): 'good' | 'medium' | 'bad' {
  if (absRoC <= ROC_THRESHOLDS.good) {
    return 'good';
  } else if (absRoC <= ROC_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'bad';
  }
}

/**
 * Calculate Rate of Change from consecutive glucose readings
 * 
 * @param readings - Array of glucose readings sorted by timestamp
 * @returns Array of RoC data points
 */
export function calculateRoC(readings: GlucoseReading[]): RoCDataPoint[] {
  if (readings.length < 2) {
    return [];
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const rocDataPoints: RoCDataPoint[] = [];

  for (let i = 1; i < sortedReadings.length; i++) {
    const current = sortedReadings[i];
    const previous = sortedReadings[i - 1];
    
    // Calculate time difference in minutes
    const timeDiffMs = current.timestamp.getTime() - previous.timestamp.getTime();
    const timeDiffMin = timeDiffMs / (1000 * 60);
    
    // Skip if time gap is too large (>30 minutes) or too small (<1 minute)
    if (timeDiffMin > 30 || timeDiffMin < 1) {
      continue;
    }
    
    // Calculate glucose change
    const glucoseChange = current.value - previous.value;
    
    // Calculate rate of change (mmol/L per minute)
    const rocRaw = glucoseChange / timeDiffMin;
    const absRoC = Math.abs(rocRaw);
    
    // Get time components for the data point (use midpoint)
    const hour = current.timestamp.getHours();
    const minute = current.timestamp.getMinutes();
    const timeDecimal = hour + minute / 60;
    const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    rocDataPoints.push({
      timestamp: current.timestamp,
      timeDecimal,
      timeLabel,
      roc: absRoC,
      rocRaw,
      glucoseValue: current.value,
      color: getRoCColor(absRoC),
      category: categorizeRoC(absRoC),
    });
  }

  return rocDataPoints;
}

/**
 * Filter RoC data points for a specific date
 * 
 * @param dataPoints - Array of RoC data points
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Filtered data points for that date
 */
export function filterRoCByDate(dataPoints: RoCDataPoint[], dateString: string): RoCDataPoint[] {
  return dataPoints.filter(point => {
    const year = point.timestamp.getFullYear();
    const month = String(point.timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(point.timestamp.getDate()).padStart(2, '0');
    const pointDate = `${year}-${month}-${day}`;
    return pointDate === dateString;
  });
}

/**
 * Calculate RoC statistics for a set of data points
 * 
 * @param dataPoints - Array of RoC data points
 * @returns RoC statistics
 */
export function calculateRoCStats(dataPoints: RoCDataPoint[]): RoCStats {
  if (dataPoints.length === 0) {
    return {
      minRoC: 0,
      maxRoC: 0,
      sdRoC: 0,
      goodPercentage: 0,
      mediumPercentage: 0,
      badPercentage: 0,
      goodCount: 0,
      mediumCount: 0,
      badCount: 0,
      totalCount: 0,
    };
  }

  const rocValues = dataPoints.map(d => d.roc);
  const totalCount = rocValues.length;
  
  // Min and Max
  const minRoC = Math.min(...rocValues);
  const maxRoC = Math.max(...rocValues);
  
  // Mean
  const mean = rocValues.reduce((sum, val) => sum + val, 0) / totalCount;
  
  // Standard Deviation
  const squaredDiffs = rocValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / totalCount;
  const sdRoC = Math.sqrt(variance);
  
  // Count categories
  const goodCount = dataPoints.filter(d => d.category === 'good').length;
  const mediumCount = dataPoints.filter(d => d.category === 'medium').length;
  const badCount = dataPoints.filter(d => d.category === 'bad').length;
  
  // Calculate percentages
  const goodPercentage = Math.round((goodCount / totalCount) * 1000) / 10;
  const mediumPercentage = Math.round((mediumCount / totalCount) * 1000) / 10;
  const badPercentage = Math.round((badCount / totalCount) * 1000) / 10;

  return {
    minRoC,
    maxRoC,
    sdRoC,
    goodPercentage,
    mediumPercentage,
    badPercentage,
    goodCount,
    mediumCount,
    badCount,
    totalCount,
  };
}

/**
 * Get unique dates from RoC data points
 * 
 * @param dataPoints - Array of RoC data points
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getUniqueDatesFromRoC(dataPoints: RoCDataPoint[]): string[] {
  const dateSet = new Set<string>();
  
  dataPoints.forEach(point => {
    const year = point.timestamp.getFullYear();
    const month = String(point.timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(point.timestamp.getDate()).padStart(2, '0');
    dateSet.add(`${year}-${month}-${day}`);
  });
  
  return Array.from(dateSet).sort();
}

/**
 * Format RoC value for display
 * 
 * @param roc - Rate of change value in mmol/L/min
 * @returns Formatted string
 */
export function formatRoCValue(roc: number): string {
  return roc.toFixed(3);
}

/**
 * Get description of RoC medical standards
 * 
 * @returns Object with descriptions for each category
 */
export function getRoCMedicalStandards(): {
  good: { threshold: string; description: string };
  medium: { threshold: string; description: string };
  bad: { threshold: string; description: string };
} {
  return {
    good: {
      threshold: '≤0.06 mmol/L/min',
      description: 'Stable - glucose changing slowly',
    },
    medium: {
      threshold: '0.06-0.11 mmol/L/min',
      description: 'Moderate - glucose changing at moderate pace',
    },
    bad: {
      threshold: '>0.11 mmol/L/min',
      description: 'Rapid - glucose changing quickly',
    },
  };
}
