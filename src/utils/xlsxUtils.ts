/**
 * Utility functions for XLSX file generation
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type { UploadedFile } from '../types';

/**
 * Style definitions for Excel cells following Fluent UI design principles
 */
const HEADER_STYLE = {
  font: { bold: true, sz: 11, color: { rgb: "242424" } }, // Fluent neutral gray 190
  fill: { fgColor: { rgb: "F3F2F1" } }, // Fluent neutral gray 20 (very light)
  alignment: { horizontal: "left", vertical: "center" }
};

const DATA_STYLE_LEFT = {
  alignment: { horizontal: "left", vertical: "center" }
};

const DATA_STYLE_RIGHT = {
  alignment: { horizontal: "right", vertical: "center" }
};

// Number format codes
const NUMBER_FORMAT_INTEGER = '#,##0'; // Integer with thousands separator
const NUMBER_FORMAT_ONE_DECIMAL = '#,##0.0'; // One decimal place with thousands separator

/**
 * Convert a ZIP file to XLSX format
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
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare summary data
  const summaryData: (string | number)[][] = [
    ['Dataset Name', 'Number of Records']
  ];
  
  // Get all CSV files from the ZIP
  const csvFiles = uploadedFile.zipMetadata.csvFiles;
  
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
      // Parse CSV content and create worksheet
      const worksheet = createWorksheetFromCSV(csvContent);
      
      // Add worksheet to workbook with dataset name as sheet name
      // Sanitize sheet name (Excel limits: max 31 chars, no special chars)
      const sheetName = sanitizeSheetName(csvFile.name);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
  }
  
  // Create summary worksheet
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Apply formatting to summary sheet
  applySummaryFormatting(summaryWorksheet);
  
  // Insert summary sheet at the beginning
  workbook.SheetNames.unshift('Summary');
  workbook.Sheets['Summary'] = summaryWorksheet;
  
  // Generate XLSX file as array buffer
  const xlsxArrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true  // Enable cell styling
  });
  
  // Convert to Blob
  return new Blob([xlsxArrayBuffer], {
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
 * Create a worksheet from CSV content
 * Automatically detects delimiter (tab or comma)
 * 
 * @param csvContent - The CSV file content as string
 * @returns XLSX worksheet
 */
function createWorksheetFromCSV(csvContent: string): XLSX.WorkSheet {
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
  
  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Apply formatting to the worksheet
  applyDataSheetFormatting(worksheet, data);
  
  return worksheet;
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
 * Apply formatting to the Summary sheet
 * 
 * @param worksheet - The worksheet to format
 */
function applySummaryFormatting(worksheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const colCount = range.e.c + 1;
  
  // Set column widths with padding
  const colWidths: XLSX.ColInfo[] = [];
  for (let col = 0; col <= range.e.c; col++) {
    const columnData: (string | number)[] = [];
    for (let row = 0; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v !== undefined) {
        columnData.push(cell.v);
      }
    }
    colWidths.push({ wch: calculateColumnWidth(columnData, col === 0 ? 20 : 15) });
  }
  worksheet['!cols'] = colWidths;
  
  // Apply header styling (row 0)
  for (let col = 0; col < colCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (cell) {
      cell.s = HEADER_STYLE;
    }
  }
  
  // Apply data styling for data rows
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell) {
        // First column: left-aligned (dataset names)
        // Second column: right-aligned with integer format (counts)
        if (col === 0) {
          cell.s = DATA_STYLE_LEFT;
        } else {
          cell.s = DATA_STYLE_RIGHT;
          if (typeof cell.v === 'number') {
            cell.z = NUMBER_FORMAT_INTEGER;
          }
        }
      }
    }
  }
}

/**
 * Apply formatting to data sheets (individual CSV datasets)
 * 
 * @param worksheet - The worksheet to format
 * @param data - The data array used to create the worksheet
 */
function applyDataSheetFormatting(worksheet: XLSX.WorkSheet, data: (string | number)[][]): void {
  if (!worksheet['!ref'] || data.length === 0) return;
  
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const colCount = range.e.c + 1;
  const headerRow = data[0];
  
  // Determine number formats for each column based on header names
  const columnFormats: { shouldFormat: boolean; format: string }[] = [];
  for (let col = 0; col < colCount; col++) {
    const headerCell = headerRow[col];
    const columnName = headerCell?.toString() || '';
    columnFormats.push(getColumnNumberFormat(columnName));
  }
  
  // Calculate column widths with padding
  const colWidths: XLSX.ColInfo[] = [];
  for (let col = 0; col <= range.e.c; col++) {
    const columnData: (string | number)[] = [];
    for (let row = 0; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v !== undefined) {
        columnData.push(cell.v);
      }
    }
    colWidths.push({ wch: calculateColumnWidth(columnData, 10) });
  }
  worksheet['!cols'] = colWidths;
  
  // Apply header styling (row 0)
  for (let col = 0; col < colCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (cell) {
      cell.s = HEADER_STYLE;
    }
  }
  
  // Apply data styling for data rows (row 1+)
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell) {
        // Determine alignment based on data type
        const isNumeric = typeof cell.v === 'number';
        cell.s = isNumeric ? DATA_STYLE_RIGHT : DATA_STYLE_LEFT;
        
        // Apply number format if applicable
        if (isNumeric && columnFormats[col].shouldFormat) {
          cell.z = columnFormats[col].format;
        }
      }
    }
  }
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
