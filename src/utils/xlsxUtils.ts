/**
 * Utility functions for XLSX file generation using ExcelJS
 */

import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import type { UploadedFile } from '../types';

/**
 * Fluent UI color constants
 */
const FLUENT_COLORS = {
  LIGHT_BLUE_10: 'DEECF9',        // Very light, desaturated blue for header background
  BLACK: '000000',                // Black for header text
};

/**
 * Font family for Excel cells
 */
const FONT_FAMILY = 'Segoe UI';

/**
 * Font size for Excel cells
 */
const FONT_SIZE = 9;

/**
 * Number format codes
 */
const NUMBER_FORMAT_INTEGER = '#,##0'; // Integer with thousands separator
const NUMBER_FORMAT_ONE_DECIMAL = '#,##0.0'; // One decimal place with thousands separator

/**
 * Convert a ZIP file to XLSX format using ExcelJS
 * Each CSV dataset becomes a sheet, with a summary sheet as the first sheet
 * 
 * @param uploadedFile - The uploaded file with ZIP metadata
 * @returns Promise resolving to a Blob containing the XLSX file
 */
export async function convertZipToXlsx(uploadedFile: UploadedFile): Promise<Blob> {
  if (!uploadedFile.zipMetadata || !uploadedFile.zipMetadata.isValid) {
    throw new Error('Cannot convert invalid ZIP file to XLSX');
  }

  // Load the ZIP file
  const zip = await JSZip.loadAsync(uploadedFile.file);
  
  // Create a new workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GlookoDataWebApp';
  workbook.created = new Date();
  
  // Prepare summary data
  const summaryData: (string | number)[][] = [
    ['Dataset Name', 'Number of Records']
  ];
  
  // Get all CSV files from the ZIP
  const csvFiles = uploadedFile.zipMetadata.csvFiles;
  
  // Collect data for summary
  const dataSheets: { name: string; content: string }[] = [];
  
  // Process each dataset
  for (const csvFile of csvFiles) {
    // Add to summary
    summaryData.push([csvFile.name, csvFile.rowCount]);
    
    // Find the actual CSV file(s) in the ZIP
    let csvContent = '';
    
    if (csvFile.sourceFiles && csvFile.sourceFiles.length > 0) {
      // Merged dataset - combine all source files
      const contents: string[] = [];
      
      for (const sourceFileName of csvFile.sourceFiles) {
        const fileData = zip.files[sourceFileName];
        if (fileData) {
          const content = await fileData.async('string');
          contents.push(content);
        }
      }
      
      // Merge the content (skip metadata and header for subsequent files)
      csvContent = mergeCSVContents(contents);
    } else {
      // Single file dataset - find by pattern
      const fileName = findCSVFileName(Object.keys(zip.files), csvFile.name);
      if (fileName) {
        const fileData = zip.files[fileName];
        csvContent = await fileData.async('string');
      }
    }
    
    if (csvContent) {
      dataSheets.push({
        name: sanitizeSheetName(csvFile.name),
        content: csvContent
      });
    }
  }
  
  // Create summary worksheet as first sheet
  const summaryWorksheet = workbook.addWorksheet('Summary');
  populateSummaryWorksheet(summaryWorksheet, summaryData);
  
  // Create data sheets
  for (const sheet of dataSheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    populateWorksheetFromCSV(worksheet, sheet.content);
  }
  
  // Generate XLSX file as buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Convert to Blob
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Merge multiple CSV contents into one
 * Keeps metadata and header from first file, appends data rows from all files
 * 
 * @param contents - Array of CSV file contents
 * @returns Merged CSV content
 */
function mergeCSVContents(contents: string[]): string {
  if (contents.length === 0) return '';
  if (contents.length === 1) return contents[0];
  
  const lines: string[] = [];
  
  // Process first file - keep everything
  const firstFileLines = contents[0].split('\n');
  lines.push(...firstFileLines);
  
  // Process remaining files - skip metadata (line 0) and header (line 1)
  for (let i = 1; i < contents.length; i++) {
    const fileLines = contents[i].split('\n');
    // Add data rows (starting from line 2)
    for (let j = 2; j < fileLines.length; j++) {
      if (fileLines[j].trim()) {
        lines.push(fileLines[j]);
      }
    }
  }
  
  return lines.join('\n');
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
  const pattern = new RegExp(`^${datasetName}_data_\\d+\\.csv$`, 'i');
  const match = fileNames.find(name => pattern.test(name));
  
  if (match) return match;
  
  // Fallback: look for files that START with the dataset name (not substring match)
  // This prevents "insulin" from matching "manual_insulin"
  return fileNames.find(name => {
    const lowerName = name.toLowerCase();
    const lowerDataset = datasetName.toLowerCase();
    return lowerName.startsWith(lowerDataset) && lowerName.endsWith('.csv');
  });
}

/**
 * Detect the delimiter used in CSV content
 * Checks the header line (line 1) for tabs or commas
 * 
 * @param csvContent - The CSV file content as string
 * @returns The detected delimiter (tab or comma)
 */
function detectDelimiter(csvContent: string): string {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return '\t'; // Default to tab
  }
  
  // Check the header line (line 1) for delimiters
  const headerLine = lines[1];
  
  // Count tabs and commas
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  
  // Use the delimiter that appears more frequently
  // If equal or none found, default to tab (original behavior)
  return commaCount > tabCount ? ',' : '\t';
}

/**
 * Sanitize sheet name to meet Excel requirements
 * - Max 31 characters
 * - No special characters: \ / * ? [ ] :
 * 
 * @param name - Original sheet name
 * @returns Sanitized sheet name
 */
function sanitizeSheetName(name: string): string {
  // Remove invalid characters
  let sanitized = name.replace(/[\\/*?[\]:]/g, '_');
  
  // Truncate to 31 characters
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  
  return sanitized;
}

/**
 * Determine if a column should use number formatting based on column name
 * 
 * @param columnName - The name of the column
 * @returns Object with shouldFormat flag and format code
 */
function getColumnNumberFormat(columnName: string): { shouldFormat: boolean; format: string } {
  const lowerName = columnName.toLowerCase();
  
  // Integer columns (counts, IDs, serial numbers)
  if (lowerName.includes('count') || 
      lowerName.includes('number of') ||
      lowerName.includes('serial') ||
      lowerName.includes('id')) {
    return { shouldFormat: true, format: NUMBER_FORMAT_INTEGER };
  }
  
  // Decimal columns (glucose, insulin, carbs, bg, cgm)
  if (lowerName.includes('glucose') || 
      lowerName.includes('insulin') ||
      lowerName.includes('carb') ||
      lowerName.includes('bg') ||
      lowerName.includes('cgm') ||
      lowerName.includes('dose') ||
      lowerName.includes('value') ||
      lowerName.includes('rate')) {
    return { shouldFormat: true, format: NUMBER_FORMAT_ONE_DECIMAL };
  }
  
  return { shouldFormat: false, format: '' };
}

/**
 * Calculate optimal column width with padding
 * 
 * @param data - The data in the column
 * @param minWidth - Minimum width
 * @returns Column width
 */
function calculateColumnWidth(data: (string | number)[], minWidth: number = 10): number {
  let maxLength = minWidth;
  
  for (const cell of data) {
    const cellStr = cell?.toString() || '';
    const cellLength = cellStr.length;
    if (cellLength > maxLength) {
      maxLength = cellLength;
    }
  }
  
  // Add padding (1-2 units as per requirements)
  return maxLength + 2;
}

/**
 * Apply header styling to a cell following Fluent UI design principles
 * 
 * @param cell - The ExcelJS cell to style
 */
function applyHeaderStyle(cell: ExcelJS.Cell): void {
  cell.font = {
    name: FONT_FAMILY,
    bold: true,
    size: FONT_SIZE,
    color: { argb: FLUENT_COLORS.BLACK }
  };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: FLUENT_COLORS.LIGHT_BLUE_10 }
  };
  cell.alignment = {
    horizontal: 'left',
    vertical: 'middle'
  };
}

/**
 * Populate summary worksheet with data and formatting
 * 
 * @param worksheet - The ExcelJS worksheet
 * @param summaryData - Array of arrays containing summary data
 */
function populateSummaryWorksheet(worksheet: ExcelJS.Worksheet, summaryData: (string | number)[][]): void {
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
function populateWorksheetFromCSV(worksheet: ExcelJS.Worksheet, csvContent: string): void {
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


/**
 * Download XLSX file to user's computer
 * 
 * @param blob - The XLSX blob to download
 * @param fileName - The desired file name (without extension)
 */
export function downloadXlsx(blob: Blob, fileName: string): void {
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
