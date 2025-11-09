/**
 * Utility functions for ZIP file processing
 */

import JSZip from 'jszip';
import type { ZipMetadata, CsvFileMetadata, ParsedMetadata } from '../types';

/**
 * Extract the base name from a CSV file name
 * Pattern: <set_name>_data_<set_number>.csv
 * For example: 'cgm_data_1.csv' -> 'cgm', 'bg_data_1.csv' -> 'bg'
 * 
 * @param fileName - The CSV file name
 * @returns Set name without '_data_<number>' suffix and extension
 */
function extractBaseName(fileName: string): string {
  // Remove .csv extension
  const nameWithoutExt = fileName.replace(/\.csv$/i, '');
  
  // Match pattern: {set_name}_data_{number}
  const match = nameWithoutExt.match(/^(.+?)_data_(\d+)$/);
  
  if (match) {
    return match[1]; // Return the set name without '_data_<number>'
  }
  
  // Fallback: try pattern {name}_{number} (for files not following _data_ convention)
  const simpleMatch = nameWithoutExt.match(/^(.+?)_(\d+)$/);
  if (simpleMatch) {
    return simpleMatch[1];
  }
  
  // If no pattern found, return the name as-is
  return nameWithoutExt;
}

/**
 * Parse metadata line from CSV file header
 * Metadata format: Key:Value\tKey:Value\t...
 * Example: "Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26"
 * 
 * @param metadataLine - The metadata line to parse
 * @returns Parsed metadata object with key-value pairs
 */
export function parseMetadata(metadataLine: string): ParsedMetadata {
  if (!metadataLine || metadataLine.trim().length === 0) {
    return {};
  }

  const metadata: ParsedMetadata = {};
  
  // Split by tab or comma to get individual key-value pairs
  const delimiter = metadataLine.includes('\t') ? '\t' : ',';
  const pairs = metadataLine.split(delimiter);
  
  for (const pair of pairs) {
    // Split each pair by the first colon
    const colonIndex = pair.indexOf(':');
    if (colonIndex > 0) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      
      // Convert key to camelCase for consistent JavaScript naming
      // "Name" -> "name", "Date Range" -> "dateRange"
      const camelKey = key.charAt(0).toLowerCase() + 
        key.slice(1).replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase());
      
      metadata[camelKey] = value;
    }
  }
  
  return metadata;
}

/**
 * Detect the delimiter used in CSV content
 * Checks the header line (line 1) for tabs or commas
 * 
 * @param content - The CSV file content as string
 * @returns The detected delimiter (tab or comma)
 */
function detectDelimiter(content: string): string {
  const lines = content.trim().split('\n');
  
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
 * Extract metadata line and header from CSV content
 * Automatically detects delimiter (tab or comma)
 * 
 * @param content - The CSV file content as string
 * @returns Object with metadata line, header columns, and row count
 */
function parseCsvContent(content: string): { metadataLine: string; columnNames: string[]; rowCount: number } {
  if (!content || content.trim().length === 0) {
    return { metadataLine: '', columnNames: [], rowCount: 0 };
  }
  
  const lines = content.trim().split('\n');
  
  // Detect delimiter
  const delimiter = detectDelimiter(content);
  
  // First line is metadata (e.g., "Name:Igor Irić	Date Range:2025-07-29 - 2025-10-26")
  const metadataLine = lines.length > 0 ? lines[0].trim() : '';
  
  // Second line is header with column names
  const headerLine = lines.length > 1 ? lines[1].trim() : '';
  const columnNames = headerLine ? headerLine.split(delimiter).map(col => col.trim()).filter(col => col.length > 0) : [];
  
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
      // Single file, use base name (set name) instead of full filename
      mergedFiles.push({
        ...groupFiles[0],
        name: baseName
      });
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
          name: baseName, // Just the set name, no extension
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
    
    // Parse metadata line into structured object
    const parsedMetadata = zipMetadataLine ? parseMetadata(zipMetadataLine) : undefined;
    
    return {
      isValid: true,
      csvFiles: groupedCsvFiles,
      metadataLine: zipMetadataLine,
      parsedMetadata
    };
  } catch (error) {
    return {
      isValid: false,
      csvFiles: [],
      error: error instanceof Error ? error.message : 'Failed to process ZIP file'
    };
  }
}
