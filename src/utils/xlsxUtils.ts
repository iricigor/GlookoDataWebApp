/**
 * Utility functions for XLSX file generation
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type { UploadedFile } from '../types';

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
  
  // Set column widths for summary sheet
  summaryWorksheet['!cols'] = [
    { wch: 30 }, // Dataset Name
    { wch: 20 }  // Number of Records
  ];
  
  // Insert summary sheet at the beginning
  workbook.SheetNames.unshift('Summary');
  workbook.Sheets['Summary'] = summaryWorksheet;
  
  // Generate XLSX file as array buffer
  const xlsxArrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
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
 * Create a worksheet from CSV content
 * 
 * @param csvContent - The CSV file content as string
 * @returns XLSX worksheet
 */
function createWorksheetFromCSV(csvContent: string): XLSX.WorkSheet {
  const lines = csvContent.trim().split('\n');
  
  // Skip metadata line (line 0), use header (line 1) and data (lines 2+)
  const relevantLines = lines.slice(1); // Skip metadata
  
  // Parse tab-separated values
  const data: (string | number)[][] = relevantLines.map(line => {
    return line.split('\t').map(cell => {
      const trimmed = cell.trim();
      // Try to parse as number
      const num = Number(trimmed);
      return !isNaN(num) && trimmed !== '' ? num : trimmed;
    });
  });
  
  // Create worksheet from array of arrays
  return XLSX.utils.aoa_to_sheet(data);
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
