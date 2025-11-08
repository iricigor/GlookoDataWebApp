/**
 * Utility functions for ZIP file processing
 */

import JSZip from 'jszip';
import type { ZipMetadata, CsvFileMetadata } from '../types';

/**
 * Extract metadata line and header from CSV content
 * 
 * @param content - The CSV file content as string
 * @returns Object with metadata line, header columns, and row count
 */
function parseCsvContent(content: string): { metadataLine: string; columnNames: string[]; rowCount: number } {
  if (!content || content.trim().length === 0) {
    return { metadataLine: '', columnNames: [], rowCount: 0 };
  }
  
  const lines = content.trim().split('\n');
  
  // First line is metadata (e.g., "Name:Igor Irić	Date Range:2025-07-29 - 2025-10-26")
  const metadataLine = lines.length > 0 ? lines[0].trim() : '';
  
  // Second line is header with column names
  const headerLine = lines.length > 1 ? lines[1].trim() : '';
  const columnNames = headerLine ? headerLine.split('\t').map(col => col.trim()).filter(col => col.length > 0) : [];
  
  // Remaining lines are data rows (subtract metadata line and header line)
  const rowCount = Math.max(0, lines.length - 2);
  
  return { metadataLine, columnNames, rowCount };
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
    let zipMetadataLine: string | undefined = undefined;
    
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
      const { metadataLine, columnNames, rowCount } = parseCsvContent(content);
      
      // Validate that all CSV files have the same metadata line
      if (zipMetadataLine === undefined) {
        zipMetadataLine = metadataLine;
      } else if (zipMetadataLine !== metadataLine) {
        return {
          isValid: false,
          csvFiles: [],
          error: 'Not all CSV files have the same metadata line'
        };
      }
      
      // Extract just the filename without path for display
      const displayName = fileName.split('/').pop() || fileName;
      
      csvFiles.push({
        name: displayName,
        rowCount,
        columnNames
      });
    }
    
    // Sort by filename for consistent display
    csvFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      isValid: true,
      csvFiles,
      metadataLine: zipMetadataLine
    };
  } catch (error) {
    return {
      isValid: false,
      csvFiles: [],
      error: error instanceof Error ? error.message : 'Failed to process ZIP file'
    };
  }
}
