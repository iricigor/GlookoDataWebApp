/**
 * Utility functions for extracting insulin data from Glooko ZIP files
 */

import JSZip from 'jszip';
import type { UploadedFile, InsulinReading, DailyInsulinSummary } from '../types';

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
  const doseIndex = headers.findIndex(h => 
    h.toLowerCase().includes('dose') || 
    h.toLowerCase().includes('units') ||
    h.toLowerCase().includes('rate')
  );

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
 * Extract insulin readings from uploaded file
 * 
 * @param uploadedFile - The uploaded file with ZIP metadata
 * @returns Promise resolving to array of insulin readings
 */
export async function extractInsulinReadings(
  uploadedFile: UploadedFile
): Promise<InsulinReading[]> {
  if (!uploadedFile.zipMetadata || !uploadedFile.zipMetadata.isValid) {
    throw new Error('Invalid ZIP file');
  }

  // Load the ZIP file
  const zip = await JSZip.loadAsync(uploadedFile.file);

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
