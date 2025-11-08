/**
 * Utility functions for ZIP file processing
 */

import JSZip from 'jszip';
import type { ZipMetadata, CsvFileMetadata } from '../types';

/**
 * Count the number of rows in a CSV file content
 * 
 * @param content - The CSV file content as string
 * @returns Number of data rows (excluding header)
 */
function countCsvRows(content: string): number {
  if (!content || content.trim().length === 0) {
    return 0;
  }
  
  const lines = content.trim().split('\n');
  // Subtract 1 for header row, but ensure we don't go negative
  return Math.max(0, lines.length - 1);
}

/**
 * Extract metadata from a ZIP file
 * Validates that the ZIP contains CSV files and extracts information about them
 * 
 * @param file - The ZIP file to process
 * @returns Promise resolving to ZipMetadata with validation status and CSV file information
 */
export async function extractZipMetadata(file: File): Promise<ZipMetadata> {
  try {
    const zip = await JSZip.loadAsync(file);
    const csvFiles: CsvFileMetadata[] = [];
    
    // Get all files in the ZIP
    const fileEntries = Object.keys(zip.files)
      .filter(fileName => !zip.files[fileName].dir) // Exclude directories
      .filter(fileName => fileName.toLowerCase().endsWith('.csv')); // Only CSV files
    
    if (fileEntries.length === 0) {
      return {
        isValid: false,
        csvFiles: [],
        error: 'No CSV files found in ZIP archive'
      };
    }
    
    // Process each CSV file
    for (const fileName of fileEntries) {
      const fileData = zip.files[fileName];
      const content = await fileData.async('string');
      const rowCount = countCsvRows(content);
      
      // Extract just the filename without path for display
      const displayName = fileName.split('/').pop() || fileName;
      
      csvFiles.push({
        name: displayName,
        rowCount
      });
    }
    
    // Sort by filename for consistent display
    csvFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      isValid: true,
      csvFiles
    };
  } catch (error) {
    return {
      isValid: false,
      csvFiles: [],
      error: error instanceof Error ? error.message : 'Failed to process ZIP file'
    };
  }
}
