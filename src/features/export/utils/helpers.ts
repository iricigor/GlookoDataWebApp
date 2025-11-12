/**
 * Helper utility functions for XLSX export
 */

/**
 * Merge multiple CSV contents into one
 * Keeps metadata and header from first file, appends data rows from all files
 * 
 * @param contents - Array of CSV file contents
 * @returns Merged CSV content
 */
export function mergeCSVContents(contents: string[]): string {
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
 * Detect the delimiter used in CSV content
 * Checks the header line (line 1) for tabs or commas
 * 
 * @param csvContent - The CSV file content as string
 * @returns The detected delimiter (tab or comma)
 */
export function detectDelimiter(csvContent: string): string {
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
export function sanitizeSheetName(name: string): string {
  // Remove invalid characters
  let sanitized = name.replace(/[\\/*?[\]:]/g, '_');
  
  // Truncate to 31 characters
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  
  return sanitized;
}
