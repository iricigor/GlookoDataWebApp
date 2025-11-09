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
