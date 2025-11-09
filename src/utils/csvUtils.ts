/**
 * CSV utility functions for exporting table data to CSV format
 */

/**
 * Convert a 2D array of data to CSV format string
 * @param data - 2D array where first row is headers, subsequent rows are data
 * @returns CSV formatted string
 */
export function convertToCSV(data: (string | number)[][]): string {
  if (!data || data.length === 0) {
    return '';
  }

  return data
    .map(row =>
      row
        .map(cell => {
          // Convert cell to string
          const cellStr = String(cell ?? '');
          
          // If cell contains comma, newline, or quotes, wrap in quotes and escape quotes
          if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          
          return cellStr;
        })
        .join(',')
    )
    .join('\n');
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
