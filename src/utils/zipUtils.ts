/**
 * Utility functions for ZIP file processing
 */

import JSZip from 'jszip';
import type { ZipMetadata, CsvFileMetadata } from '../types';

/**
 * Extract the base name from a CSV file name
 * For example: 'cgm_data_1.csv' -> 'cgm_data', 'bg_data_1.csv' -> 'bg_data'
 * 
 * @param fileName - The CSV file name
 * @returns Base name without numeric suffix and extension
 */
function extractBaseName(fileName: string): string {
  // Remove .csv extension
  const nameWithoutExt = fileName.replace(/\.csv$/i, '');
  
  // Match pattern: {name}_data_{number} or {name}_{number}
  const match = nameWithoutExt.match(/^(.+?)_(\d+)$/);
  
  if (match) {
    return match[1]; // Return the base name without the number
  }
  
  // If no number pattern found, return the name as-is
  return nameWithoutExt;
}

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
 * Group CSV files by their base name and merge related files
 * 
 * @param files - Array of CSV file metadata
 * @returns Array of grouped/merged CSV file metadata
 */
function groupCsvFiles(files: CsvFileMetadata[]): CsvFileMetadata[] {
  // Group files by base name
  const groups = new Map<string, CsvFileMetadata[]>();
  
  for (const file of files) {
    const baseName = extractBaseName(file.name);
    
    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName)!.push(file);
  }
  
  // Merge grouped files
  const mergedFiles: CsvFileMetadata[] = [];
  
  for (const [baseName, groupFiles] of groups.entries()) {
    if (groupFiles.length === 1) {
      // Single file, keep as-is
      mergedFiles.push(groupFiles[0]);
    } else {
      // Multiple files, merge them
      const totalRowCount = groupFiles.reduce((sum, file) => sum + file.rowCount, 0);
      
      // Use the first file's column names (they should all be the same)
      const columnNames = groupFiles[0].columnNames;
      
      // Validate that all files in the group have the same column names
      const allSameColumns = groupFiles.every(file => {
        if (!file.columnNames || !columnNames) return true;
        if (file.columnNames.length !== columnNames.length) return false;
        return file.columnNames.every((col, idx) => col === columnNames[idx]);
      });
      
      if (!allSameColumns) {
        // If columns don't match, keep files separate (don't merge)
        mergedFiles.push(...groupFiles);
      } else {
        // Create merged file metadata
        mergedFiles.push({
          name: `${baseName}.csv`,
          rowCount: totalRowCount,
          columnNames,
          fileCount: groupFiles.length,
          sourceFiles: groupFiles.map(f => f.name).sort()
        });
      }
    }
  }
  
  // Sort by name for consistent display
  mergedFiles.sort((a, b) => a.name.localeCompare(b.name));
  
  return mergedFiles;
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
    
    // Group and merge related CSV files
    const groupedCsvFiles = groupCsvFiles(csvFiles);
    
    return {
      isValid: true,
      csvFiles: groupedCsvFiles,
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
