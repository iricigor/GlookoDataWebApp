/**
 * Utility functions for extracting glucose data from Glooko ZIP files
 */

import JSZip from 'jszip';
import type { UploadedFile, GlucoseReading, GlucoseDataSource } from '../types';

/**
 * Parse glucose readings from CSV content
 * 
 * @param csvContent - The CSV file content as string
 * @param delimiter - The delimiter used in the CSV (tab or comma)
 * @returns Array of glucose readings
 */
function parseGlucoseReadingsFromCSV(csvContent: string, delimiter: string = '\t'): GlucoseReading[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return [];
  }

  // Line 0: metadata, Line 1: headers, Lines 2+: data
  const headerLine = lines[1];
  const headers = headerLine.split(delimiter).map(h => h.trim());
  
  // Find timestamp and glucose value column indices
  const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
  const glucoseIndex = headers.findIndex(h => 
    h.toLowerCase().includes('glucose value') || h.toLowerCase().includes('glucose')
  );

  if (timestampIndex === -1 || glucoseIndex === -1) {
    return [];
  }

  // Assume input data is always in mmol/L (no conversion needed)

  const readings: GlucoseReading[] = [];

  // Process data rows (starting from line 2)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(delimiter);
    
    const timestampStr = values[timestampIndex]?.trim();
    const glucoseStr = values[glucoseIndex]?.trim();

    if (!timestampStr || !glucoseStr) continue;

    // Parse timestamp
    const timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) continue;

    // Parse glucose value (expected to be in mmol/L)
    const value = parseFloat(glucoseStr);
    if (isNaN(value) || value <= 0) continue;

    readings.push({ timestamp, value });
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
 * Extract glucose readings from uploaded file
 * 
 * @param uploadedFile - The uploaded file with ZIP metadata
 * @param dataSource - The data source type ('cgm' or 'bg')
 * @returns Promise resolving to array of glucose readings
 */
export async function extractGlucoseReadings(
  uploadedFile: UploadedFile,
  dataSource: GlucoseDataSource
): Promise<GlucoseReading[]> {
  if (!uploadedFile.zipMetadata || !uploadedFile.zipMetadata.isValid) {
    throw new Error('Invalid ZIP file');
  }

  // Find the appropriate dataset
  const datasetName = dataSource === 'cgm' ? 'cgm' : 'bg';
  const csvFile = uploadedFile.zipMetadata.csvFiles.find(f => f.name === datasetName);

  if (!csvFile) {
    throw new Error(`No ${datasetName} data found in the ZIP file`);
  }

  // Load the ZIP file
  const zip = await JSZip.loadAsync(uploadedFile.file);

  let allReadings: GlucoseReading[] = [];

  // Handle multiple source files (merged datasets)
  if (csvFile.sourceFiles && csvFile.sourceFiles.length > 0) {
    for (const sourceFileName of csvFile.sourceFiles) {
      const fileData = zip.files[sourceFileName];
      if (fileData) {
        const content = await fileData.async('string');
        const delimiter = detectDelimiter(content);
        const readings = parseGlucoseReadingsFromCSV(content, delimiter);
        allReadings = allReadings.concat(readings);
      }
    }
  } else {
    // Single file dataset - find by pattern
    const fileName = findCSVFileName(Object.keys(zip.files), datasetName);
    if (fileName) {
      const fileData = zip.files[fileName];
      const content = await fileData.async('string');
      const delimiter = detectDelimiter(content);
      allReadings = parseGlucoseReadingsFromCSV(content, delimiter);
    }
  }

  return allReadings;
}

/**
 * Find CSV file name in ZIP that matches the dataset name
 * 
 * @param fileNames - Array of file names in the ZIP
 * @param datasetName - The dataset name to find
 * @returns The matching file name or undefined
 */
function findCSVFileName(fileNames: string[], datasetName: string): string | undefined {
  // Look for exact match first (e.g., "bg_data_1.csv" for "bg")
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
 * Smooth glucose values using a simple moving average
 * Takes the average of the current value, the previous value, and the next value
 * 
 * @param readings - Array of glucose readings sorted by time
 * @returns Array of smoothed glucose readings
 */
export function smoothGlucoseValues(readings: GlucoseReading[]): GlucoseReading[] {
  if (readings.length < 3) {
    // Not enough data points to smooth, return as is
    return readings;
  }

  const smoothed: GlucoseReading[] = [];

  for (let i = 0; i < readings.length; i++) {
    if (i === 0) {
      // First value: average of current and next
      const avgValue = (readings[i].value + readings[i + 1].value) / 2;
      smoothed.push({ ...readings[i], value: avgValue });
    } else if (i === readings.length - 1) {
      // Last value: average of previous and current
      const avgValue = (readings[i - 1].value + readings[i].value) / 2;
      smoothed.push({ ...readings[i], value: avgValue });
    } else {
      // Middle values: average of previous, current, and next
      const avgValue = (readings[i - 1].value + readings[i].value + readings[i + 1].value) / 3;
      smoothed.push({ ...readings[i], value: avgValue });
    }
  }

  return smoothed;
}
