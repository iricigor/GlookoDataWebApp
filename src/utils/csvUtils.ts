/**
 * CSV/TSV utility functions for exporting table data
 */

export type ExportFormat = 'csv' | 'tsv';

/**
 * Convert a 2D array of data to CSV or TSV format string
 * @param data - 2D array where first row is headers, subsequent rows are data
 * @param format - Export format ('csv' or 'tsv')
 * @returns CSV or TSV formatted string
 */
export function convertToDelimitedFormat(data: (string | number)[][], format: ExportFormat = 'csv'): string {
  if (!data || data.length === 0) {
    return '';
  }

  const delimiter = format === 'tsv' ? '\t' : ',';
  
  return data
    .map(row =>
      row
        .map(cell => {
          // Convert cell to string
          const cellStr = String(cell ?? '');
          
          if (format === 'tsv') {
            // For TSV, just escape tabs and newlines
            return cellStr.replace(/\t/g, '  ').replace(/\n/g, ' ');
          } else {
            // For CSV, if cell contains comma, newline, or quotes, wrap in quotes and escape quotes
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }
        })
        .join(delimiter)
    )
    .join('\n');
}

/**
 * Convert a 2D array of data to CSV format string (legacy function for backward compatibility)
 * @param data - 2D array where first row is headers, subsequent rows are data
 * @returns CSV formatted string
 */
export function convertToCSV(data: (string | number)[][]): string {
  return convertToDelimitedFormat(data, 'csv');
}

/**
 * Copy text to clipboard using the Clipboard API
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
    return;
  }

  await navigator.clipboard.writeText(text);
}
