# Reports Feature Documentation

## Overview

The Reports page provides comprehensive glucose range analysis for diabetes data exported from the Glooko platform. This feature allows users to understand their time-in-range statistics grouped by day of the week and by date, helping identify patterns and trends in glucose management.

## Features

### In-Range Report

The In-Range Report analyzes glucose readings and categorizes them into ranges based on clinically relevant thresholds. This report provides two main views:

1. **Glucose Range by Day of Week**: Shows statistics aggregated by each day (Monday-Sunday), plus aggregated Workday (Mon-Fri) and Weekend (Sat-Sun) summaries
2. **Glucose Range by Date**: Shows daily breakdown of glucose range statistics for each date in the dataset

### Configurable Options

#### Data Source Selection

Users can choose between two data sources:

- **CGM Data** (Continuous Glucose Monitor): High-frequency readings, typically every 5 minutes
- **BG Data** (Blood Glucose): Manual blood glucose checks, typically 4-6 readings per day

Switch between data sources using the toggle in the controls section.

#### Category Mode

Users can select between two analysis modes:

- **3 Categories Mode**: Simpler view with Low, In Range, and High categories
  - **Low**: Below target range (< 3.9 mmol/L or ~70 mg/dL)
  - **In Range**: Within target range (3.9-10.0 mmol/L or ~70-180 mg/dL)
  - **High**: Above target range (> 10.0 mmol/L or ~180 mg/dL)

- **5 Categories Mode**: Detailed view with Very Low, Low, In Range, High, and Very High categories
  - **Very Low**: < 3.0 mmol/L (~54 mg/dL)
  - **Low**: 3.0-3.9 mmol/L (~54-70 mg/dL)
  - **In Range**: 3.9-10.0 mmol/L (~70-180 mg/dL)
  - **High**: 10.0-13.9 mmol/L (~180-250 mg/dL)
  - **Very High**: > 13.9 mmol/L (~250 mg/dL)

### Data Presentation

Each table cell displays:
- **Count**: Number of readings in that category
- **Percentage**: Proportion of total readings (shown with 1 decimal precision)

Example: `487 (84.5%)` means 487 readings representing 84.5% of total readings for that period.

## Screenshots

### Reports Page - No Data Selected

When no data file is selected, the page prompts users to upload and select a data file:

![Reports - No Data Selected](https://github.com/user-attachments/assets/ec23f42c-9f2b-4c45-8978-4dc5da04abca)

### Reports Page - 3 Categories Mode

The default view shows glucose range analysis in 3-category mode (Low, In Range, High), displaying both day-of-week and daily breakdown:

![Reports - 3 Categories Mode](https://github.com/user-attachments/assets/32f01e4a-7a28-487b-9bc9-4b42b084ed1c)

### Reports Page - 5 Categories Mode

Toggle to 5-category mode for more detailed analysis including Very Low and Very High ranges:

![Reports - 5 Categories Mode](https://github.com/user-attachments/assets/04ab4825-b51d-4c2f-bd3d-b4771f65a6f7)

## How to Use

1. **Upload Data**: Navigate to the Data Upload page and upload your Glooko export ZIP file
2. **Select File**: Click the radio button to select the uploaded file
3. **View Reports**: Navigate to the Reports page
4. **Configure Options**: 
   - Toggle between CGM and BG data sources
   - Toggle between 3 and 5 category modes
5. **Analyze Results**: Review the tables to understand your glucose control patterns

## Understanding Your Results

### Time in Range Goals

According to diabetes management guidelines, the general targets are:
- **Time in Range**: > 70% (ideally > 80%)
- **Time Below Range**: < 4% (< 1% for very low)
- **Time Above Range**: < 25%

### Day of Week Patterns

The day-of-week breakdown helps identify:
- Differences between workdays and weekends
- Specific days that may need attention
- Patterns related to routine changes

### Daily Trends

The daily date breakdown helps identify:
- Overall trend over time (improving or declining control)
- Impact of specific events or changes
- Consistency of glucose management

## Alternative Visualization Options (Future Enhancement)

While the current implementation uses tabular data representation, the following alternative visualizations could be considered for future releases:

### 1. Stacked Bar Charts
- Horizontal or vertical bars showing proportion of each glucose range category
- Color-coded segments (green for in-range, yellow/orange for low/high, red for very low/very high)
- Easy visual comparison across days or dates

### 2. Time-in-Range Pie Charts
- Circular visualization showing percentage breakdown
- Helpful for quick overview of overall glucose distribution
- Could be shown as small multiples for each day of the week

### 3. Heat Map Calendar View
- Calendar grid with each day colored based on time-in-range percentage
- Gradient coloring to show good days (green) vs. challenging days (red)
- Quick visual pattern recognition across weeks/months

### 4. Trend Line Charts
- Line graph showing time-in-range percentage over time
- Helps identify trends and improvements
- Could include moving average to smooth day-to-day variations

### 5. Ambulatory Glucose Profile (AGP)-style Display
- Percentile bands showing glucose distribution by time of day
- Overlay for each day of the week
- Industry-standard visualization familiar to healthcare professionals

These alternative views would complement the tabular data, providing different perspectives for different analysis needs. Implementation priority would be determined based on user feedback and clinical utility.

## Technical Notes

- **Privacy**: All data processing happens client-side in your browser. No data is transmitted to external servers.
- **Performance**: Large datasets (multiple weeks or months) may take a few seconds to process
- **Thresholds**: Glucose thresholds are configurable in the Settings page and default to international standard values
- **Data Quality**: The report excludes invalid readings (missing values, non-numeric data, timestamps outside the date range)

## Version Information

This feature was introduced in version 1.1.0 of Glooko Insights.
