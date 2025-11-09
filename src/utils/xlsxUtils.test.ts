/**
 * Unit tests for XLSX file generation utilities
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Check that Summary sheet is first
      expect(workbook.SheetNames[0]).toBe('Summary');
      
      // Check that other sheets exist
      expect(workbook.SheetNames).toContain('bg');
      expect(workbook.SheetNames).toContain('cgm');
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get summary sheet
      const summarySheet = workbook.Sheets['Summary'];
      const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
      
      // Check header
      expect(summaryData[0]).toEqual(['Dataset Name', 'Number of Records']);
      
      // Check data rows
      expect(summaryData[1]).toEqual(['bg', 10]);
      expect(summaryData[2]).toEqual(['cgm', 15]);
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Check that bg sheet exists and has data
      const bgSheet = workbook.Sheets['bg'];
      expect(bgSheet).toBeDefined();
      const bgData = XLSX.utils.sheet_to_json(bgSheet, { header: 1 });
      expect(bgData.length).toBeGreaterThan(0); // Has header and data rows
      
      // Check that cgm sheet exists and has data
      const cgmSheet = workbook.Sheets['cgm'];
      expect(cgmSheet).toBeDefined();
      const cgmData = XLSX.utils.sheet_to_json(cgmSheet, { header: 1 });
      expect(cgmData.length).toBeGreaterThan(0);
    });

    it('should include headers in dataset sheets', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get bg sheet
      const bgSheet = workbook.Sheets['bg'];
      const bgData = XLSX.utils.sheet_to_json<string[]>(bgSheet, { header: 1 });
      
      // First row should be header
      expect(bgData[0]).toContain('Timestamp');
      expect(bgData[0]).toContain('Glucose Value (mg/dL)');
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get alarms sheet
      const alarmsSheet = workbook.Sheets['alarms'];
      
      // Check raw cell values to see if data is properly split
      // If bug exists, all data will be in column A (A1, A2, A3, etc.)
      // If fixed, data will be in columns A, B, C
      const cellA1 = alarmsSheet['A1'];
      const cellB1 = alarmsSheet['B1'];
      const cellC1 = alarmsSheet['C1'];
      
      // Debug: log cell values
      console.log('Cell A1:', cellA1?.v);
      console.log('Cell B1:', cellB1?.v);
      console.log('Cell C1:', cellC1?.v);
      
      // The bug would cause B1 and C1 to be undefined because all data is in A1
      expect(cellB1).toBeDefined();
      expect(cellC1).toBeDefined();
      
      const alarmsData = XLSX.utils.sheet_to_json<string[]>(alarmsSheet, { header: 1 });
      
      // Verify header row has 3 separate values (not concatenated)
      expect(alarmsData[0]).toHaveLength(3);
      expect(alarmsData[0][0]).toBe('Timestamp');
      expect(alarmsData[0][1]).toBe('Alarm/Event');
      expect(alarmsData[0][2]).toBe('Serial Number');
      
      // Verify first data row has 3 separate values
      expect(alarmsData[1]).toHaveLength(3);
      expect(alarmsData[1][0]).toBe('2025-10-26 14:02');
      expect(alarmsData[1][1]).toBe('Resume Pump Alarm (18A)');
      expect(alarmsData[1][2]).toBe(1266847); // Number is parsed as number
      
      // Verify second data row
      expect(alarmsData[2]).toHaveLength(3);
      expect(alarmsData[2][0]).toBe('2025-10-25 18:55');
      expect(alarmsData[2][1]).toBe('dexcom_high_glucose_alert');
      expect(alarmsData[2][2]).toBe('Dexcom g7 (9042781)');
      
      // Verify third data row
      expect(alarmsData[3]).toHaveLength(3);
      expect(alarmsData[3][0]).toBe('2025-10-25 17:52');
      expect(alarmsData[3][1]).toBe('tandem_controliq_high');
      expect(alarmsData[3][2]).toBe(1266847); // Number is parsed as number
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get alarms sheet
      const alarmsSheet = workbook.Sheets['alarms'];
      
      // Check if data is split into separate cells
      const cellA1 = alarmsSheet['A1'];
      const cellB1 = alarmsSheet['B1'];
      const cellC1 = alarmsSheet['C1'];
      
      console.log('Comma-delimited - Cell A1:', cellA1?.v);
      console.log('Comma-delimited - Cell B1:', cellB1?.v);
      console.log('Comma-delimited - Cell C1:', cellC1?.v);
      
      // With comma delimiters, B1 and C1 should still be defined after fix
      expect(cellB1).toBeDefined();
      expect(cellC1).toBeDefined();
      
      const alarmsData = XLSX.utils.sheet_to_json<string[]>(alarmsSheet, { header: 1 });
      
      // Verify header row has 3 separate values
      expect(alarmsData[0]).toHaveLength(3);
      expect(alarmsData[0][0]).toBe('Timestamp');
      expect(alarmsData[0][1]).toBe('Alarm/Event');
      expect(alarmsData[0][2]).toBe('Serial Number');
      
      // Verify first data row has 3 separate values
      expect(alarmsData[1]).toHaveLength(3);
      expect(alarmsData[1][0]).toBe('2025-10-26 14:02');
      expect(alarmsData[1][1]).toBe('Resume Pump Alarm (18A)');
      expect(alarmsData[1][2]).toBe(1266847);
    });

    it('should handle single dataset', async () => {
      const csvFiles = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Should have Summary and bg sheets
      expect(workbook.SheetNames).toHaveLength(2);
      expect(workbook.SheetNames).toContain('Summary');
      expect(workbook.SheetNames).toContain('bg');
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Should have Summary + 4 dataset sheets
      expect(workbook.SheetNames).toHaveLength(5);
      expect(workbook.SheetNames[0]).toBe('Summary');
    });

    it('should sanitize sheet names to meet Excel requirements', async () => {
      const csvFiles = {
        'test:data*with/special\\chars[1].csv': generateMockCsvContent('bg_data', 5),
      };
      
      const uploadedFile = await createMockUploadedFile(csvFiles);
      const xlsxBlob = await convertZipToXlsx(uploadedFile);
      
      // Parse the XLSX blob
      const arrayBuffer = await blobToArrayBuffer(xlsxBlob);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Sheet names should not contain invalid characters
      workbook.SheetNames.forEach(sheetName => {
        expect(sheetName).not.toMatch(/[\\/*?[\]:]/);
        expect(sheetName.length).toBeLessThanOrEqual(31);
      });
    });
  });
});
