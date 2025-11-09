/**
 * Unit tests for glucose data extraction utilities
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { extractGlucoseReadings } from './glucoseDataUtils';
import type { UploadedFile } from '../types';

/**
 * Helper function to create a mock uploaded file for testing
 */
async function createMockUploadedFileWithUnit(
  datasetName: string,
  unit: 'mg/dL' | 'mmol/L',
  values: number[]
): Promise<UploadedFile> {
  const zip = new JSZip();
  
  // Create CSV content with specified unit
  const lines: string[] = [];
  lines.push('Name:Test Patient\tDate Range:2025-01-01 - 2025-01-14'); // Metadata
  lines.push(`Timestamp\tGlucose Value (${unit})\tDevice\tNotes`); // Header with unit
  
  // Add data rows with sample timestamps
  values.forEach((value, index) => {
    const date = new Date('2025-01-01T10:00:00');
    date.setHours(10 + index);
    const timestamp = date.toISOString().replace('T', ' ').substring(0, 19);
    lines.push(`${timestamp}\t${value}\tTest Device\t`);
  });
  
  const csvContent = lines.join('\n');
  const fileName = `${datasetName}_data_1.csv`;
  zip.file(fileName, csvContent);
  
  // Generate the ZIP file as a Blob
  const blob = await zip.generateAsync({ type: 'blob' });
  const file = new File([blob], 'test.zip', { type: 'application/zip' });
  
  return {
    id: 'test-id',
    name: 'test.zip',
    size: blob.size,
    uploadTime: new Date(),
    file,
    zipMetadata: {
      isValid: true,
      csvFiles: [
        {
          name: datasetName,
          rowCount: values.length,
          columnNames: ['Timestamp', `Glucose Value (${unit})`, 'Device', 'Notes'],
        }
      ],
    },
  };
}

describe('glucoseDataUtils', () => {
  describe('extractGlucoseReadings', () => {
    it('should convert mmol/L values to mg/dL', async () => {
      // Values in mmol/L: 13.4, 12.8, 12.4, 12, 11.7, 11, 9.6, 9.2
      const mmolValues = [13.4, 12.8, 12.4, 12, 11.7, 11, 9.6, 9.2];
      const uploadedFile = await createMockUploadedFileWithUnit('bg', 'mmol/L', mmolValues);
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(8);
      
      // Check conversions (mmol/L * 18.018 = mg/dL)
      expect(readings[0].value).toBeCloseTo(13.4 * 18.018, 1); // ~241.4 mg/dL
      expect(readings[1].value).toBeCloseTo(12.8 * 18.018, 1); // ~230.6 mg/dL
      expect(readings[6].value).toBeCloseTo(9.6 * 18.018, 1);  // ~173.0 mg/dL
      expect(readings[7].value).toBeCloseTo(9.2 * 18.018, 1);  // ~165.8 mg/dL
    });

    it('should keep mg/dL values unchanged', async () => {
      // Values already in mg/dL
      const mgdlValues = [241, 231, 223, 216, 211, 198, 173, 166];
      const uploadedFile = await createMockUploadedFileWithUnit('bg', 'mg/dL', mgdlValues);
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(8);
      
      // Values should remain the same
      expect(readings[0].value).toBe(241);
      expect(readings[1].value).toBe(231);
      expect(readings[6].value).toBe(173);
      expect(readings[7].value).toBe(166);
    });

    it('should detect mmol/L without slash', async () => {
      // Test with "mmol" instead of "mmol/L"
      const zip = new JSZip();
      const lines: string[] = [];
      lines.push('Name:Test\tDate Range:2025-01-01 - 2025-01-01');
      lines.push('Timestamp\tGlucose Value (mmol)\tDevice'); // Note: mmol without /L
      lines.push('2025-01-01 10:00:00\t10.0\tDevice');
      
      zip.file('bg_data_1.csv', lines.join('\n'));
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'test.zip', { type: 'application/zip' });
      
      const uploadedFile: UploadedFile = {
        id: 'test-id',
        name: 'test.zip',
        size: blob.size,
        uploadTime: new Date(),
        file,
        zipMetadata: {
          isValid: true,
          csvFiles: [{ name: 'bg', rowCount: 1, columnNames: ['Timestamp', 'Glucose Value (mmol)', 'Device'] }],
        },
      };
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(1);
      expect(readings[0].value).toBeCloseTo(180.18, 1); // 10.0 * 18.018
    });

    it('should handle mixed case in units', async () => {
      // Test case-insensitive unit detection
      const zip = new JSZip();
      const lines: string[] = [];
      lines.push('Name:Test\tDate Range:2025-01-01 - 2025-01-01');
      lines.push('Timestamp\tGlucose Value (MMOL/L)\tDevice'); // Uppercase
      lines.push('2025-01-01 10:00:00\t5.5\tDevice');
      
      zip.file('bg_data_1.csv', lines.join('\n'));
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'test.zip', { type: 'application/zip' });
      
      const uploadedFile: UploadedFile = {
        id: 'test-id',
        name: 'test.zip',
        size: blob.size,
        uploadTime: new Date(),
        file,
        zipMetadata: {
          isValid: true,
          csvFiles: [{ name: 'bg', rowCount: 1, columnNames: ['Timestamp', 'Glucose Value (MMOL/L)', 'Device'] }],
        },
      };
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(1);
      expect(readings[0].value).toBeCloseTo(99.1, 1); // 5.5 * 18.018
    });
  });
});
