/**
 * Worksheet population utilities for XLSX export
 */

import type ExcelJS from 'exceljs';
import { 
  applyHeaderStyle, 
  calculateColumnWidth, 
  getColumnNumberFormat,
  FONT_FAMILY,
  FONT_SIZE,
  NUMBER_FORMAT_INTEGER 
} from './formatting';
import { detectDelimiter } from './helpers';

/**
 * Populate summary worksheet with data and formatting
 * 
 * @param worksheet - The ExcelJS worksheet
 * @param summaryData - Array of arrays containing summary data
 */
export function populateSummaryWorksheet(worksheet: ExcelJS.Worksheet, summaryData: (string | number)[][]): void {
  // Add all rows
  summaryData.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Apply header formatting to first row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell);
  });
  
  // Apply data styling and formatting
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    row.eachCell((cell, colNumber) => {
      // Apply Segoe UI font to all data cells
      cell.font = { name: FONT_FAMILY, size: FONT_SIZE };
      
      // First column: left-aligned (dataset names)
      if (colNumber === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        // Second column: right-aligned with integer format (counts)
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (typeof cell.value === 'number') {
          cell.numFmt = NUMBER_FORMAT_INTEGER;
        }
      }
    });
  }
  
  // Set column widths with padding
  worksheet.columns = [
    { width: calculateColumnWidth(['Dataset Name', ...summaryData.slice(1).map(r => r[0])], 20) },
    { width: calculateColumnWidth(['Number of Records', ...summaryData.slice(1).map(r => r[1])], 15) }
  ];
  
  // Freeze top row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];
}

/**
 * Populate worksheet from CSV content with proper formatting
 * 
 * @param worksheet - The ExcelJS worksheet
 * @param csvContent - The CSV file content as string
 */
export function populateWorksheetFromCSV(worksheet: ExcelJS.Worksheet, csvContent: string): void {
  const lines = csvContent.trim().split('\n');
  
  // Detect delimiter
  const delimiter = detectDelimiter(csvContent);
  
  // Skip metadata line (line 0), use header (line 1) and data (lines 2+)
  const relevantLines = lines.slice(1); // Skip metadata
  
  // Parse delimited values
  const data: (string | number)[][] = relevantLines.map(line => {
    return line.split(delimiter).map(cell => {
      const trimmed = cell.trim();
      // Try to parse as number
      const num = Number(trimmed);
      return !isNaN(num) && trimmed !== '' ? num : trimmed;
    });
  });
  
  if (data.length === 0) return;
  
  const headerRow = data[0];
  
  // Determine number formats for each column based on header names
  const columnFormats: { shouldFormat: boolean; format: string }[] = [];
  for (let col = 0; col < headerRow.length; col++) {
    const columnName = headerRow[col]?.toString() || '';
    columnFormats.push(getColumnNumberFormat(columnName));
  }
  
  // Add all rows to worksheet
  data.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Apply header formatting to first row
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell) => {
    applyHeaderStyle(cell);
  });
  
  // Apply data styling and formatting
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    row.eachCell((cell, colNumber) => {
      const isNumeric = typeof cell.value === 'number';
      
      // Apply Segoe UI font to all data cells
      cell.font = { name: FONT_FAMILY, size: FONT_SIZE };
      
      // Apply alignment based on data type
      cell.alignment = {
        horizontal: isNumeric ? 'right' : 'left',
        vertical: 'middle'
      };
      
      // Apply number format if applicable
      const colIndex = colNumber - 1; // Convert to 0-based index
      if (isNumeric && columnFormats[colIndex]?.shouldFormat) {
        cell.numFmt = columnFormats[colIndex].format;
      }
    });
  }
  
  // Calculate and set column widths with padding
  const columnWidths: number[] = [];
  for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
    const columnData: (string | number)[] = [];
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      if (data[rowIndex][colIndex] !== undefined) {
        columnData.push(data[rowIndex][colIndex]);
      }
    }
    columnWidths.push(calculateColumnWidth(columnData, 10));
  }
  
  worksheet.columns = columnWidths.map(width => ({ width }));
  
  // Freeze top row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];
}
