/**
 * XLSX converter utility for converting ZIP files to Excel format
 */

import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import type { UploadedFile } from '../../../types';
import { mergeCSVContents, sanitizeSheetName } from './helpers';
import { populateSummaryWorksheet, populateWorksheetFromCSV } from './worksheet';

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
    
    // Get the actual CSV file(s) from the ZIP using sourceFiles
    // sourceFiles is always populated by groupCsvFiles in zipUtils
    if (!csvFile.sourceFiles || csvFile.sourceFiles.length === 0) {
      // Skip datasets without source files (shouldn't happen with current zipUtils logic)
      console.warn(`Dataset "${csvFile.name}" has no source files, skipping`);
      continue;
    }
    
    const contents: string[] = [];
    
    for (const sourceFileName of csvFile.sourceFiles) {
      const fileData = zip.files[sourceFileName];
      if (fileData) {
        const content = await fileData.async('string');
        contents.push(content);
      } else {
        console.warn(`Source file "${sourceFileName}" not found in ZIP for dataset "${csvFile.name}"`);
      }
    }
    
    // Only create sheet if we found at least one file
    if (contents.length > 0) {
      // Merge the content (skip metadata and header for subsequent files)
      const csvContent = mergeCSVContents(contents);
      
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
