# Application Screenshots

This page showcases the GlookoDataWebApp interface with various features and views.

## Home Page

### Light Mode

![GlookoDataWebApp Home Page](https://github.com/user-attachments/assets/9630fcd4-4eca-4fb6-80c5-b4d53215b1c9)

The application features a modern, Microsoft Fluent UI-based interface with intuitive navigation to key sections:
- **Data Upload** - Upload and manage your Glooko export files
- **Comprehensive Reports** - View detailed analytics and trends
- **AI Analysis** - Get intelligent insights using AI algorithms
- **Settings** - Configure data persistence options and theme preferences

### Dark Mode

![GlookoDataWebApp Home Page - Dark Mode](https://github.com/user-attachments/assets/a64897c8-019f-44d7-8957-33a61b8f6c8a)

The application supports both light and dark themes with an automatic system preference detection option. Theme preferences are saved and persist across sessions.

## Mobile Responsive Design

### Compact Layout

![Mobile View](https://github.com/user-attachments/assets/9a03cc4e-a204-43f8-8726-815a5218e5b0)

The application is fully responsive and optimized for mobile devices:

- **Hamburger Menu** - Navigation automatically switches to a compact menu on small screens
- **Single Column Layout** - Content cards stack vertically for better readability
- **Touch-Friendly** - All interactive elements are sized appropriately for touch input
- **No Horizontal Overflow** - Content fits perfectly within the viewport

### Mobile Menu

![Mobile Menu Open](https://github.com/user-attachments/assets/b7570844-07a1-4f59-98b8-dc8a44858cea)

The hamburger menu provides easy access to all navigation items with a clean, touch-friendly interface.

## Data Upload Page

### Empty State

![Data Upload Page - Empty State](https://github.com/user-attachments/assets/446b5a28-4763-42f5-857d-5dd8c44147a2)

The Data Upload page provides an intuitive interface for importing Glooko export files with advanced features:

- **Drag-and-drop upload zone** - Simply drag ZIP files onto the page or click to browse
- **Intelligent CSV validation** - Validates metadata consistency across all CSV files
- **Metadata extraction** - Automatically extracts and displays patient info and date ranges
- **Column name detection** - Shows column headers from each CSV file
- **Accurate row counting** - Displays data row counts (excluding metadata and headers)
- **Expandable details view** - Click the chevron to see full metadata, CSV files, and column names
- **Browser-based processing** - All files are stored and processed locally for privacy

Files are maintained in memory for the duration of your session without being transmitted to any server, ensuring your data privacy.

### With Uploaded Files

![Data Upload Page - With Uploaded Files](https://github.com/user-attachments/assets/00e951f4-685f-4550-8cd4-d5b1be69436f)

Example showing two valid ZIP files with green "Valid" badges. Each file has an expandable chevron icon to view details.

### Expanded File Details

![Data Upload Page - Expanded File Details](https://github.com/user-attachments/assets/66b9860d-3804-4952-8936-86fbe44e4395)

Example showing expanded view with metadata, CSV file names, column headers as colored tags, and row counts.

### Invalid Files

![Data Upload Page - Invalid Files](https://github.com/user-attachments/assets/8b230ebb-7965-40b0-9dc4-8a47812c5c51)

Example showing files marked as invalid because they contain CSV files with different metadata lines (different patients).

### CSV Metadata Extraction

![CSV Metadata Extraction](https://github.com/user-attachments/assets/1ecdd7da-107d-4110-b5bd-80c799ae39ec)

The extraction process:
1. **Extracts the metadata line** (first row) containing patient name, date range, etc.
2. **Parses column headers** (second row) and displays them as colored tags
3. **Counts data rows** (excluding metadata and header rows)
4. **Merges related datasets** - Files with the same base name are automatically merged

### Export Button

![Data Upload with Export Button](https://github.com/user-attachments/assets/1ce3d310-e4cd-4a1a-9ea7-b9ec16592a2a)

Example showing a valid ZIP file with the export button (download icon) in the Actions column.

### Expanded Details with Export

![Expanded Details with Export](https://github.com/user-attachments/assets/55141ff6-118f-4a7b-a49c-020429060bb4)

Expanded view showing the datasets that will be exported to XLSX.

## Reports Page

### No Data Selected

![Reports - No Data Selected](https://github.com/user-attachments/assets/ec23f42c-9f2b-4c45-8978-4dc5da04abca)

When no data file is selected, the page prompts users to upload and select a data file.

### 3 Categories Mode

![Reports - 3 Categories Mode](https://github.com/user-attachments/assets/32f01e4a-7a28-487b-9bc9-4b42b084ed1c)

The default view shows glucose range analysis in 3-category mode (Low, In Range, High), displaying both day-of-week and daily breakdown.

### 5 Categories Mode

![Reports - 5 Categories Mode](https://github.com/user-attachments/assets/04ab4825-b51d-4c2f-bd3d-b4771f65a6f7)

Toggle to 5-category mode for more detailed analysis including Very Low and Very High ranges.

## Settings Page

![Settings Page](https://github.com/user-attachments/assets/3cdff779-be17-4782-b4bc-e84dc8be7032)

The Settings page provides configuration options for themes and blood glucose thresholds. All settings are stored locally in your browser for privacy.

---

For more information, see:
- [Main README](../README.md)
- [Data Upload Guide](DATA_UPLOAD.md)
- [Reports Documentation](REPORTS.md)
- [Settings Guide](SETTINGS.md)
