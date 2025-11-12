/**
 * XLSX download utility
 */

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
