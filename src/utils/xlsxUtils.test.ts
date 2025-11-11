/**
 * Unit tests for XLSX file generation utilities
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { convertZipToXlsx } from './xlsxUtils';
import { generateMockCsvContent } from '../test/mockData';
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
    const columnNames = headerLine.split('\t').map(col => col.trim()).filter(col => col.length > 0);
    
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
      metadataLine: 'Name:Test User\tDate Range:2025-01-01 - 2025-12-31',
    },
  };
}

describe('xlsxUtils', () => {
  describe('convertZipToXlsx', () => {
    it('should convert a valid ZIP file to XLSX', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      expect(xlsxBlob).toBeInstanceOf(Blob);
      expect(xlsxBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(xlsxBlob.size).toBeGreaterThan(0);
    });

    it('should throw error for invalid ZIP file', async () => {
      const uploadedFile: UploadedFile = {
        id: 'test-id',
        name: 'invalid.zip',
        size: 100,
        uploadTime: new Date(),
        file: new File([''], 'invalid.zip'),
        zipMetadata: {
          isValid: false,
          csvFiles: [],
          error: 'Invalid ZIP file',
        },
      };
      
      await expect(convertZipToXlsx(uploadedFile)).rejects.toThrow('Cannot convert invalid ZIP file to XLSX');
    });

    it('should create XLSX with summary sheet as first sheet', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Check that Summary sheet is first
      expect(workbook.worksheets[0].name).toBe('Summary');
      
      // Check that other sheets exist
      const sheetNames = workbook.worksheets.map(ws => ws.name);
      expect(sheetNames).toContain('bg');
      expect(sheetNames).toContain('cgm');
    });

    it('should populate summary sheet with dataset names and row counts', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get summary sheet
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      
      // Check header
      const headerRow = summarySheet!.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Dataset Name');
      expect(headerRow.getCell(2).value).toBe('Number of Records');
      
      // Check data rows
      const row2 = summarySheet!.getRow(2);
      expect(row2.getCell(1).value).toBe('bg');
      expect(row2.getCell(2).value).toBe(10);
      
      const row3 = summarySheet!.getRow(3);
      expect(row3.getCell(1).value).toBe('cgm');
      expect(row3.getCell(2).value).toBe(15);
    });

    it('should create individual sheets for each dataset', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Check that bg sheet exists and has data
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      expect(bgSheet!.rowCount).toBeGreaterThan(0); // Has header and data rows
      
      // Check that cgm sheet exists and has data
      const cgmSheet = workbook.getWorksheet('cgm');
      expect(cgmSheet).toBeDefined();
      expect(cgmSheet!.rowCount).toBeGreaterThan(0);
    });

    it('should include headers in dataset sheets', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get bg sheet
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      
      // First row should be header
      const headerRow = bgSheet!.getRow(1);
      const headerValues: string[] = [];
      headerRow.eachCell((cell) => {
        headerValues.push(cell.value?.toString() || '');
      });
      
      expect(headerValues).toContain('Timestamp');
      expect(headerValues).toContain('Glucose Value (mg/dL)');
    });

    it('should split data into separate cells, not concatenate in column A', async () => {
      // Create CSV with realistic alarm data like in the bug screenshot
      const csvContent = `Name:Test User\tDate Range:2025-01-01 - 2025-12-31
Timestamp\tAlarm/Event\tSerial Number
2025-10-26 14:02\tResume Pump Alarm (18A)\t1266847
2025-10-25 18:55\tdexcom_high_glucose_alert\tDexcom g7 (9042781)
2025-10-25 17:52\ttandem_controliq_high\t1266847`;
      
      const csvFiles = {
        'alarms_data_1.csv': csvContent,
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get alarms sheet
      const alarmsSheet = workbook.getWorksheet('alarms');
      expect(alarmsSheet).toBeDefined();
      
      // Check raw cell values to see if data is properly split
      const headerRow = alarmsSheet!.getRow(1);
      const cellA1 = headerRow.getCell(1);
      const cellB1 = headerRow.getCell(2);
      const cellC1 = headerRow.getCell(3);
      
      // Debug: log cell values
      console.log('Cell A1:', cellA1.value);
      console.log('Cell B1:', cellB1.value);
      console.log('Cell C1:', cellC1.value);
      
      // The bug would cause B1 and C1 to be undefined because all data is in A1
      expect(cellB1.value).toBeDefined();
      expect(cellC1.value).toBeDefined();
      
      // Verify header row has 3 separate values (not concatenated)
      expect(cellA1.value).toBe('Timestamp');
      expect(cellB1.value).toBe('Alarm/Event');
      expect(cellC1.value).toBe('Serial Number');
      
      // Verify first data row has 3 separate values
      const dataRow1 = alarmsSheet!.getRow(2);
      expect(dataRow1.getCell(1).value).toBe('2025-10-26 14:02');
      expect(dataRow1.getCell(2).value).toBe('Resume Pump Alarm (18A)');
      expect(dataRow1.getCell(3).value).toBe(1266847); // Number is parsed as number
      
      // Verify second data row
      const dataRow2 = alarmsSheet!.getRow(3);
      expect(dataRow2.getCell(1).value).toBe('2025-10-25 18:55');
      expect(dataRow2.getCell(2).value).toBe('dexcom_high_glucose_alert');
      expect(dataRow2.getCell(3).value).toBe('Dexcom g7 (9042781)');
      
      // Verify third data row
      const dataRow3 = alarmsSheet!.getRow(4);
      expect(dataRow3.getCell(1).value).toBe('2025-10-25 17:52');
      expect(dataRow3.getCell(2).value).toBe('tandem_controliq_high');
      expect(dataRow3.getCell(3).value).toBe(1266847); // Number is parsed as number
    });

    it('should handle comma-delimited CSV files (reproducing the bug)', async () => {
      // Create CSV with COMMA delimiters like the user's actual data
      // This reproduces the bug shown in the screenshot
      const csvContent = `Name:Test User,Date Range:2025-01-01 - 2025-12-31
Timestamp,Alarm/Event,Serial Number
2025-10-26 14:02,Resume Pump Alarm (18A),1266847
2025-10-25 18:55,dexcom_high_glucose_alert,Dexcom g7 (9042781)
2025-10-25 17:52,tandem_controliq_high,1266847`;
      
      const csvFiles = {
        'alarms_data_1.csv': csvContent,
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get alarms sheet
      const alarmsSheet = workbook.getWorksheet('alarms');
      expect(alarmsSheet).toBeDefined();
      
      // Check if data is split into separate cells
      const headerRow = alarmsSheet!.getRow(1);
      const cellA1 = headerRow.getCell(1);
      const cellB1 = headerRow.getCell(2);
      const cellC1 = headerRow.getCell(3);
      
      console.log('Comma-delimited - Cell A1:', cellA1.value);
      console.log('Comma-delimited - Cell B1:', cellB1.value);
      console.log('Comma-delimited - Cell C1:', cellC1.value);
      
      // With comma delimiters, B1 and C1 should still be defined after fix
      expect(cellB1.value).toBeDefined();
      expect(cellC1.value).toBeDefined();
      
      // Verify header row has 3 separate values
      expect(cellA1.value).toBe('Timestamp');
      expect(cellB1.value).toBe('Alarm/Event');
      expect(cellC1.value).toBe('Serial Number');
      
      // Verify first data row has 3 separate values
      const dataRow1 = alarmsSheet!.getRow(2);
      expect(dataRow1.getCell(1).value).toBe('2025-10-26 14:02');
      expect(dataRow1.getCell(2).value).toBe('Resume Pump Alarm (18A)');
      expect(dataRow1.getCell(3).value).toBe(1266847);
    });

    it('should handle single dataset', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Should have Summary and bg sheets
      expect(workbook.worksheets).toHaveLength(2);
      const sheetNames = workbook.worksheets.map(ws => ws.name);
      expect(sheetNames).toContain('Summary');
      expect(sheetNames).toContain('bg');
    });

    it('should handle multiple datasets', async () => {
      const csvFiles = {
        'alarms_data_1.csv': generateMockCsvContent('bg_data', 5),
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
        'insulin_data_1.csv': generateMockCsvContent('insulin_data', 8),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Should have Summary + 4 dataset sheets
      expect(workbook.worksheets).toHaveLength(5);
      expect(workbook.worksheets[0].name).toBe('Summary');
    });

    it('should sanitize sheet names to meet Excel requirements', async () => {
      const csvFiles = {
        'test:data*with/special\\chars[1].csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Sheet names should not contain invalid characters
      workbook.worksheets.forEach((worksheet) => {
        expect(worksheet.name).not.toMatch(/[\\/*?[\]:]/);
        expect(worksheet.name.length).toBeLessThanOrEqual(31);
      });
    });

    it('should apply formatting to summary sheet headers', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get summary sheet
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      
      // Check that header cells have styling
      const headerRow = summarySheet!.getRow(1);
      const cellA1 = headerRow.getCell(1);
      const cellB1 = headerRow.getCell(2);
      
      // Headers should have bold font with size 9 and black color
      expect(cellA1.font?.bold).toBe(true);
      expect(cellA1.font?.size).toBe(9);
      expect(cellA1.font?.color?.argb).toBe('000000'); // Black
      expect(cellB1.font?.bold).toBe(true);
      expect(cellB1.font?.size).toBe(9);
      expect(cellB1.font?.color?.argb).toBe('000000'); // Black
      
      // Headers should have pale blue background
      expect(cellA1.fill).toBeDefined();
      expect(cellA1.fill?.type).toBe('pattern');
      if (cellA1.fill && cellA1.fill.type === 'pattern') {
        expect(cellA1.fill.fgColor?.argb).toBe('DEECF9'); // Pale blue
      }
      
      // Verify header values
      expect(cellA1.value).toBe('Dataset Name');
      expect(cellB1.value).toBe('Number of Records');
    });

    it('should apply number formatting to summary sheet counts', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 1234),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get summary sheet
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      
      // Check the count cell (B2)
      const row2 = summarySheet!.getRow(2);
      const countCell = row2.getCell(2);
      
      // Should have number format with thousands separator
      expect(countCell.value).toBe(1234);
      expect(countCell.numFmt).toBeDefined();
      expect(countCell.numFmt).toContain('#,##0');
    });

    it('should set appropriate column widths with padding', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Check summary sheet has column widths set
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      expect(summarySheet!.columns.length).toBeGreaterThan(0);
      expect(summarySheet!.getColumn(1).width).toBeGreaterThan(0);
      
      // Check data sheets have column widths
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      expect(bgSheet!.columns.length).toBeGreaterThan(0);
      expect(bgSheet!.getColumn(1).width).toBeGreaterThan(0);
    });

    it('should apply formatting to data sheet headers', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get bg sheet
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      
      // Check that header cells have styling
      const headerRow = bgSheet!.getRow(1);
      const cellA1 = headerRow.getCell(1);
      const cellB1 = headerRow.getCell(2);
      
      // Headers should have bold font with size 9 and black color
      expect(cellA1.font?.bold).toBe(true);
      expect(cellA1.font?.size).toBe(9);
      expect(cellA1.font?.color?.argb).toBe('000000'); // Black
      expect(cellB1.font?.bold).toBe(true);
      expect(cellB1.font?.size).toBe(9);
      
      // Headers should have pale blue background
      expect(cellA1.fill).toBeDefined();
      if (cellA1.fill && cellA1.fill.type === 'pattern') {
        expect(cellA1.fill.fgColor?.argb).toBe('DEECF9'); // Pale blue
      }
    });

    it('should apply font size 9 to all data cells', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Check summary sheet
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      
      // Check data cells in summary sheet have font size 9
      const dataRow = summarySheet!.getRow(2);
      const dataCell = dataRow.getCell(1);
      expect(dataCell.font?.size).toBe(9);
      
      // Check bg sheet
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      
      // Check data cells in bg sheet have font size 9
      const bgDataRow = bgSheet!.getRow(2);
      const bgDataCell = bgDataRow.getCell(1);
      expect(bgDataCell.font?.size).toBe(9);
    });

    it('should freeze top row in all sheets', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 10),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Check summary sheet has frozen pane
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      expect(summarySheet!.views).toBeDefined();
      expect(summarySheet!.views!.length).toBeGreaterThan(0);
      expect(summarySheet!.views![0].state).toBe('frozen');
      const summaryView = summarySheet!.views![0] as ExcelJS.WorksheetView & { ySplit?: number };
      expect(summaryView.ySplit).toBe(1);
      
      // Check bg sheet has frozen pane
      const bgSheet = workbook.getWorksheet('bg');
      expect(bgSheet).toBeDefined();
      expect(bgSheet!.views).toBeDefined();
      expect(bgSheet!.views!.length).toBeGreaterThan(0);
      expect(bgSheet!.views![0].state).toBe('frozen');
      const bgView = bgSheet!.views![0] as ExcelJS.WorksheetView & { ySplit?: number };
      expect(bgView.ySplit).toBe(1);
      
      // Check cgm sheet has frozen pane
      const cgmSheet = workbook.getWorksheet('cgm');
      expect(cgmSheet).toBeDefined();
      expect(cgmSheet!.views).toBeDefined();
      expect(cgmSheet!.views!.length).toBeGreaterThan(0);
      expect(cgmSheet!.views![0].state).toBe('frozen');
      const cgmView = cgmSheet!.views![0] as ExcelJS.WorksheetView & { ySplit?: number };
      expect(cgmView.ySplit).toBe(1);
    });

    it('should create tabs for all datasets in the Summary sheet - reproducing bug from issue', async () => {
      // Reproduce the exact bug: Summary shows all datasets, but not all get tabs
      // This test creates a scenario similar to the user's screenshot
      const csvFiles = {
        'alarms_data_1.csv': generateMockCsvContent('bg_data', 1040),
        'basal_data_1.csv': generateMockCsvContent('basal_data', 12533),
        'bg_data_1.csv': generateMockCsvContent('bg_data', 309),
        'bolus_data_1.csv': generateMockCsvContent('bolus_data', 730),
        'carbs_data_1.csv': generateMockCsvContent('carbs_data', 0),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 41903),
        'exercise_data_1.csv': generateMockCsvContent('bg_data', 0),
        'food_data_1.csv': generateMockCsvContent('bg_data', 0),
        'insulin_data_1.csv': generateMockCsvContent('insulin_data', 91),
        'manual_insulin_data_1.csv': generateMockCsvContent('insulin_data', 0),
        'medication_data_1.csv': generateMockCsvContent('bg_data', 1),
        'notes_data_1.csv': generateMockCsvContent('bg_data', 0),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Should have Summary + 12 dataset sheets (one for each dataset)
      // Before fix: would only have 6 tabs (Summary, alarms, bg, carbs, cgm, insulin)
      // After fix: should have 13 tabs (Summary + all 12 datasets)
      expect(workbook.worksheets.length).toBe(13);
      
      // Verify Summary sheet exists
      expect(workbook.worksheets[0].name).toBe('Summary');
      
      // Verify all dataset tabs exist (the ones that were missing in the bug)
      const sheetNames = workbook.worksheets.map(ws => ws.name);
      expect(sheetNames).toContain('alarms');
      expect(sheetNames).toContain('basal');     // This was missing!
      expect(sheetNames).toContain('bg');
      expect(sheetNames).toContain('bolus');     // This was missing!
      expect(sheetNames).toContain('carbs');
      expect(sheetNames).toContain('cgm');
      expect(sheetNames).toContain('exercise');  // This was missing!
      expect(sheetNames).toContain('food');      // This was missing!
      expect(sheetNames).toContain('insulin');
      expect(sheetNames).toContain('manual_insulin'); // This was missing!
      expect(sheetNames).toContain('medication'); // This was missing!
      expect(sheetNames).toContain('notes');     // This was missing!
      
      // Verify that Summary sheet has all 12 datasets listed
      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
      expect(summarySheet!.rowCount).toBe(13); // Header + 12 datasets
      
      // Verify row counts match what's in the CSV files
      expect(summarySheet!.getRow(2).getCell(2).value).toBe(1040);   // alarms
      expect(summarySheet!.getRow(3).getCell(2).value).toBe(12533);  // basal
      expect(summarySheet!.getRow(4).getCell(2).value).toBe(309);    // bg
      expect(summarySheet!.getRow(5).getCell(2).value).toBe(730);    // bolus
    });
  });
});
