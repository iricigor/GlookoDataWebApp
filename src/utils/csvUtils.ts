/**
 * CSV/TSV utility functions for exporting table data
 */

import type { DailyReport, GlucoseReading, InsulinReading } from '../types';
import { calculatePercentage } from './glucoseRangeUtils';

export type ExportFormat = 'csv' | 'tsv';

/**
 * Convert a 2D array of data to CSV or TSV format string
 * @param data - 2D array where first row is headers, subsequent rows are data
 * @param format - Export format ('csv' or 'tsv')
 * @returns CSV or TSV formatted string
 */
export function convertToDelimitedFormat(data: (string | number)[][], format: ExportFormat = 'csv'): string {
  if (!data || data.length === 0) {
    return '';
  }

  const delimiter = format === 'tsv' ? '\t' : ',';
  
  return data
    .map(row =>
      row
        .map(cell => {
          // Convert cell to string
          const cellStr = String(cell ?? '');
          
          if (format === 'tsv') {
            // For TSV, just escape tabs and newlines
            return cellStr.replace(/\t/g, '  ').replace(/\n/g, ' ');
          } else {
            // For CSV, if cell contains comma, newline, or quotes, wrap in quotes and escape quotes
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }
        })
        .join(delimiter)
    )
    .join('\n');
}

/**
 * Convert a 2D array of data to CSV format string (legacy function for backward compatibility)
 * @param data - 2D array where first row is headers, subsequent rows are data
 * @returns CSV formatted string
 */
export function convertToCSV(data: (string | number)[][]): string {
  return convertToDelimitedFormat(data, 'csv');
}

/**
 * Copy text to clipboard using the Clipboard API
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
    return;
  }

  await navigator.clipboard.writeText(text);
}

/**
 * Convert DailyReport array to CSV format for AI analysis
 * @param reports - Array of daily reports with glucose and insulin data
 * @returns CSV formatted string with headers
 */
export function convertDailyReportsToCSV(reports: DailyReport[]): string {
  if (!reports || reports.length === 0) {
    return '';
  }

  // Define headers
  const headers = [
    'Date',
    'Day of Week',
    'BG Below (%)',
    'BG In Range (%)',
    'BG Above (%)',
    'Basal Insulin',
    'Bolus Insulin',
    'Total Insulin'
  ];

  // Convert reports to rows
  const rows: (string | number)[][] = [headers];
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  reports.forEach(report => {
    const date = new Date(report.date);
    const dayOfWeek = dayNames[date.getDay()];
    
    const row = [
      report.date,
      dayOfWeek,
      calculatePercentage(report.stats.low, report.stats.total),
      calculatePercentage(report.stats.inRange, report.stats.total),
      calculatePercentage(report.stats.high, report.stats.total),
      report.basalInsulin !== undefined ? report.basalInsulin.toFixed(2) : '',
      report.bolusInsulin !== undefined ? report.bolusInsulin.toFixed(2) : '',
      report.totalInsulin !== undefined ? report.totalInsulin.toFixed(2) : ''
    ];
    
    rows.push(row);
  });

  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Convert GlucoseReading array to CSV format for meal timing analysis
 * @param readings - Array of glucose readings with timestamp and value
 * @returns CSV formatted string with headers (Timestamp, CGM Glucose Value (mmol/L))
 */
export function convertGlucoseReadingsToCSV(readings: GlucoseReading[]): string {
  if (!readings || readings.length === 0) {
    return '';
  }

  // Define headers matching the required format
  const headers = ['Timestamp', 'CGM Glucose Value (mmol/L)'];

  // Convert readings to rows
  const rows: (string | number)[][] = [headers];
  
  readings.forEach(reading => {
    const row = [
      reading.timestamp.toISOString(),
      reading.value.toFixed(1)
    ];
    rows.push(row);
  });

  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Convert InsulinReading array to CSV format for meal timing analysis (bolus data)
 * @param readings - Array of bolus insulin readings with timestamp and dose
 * @returns CSV formatted string with headers (Timestamp, Insulin Delivered (U))
 */
export function convertBolusReadingsToCSV(readings: InsulinReading[]): string {
  if (!readings || readings.length === 0) {
    return '';
  }

  // Define headers matching the required format
  const headers = ['Timestamp', 'Insulin Delivered (U)'];

  // Convert readings to rows
  const rows: (string | number)[][] = [headers];
  
  readings.forEach(reading => {
    const row = [
      reading.timestamp.toISOString(),
      reading.dose.toFixed(2)
    ];
    rows.push(row);
  });

  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Convert InsulinReading array to CSV format for meal timing analysis (basal data)
 * @param readings - Array of basal insulin readings with timestamp and dose/rate
 * @returns CSV formatted string with headers (Timestamp, Insulin Delivered (U))
 */
export function convertBasalReadingsToCSV(readings: InsulinReading[]): string {
  if (!readings || readings.length === 0) {
    return '';
  }

  // Define headers matching the required format
  const headers = ['Timestamp', 'Insulin Delivered (U)'];

  // Convert readings to rows
  const rows: (string | number)[][] = [headers];
  
  readings.forEach(reading => {
    const row = [
      reading.timestamp.toISOString(),
      reading.dose.toFixed(2)
    ];
    rows.push(row);
  });

  return convertToDelimitedFormat(rows, 'csv');
}

/**
 * Filter glucose readings to the last N days from the most recent reading
 * @param readings - Array of glucose readings to filter
 * @param days - Number of days to include (default 28)
 * @returns Filtered array of glucose readings
 */
export function filterGlucoseReadingsToLastDays(readings: GlucoseReading[], days: number = 28): GlucoseReading[] {
  if (!readings || readings.length === 0) {
    return [];
  }

  // Find the most recent timestamp
  const maxTimestamp = Math.max(...readings.map(r => r.timestamp.getTime()));
  const cutoffDate = new Date(maxTimestamp);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Filter readings after the cutoff date
  return readings.filter(r => r.timestamp >= cutoffDate);
}

/**
 * Filter insulin readings to the last N days from the most recent reading
 * @param readings - Array of insulin readings to filter
 * @param days - Number of days to include (default 28)
 * @returns Filtered array of insulin readings
 */
export function filterInsulinReadingsToLastDays(readings: InsulinReading[], days: number = 28): InsulinReading[] {
  if (!readings || readings.length === 0) {
    return [];
  }

  // Find the most recent timestamp
  const maxTimestamp = Math.max(...readings.map(r => r.timestamp.getTime()));
  const cutoffDate = new Date(maxTimestamp);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Filter readings after the cutoff date
  return readings.filter(r => r.timestamp >= cutoffDate);
}
