/**
 * Bug reproduction test for insulin data export issue
 * 
 * This test reproduces the bug where insulin data with 5 columns gets exported
 * to Excel with wrong columns from manual_insulin instead.
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { convertZipToXlsx } from './xlsxUtils';
import type { UploadedFile } from '../types';

/**
 * Helper to convert Blob to ArrayBuffer for testing
 */
async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Helper function to create a mock uploaded file for testing
 */
async function createMockUploadedFile(csvFiles: Record<string, string>): Promise<UploadedFile> {
  const zip = new JSZip();
  
  // Add each CSV file to the ZIP
  Object.entries(csvFiles).forEach(([fileName, content]) => {
    zip.file(fileName, content);
  });
  
  // Generate the ZIP file as a Blob
  const blob = await zip.generateAsync({ type: 'blob' });
  const file = new File([blob], 'test.zip', { type: 'application/zip' });
  
  // Create mock metadata based on file names
  const csvFileMetadata = Object.keys(csvFiles).map(fileName => {
    const content = csvFiles[fileName];
    const lines = content.split('\n');
    const rowCount = Math.max(0, lines.length - 2); // Subtract metadata and header
    const headerLine = lines.length > 1 ? lines[1] : '';
    
    // Detect delimiter (tab or comma)
    const tabCount = (headerLine.match(/\t/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const delimiter = commaCount > tabCount ? ',' : '\t';
    
    const columnNames = headerLine.split(delimiter).map(col => col.trim()).filter(col => col.length > 0);
    
    // Extract base name
    const nameWithoutExt = fileName.replace(/\.csv$/i, '');
    const match = nameWithoutExt.match(/^(.+?)_data_(\d+)$/);
    const baseName = match ? match[1] : nameWithoutExt;
    
    return {
      name: baseName,
      rowCount,
      columnNames,
    };
  });
  
  return {
    id: 'test-id',
    name: 'test.zip',
    size: blob.size,
    uploadTime: new Date(),
    file,
    zipMetadata: {
      isValid: true,
      csvFiles: csvFileMetadata,
      metadataLine: 'Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26',
    },
  };
}

describe('xlsxUtils - insulin bug reproduction', () => {
  it('should correctly export insulin data with 5 columns (not manual_insulin columns)', async () => {
    // Create realistic insulin and manual_insulin CSV files
    // Based on the user's bug report
    const insulinCsv = `Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26
Timestamp\tTotal Bolus (U)\tTotal Insulin (U)\tTotal Basal (U)\tSerial Number
2025-10-26 14:00\t5.2\t7.8\t2.6\t1266847
2025-10-26 15:00\t3.1\t6.3\t3.2\t1266847
2025-10-26 16:00\t4.5\t8.1\t3.6\t1266847`;

    const manualInsulinCsv = `Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26
Timestamp\tName\tValue\tInsulin Type
2025-10-26 14:00\tRapid\t5.2\tBolus
2025-10-26 15:00\tRapid\t3.1\tBolus`;

    const csvFiles = {
      'insulin_data_1.csv': insulinCsv,
      'manual_insulin_data_1.csv': manualInsulinCsv,
    };
    
    const uploadedFile = await createMockUploadedFile(csvFiles);
    
    console.log('CSV Files metadata:', JSON.stringify(uploadedFile.zipMetadata?.csvFiles, null, 2));
    
    const xlsxBlob = await convertZipToXlsx(uploadedFile);
    
    // Parse the XLSX blob
    const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Get insulin sheet
    const insulinSheet = workbook.getWorksheet('insulin');
    expect(insulinSheet).toBeDefined();
    
    if (!insulinSheet) {
      throw new Error('insulin sheet not found');
    }
    
    // Check header row
    const headerRow = insulinSheet.getRow(1);
    const headerCell1 = headerRow.getCell(1);
    const headerCell2 = headerRow.getCell(2);
    const headerCell3 = headerRow.getCell(3);
    const headerCell4 = headerRow.getCell(4);
    const headerCell5 = headerRow.getCell(5);
    
    console.log('Insulin sheet headers:');
    console.log('  Cell A1:', headerCell1.value);
    console.log('  Cell B1:', headerCell2.value);
    console.log('  Cell C1:', headerCell3.value);
    console.log('  Cell D1:', headerCell4.value);
    console.log('  Cell E1:', headerCell5.value);
    
    // Should have 5 columns from insulin data, NOT 4 columns from manual_insulin
    expect(headerCell1.value).toBe('Timestamp');
    expect(headerCell2.value).toBe('Total Bolus (U)');
    expect(headerCell3.value).toBe('Total Insulin (U)');
    expect(headerCell4.value).toBe('Total Basal (U)');
    expect(headerCell5.value).toBe('Serial Number');
    
    // Verify first data row
    const dataRow1 = insulinSheet.getRow(2);
    expect(dataRow1.getCell(1).value).toBe('2025-10-26 14:00');
    expect(dataRow1.getCell(2).value).toBe(5.2);
    expect(dataRow1.getCell(3).value).toBe(7.8);
    expect(dataRow1.getCell(4).value).toBe(2.6);
    expect(dataRow1.getCell(5).value).toBe(1266847);
    
    // Get manual_insulin sheet
    const manualInsulinSheet = workbook.getWorksheet('manual_insulin');
    expect(manualInsulinSheet).toBeDefined();
    
    if (!manualInsulinSheet) {
      throw new Error('manual_insulin sheet not found');
    }
    
    // Check manual_insulin header row
    const miHeaderRow = manualInsulinSheet.getRow(1);
    const miHeaderCell1 = miHeaderRow.getCell(1);
    const miHeaderCell2 = miHeaderRow.getCell(2);
    const miHeaderCell3 = miHeaderRow.getCell(3);
    const miHeaderCell4 = miHeaderRow.getCell(4);
    
    console.log('Manual insulin sheet headers:');
    console.log('  Cell A1:', miHeaderCell1.value);
    console.log('  Cell B1:', miHeaderCell2.value);
    console.log('  Cell C1:', miHeaderCell3.value);
    console.log('  Cell D1:', miHeaderCell4.value);
    
    // Should have manual_insulin columns
    expect(miHeaderCell1.value).toBe('Timestamp');
    expect(miHeaderCell2.value).toBe('Name');
    expect(miHeaderCell3.value).toBe('Value');
    expect(miHeaderCell4.value).toBe('Insulin Type');
  });
});

  it('should NOT match manual_insulin when looking for insulin (bug fix verification)', async () => {
    // This test verifies the bug fix: when insulin file is missing from ZIP,
    // the fallback should NOT match manual_insulin_data_1.csv
    
    // Create a ZIP with manual_insulin but no insulin
    const manualInsulinCsv = `Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26
Timestamp\tName\tValue\tInsulin Type
2025-10-26 14:00\tRapid\t5.2\tBolus`;

    const zip = new JSZip();
    zip.file('manual_insulin_data_1.csv', manualInsulinCsv);
    
    // Generate the ZIP file as a Blob
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'test.zip', { type: 'application/zip' });
    
    // Metadata claims there's an insulin dataset
    // (simulating a mismatch between metadata and actual files)
    const uploadedFile: UploadedFile = {
      id: 'test-id',
      name: 'test.zip',
      size: blob.size,
      uploadTime: new Date(),
      file,
      zipMetadata: {
        isValid: true,
        csvFiles: [
          {
            name: 'insulin',  // Metadata says insulin exists
            rowCount: 91,
            columnNames: ['Timestamp', 'Total Bolus (U)', 'Total Insulin (U)', 'Total Basal (U)', 'Serial Number'],
          },
          {
            name: 'manual_insulin',
            rowCount: 1,
            columnNames: ['Timestamp', 'Name', 'Value', 'Insulin Type'],
          }
        ],
        metadataLine: 'Name:Igor Irić\tDate Range:2025-07-29 - 2025-10-26',
      },
    };
    
    const xlsxBlob = await convertZipToXlsx(uploadedFile);
    
    // Parse the XLSX blob
    const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Check what sheets were created
    const sheetNames = workbook.worksheets.map(ws => ws.name);
    console.log('Sheets created:', sheetNames);
    
    // After fix: insulin sheet should NOT be created because file wasn't found
    // The bug would have created it with manual_insulin data
    expect(sheetNames).toContain('Summary');
    expect(sheetNames).toContain('manual_insulin');
    expect(sheetNames).not.toContain('insulin'); // This is the key assertion - insulin sheet should not exist
    
    // Get manual_insulin sheet - should have correct data
    const manualInsulinSheet = workbook.getWorksheet('manual_insulin');
    expect(manualInsulinSheet).toBeDefined();
    expect(manualInsulinSheet!.rowCount).toBeGreaterThan(0);
    
    // Verify manual_insulin has correct columns (not insulin columns)
    const miHeaderRow = manualInsulinSheet!.getRow(1);
    expect(miHeaderRow.getCell(1).value).toBe('Timestamp');
    expect(miHeaderRow.getCell(2).value).toBe('Name');
    expect(miHeaderRow.getCell(3).value).toBe('Value');
    expect(miHeaderRow.getCell(4).value).toBe('Insulin Type');
  });
