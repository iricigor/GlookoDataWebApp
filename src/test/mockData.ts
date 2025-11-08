/**
 * Mock data and utilities for testing
 */

/**
 * Example CSV file structure from a typical Glooko export ZIP
 * This represents the actual file names found in a Glooko data export
 */
export const MOCK_CSV_FILE_NAMES = [
  'alarms_data_1.csv',
  'bg_data_1.csv',
  'carbs_data_1.csv',
  'cgm_data_1.csv',
  'cgm_data_2.csv',
  'cgm_data_3.csv',
  'basal_data_1.csv',
  'bolus_data_1.csv',
  'insulin_data_1.csv',
  'exercise_data_1.csv',
  'food_data_1.csv',
  'manual_insulin_data_1.csv',
  'medication_data_1.csv',
  'notes_data_1.csv',
];

/**
 * Sample metadata line that appears in Glooko CSV files
 */
export const MOCK_METADATA_LINE = 'Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26';

/**
 * Sample column headers for different CSV file types
 */
export const MOCK_COLUMN_HEADERS = {
  bg_data: 'Timestamp\tGlucose Value (mg/dL)\tDevice\tNotes',
  cgm_data: 'Timestamp\tGlucose Value (mg/dL)\tTrend Arrow\tTransmitter ID',
  carbs_data: 'Timestamp\tCarbs (g)\tFood Description\tNotes',
  insulin_data: 'Timestamp\tInsulin Type\tDose (units)\tNotes',
  basal_data: 'Timestamp\tBasal Rate (units/hr)\tDuration (min)\tType',
  bolus_data: 'Timestamp\tBolus Type\tDose (units)\tCarbs (g)\tNotes',
};

/**
 * Generate mock CSV content with metadata, headers, and data rows
 * 
 * @param fileType - The type of CSV file (e.g., 'bg_data', 'cgm_data')
 * @param rowCount - Number of data rows to generate
 * @param metadataLine - Optional custom metadata line
 * @returns Complete CSV file content as string
 */
export function generateMockCsvContent(
  fileType: keyof typeof MOCK_COLUMN_HEADERS = 'bg_data',
  rowCount: number = 5,
  metadataLine: string = MOCK_METADATA_LINE
): string {
  const lines: string[] = [];
  
  // Add metadata line
  lines.push(metadataLine);
  
  // Add header line
  const headers = MOCK_COLUMN_HEADERS[fileType] || MOCK_COLUMN_HEADERS.bg_data;
  lines.push(headers);
  
  // Add data rows (simple mock data)
  for (let i = 0; i < rowCount; i++) {
    const columnCount = headers.split('\t').length;
    const mockRow = Array(columnCount).fill(`data_${i + 1}`).join('\t');
    lines.push(mockRow);
  }
  
  return lines.join('\n');
}
