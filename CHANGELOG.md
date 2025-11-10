# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Current Development - 1.1.x](#11x---current-development)
- [Version 1.0.x](#10x---released)
- [Future Versions](#future-versions)
- [Version Format](#version-format)
- [How to Update This File](#how-to-update-this-file)

## [1.1.x] - Current Development

### New Features
- [#XXX](../../pull/XXX) Add swipe gesture navigation for mobile devices
  - Horizontal swipe left/right to navigate between pages
  - Page order: Home → Data Upload → Reports → AI Analysis → Settings
  - Custom `useSwipeGesture` hook with configurable sensitivity
  - Works on both touch devices (mobile) and mouse (desktop testing)
  - Prevents accidental triggers with vertical scroll detection
- [#XXX](../../pull/XXX) Add first AI analysis prompts to AI Analysis page
  - Two collapsible accordion sections (both collapsed by default)
  - First prompt: "Time in Range Analysis" displays calculated glucose percentage in range
  - "Analyze with AI" button (enabled only when API key is configured)
  - Button shows helper text before clicking, changes to "AI analysis not implemented yet" after click
  - Second prompt: "Additional Analysis" placeholder with "To be added soon" message
  - UI setup for future AI functionality integration
- [#XXX](../../pull/XXX) Add AGP report filters and CSV export
  - Day-of-week filter dropdown with options: All Days, Mon-Sun, Workdays, Weekends
  - Time range filters (start/end) to analyze specific hours of the day
  - CSV export button for AGP statistics table with hover effect
- Add AI settings configuration in Settings page
  - Password-type input field for Perplexity API key with visual confirmation checkmark
  - API key stored securely in browser cookies with persistent storage
  - AI Analysis page displays helpful message with link to Settings when API key is not configured
  - Follows existing settings patterns with Fluent UI components for consistency
  - [#XXX](../../pull/XXX) Enhanced API key input with inline label layout and comprehensive security explanation
    - Label and input field now displayed in the same row for improved visual organization
    - Detailed security explanation covering storage mechanism (browser cookies, 1-year expiry)
    - Privacy transparency: explains no server transmission, client-side only processing
    - Best practices guidance with links to Perplexity API settings for minimal permissions
    - Risk warning about session compromise with mitigation strategies
    - Link to GitHub repository for open source transparency
- [#XXX](../../pull/XXX) Add CSV export functionality to all data tables
  - Copy icon appears in top-right corner on table hover with "Copy As CSV" tooltip
  - Export FileList table showing uploaded files with metadata
  - Export In Range reports (Day of Week, Weekly, Daily tables)
  - Proper CSV formatting with comma escaping and quote handling
  - Visual feedback with checkmark icon after successful copy
- Add realistic demo data for John Doe (two weeks of diabetes data) that automatically loads on app startup
- [#114](../../pull/114) Optimize Reports page with collapsible sections for better organization and scalability
  - Selected Data Package section now shows filename, patient name, and metadata in header, details collapsed by default
  - In Range report displays header with summary bar and legend inside collapsed section
- AGP (Ambulatory Glucose Profile) report with statistical analysis
  - Interactive AGP graph visualization showing glucose patterns over 24-hour period
  - Percentile bands (10-90% and 25-75%) with median line for easy trend identification
  - Target range indicators (3.9-10 mmol/L after-meal target) displayed on graph
  - Displays glucose statistics for each 5-minute period throughout the day (00:00 to 23:55)
  - Shows lowest, 10th, 25th, 50th (median), 75th, 90th percentiles, and highest values for each time slot
  - Calculates percentiles across all days for each time period
  - Supports both CGM and BG data sources
  - Includes comprehensive unit tests for AGP calculations
- In-Range Report feature with glucose range analysis by day of week and by date
- Add weekly grouping report showing glucose ranges by week (e.g., "Oct 6-12")
- Add summary section with horizontal colored bar chart showing overall glucose distribution
- Add date range selector to filter data between custom start/end dates
- Configurable data source selection (CGM vs BG data) with improved button group UI
- Configurable category mode (3 vs 5 categories) with improved button group UI
- Support for both simple (Low, In Range, High) and detailed (Very Low, Low, In Range, High, Very High) glucose categorization
- Collapsible accordion sections for all reports (collapsed by default, summary always visible)
- Emphasized "In Range" column with bold text and brand color
- Improved value display format showing "percentage (count)" instead of "count (percentage)"

### Fixes
- Center-align all column headers and data cells in AGP report table for improved readability
- Update demo CGM data to have realistic glucose variability matching clinical distribution (1% very low, 2% low, 71% in range, 19% high, 7% very high)

### Documentation
- Simplify README by keeping only one screenshot and essential information
  - Move all additional screenshots to new docs/SCREENSHOTS.md page
  - Add comprehensive documentation links section in README
  - Move developer-specific content (Available Scripts, Project Structure) to CONTRIBUTING.md
  - Improve README organization and readability
- Add docs/REPORTS.md with comprehensive feature documentation and screenshots
- Document alternative visualization options for future implementation
- Update docs/REPORTS.md with AGP Report screenshots and enhanced descriptions
  - Add AGP graph visualization screenshot showing percentile bands and target ranges
  - Enhance AGP section with detailed interpretation guide
  - Add clinical context and usage tips for both In-Range and AGP reports
  - Update "How to Use" section with step-by-step instructions for both reports
  - Expand "Understanding Your Results" with AGP interpretation guidelines

### Other

---

## [1.0.x] - Released

### New Features
- [#106](../../pull/106) Add metadata parsing utilities to process structured metadata from CSV files with support for both comma-separated and tab-separated formats
- [#101](../../pull/101) Implement dynamic test count badge using GitHub Gist endpoint
- [#90](../../pull/90) Add version information and build ID tracking system

### Fixes
- [#108](../../pull/108) Reduce Select column width by applying explicit width style while keeping header text
- [#103](../../pull/103) Fix footer positioning to stay at bottom of viewport using flexbox sticky footer layout

### Documentation
- [#91](../../pull/91) Add CHANGELOG.md file and update copilot instructions to require changelog updates in each PR

### Other

---

## Future Versions

### [1.2.x] - ETA Nov 11
- Provide access to AI analysis

### [2.0.x] - Future
- Major version updates and breaking changes will be listed here

---

## Version Format

Versions follow the format: `major.minor.buildId`
- **major**: Breaking changes or significant new features
- **minor**: New features and enhancements (backward compatible)
- **buildId**: Automatically incremented build number from GitHub Actions

## How to Update This File

When creating a pull request:
1. Add an entry under the appropriate version section (current: 1.0.x)
2. Place the entry in the correct category based on the PR/issue label:
   - **New Features** - for ✨ Feature label
   - **Fixes** - for 🪲 Bug label
   - **Documentation** - for 📚 Documentation label
   - **Other** - for other changes
3. Format: `- [#PR_NUMBER](../../pull/PR_NUMBER) Description of the change`
   - Use relative link format for PRs: `[#152](../../pull/152)`
   - For issues without PRs, use: `[Issue #ISSUE_NUMBER](../../issues/ISSUE_NUMBER)`
4. Entries within each category should be sorted by PR/issue number (descending - highest first)
