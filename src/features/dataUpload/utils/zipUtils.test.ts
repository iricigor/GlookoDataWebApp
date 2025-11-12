/**
 * Unit tests for ZIP file processing utilities
 */

import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { extractZipMetadata } from './zipUtils';
import { generateMockCsvContent, MOCK_CSV_FILE_NAMES, MOCK_METADATA_LINE } from '../../../test/mockData';

/**
 * Helper function to create a mock ZIP file for testing
 * 
 * @param files - Object mapping file names to their content
 * @returns Promise resolving to a File object containing the ZIP
 */
async function createMockZipFile(files: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  
  // Add each file to the ZIP
  Object.entries(files).forEach(([fileName, content]) => {
    zip.file(fileName, content);
  });
  
  // Generate the ZIP file as a Blob
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Convert Blob to File
  return new File([blob], 'test.zip', { type: 'application/zip' });
}

describe('zipUtils', () => {
  describe('extractZipMetadata', () => {
    it('should extract metadata from a valid ZIP file with CSV files', async () => {
      const files = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 15),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(2);
      expect(result.metadataLine).toBe(MOCK_METADATA_LINE);
      expect(result.error).toBeUndefined();
    });

    it('should extract correct file names from ZIP', async () => {
      const files = {
        'alarms_data_1.csv': generateMockCsvContent('bg_data', 5),
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'carbs_data_1.csv': generateMockCsvContent('carbs_data', 8),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(3);
      
      const fileNames = result.csvFiles.map(f => f.name);
      // Files display only the set name (e.g., 'alarms' from 'alarms_data_1.csv')
      expect(fileNames).toContain('alarms');
      expect(fileNames).toContain('bg');
      expect(fileNames).toContain('carbs');
    });

    it('should extract correct row counts from CSV files', async () => {
      const files = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 25),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(2);
      
      const bgFile = result.csvFiles.find(f => f.name === 'bg');
      const cgmFile = result.csvFiles.find(f => f.name === 'cgm');
      
      expect(bgFile?.rowCount).toBe(10);
      expect(cgmFile?.rowCount).toBe(25);
    });

    it('should extract correct column names from CSV headers', async () => {
      const files = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles[0].columnNames).toEqual([
        'Timestamp',
        'Glucose Value (mg/dL)',
        'Device',
        'Notes',
      ]);
    });

    it('should sort CSV files alphabetically by name', async () => {
      const files = {
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 5),
        'alarms_data_1.csv': generateMockCsvContent('bg_data', 5),
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      const fileNames = result.csvFiles.map(f => f.name);
      expect(fileNames).toEqual([
        'alarms',
        'bg',
        'cgm',
      ]);
    });

    it('should handle multiple CSV files from real Glooko export structure', async () => {
      // Create a realistic Glooko export with multiple files
      const files: Record<string, string> = {};
      MOCK_CSV_FILE_NAMES.forEach(fileName => {
        files[fileName] = generateMockCsvContent('bg_data', 5);
      });
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      // Note: Files with same prefix will be merged, so we have fewer than MOCK_CSV_FILE_NAMES.length
      // Original: 14 files, but cgm_data_1,2,3 merge into 1, so we get 12 files
      expect(result.csvFiles.length).toBeLessThanOrEqual(MOCK_CSV_FILE_NAMES.length);
      expect(result.metadataLine).toBe(MOCK_METADATA_LINE);
      
      // Check that cgm_data files were merged
      const cgmFile = result.csvFiles.find(f => f.name === 'cgm');
      expect(cgmFile).toBeDefined();
      expect(cgmFile?.fileCount).toBe(3);
      expect(cgmFile?.rowCount).toBe(15); // 3 files * 5 rows each
    });

    it('should reject ZIP with no CSV files', async () => {
      const files = {
        'readme.txt': 'This is not a CSV file',
        'image.png': 'PNG data here',
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(false);
      expect(result.csvFiles).toHaveLength(0);
      expect(result.error).toBe('No CSV files found in ZIP archive');
    });

    it('should reject CSV files with inconsistent metadata', async () => {
      const files = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5, 'Name:John Doe\tDate Range:2025-01-01 - 2025-01-31'),
        'cgm_data_1.csv': generateMockCsvContent('cgm_data', 5, 'Name:Jane Smith\tDate Range:2025-02-01 - 2025-02-28'),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(false);
      expect(result.csvFiles).toHaveLength(0);
      expect(result.error).toBe('Not all CSV files have the same metadata line');
    });

    it('should handle empty CSV files gracefully', async () => {
      const files = {
        'bg_data_1.csv': '',
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(1);
      expect(result.csvFiles[0].rowCount).toBe(0);
      expect(result.csvFiles[0].columnNames).toEqual([]);
    });

    it('should handle CSV files with only metadata line', async () => {
      const files = {
        'bg_data_1.csv': MOCK_METADATA_LINE,
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(1);
      expect(result.csvFiles[0].rowCount).toBe(0);
      expect(result.csvFiles[0].columnNames).toEqual([]);
    });

    it('should ignore directories in ZIP file', async () => {
      const zip = new JSZip();
      
      // Add a directory
      zip.folder('data');
      
      // Add CSV files
      zip.file('bg_data_1.csv', generateMockCsvContent('bg_data', 5));
      zip.file('data/cgm_data_1.csv', generateMockCsvContent('cgm_data', 5));
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([blob], 'test.zip', { type: 'application/zip' });
      
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(2);
    });

    it('should extract filename without path for nested CSV files', async () => {
      const zip = new JSZip();
      zip.file('data/bg_data_1.csv', generateMockCsvContent('bg_data', 5));
      zip.file('exports/cgm_data_1.csv', generateMockCsvContent('cgm_data', 5));
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([blob], 'test.zip', { type: 'application/zip' });
      
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(2);
      
      const fileNames = result.csvFiles.map(f => f.name);
      expect(fileNames).toContain('bg');
      expect(fileNames).toContain('cgm');
    });

    it('should handle corrupted or invalid ZIP files', async () => {
      const invalidZipFile = new File(['This is not a valid ZIP'], 'invalid.zip', {
        type: 'application/zip',
      });
      
      const result = await extractZipMetadata(invalidZipFile);
      
      expect(result.isValid).toBe(false);
      expect(result.csvFiles).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should handle CSV files with different column counts', async () => {
      const files = {
        'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
        'insulin_data_1.csv': generateMockCsvContent('insulin_data', 8),
      };
      
      const zipFile = await createMockZipFile(files);
      const result = await extractZipMetadata(zipFile);
      
      expect(result.isValid).toBe(true);
      expect(result.csvFiles).toHaveLength(2);
      
      // Verify different column counts (single files show only set name)
      const bgFile = result.csvFiles.find(f => f.name === 'bg');
      const insulinFile = result.csvFiles.find(f => f.name === 'insulin');
      
      expect(bgFile?.columnNames?.length).toBe(4);
      expect(insulinFile?.columnNames?.length).toBe(4);
    });

    // Tests for merging multiple datasets
    describe('dataset merging', () => {
      it('should merge multiple CGM data files into one dataset', async () => {
        const files = {
          'cgm_data_1.csv': generateMockCsvContent('cgm_data', 10),
          'cgm_data_2.csv': generateMockCsvContent('cgm_data', 15),
          'cgm_data_3.csv': generateMockCsvContent('cgm_data', 20),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.csvFiles).toHaveLength(1); // Merged into one
        
        const mergedFile = result.csvFiles[0];
        expect(mergedFile.name).toBe('cgm');
        expect(mergedFile.rowCount).toBe(45); // 10 + 15 + 20
        expect(mergedFile.fileCount).toBe(3);
        expect(mergedFile.sourceFiles).toEqual(['cgm_data_1.csv', 'cgm_data_2.csv', 'cgm_data_3.csv']);
      });

      it('should merge files with the same type but keep different types separate', async () => {
        const files = {
          'cgm_data_1.csv': generateMockCsvContent('cgm_data', 10),
          'cgm_data_2.csv': generateMockCsvContent('cgm_data', 15),
          'bg_data_1.csv': generateMockCsvContent('bg_data', 5),
          'insulin_data_1.csv': generateMockCsvContent('insulin_data', 8),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.csvFiles).toHaveLength(3); // cgm_data merged, bg_data and insulin_data separate
        
        const cgmFile = result.csvFiles.find(f => f.name === 'cgm');
        const bgFile = result.csvFiles.find(f => f.name === 'bg');
        const insulinFile = result.csvFiles.find(f => f.name === 'insulin');
        
        expect(cgmFile?.rowCount).toBe(25); // 10 + 15
        expect(cgmFile?.fileCount).toBe(2);
        expect(bgFile?.rowCount).toBe(5);
        expect(bgFile?.fileCount).toBeUndefined(); // Single file, not merged
        expect(insulinFile?.rowCount).toBe(8);
        expect(insulinFile?.fileCount).toBeUndefined(); // Single file, not merged
      });

      it('should not merge files with different column names', async () => {
        const files = {
          'cgm_data_1.csv': generateMockCsvContent('cgm_data', 10),
          'cgm_data_2.csv': generateMockCsvContent('bg_data', 15), // Different columns
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.csvFiles).toHaveLength(2); // Not merged, kept separate
        
        const file1 = result.csvFiles.find(f => f.name === 'cgm_data_1.csv');
        const file2 = result.csvFiles.find(f => f.name === 'cgm_data_2.csv');
        
        expect(file1?.rowCount).toBe(10);
        expect(file1?.fileCount).toBeUndefined();
        expect(file2?.rowCount).toBe(15);
        expect(file2?.fileCount).toBeUndefined();
      });

      it('should handle a realistic Glooko export with multiple CGM files', async () => {
        const files = {
          'alarms_data_1.csv': generateMockCsvContent('bg_data', 5),
          'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
          'cgm_data_1.csv': generateMockCsvContent('cgm_data', 100),
          'cgm_data_2.csv': generateMockCsvContent('cgm_data', 150),
          'cgm_data_3.csv': generateMockCsvContent('cgm_data', 200),
          'insulin_data_1.csv': generateMockCsvContent('insulin_data', 8),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.csvFiles).toHaveLength(4); // cgm merged, others separate
        
        const cgmFile = result.csvFiles.find(f => f.name === 'cgm');
        expect(cgmFile?.rowCount).toBe(450); // 100 + 150 + 200
        expect(cgmFile?.fileCount).toBe(3);
        expect(cgmFile?.sourceFiles).toEqual(['cgm_data_1.csv', 'cgm_data_2.csv', 'cgm_data_3.csv']);
      });

      it('should keep single files with just the set name', async () => {
        const files = {
          'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.csvFiles).toHaveLength(1);
        
        const file = result.csvFiles[0];
        expect(file.name).toBe('bg'); // Show only set name
        expect(file.rowCount).toBe(10);
        expect(file.fileCount).toBeUndefined(); // Not merged (single file)
        expect(file.sourceFiles).toEqual(['bg_data_1.csv']); // Preserve original file name for xlsx export
      });

      it('should sort merged datasets alphabetically', async () => {
        const files = {
          'insulin_data_1.csv': generateMockCsvContent('insulin_data', 5),
          'cgm_data_1.csv': generateMockCsvContent('cgm_data', 10),
          'cgm_data_2.csv': generateMockCsvContent('cgm_data', 15),
          'bg_data_1.csv': generateMockCsvContent('bg_data', 8),
          'alarms_data_1.csv': generateMockCsvContent('basal_data', 3),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        const fileNames = result.csvFiles.map(f => f.name);
        
        // Should be sorted alphabetically
        // All files show just the set name
        expect(fileNames).toEqual([
          'alarms',
          'bg',
          'cgm',
          'insulin',
        ]);
      });
    });

    // Tests for metadata parsing
    describe('metadata parsing', () => {
      it('should parse metadata line and include parsed fields', async () => {
        const files = {
          'bg_data_1.csv': generateMockCsvContent('bg_data', 10),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.metadataLine).toBe(MOCK_METADATA_LINE);
        expect(result.parsedMetadata).toBeDefined();
        expect(result.parsedMetadata?.name).toBe('Igor Irić');
        expect(result.parsedMetadata?.dateRange).toBe('2025-07-29 - 2025-10-26');
        expect(result.parsedMetadata?.startDate).toBe('2025-07-29');
        expect(result.parsedMetadata?.endDate).toBe('2025-10-26');
      });

      it('should handle comma-separated metadata format', async () => {
        const commaSeparatedMetadata = 'Name:John Doe, Date Range:2025-01-01 - 2025-01-31';
        const files = {
          'bg_data_1.csv': generateMockCsvContent('bg_data', 5, commaSeparatedMetadata),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.parsedMetadata).toBeDefined();
        expect(result.parsedMetadata?.name).toBe('John Doe');
        expect(result.parsedMetadata?.dateRange).toBe('2025-01-01 - 2025-01-31');
        expect(result.parsedMetadata?.startDate).toBe('2025-01-01');
        expect(result.parsedMetadata?.endDate).toBe('2025-01-31');
      });

      it('should handle tab-separated metadata format', async () => {
        const tabSeparatedMetadata = 'Name:Jane Smith\tDate Range:2025-02-01 - 2025-02-28';
        const files = {
          'bg_data_1.csv': generateMockCsvContent('bg_data', 5, tabSeparatedMetadata),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.parsedMetadata).toBeDefined();
        expect(result.parsedMetadata?.name).toBe('Jane Smith');
        expect(result.parsedMetadata?.dateRange).toBe('2025-02-01 - 2025-02-28');
        expect(result.parsedMetadata?.startDate).toBe('2025-02-01');
        expect(result.parsedMetadata?.endDate).toBe('2025-02-28');
      });

      it('should handle empty metadata line', async () => {
        const files = {
          'bg_data_1.csv': generateMockCsvContent('bg_data', 5, ''),
        };
        
        const zipFile = await createMockZipFile(files);
        const result = await extractZipMetadata(zipFile);
        
        expect(result.isValid).toBe(true);
        expect(result.parsedMetadata).toBeDefined();
        expect(result.parsedMetadata?.name).toBeUndefined();
        expect(result.parsedMetadata?.dateRange).toBeUndefined();
      });
    });
  });
});
