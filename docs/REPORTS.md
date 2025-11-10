# Reports Feature Documentation

## Overview

The Reports page provides comprehensive glucose analysis for diabetes data exported from the Glooko platform. This feature includes two powerful reporting tools:

1. **In-Range Report**: Time-in-range statistics grouped by day of week and by date
2. **AGP Report**: Ambulatory Glucose Profile showing glucose patterns throughout the day

Both reports feature collapsible sections with summary visualizations, allowing users to understand their glucose control patterns and trends at a glance.

## Features

### In-Range Report

The In-Range Report analyzes glucose readings and categorizes them into ranges based on clinically relevant thresholds. 

#### Summary Visualization

When expanded, the report displays a colorful horizontal summary bar that provides an immediate visual representation of your overall glucose distribution:
- **Red segment**: Low glucose readings
- **Green segment**: In-range readings (the goal is to maximize this!)
- **Orange/Yellow segment**: High glucose readings

Below the bar, detailed statistics show the exact percentages and counts for each category, along with the total number of readings analyzed.

#### Report Views

The In-Range Report provides three main views:

1. **Glucose Range by Day of Week**: Shows statistics aggregated by each day (Monday-Sunday), plus aggregated Workday (Mon-Fri) and Weekend (Sat-Sun) summaries
2. **Glucose Range by Week**: Shows statistics grouped by week (e.g., "Oct 6-12")
3. **Glucose Range by Date**: Shows daily breakdown of glucose range statistics for each date in the dataset

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

#### Data Presentation

Each table cell displays:
- **Percentage**: Proportion of total readings (shown with 1 decimal precision)
- **Count**: Number of readings in that category (shown in parentheses)

Example: `84.5% (487)` means 84.5% of readings (487 total readings) for that period.

#### Date Range Filtering

Users can filter the In-Range Report data by specifying custom start and end dates, allowing focused analysis of specific time periods.

### AGP (Ambulatory Glucose Profile) Report

The AGP Report provides a comprehensive view of glucose patterns across a typical 24-hour period. This industry-standard visualization is widely used by healthcare professionals and diabetes educators to understand glucose control patterns.

#### AGP Graph Visualization

The interactive AGP graph consolidates multiple days of data into a single 24-hour profile, showing typical glucose patterns and variability:

- **Percentile Bands**: 
  - **Light blue area** (10-90th percentile): Shows the range where 80% of glucose values fall. A wider band indicates more glucose variability.
  - **Dark blue area** (25-75th percentile): Shows the interquartile range where 50% of glucose values fall. This represents the most common glucose levels.
  
- **Median Line**: Blue line showing the 50th percentile (median glucose value) for each time point throughout the day. This line shows the typical glucose trajectory.

- **Target Range Indicator**: Green dashed horizontal lines at 3.9 and 10.0 mmol/L (70-180 mg/dL) showing the recommended after-meal target range. The goal is to keep glucose levels between these lines.

The graph's X-axis displays the 24-hour time period (from midnight to midnight with markers at 12A, 6A, 12P, 6P), while the Y-axis shows glucose levels in mmol/L or mg/dL depending on your settings.

**What to look for in the AGP graph:**
- **Times of day with high variability**: Wide percentile bands indicate inconsistent glucose levels at those times
- **Periods of low glucose**: When the bands dip below the lower target line (hypoglycemia risk)
- **Periods of high glucose**: When the bands rise above the upper target line (hyperglycemia)
- **Pattern consistency**: Narrow bands indicate consistent, predictable glucose patterns
- **Meal impact**: You may see glucose rises after typical meal times (breakfast ~7-9am, lunch ~12-2pm, dinner ~6-8pm)

#### Statistical Analysis Table

Below the graph, a detailed table shows statistical data for each 5-minute time slot throughout the day:

- **Time**: 5-minute intervals from 00:00 to 23:55
- **Percentile Values**: Lowest, 10th, 25th, 50th (Median), 75th, 90th percentiles, and Highest
- **Count**: Number of readings available for that time slot across all days

This granular data allows for precise analysis of glucose patterns and helps identify specific times that may need attention.

#### Data Source Selection

Like the In-Range Report, the AGP Report supports both CGM and BG data sources, allowing flexibility based on the type of glucose monitoring device used.

## Screenshots

### Reports Page - Collapsed View

When first navigating to the Reports page with data loaded, both report sections are collapsed, showing only the headers. The selected data file is displayed at the top:

![Reports - Collapsed View](https://github.com/user-attachments/assets/fcdcc15e-6789-4039-b897-28a19ab0aadf)

### In-Range Report - Summary Bar and Controls

When the In-Range section is expanded, it displays a colorful summary bar showing the overall glucose distribution at a glance. The green "In Range" segment dominates in this example (70.4%), which is excellent glucose control:

![In-Range Report with Summary Bar](https://github.com/user-attachments/assets/6c43eaaf-8186-43d3-8960-9c35daa7ad93)

The controls allow you to:
- Switch between CGM and BG data sources
- Toggle between 3 and 5 category modes
- Set custom date ranges for analysis
- Expand individual report tables (by Day of Week, by Week, or by Date)

### AGP Report - Graph and Statistical Table

The AGP (Ambulatory Glucose Profile) report displays an interactive graph showing glucose patterns throughout a 24-hour period. The graph uses percentile bands to visualize glucose variability:

![AGP Report with Graph](https://github.com/user-attachments/assets/aa53d45a-8fc8-4f09-9ab6-b7891f703dac)

The visualization includes:
- **Light blue shaded area**: 10-90th percentile range (where 80% of readings fall)
- **Dark blue shaded area**: 25-75th percentile range (interquartile range, where 50% of readings fall)
- **Blue median line**: 50th percentile showing the typical glucose value at each time point
- **Green dashed lines**: Target range boundaries (3.9-10.0 mmol/L after meals)

Below the graph, a detailed statistical table shows percentile values for each 5-minute time slot throughout the day, helping identify specific times that may need attention.

### Reports Page - No Data Selected

When no data file is selected, the page prompts users to upload and select a data file:

![Reports - No Data Selected](https://github.com/user-attachments/assets/ec23f42c-9f2b-4c45-8978-4dc5da04abca)

## How to Use

1. **Upload Data**: Navigate to the Data Upload page and upload your Glooko export ZIP file
2. **Select File**: Click on the uploaded file to select it (the file row is clickable)
3. **View Reports**: Navigate to the Reports page
4. **Expand Report Sections**: Click on "In Range" or "AGP Data" to expand the report sections
5. **Configure Options**: 
   - Toggle between CGM and BG data sources to analyze different types of glucose data
   - For In-Range Report: Toggle between 3 and 5 category modes for different levels of detail
   - For In-Range Report: Set custom date ranges to focus on specific time periods
6. **Analyze Results**: 
   - Review the colorful summary bar in the In-Range report for an at-a-glance view
   - Examine the detailed tables to understand glucose control patterns
   - Study the AGP graph to identify time-of-day patterns and variability
   - Use the statistical table in AGP report for precise analysis of specific time slots

## Understanding Your Results

### Time in Range Goals

According to diabetes management guidelines from organizations like the ADA (American Diabetes Association) and ATTD (Advanced Technologies & Treatments for Diabetes), the general targets are:
- **Time in Range** (3.9-10.0 mmol/L / 70-180 mg/dL): > 70% of the time
  - For tighter control or during pregnancy: > 80%
- **Time Below Range**: < 4% of the time (< 1% for very low/< 3.0 mmol/L)
- **Time Above Range**: < 25% of the time

These metrics are key performance indicators for diabetes management and are used globally by healthcare professionals.

### In-Range Report Patterns

#### Day of Week Patterns

The day-of-week breakdown helps identify:
- Differences between workdays and weekends (different routines, activity levels, eating patterns)
- Specific days that may need attention or pattern adjustments
- Impact of weekly activities (e.g., exercise classes, social events)
- Consistency of glucose management across the week

#### Daily Trends

The daily date breakdown helps identify:
- Overall trend over time (improving or declining glucose control)
- Impact of specific events, medication changes, or lifestyle modifications
- Day-to-day consistency and variability
- Short-term versus long-term patterns

### AGP Report Interpretation

The AGP graph provides insights that complement the In-Range report:

#### Glucose Variability
- **Narrow bands**: Indicate stable, predictable glucose levels (desirable)
- **Wide bands**: Indicate high variability, suggesting inconsistent patterns that may need attention

#### Time-of-Day Patterns
- **Morning patterns**: Identify dawn phenomenon (early morning glucose rise) or fasting levels
- **Meal-related patterns**: See how glucose responds to meals at different times
- **Overnight patterns**: Check for nocturnal hypoglycemia or early morning highs
- **Exercise effects**: Identify periods when physical activity impacts glucose

#### Clinical Significance
The AGP report is particularly useful for:
- Identifying patterns that may not be obvious from individual readings
- Adjusting insulin doses or medication timing with your healthcare provider
- Planning meal and exercise timing to optimize glucose control
- Detecting problematic patterns like post-meal spikes or overnight lows

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

- **In-Range Report**: Introduced in version 1.1.0 of Glooko Insights
- **AGP Report**: Introduced in version 1.1.0 of Glooko Insights
- **Collapsible Sections**: Added in version 1.1.0 for better user experience
- **Summary Visualization Bar**: Added in version 1.1.0 for at-a-glance understanding

For the latest features and updates, check the [CHANGELOG](../CHANGELOG.md).
