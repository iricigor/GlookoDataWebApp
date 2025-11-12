/**
 * Utility functions for extracting insulin data from Glooko ZIP files
 */

import JSZip from 'jszip';
import type { UploadedFile, InsulinReading, DailyInsulinSummary } from '../types';

/**
 * Parse daily insulin totals from combined insulin CSV (format: Timestamp, Total Bolus, Total Insulin, Total Basal)
 * 
 * @param csvContent - The CSV file content as string
 * @param delimiter - The delimiter used in the CSV (tab or comma)
 * @returns Array of daily insulin summaries
 */
function parseDailyInsulinFromCSV(
  csvContent: string,
  delimiter: string = '\t'
): DailyInsulinSummary[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return [];
  }

  // Line 0: metadata, Line 1: headers, Lines 2+: data
  const headerLine = lines[1];
  const headers = headerLine.split(delimiter).map(h => h.trim());
  
  // Find column indices
  const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
  const totalBolusIndex = headers.findIndex(h => h.toLowerCase().includes('total bolus') || h.toLowerCase() === 'total bolus (u)');
  const totalBasalIndex = headers.findIndex(h => h.toLowerCase().includes('total basal') || h.toLowerCase() === 'total basal (u)');
  const totalInsulinIndex = headers.findIndex(h => h.toLowerCase().includes('total insulin') || h.toLowerCase() === 'total insulin (u)');

  if (timestampIndex === -1) {
    return [];
  }

  const summaries: DailyInsulinSummary[] = [];

  // Process data rows (starting from line 2)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(delimiter);
    
    const timestampStr = values[timestampIndex]?.trim();
    if (!timestampStr) continue;

    // Parse timestamp and format as date
    const timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) continue;
    
    const date = formatDate(timestamp);

    // Parse insulin values
    const totalBolus = totalBolusIndex !== -1 ? parseFloat(values[totalBolusIndex]?.trim() || '0') : 0;
    const totalBasal = totalBasalIndex !== -1 ? parseFloat(values[totalBasalIndex]?.trim() || '0') : 0;
    const totalInsulin = totalInsulinIndex !== -1 ? parseFloat(values[totalInsulinIndex]?.trim() || '0') : (totalBasal + totalBolus);

    summaries.push({
      date,
      basalTotal: Math.round(totalBasal * 10) / 10,
      bolusTotal: Math.round(totalBolus * 10) / 10,
      totalInsulin: Math.round(totalInsulin * 10) / 10,
    });
  }

  return summaries;
}

/**
 * Parse insulin readings from CSV content
 * 
 * @param csvContent - The CSV file content as string
 * @param delimiter - The delimiter used in the CSV (tab or comma)
 * @param insulinType - The type of insulin ('basal' or 'bolus')
 * @returns Array of insulin readings
 */
function parseInsulinReadingsFromCSV(
  csvContent: string, 
  delimiter: string = '\t',
  insulinType: 'basal' | 'bolus'
): InsulinReading[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return [];
  }

  // Line 0: metadata, Line 1: headers, Lines 2+: data
  const headerLine = lines[1];
  const headers = headerLine.split(delimiter).map(h => h.trim());
  
  // Find timestamp and dose column indices
  const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
  const doseIndex = headers.findIndex(h => {
    const lower = h.toLowerCase();
    return lower.includes('dose') || 
           lower.includes('units') ||
           lower.includes('rate') ||
           lower.includes('delivered');
  });

  if (timestampIndex === -1 || doseIndex === -1) {
    return [];
  }

  const readings: InsulinReading[] = [];

  // Process data rows (starting from line 2)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(delimiter);
    
    const timestampStr = values[timestampIndex]?.trim();
    const doseStr = values[doseIndex]?.trim();

    if (!timestampStr || !doseStr) continue;

    // Parse timestamp
    const timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) continue;

    // Parse dose value
    const dose = parseFloat(doseStr);
    if (isNaN(dose) || dose < 0) continue;

    readings.push({ timestamp, dose, insulinType });
  }

  return readings;
}

/**
 * Detect the delimiter used in CSV content
 * 
 * @param csvContent - The CSV file content as string
 * @returns The detected delimiter (tab or comma)
 */
function detectDelimiter(csvContent: string): string {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return '\t';
  }
  
  // Check the header line (line 1) for delimiters
  const headerLine = lines[1];
  
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  
  return commaCount > tabCount ? ',' : '\t';
}

/**
 * Find CSV file name in ZIP that matches the dataset name
 * 
 * @param fileNames - Array of file names in the ZIP
 * @param datasetName - The dataset name to find
 * @returns The matching file name or undefined
 */
function findCSVFileName(fileNames: string[], datasetName: string): string | undefined {
  // Look for exact match first (e.g., "basal_data_1.csv" for "basal")
  const pattern = new RegExp(`${datasetName}_data_\\d+\\.csv$`, 'i');
  const match = fileNames.find(name => pattern.test(name));
  
  if (match) return match;
  
  // Fallback: look for any file containing the dataset name
  return fileNames.find(name => 
    name.toLowerCase().includes(datasetName.toLowerCase()) && 
    name.toLowerCase().endsWith('.csv')
  );
}

/**
 * Extract daily insulin summaries from uploaded file
 * Supports both combined insulin file format and separate basal/bolus files
 * 
 * @param uploadedFile - The uploaded file with ZIP metadata
 * @returns Promise resolving to array of daily insulin summaries
 */
export async function extractDailyInsulinSummaries(
  uploadedFile: UploadedFile
): Promise<DailyInsulinSummary[]> {
  if (!uploadedFile.zipMetadata || !uploadedFile.zipMetadata.isValid) {
    throw new Error('Invalid ZIP file');
  }

  // Load the ZIP file
  const zip = await JSZip.loadAsync(uploadedFile.file);

  // First check for combined insulin file (insulin_data_*.csv with daily totals)
  const insulinFile = uploadedFile.zipMetadata.csvFiles.find(f => f.name === 'insulin');
  if (insulinFile) {
    // Combined insulin file with daily totals
    if (insulinFile.sourceFiles && insulinFile.sourceFiles.length > 0) {
      const sourceFileName = insulinFile.sourceFiles[0]; // Use first file
      const fileData = zip.files[sourceFileName];
      if (fileData) {
        const content = await fileData.async('string');
        const delimiter = detectDelimiter(content);
        return parseDailyInsulinFromCSV(content, delimiter);
      }
    } else {
      const fileName = findCSVFileName(Object.keys(zip.files), 'insulin');
      if (fileName) {
        const fileData = zip.files[fileName];
        const content = await fileData.async('string');
        const delimiter = detectDelimiter(content);
        return parseDailyInsulinFromCSV(content, delimiter);
      }
    }
  }

  // Fall back to extracting from separate basal/bolus files
  const readings = await extractInsulinReadings(uploadedFile);
  return aggregateInsulinByDate(readings);
}

/**
 * Extract insulin readings from uploaded file
 * 
 * @param uploadedFile - The uploaded file with ZIP metadata
 * @returns Promise resolving to array of daily insulin summaries (for combined format) or insulin readings (for separate format)
 */
export async function extractInsulinReadings(
  uploadedFile: UploadedFile
): Promise<InsulinReading[]> {
  if (!uploadedFile.zipMetadata || !uploadedFile.zipMetadata.isValid) {
    throw new Error('Invalid ZIP file');
  }

  // Load the ZIP file
  const zip = await JSZip.loadAsync(uploadedFile.file);

  // Note: Skip the combined 'insulin' file (manual insulin entries like Lantus)
  // as it's not pump data. We want to extract basal and bolus pump data instead.

  let allReadings: InsulinReading[] = [];

  // Extract basal insulin data
  const basalFile = uploadedFile.zipMetadata.csvFiles.find(f => f.name === 'basal');
  if (basalFile) {
    if (basalFile.sourceFiles && basalFile.sourceFiles.length > 0) {
      for (const sourceFileName of basalFile.sourceFiles) {
        const fileData = zip.files[sourceFileName];
        if (fileData) {
          const content = await fileData.async('string');
          const delimiter = detectDelimiter(content);
          const readings = parseInsulinReadingsFromCSV(content, delimiter, 'basal');
          allReadings = allReadings.concat(readings);
        }
      }
    } else {
      const fileName = findCSVFileName(Object.keys(zip.files), 'basal');
      if (fileName) {
        const fileData = zip.files[fileName];
        const content = await fileData.async('string');
        const delimiter = detectDelimiter(content);
        const readings = parseInsulinReadingsFromCSV(content, delimiter, 'basal');
        allReadings = allReadings.concat(readings);
      }
    }
  }

  // Extract bolus insulin data
  const bolusFile = uploadedFile.zipMetadata.csvFiles.find(f => f.name === 'bolus');
  if (bolusFile) {
    if (bolusFile.sourceFiles && bolusFile.sourceFiles.length > 0) {
      for (const sourceFileName of bolusFile.sourceFiles) {
        const fileData = zip.files[sourceFileName];
        if (fileData) {
          const content = await fileData.async('string');
          const delimiter = detectDelimiter(content);
          const readings = parseInsulinReadingsFromCSV(content, delimiter, 'bolus');
          allReadings = allReadings.concat(readings);
        }
      }
    } else {
      const fileName = findCSVFileName(Object.keys(zip.files), 'bolus');
      if (fileName) {
        const fileData = zip.files[fileName];
        const content = await fileData.async('string');
        const delimiter = detectDelimiter(content);
        const readings = parseInsulinReadingsFromCSV(content, delimiter, 'bolus');
        allReadings = allReadings.concat(readings);
      }
    }
  }

  return allReadings;
}

/**
 * Format date as YYYY-MM-DD
 * 
 * @param date - Date object
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Aggregate insulin readings by date
 * 
 * @param readings - Array of insulin readings
 * @returns Array of daily insulin summaries
 */
export function aggregateInsulinByDate(readings: InsulinReading[]): DailyInsulinSummary[] {
  // Group readings by date and type
  const dateGroups: Record<string, { basal: number; bolus: number }> = {};

  readings.forEach(reading => {
    const dateKey = formatDate(reading.timestamp);
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = { basal: 0, bolus: 0 };
    }
    
    if (reading.insulinType === 'basal') {
      dateGroups[dateKey].basal += reading.dose;
    } else {
      dateGroups[dateKey].bolus += reading.dose;
    }
  });

  // Convert to array of daily summaries
  const summaries: DailyInsulinSummary[] = Object.keys(dateGroups)
    .sort() // Sort dates chronologically
    .map(date => ({
      date,
      basalTotal: Math.round(dateGroups[date].basal * 10) / 10, // Round to 1 decimal
      bolusTotal: Math.round(dateGroups[date].bolus * 10) / 10, // Round to 1 decimal
      totalInsulin: Math.round((dateGroups[date].basal + dateGroups[date].bolus) * 10) / 10, // Round to 1 decimal
    }));

  return summaries;
}

/**
 * Prepare insulin timeline data for a specific date
 * Groups insulin readings by hour for visualization
 * 
 * @param readings - Array of insulin readings
 * @param date - Date to filter readings (YYYY-MM-DD format)
 * @returns Array of hourly insulin data points (24 hours)
 */
export function prepareInsulinTimelineData(readings: InsulinReading[], date: string): Array<{
  hour: number;
  timeLabel: string;
  basalRate: number;
  bolusTotal: number;
}> {
  // Filter readings for the specified date
  const dateReadings = readings.filter(reading => {
    const readingDate = formatDate(reading.timestamp);
    return readingDate === date;
  });

  // Initialize hourly data points (0-23)
  const hourlyData: Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }> = [];

  for (let hour = 0; hour < 24; hour++) {
    const timeLabel = `${String(hour).padStart(2, '0')}:00`;
    
    // Filter readings for this hour
    const hourReadings = dateReadings.filter(reading => {
      return reading.timestamp.getHours() === hour;
    });

    // Calculate basal rate (average for the hour)
    const basalReadings = hourReadings.filter(r => r.insulinType === 'basal');
    const basalRate = basalReadings.length > 0
      ? basalReadings.reduce((sum, r) => sum + r.dose, 0) / basalReadings.length
      : 0;

    // Calculate bolus total for the hour
    const bolusReadings = hourReadings.filter(r => r.insulinType === 'bolus');
    const bolusTotal = bolusReadings.reduce((sum, r) => sum + r.dose, 0);

    hourlyData.push({
      hour,
      timeLabel,
      basalRate: Math.round(basalRate * 100) / 100, // Round to 2 decimals
      bolusTotal: Math.round(bolusTotal * 10) / 10,  // Round to 1 decimal
    });
  }

  return hourlyData;
}
