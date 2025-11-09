/**
 * Utility functions for parsing CSV metadata
 */

import type { ParsedMetadata } from '../types';

/**
 * Parse metadata line from CSV file
 * Supports both comma-separated and tab-separated formats
 * 
 * Expected formats:
 * - Comma-separated: "Name:John Doe, Date Range:2025-01-01 - 2025-01-31"
 * - Tab-separated: "Name:John Doe\tDate Range:2025-01-01 - 2025-01-31"
 * 
 * @param metadataLine - The metadata line from the CSV file
 * @returns ParsedMetadata object with extracted fields
 */
export function parseMetadata(metadataLine: string): ParsedMetadata {
  if (!metadataLine || metadataLine.trim().length === 0) {
    return {};
  }

  const result: ParsedMetadata = {};

  // Try comma-separated format first
  let parts = metadataLine.split(',').map(part => part.trim());
  
  // If there's only one part, try tab-separated format
  if (parts.length === 1) {
    parts = metadataLine.split('\t').map(part => part.trim());
  }

  // Parse each part as key:value
  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) continue;

    const key = part.substring(0, colonIndex).trim();
    const value = part.substring(colonIndex + 1).trim();

    if (!value) continue;

    // Parse based on key
    if (key.toLowerCase() === 'name') {
      result.name = value;
    } else if (key.toLowerCase() === 'date range') {
      result.dateRange = value;
      
      // Try to parse date range (format: YYYY-MM-DD - YYYY-MM-DD)
      const dateRangeMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/);
      if (dateRangeMatch) {
        result.startDate = dateRangeMatch[1];
        result.endDate = dateRangeMatch[2];
      }
    }
  }

  return result;
}

/**
 * Validate that parsed metadata contains required fields
 * 
 * @param metadata - The parsed metadata to validate
 * @returns True if metadata has at least a name or date range
 */
export function isValidMetadata(metadata: ParsedMetadata): boolean {
  return !!(metadata.name || metadata.dateRange);
}

/**
 * Format parsed metadata for display
 * 
 * @param metadata - The parsed metadata
 * @returns Formatted string for display
 */
export function formatMetadataForDisplay(metadata: ParsedMetadata): string {
  const parts: string[] = [];

  if (metadata.name) {
    parts.push(`Name: ${metadata.name}`);
  }

  if (metadata.dateRange) {
    parts.push(`Date Range: ${metadata.dateRange}`);
  }

  return parts.join(' | ');
}
