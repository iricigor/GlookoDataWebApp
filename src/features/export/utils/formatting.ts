/**
 * Excel formatting utilities for XLSX export
 */

import type ExcelJS from 'exceljs';

/**
 * Fluent UI color constants
 */
const FLUENT_COLORS = {
  LIGHT_BLUE_10: 'DEECF9',        // Very light, desaturated blue for header background
  BLACK: '000000',                // Black for header text
};

/**
 * Font family for Excel cells
 */
export const FONT_FAMILY = 'Segoe UI';

/**
 * Font size for Excel cells
 */
export const FONT_SIZE = 9;

/**
 * Number format codes
 */
export const NUMBER_FORMAT_INTEGER = '#,##0'; // Integer with thousands separator
export const NUMBER_FORMAT_ONE_DECIMAL = '#,##0.0'; // One decimal place with thousands separator

/**
 * Determine if a column should use number formatting based on column name
 * 
 * @param columnName - The name of the column
 * @returns Object with shouldFormat flag and format code
 */
export function getColumnNumberFormat(columnName: string): { shouldFormat: boolean; format: string } {
  const lowerName = columnName.toLowerCase();
  
  // Integer columns (counts, IDs, serial numbers)
  if (lowerName.includes('count') || 
      lowerName.includes('number of') ||
      lowerName.includes('serial') ||
      lowerName.includes('id')) {
    return { shouldFormat: true, format: NUMBER_FORMAT_INTEGER };
  }
  
  // Decimal columns (glucose, insulin, carbs, bg, cgm)
  if (lowerName.includes('glucose') || 
      lowerName.includes('insulin') ||
      lowerName.includes('carb') ||
      lowerName.includes('bg') ||
      lowerName.includes('cgm') ||
      lowerName.includes('dose') ||
      lowerName.includes('value') ||
      lowerName.includes('rate')) {
    return { shouldFormat: true, format: NUMBER_FORMAT_ONE_DECIMAL };
  }
  
  return { shouldFormat: false, format: '' };
}

/**
 * Calculate optimal column width with padding
 * 
 * @param data - The data in the column
 * @param minWidth - Minimum width
 * @returns Column width
 */
export function calculateColumnWidth(data: (string | number)[], minWidth: number = 10): number {
  let maxLength = minWidth;
  
  for (const cell of data) {
    const cellStr = cell?.toString() || '';
    const cellLength = cellStr.length;
    if (cellLength > maxLength) {
      maxLength = cellLength;
    }
  }
  
  // Add padding (1-2 units as per requirements)
  return maxLength + 2;
}

/**
 * Apply header styling to a cell following Fluent UI design principles
 * 
 * @param cell - The ExcelJS cell to style
 */
export function applyHeaderStyle(cell: ExcelJS.Cell): void {
  cell.font = {
    name: FONT_FAMILY,
    bold: true,
    size: FONT_SIZE,
    color: { argb: FLUENT_COLORS.BLACK }
  };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: FLUENT_COLORS.LIGHT_BLUE_10 }
  };
  cell.alignment = {
    horizontal: 'left',
    vertical: 'middle'
  };
}
