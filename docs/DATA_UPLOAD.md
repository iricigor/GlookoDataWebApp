# Data Upload Guide

The Data Upload page is your gateway to importing and managing Glooko export data. This guide covers all features and functionality available on this page.

## Overview

The Data Upload page provides a modern, intuitive interface for uploading ZIP files containing CSV data exported from the Glooko platform. All processing happens locally in your browser, ensuring your data privacy.

## Getting Started

### Accessing the Data Upload Page

1. Launch the GlookoDataWebApp
2. Click the **Data Upload** button in the navigation menu
3. You'll see the upload zone and file management interface

![Data Upload Page - Empty State](https://github.com/user-attachments/assets/446b5a28-4763-42f5-857d-5dd8c44147a2)

## Features

### 1. Drag-and-Drop Upload Zone

The upload zone supports two methods for adding files:

- **Drag and Drop**: Simply drag one or multiple ZIP files from your file manager onto the upload zone
- **Click to Browse**: Click anywhere in the upload zone or use the "Select Files" button to open your system's file picker

The upload zone accepts only ZIP files containing CSV data from Glooko exports.

### 2. File Validation

When you upload a ZIP file, the application automatically validates its contents:

#### Valid ZIP Files ✅

A ZIP file is considered **valid** when:
- It contains at least one CSV file
- All CSV files have the same metadata line (first row)
- Each CSV file follows the expected format:
  - **Line 1**: Metadata (e.g., `Name:Igor Irić	Date Range:2025-07-29 - 2025-10-26`)
  - **Line 2**: Column headers (e.g., `Timestamp	Glucose Value (mmol/l)	Manual Reading	Serial Number`)
  - **Lines 3+**: Data rows

Valid files display a green **Valid** badge.

#### Invalid ZIP Files ❌

A ZIP file is marked as **invalid** when:
- It contains no CSV files
- CSV files have different metadata lines
- The file cannot be processed

Invalid files display a red **Invalid** badge with an error message.

![Data Upload Page - Invalid Files](https://github.com/user-attachments/assets/8b230ebb-7965-40b0-9dc4-8a47812c5c51)

*Example showing files marked as invalid because they contain CSV files with different metadata lines (different patients).*

#### CSV Data Format

The application expects CSV files with this structure:

![CSV Metadata Extraction](https://github.com/user-attachments/assets/1ecdd7da-107d-4110-b5bd-80c799ae39ec)

As shown in the example above, the extraction process:
1. **Extracts the metadata line** (first row) containing patient name, date range, etc.
2. **Parses column headers** (second row) and displays them as colored tags
3. **Counts data rows** (excluding metadata and header rows)

### 3. File List and Management

All uploaded files are displayed in a comprehensive table showing:

- **File Name**: The name of the uploaded ZIP file with validation badge
- **Upload Time**: When the file was uploaded (local time)
- **File Size**: Size of the ZIP file in human-readable format (KB, MB)
- **Actions**: Remove button to delete individual files

The table header also shows the total count of uploaded files and a **Clear All** button to remove all files at once.

![Data Upload Page - With Uploaded Files](https://github.com/user-attachments/assets/00e951f4-685f-4550-8cd4-d5b1be69436f)

*Example showing two valid ZIP files with green "Valid" badges. Each file has an expandable chevron icon to view details.*

### 4. Expandable Metadata View

For valid ZIP files, click the **chevron icon** (▶) next to the file name to expand and view detailed information:

![Data Upload Page - Expanded File Details](https://github.com/user-attachments/assets/66b9860d-3804-4952-8936-86fbe44e4395)

*Example showing expanded view with metadata, CSV file names, column headers as colored tags, and row counts.*

#### Metadata Section

The metadata line extracted from the CSV files is displayed in a monospace font with a gray background. This line typically contains:
- Patient name
- Date range of the data
- Other export-specific information

Example:
```
Name:Igor Irić	Date Range:2025-07-29 - 2025-10-26
```

#### CSV Files List

Each CSV file in the ZIP is listed with:
- **File name**: The name of the CSV file
- **Column names**: Column headers displayed as colored tags
- **Row count**: Number of data rows (excluding metadata and header rows)

Example display:
```
glucose_data.csv
[Timestamp] [Glucose Value (mmol/l)] [Manual Reading] [Serial Number]
9 rows
```

### 5. Data Processing

The application processes your data as follows:

1. **Extracts metadata**: Reads the first line from each CSV file
2. **Validates consistency**: Ensures all CSV files have identical metadata
3. **Parses headers**: Extracts column names from the second line
4. **Counts data rows**: Calculates the number of actual data rows (excluding metadata and header)
5. **Stores information**: Keeps all data in browser memory for the session

### 6. Browser-Based Storage

**Important**: All uploaded files are stored in your browser's memory:
- ✅ No data is sent to any server
- ✅ Complete privacy and security
- ✅ Fast local processing
- ⚠️ Files are cleared when you close the browser tab or refresh the page
- ⚠️ Large files may consume significant memory

## Usage Examples

### Example 1: Uploading a Single ZIP File

1. Navigate to the Data Upload page
2. Click "Select Files" or drag your ZIP file onto the upload zone
3. Wait for the file to be processed (usually instant)
4. Check the validation badge - it should show "Valid" in green
5. Click the chevron icon to expand and view the metadata and CSV details

### Example 2: Uploading Multiple ZIP Files

1. Select or drag multiple ZIP files at once
2. Each file is processed independently
3. Review the validation status of each file
4. Expand any file to see its contents
5. Remove invalid files using the delete button

### Example 3: Viewing CSV Details

1. Upload a valid ZIP file
2. Click the chevron icon next to the file name
3. Review the metadata line at the top
4. Scroll through the list of CSV files
5. Check the column names to understand the data structure
6. Note the row counts for each CSV file

## Data Format Requirements

For successful processing, your CSV files must follow this format:

```csv
Name:Igor Irić	Date Range:2025-07-29 - 2025-10-26		
Timestamp	Glucose Value (mmol/l)	Manual Reading	Serial Number
10/26/2025 11:20	7.2	M	1266847
10/26/2025 10:02	5.2	M	1266847
10/25/2025 19:55	14.8	M	1266847
```

**Key requirements**:
- First line: Metadata (tab-separated key-value pairs)
- Second line: Column headers (tab-separated)
- Subsequent lines: Data rows (tab-separated values)
- All CSV files in the same ZIP must have identical metadata lines

## Troubleshooting

### "No CSV files found in ZIP archive"

**Cause**: The ZIP file doesn't contain any files with a `.csv` extension.

**Solution**: 
- Ensure you're uploading a ZIP file containing CSV exports from Glooko
- Check that the CSV files have the correct `.csv` extension
- Verify the ZIP file isn't corrupted

### "Not all CSV files have the same metadata line"

**Cause**: The CSV files in your ZIP have different metadata lines (different patients, date ranges, etc.).

**Solution**:
- Create separate ZIP files for data from different exports
- Ensure all CSV files in one ZIP come from the same Glooko export session
- Verify the first line of each CSV file matches exactly

### File Won't Upload

**Possible causes and solutions**:
- **Wrong file type**: Only ZIP files are accepted
- **File too large**: Try compressing the data more or splitting into multiple ZIP files
- **Browser memory**: Close other tabs and try again
- **Corrupted file**: Re-export the data from Glooko

## Best Practices

1. **Organize Your Data**: Keep CSV files from the same export/patient in one ZIP file
2. **Name Meaningfully**: Use descriptive names for your ZIP files (e.g., `patient_2025-Q3.zip`)
3. **Regular Cleanup**: Remove old files you no longer need to free up browser memory
4. **Verify Before Analysis**: Always expand and review the metadata before proceeding to analysis
5. **Check Row Counts**: Verify the row counts match your expectations

## Technical Notes

- **Supported Browsers**: All modern browsers (Chrome, Firefox, Edge, Safari)
- **File Size Limit**: Limited by browser memory (typically 100-500MB)
- **Processing Speed**: Instant for files under 10MB, a few seconds for larger files
- **Concurrent Uploads**: You can upload multiple files simultaneously
- **Data Retention**: Files persist only for the current browser session

## Next Steps

After successfully uploading your data:

1. Navigate to the **Reports** page to view analytics and trends
2. Try the **AI Analysis** feature for intelligent insights
3. Configure **Settings** for your preferences

---

For more information, see the [main README](../README.md) or [contributing guide](../CONTRIBUTING.md).
