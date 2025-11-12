/**
 * Unit tests for glucose data extraction utilities
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { extractGlucoseReadings, smoothGlucoseValues } from './glucoseDataUtils';
import type { UploadedFile, GlucoseReading } from '../types';

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
    it('should keep mmol/L values unchanged', async () => {
      // Values in mmol/L: 13.4, 12.8, 12.4, 12, 11.7, 11, 9.6, 9.2
      const mmolValues = [13.4, 12.8, 12.4, 12, 11.7, 11, 9.6, 9.2];
      const uploadedFile = await createMockUploadedFileWithUnit('bg', 'mmol/L', mmolValues);
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(8);
      
      // Values should remain in mmol/L
      expect(readings[0].value).toBe(13.4);
      expect(readings[1].value).toBe(12.8);
      expect(readings[6].value).toBe(9.6);
      expect(readings[7].value).toBe(9.2);
    });

    it('should handle data with mmol/L values', async () => {
      // All input data is assumed to be in mmol/L
      const mmolValues = [13.4, 12.8, 12.4, 12, 11.7, 11, 9.6, 9.2];
      const uploadedFile = await createMockUploadedFileWithUnit('bg', 'mmol/L', mmolValues);
      
      const readings = await extractGlucoseReadings(uploadedFile, 'bg');
      
      expect(readings).toHaveLength(8);
      
      // Values should remain in mmol/L (no conversion)
      expect(readings[0].value).toBe(13.4);
      expect(readings[1].value).toBe(12.8);
      expect(readings[6].value).toBe(9.6);
      expect(readings[7].value).toBe(9.2);
    });

    it('should handle data regardless of unit header label', async () => {
      // Test with "mmol" label - input is still assumed to be mmol/L
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
      expect(readings[0].value).toBe(10.0); // Input is in mmol/L
    });

    it('should handle data with MMOL/L label (case insensitive)', async () => {
      // Test case-insensitive - input is assumed to be in mmol/L
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
      expect(readings[0].value).toBe(5.5); // Input is in mmol/L
    });
  });
});

describe('smoothGlucoseValues', () => {
  it('should return original readings if less than 3 data points', () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date('2025-01-01T10:00:00'), value: 5.5 },
      { timestamp: new Date('2025-01-01T10:05:00'), value: 6.0 },
    ];
    
    const smoothed = smoothGlucoseValues(readings);
    
    expect(smoothed).toEqual(readings);
  });

  it('should smooth values using moving average for middle points', () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date('2025-01-01T10:00:00'), value: 6.0 },
      { timestamp: new Date('2025-01-01T10:05:00'), value: 9.0 },
      { timestamp: new Date('2025-01-01T10:10:00'), value: 6.0 },
    ];
    
    const smoothed = smoothGlucoseValues(readings);
    
    expect(smoothed).toHaveLength(3);
    // First value: average of 6.0 and 9.0 = 7.5
    expect(smoothed[0].value).toBe(7.5);
    // Middle value: average of 6.0, 9.0, and 6.0 = 7.0
    expect(smoothed[1].value).toBe(7.0);
    // Last value: average of 9.0 and 6.0 = 7.5
    expect(smoothed[2].value).toBe(7.5);
  });

  it('should preserve timestamps while smoothing values', () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date('2025-01-01T10:00:00'), value: 5.0 },
      { timestamp: new Date('2025-01-01T10:05:00'), value: 7.0 },
      { timestamp: new Date('2025-01-01T10:10:00'), value: 9.0 },
      { timestamp: new Date('2025-01-01T10:15:00'), value: 6.0 },
    ];
    
    const smoothed = smoothGlucoseValues(readings);
    
    expect(smoothed).toHaveLength(4);
    expect(smoothed[0].timestamp).toEqual(readings[0].timestamp);
    expect(smoothed[1].timestamp).toEqual(readings[1].timestamp);
    expect(smoothed[2].timestamp).toEqual(readings[2].timestamp);
    expect(smoothed[3].timestamp).toEqual(readings[3].timestamp);
  });

  it('should handle larger dataset correctly', () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date('2025-01-01T10:00:00'), value: 5.0 },
      { timestamp: new Date('2025-01-01T10:05:00'), value: 6.0 },
      { timestamp: new Date('2025-01-01T10:10:00'), value: 7.0 },
      { timestamp: new Date('2025-01-01T10:15:00'), value: 8.0 },
      { timestamp: new Date('2025-01-01T10:20:00'), value: 9.0 },
    ];
    
    const smoothed = smoothGlucoseValues(readings);
    
    expect(smoothed).toHaveLength(5);
    // First: (5.0 + 6.0) / 2 = 5.5
    expect(smoothed[0].value).toBe(5.5);
    // Second: (5.0 + 6.0 + 7.0) / 3 = 6.0
    expect(smoothed[1].value).toBe(6.0);
    // Third: (6.0 + 7.0 + 8.0) / 3 = 7.0
    expect(smoothed[2].value).toBe(7.0);
    // Fourth: (7.0 + 8.0 + 9.0) / 3 = 8.0
    expect(smoothed[3].value).toBe(8.0);
    // Last: (8.0 + 9.0) / 2 = 8.5
    expect(smoothed[4].value).toBe(8.5);
  });

  it('should handle empty array', () => {
    const readings: GlucoseReading[] = [];
    
    const smoothed = smoothGlucoseValues(readings);
    
    expect(smoothed).toEqual([]);
  });
});
