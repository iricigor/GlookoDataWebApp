# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Current Development - 1.2.x](#12x---current-development)
- [Version 1.1.x](#11x---released)
- [Version 1.0.x](#10x---released)
- [Future Versions](#future-versions)
- [Version Format](#version-format)
- [How to Update This File](#how-to-update-this-file)

## [1.2.x] - Current Development

### New Features
[#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis
<details>
<summary>Details</summary>

  - Add automatic fallback to last 28 days when AI API returns "request too large" error
  - New utility functions: `filterGlucoseReadingsToLastDays()` and `filterInsulinReadingsToLastDays()`
  - Enhanced error detection for request size limitations (checks for "too large", "exceeds", "maximum", "limit", "token limit", "payload large", "request size")
  - Filtered dataset automatically includes note indicating "Analysis based on the last 28 days of data"
  - If filtered dataset still fails, error is returned to user
  - 16 comprehensive unit tests for filtering functions covering various scenarios
</details>

[#217](../../pull/217) Implement comprehensive Playwright E2E testing suite by @oguzc
<details>
<summary>Details</summary>

  - Add Playwright testing framework with configuration for Chromium, Firefox, and WebKit browsers
  - Implement Page Object Model (POM) pattern for maintainable test architecture
  - Create page objects for all main pages (Home, Data Upload, Reports, Settings, Navigation)
  - Add 40 comprehensive E2E tests covering critical user journeys
  - Implement smoke tests for critical paths and application startup
  - Add navigation tests for all page transitions and routing
  - Add page-specific tests for Home, Data Upload, Reports, and Settings pages
  - Configure CI/CD integration with GitHub Actions for automated test execution
  - Add test fixtures for common setup and teardown operations
  - Include test utilities and constants for consistent test configuration
  - Add comprehensive E2E testing documentation and guidelines
  - Configure automatic artifact collection (traces, screenshots, videos) for failed tests
  - Support parallel test execution and cross-browser testing
</details>

[#208](../../pull/208) Add BG Values graph to Reports page
<details>
<summary>Details</summary>

  - New "BG Values" tab displaying daily glucose readings with interactive visualization
  - Line chart showing glucose values throughout the day (00:00-24:00) using Recharts
  - Date navigation with previous/next arrows and formatted date display (e.g., "Monday, 17-11-2025")
  - Navigation arrows automatically disabled when no data available for that direction
  - Toggle switch to change Y-axis maximum between 16.0 and 22.0 mmol/L
  - Glucose values above chart maximum are clamped to max value for display
  - Daily statistics panel showing: Below Range, In Range, Above Range percentages and counts
  - Reference lines for low (3.9) and high (10.0) glucose thresholds
  - Defaults to last available date in dataset
  - Follows existing patterns from AGPGraph and InRangeReport components
</details>

[#206](../../pull/206) Simplify Glucose & Insulin AI prompt by removing correlation analysis
<details>
<summary>Details</summary>

  - Remove complex correlation analysis from AI prompt in favor of simpler tiering approach
  - Replace "Insulin Efficacy Correlation" section with "Insulin Efficacy Tiers (Simplified and Actionable)"
  - New tiering analysis: Group days into Low/Medium/High Total Insulin tiers with average BG In Range (%) for each
  - New bolus ratio impact: Compare average BG Above (%) for days with bolus ratio above vs below median
  - Enhanced anomalies section: Report average Basal and Bolus doses for 3 best and 3 worst days with key differences
  - Updated actionable summary to provide recommendations based on tier and outlier data instead of correlations
  - Keep temporal trends section unchanged (best/worst days, multi-day patterns)
  - Updated unit tests to validate new prompt structure and content
</details>

[#207](../../pull/207) Add Grok AI provider support
<details>
<summary>Details</summary>

  - Add xAI Grok API integration using grok-beta model
  - New Grok AI API key input in Settings > Data & AI tab
  - Priority order for AI providers: Perplexity > Grok AI > Google Gemini
  - Full support for all AI analysis features (Time in Range, Glucose & Insulin)
  - Cookie-based persistence for Grok API key (1-year expiry)
  - Comprehensive test coverage for Grok API integration
</details>

[#209](../../pull/209) Add comprehensive meal timing analysis
<details>
<summary>Details</summary>

  - New "Meal Timing" tab in AI Analysis page for detailed meal-specific optimization
  - Analyzes CGM, basal, and bolus data to provide day-of-week specific and meal-specific recommendations
  - **Temporal Trends**: Day-of-week BG control ranking, workday vs weekend comparison
  - **Insulin Efficacy Tiering**: Correlation analysis between insulin dosing and time-in-range
  - **Post-Meal Timing Efficacy**: Pre-bolus timing analysis, spike rates, time to peak BG for each meal (Breakfast, Lunch, Dinner)
  - **Nocturnal Basal Efficacy**: Overnight BG drift analysis to identify Dawn Phenomenon timing
  - **Actionable Recommendations**: 3-point summary with 3-4 specific recommendations for timing, basal, and dosing adjustments
  - Extracts detailed insulin readings (bolus events with timestamps) for meal correlation analysis
  - New CSV conversion utilities: `convertGlucoseReadingsToCSV()`, `convertBolusReadingsToCSV()`, `convertBasalReadingsToCSV()`
  - New prompt generation function: `generateMealTimingPrompt()` with comprehensive analysis requirements
  - Dataset summary shows CGM readings count, bolus events count, basal events count, and date range
  - Cooldown mechanism (3 seconds) to prevent excessive API calls with progress bar
  - Loading spinner, success messages, and error handling for AI analysis
  - 12 comprehensive unit tests for new CSV conversion utilities and prompt generation
</details>

[#202](../../pull/202) UI refinements and enablements
<details>
<summary>Details</summary>

  - Remove accordion from file info display in Reports and AI Analysis pages (since we now use tabs)
  - Add "Meal Timing" tab to AI Analysis page with placeholder text for future implementation
  - Add "Detailed CGM" and "Detailed Insulin" tabs to Reports page with placeholder texts for future implementation
  - Improve Data & AI tab layout in Settings page with better vertical spacing and organization
</details>

[#192](../../pull/192) Align UI pages with consistent width and vertical tabs
<details>
<summary>Details</summary>

  - Standardize all page widths to 1200px for visual consistency (Home, Settings, DataUpload, Reports, AI Analysis)
  - Refactor Settings page to use vertical tabs on the left instead of stacked sections (7 tabs: Support, Theme, Export Format, Glucose Thresholds, AI, Data Privacy, Version Info)
  - Refactor Reports page to use vertical tabs on the left instead of top-level accordions (2 tabs: Time in Range, AGP Data)
  - Refactor AI Analysis page to use vertical tabs on the left instead of top-level accordions (2 tabs: Time in Range, Glucose & Insulin)
  - Maintain all existing functionality while improving navigation and visual consistency
</details>

Finalize second AI prompt with glucose and insulin correlation analysis
<details>
<summary>Details</summary>

  - New "Glucose and Insulin Analysis" section on AI Analysis page
  - Displays comprehensive dataset combining glucose ranges and insulin doses by date
  - Dataset includes: Date, Day of Week, BG Below (%), BG In Range (%), BG Above (%), Basal Insulin (Units), Bolus Insulin (Units), Total Insulin (Units)
  - Insulin data extracted from basal and bolus CSV files in Glooko exports
  - Automatic aggregation of insulin doses by date with rounding to 1 decimal place
  - Graceful handling of missing insulin data (displays "-" when unavailable)
  - **Full AI functionality now implemented** - converts dataset to CSV format and base64 encodes for AI analysis
  - Comprehensive AI prompt analyzing temporal trends, insulin efficacy correlations, anomalies, and actionable recommendations
  - Cooldown mechanism (3 seconds) to prevent excessive API calls with progress bar
  - Loading spinner, success messages, and error handling for AI analysis
  - Supports both Google Gemini and Perplexity AI APIs
  - New utility functions: `convertDailyReportsToCSV()`, `base64Encode()`, `base64Decode()`, `generateGlucoseInsulinPrompt()`
  - 22 comprehensive unit tests for CSV conversion, base64 encoding, and prompt generation
  - Remove AI provider name (e.g., "Using Perplexity") from accordion headers for cleaner UI
</details>

Enhance daily glucose reports with insulin data
<details>
<summary>Details</summary>

  - Add "Day of Week" column to "Glucose Range by Date" table in Reports page
  - Add three new columns: Basal Insulin (Units), Bolus Insulin (Units), Total Insulin (Units)
  - Insulin data automatically merged with glucose data by date
  - Missing insulin data displayed as "-" for dates without insulin records
</details>

[#171](../../pull/171) Align Reports page with Fluent UI design standards
<details>
<summary>Details</summary>

  - Wrap In Range summary data in Fluent UI Card component for better visual organization
  - Replace button groups with Fluent UI TabList for Data Source (CGM/BG) and Categories (3/5) selectors
  - Add rounded corners and subtle elevation to main content container for improved visual hierarchy
  - Standardize all interactive elements with consistent Fluent UI styling
</details>

Add Google Gemini AI integration alongside Perplexity AI
<details>
<summary>Details</summary>

  - Support for Google Gemini API (using gemini-2.0-flash-exp model)
  - Unified AI API interface that routes to appropriate provider (Perplexity or Gemini)
  - Settings page now includes both Perplexity and Google Gemini API key fields
  - Visual indicator showing which AI provider is currently selected
  - "✓ Selected" badge next to the active provider's API key
  - Provider selection logic: Perplexity is prioritized if both keys are configured
  - AI Analysis page shows active provider in accordion header (e.g., "Using Perplexity")
  - Helper text indicates which provider will be used for analysis
  - Both API keys stored securely in browser cookies with 1-year expiration
  - Comprehensive unit tests (35 new tests added for Gemini and unified API)
  - Updated security documentation to cover both AI providers
  - Links to both Perplexity Settings and Google AI Studio for API key creation
</details>

[#166](../../pull/166) Implement markdown rendering for AI responses
<details>
<summary>Details</summary>

  - Add react-markdown library for proper markdown formatting
  - Create MarkdownRenderer component with Fluent UI styling
  - Display AI responses with proper headers, bold text, lists, and other markdown features
  - Comprehensive styling for all markdown elements (headings, lists, code, tables, blockquotes, links)
  - 10 unit tests covering various markdown rendering scenarios
</details>

Implement Perplexity AI integration for time-in-range glucose analysis
<details>
<summary>Details</summary>

  - Real AI-powered analysis using Perplexity API (sonar model with 127K context window)
  - Complete prompt: "Given a patient's percent time-in-range (TIR) from continuous glucose monitoring is X%, provide a brief clinical assessment and 2-3 specific, actionable recommendations"
  - Loading spinner animation while waiting for API response
  - Success message with checkmark icon when analysis completes
  - Error handling for unauthorized access (401/403), API errors, and network issues
  - AI response displayed in formatted container with proper whitespace handling
  - Button disabled during analysis to prevent duplicate requests
  - Comprehensive unit tests for API utility with 16 test cases
  - Security: API key transmitted securely via HTTPS, stored only in browser cookies
  - Privacy: All AI communication happens directly from browser, no server intermediary
</details>


### Fixes
[#184](../../pull/184) Fix Grok API key not recognized in Meal Timing analysis
<details>
<summary>Details</summary>

  - Fixed bug where Grok API key was not being passed to AI API in Meal Timing analysis
  - Updated `handleMealTimingClick` to include Grok in API key selection (matching pattern from other handlers)
  - Added unit tests to verify correct API key is used for each provider (Perplexity, Grok, Gemini)
  - Meal Timing analysis now works correctly with all three AI providers
</details>

[#212](../../pull/212) Fix AI analysis helper text and provider display issues
<details>
<summary>Details</summary>

  - Helper text now correctly reappears after cooldown completes and button returns to "Analyze with AI"
  - All three AI tabs (Time in Range, Glucose & Insulin, Meal Timing) now display active AI provider name in helper text
  - Helper text now shows "Click Analyze to get AI-powered analysis (using Perplexity)" or similar based on active provider
  - Fixed conditional logic to show appropriate helper text in all states (initial, analyzing, cooldown, ready for new analysis)
  - Applied consistent logic across all three AI analysis tabs
  - Fixed Meal Timing tab to properly extract bolus insulin data by improving column matching logic to include "delivered" pattern
  - Fixed insulin data extraction to process basal and bolus files even when manual insulin file is present in ZIP
</details>

[#181](../../pull/181) Fix BG Values graph UI issues and improve Detailed CGM report
<details>
<summary>Details</summary>

  - Removed vertical dotted grid lines (CartesianGrid) from the glucose chart for cleaner visualization
  - Replaced Switch with Fluent UI TabList for max value selector (16.0/22.0 mmol/L) following Time in Range report pattern
  - Renamed "BG Values" report to "Detailed CGM" throughout the application (removed duplicate naming)
  - Updated navigation tab from "BG Values" to "Detailed CGM"
  - Updated report title and all user-facing text to use "Detailed CGM"
  - Updated "Detailed Insulin" placeholder text to "Detailed analysis about basal, bolus and total insulin intake"
  - Added loading state indicator (spinner) when switching between dates
  - Improved date selector styling with disabled state during date transitions
  - All changes follow Fluent UI design standards for consistency
</details>

[#191](../../pull/191) Simplify XLSX export to use metadata-based approach
<details>
<summary>Details</summary>

  - Removed `findCSVFileName` fallback function that tried to guess file names based on patterns
  - XLSX export now always uses `sourceFiles` array from metadata (populated by `groupCsvFiles`)
  - Eliminates inconsistency between Summary sheet (which shows all datasets) and actual exported sheets
  - Added warning messages when source files are not found in ZIP
  - Ensures "For each line in summary page, we need to have one sheet in excel" as requested
  - All 20 unit tests passing including edge cases with missing files and merged datasets
</details>

Fix missing tabs in Excel export for single-file datasets
<details>
<summary>Details</summary>

  - Fixed `groupCsvFiles` function in zipUtils.ts to preserve original file names in `sourceFiles` field
  - Previously, only merged datasets had their source files tracked, causing single-file datasets to be missing from Excel exports
  - Ensures all datasets shown in Summary sheet get their own tabs in exported xlsx file
  - Fixes missing tabs for: basal, bolus, exercise, food, manual_insulin, medication, notes
  - Added comprehensive test reproducing the bug with 12 datasets
</details>

Fix insulin dataset being exported with wrong column headers from manual_insulin
<details>
<summary>Details</summary>

  - Fixed `findCSVFileName` function fallback logic to use prefix matching instead of substring matching
  - Prevents "insulin" search from incorrectly matching "manual_insulin_data_1.csv"
  - Insulin data now exports correctly with proper columns: Timestamp, Total Bolus (U), Total Insulin (U), Total Basal (U), Serial Number
  - Added comprehensive bug reproduction tests
</details>

[#173](../../pull/173) Fix AI analysis button not returning to initial state after cooldown
<details>
<summary>Details</summary>

  - Button now correctly returns to "Analyze with AI" after 3-second cooldown completes
  - Previous behavior: button stayed as "Click to enable new analysis" indefinitely
  - Added `readyForNewAnalysis` state to track post-cooldown status
  - Accordion now opens by default for better user experience
  - Added ResizeObserver mock for test environment
  - Added new test to verify button state after cooldown completion
</details>

Fix AI analysis response persistence and button state management
<details>
<summary>Details</summary>

  - AI responses now persist when navigating to other pages and returning
  - AI responses preserved even after failed API calls
  - Button changes to "Click to enable new analysis" after successful analysis
  - 3-second cooldown with progress bar when requesting new analysis
  - Cooldown prevents accidental multiple API calls
  - State lifted to App.tsx for proper persistence across navigation
  - Added comprehensive unit tests for new behavior (7 new tests)
  - Prevents users from spamming the analyze button
</details>


### Other
[#221](../../pull/221) Automate README updates on main branch after PR merges
<details>
<summary>Details</summary>

  - New GitHub Actions workflow triggers when PRs are merged to main
  - Automatically updates "Recent Updates" section in README.md
  - Maps PR labels to emojis (Feature→✨, Bug→🐛, Documentation→📚, Performance→⚡)
  - Keeps only the 5 most recent updates in README
  - Prevents feature branch conflicts by only updating main branch
  - Includes comprehensive test suite (`test-update-readme.cjs`)
  - Adds `docs/README_AUTOMATION.md` with full documentation
  - Updates `.github/scripts/README.md` with automation details
</details>


---

## [1.1.x] - Released

### New Features
[#144](../../pull/144) Add swipe gesture navigation for mobile devices
<details>
<summary>Details</summary>

  - Horizontal swipe left/right to navigate between pages
  - Page order: Home → Data Upload → Reports → AI Analysis → Settings
  - Custom `useSwipeGesture` hook with configurable sensitivity
  - Works on both touch devices (mobile) and mouse (desktop testing)
  - Prevents accidental triggers with vertical scroll detection
</details>

[#148](../../pull/148) Add bug report and feature request links to Settings page
<details>
<summary>Details</summary>

  - New "Support" section at the top of Settings page
  - Quick access buttons to create GitHub issues directly from the app
  - Bug report button links to bug_report.yml template
  - Feature request button links to feature_request.yml template
  - Opens in new tab with proper security attributes (noopener noreferrer)
</details>

[#142](../../pull/142) Add first AI analysis prompts to AI Analysis page
<details>
<summary>Details</summary>

  - Two collapsible accordion sections (both collapsed by default)
  - First prompt: "Time in Range Analysis" displays calculated glucose percentage in range
  - "Analyze with AI" button (enabled only when API key is configured)
  - Button shows helper text before clicking, changes to "AI analysis not implemented yet" after click
  - Second prompt: "Additional Analysis" placeholder with "To be added soon" message
  - UI setup for future AI functionality integration
</details>

[#138](../../pull/138) Add AGP report filters and CSV export
<details>
<summary>Details</summary>

  - Day-of-week filter dropdown with options: All Days, Mon-Sun, Workdays, Weekends
  - Time range filters (start/end) to analyze specific hours of the day
  - CSV export button for AGP statistics table with hover effect
</details>

Add AI settings configuration in Settings page
<details>
<summary>Details</summary>

  - Password-type input field for Perplexity API key with visual confirmation checkmark
  - API key stored securely in browser cookies with persistent storage
  - AI Analysis page displays helpful message with link to Settings when API key is not configured
  - Follows existing settings patterns with Fluent UI components for consistency
</details>

[#140](../../pull/140) Enhanced API key input with inline label layout and comprehensive security explanation
<details>
<summary>Details</summary>

  - Label and input field now displayed in the same row for improved visual organization
  - Detailed security explanation covering storage mechanism (browser cookies, 1-year expiry)
  - Privacy transparency: explains no server transmission, client-side only processing
  - Best practices guidance with links to Perplexity API settings for minimal permissions
  - Risk warning about session compromise with mitigation strategies
  - Link to GitHub repository for open source transparency
</details>

[#122](../../pull/122) Add CSV export functionality to all data tables
<details>
<summary>Details</summary>

  - Copy icon appears in top-right corner on table hover with "Copy As CSV" tooltip
  - Export FileList table showing uploaded files with metadata
  - Export In Range reports (Day of Week, Weekly, Daily tables)
  - Proper CSV formatting with comma escaping and quote handling
  - Visual feedback with checkmark icon after successful copy
</details>

- Add realistic demo data for John Doe (two weeks of diabetes data) that automatically loads on app startup
[#114](../../pull/114) Optimize Reports page with collapsible sections for better organization and scalability
<details>
<summary>Details</summary>

  - Selected Data Package section now shows filename, patient name, and metadata in header, details collapsed by default
  - In Range report displays header with summary bar and legend inside collapsed section
</details>

AGP (Ambulatory Glucose Profile) report with statistical analysis
<details>
<summary>Details</summary>

  - Interactive AGP graph visualization showing glucose patterns over 24-hour period
  - Percentile bands (10-90% and 25-75%) with median line for easy trend identification
  - Target range indicators (3.9-10 mmol/L after-meal target) displayed on graph
  - Displays glucose statistics for each 5-minute period throughout the day (00:00 to 23:55)
  - Shows lowest, 10th, 25th, 50th (median), 75th, 90th percentiles, and highest values for each time slot
  - Calculates percentiles across all days for each time period
  - Supports both CGM and BG data sources
  - Includes comprehensive unit tests for AGP calculations
</details>

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
Fix black screen overlay when clicking hamburger menu on mobile devices
<details>
<summary>Details</summary>

  - Added `inline` prop to Menu component in Navigation.tsx
  - Prevents modal backdrop from covering the screen when menu is open
  - Similar fix to the dropdown issue that was previously resolved on Reports page
</details>

Make version footer visible without scrolling on all pages
<details>
<summary>Details</summary>

  - Changed app container from min-height to fixed height (100vh) to constrain layout
  - Made main-content scrollable with overflow-y: auto to keep footer always visible
  - Removed minHeight constraints from all page components (DataUpload, Reports, AIAnalysis, Settings)
  - Footer now always remains visible at bottom of viewport, content scrolls within main area
</details>

Fix AI response to use European glucose units (mmol/L) and direct second-person language
<details>
<summary>Details</summary>

  - Updated system message to specify all glucose measurements are in mmol/L (European standard)
  - Changed prompt from third-person ("patient's") to first/second-person ("my"/"your") language
  - Added explicit reminder that glucose values are in mmol/L (not mg/dL)
  - Instructed AI to communicate directly without assuming healthcare provider intermediary
  - Added comprehensive unit tests for new prompt content
</details>

[#157](../../pull/157) Make version footer visible without scrolling on home page
<details>
<summary>Details</summary>

  - Reduced container top/bottom padding from 40px to 24px
  - Reduced header margin-bottom from 40px to 24px
  - Reduced title margin-bottom from 16px to 12px
  - Reduced cards grid gap from 24px to 16px
  - Reduced navigation card minimum height from 200px to 190px
  - Footer now fits within viewport on standard screen sizes
</details>

[#151](../../pull/151) Fix CHANGELOG entry format instructions to prevent HTML anchor tags
<details>
<summary>Details</summary>

  - Updated copilot instructions to explicitly require markdown link format
  - Added clear examples and warnings against using HTML anchor tags
  - Clarified that relative paths must always be used for PR/issue links
  - Updated CHANGELOG.md instructions to match copilot instructions
  - Fixed current version reference from 1.0.x to 1.1.x
</details>

[#146](../../pull/146) Improve AI settings text clarity by restructuring into separate paragraphs
<details>
<summary>Details</summary>

  - Replace inline `<br/>` tags with proper paragraph structure using `<Text as="p">` components
  - Increase font size from Base200 to Base300 and adjust line height for better readability
  - Add proper spacing between paragraphs with marginBottom style
  - Text now matches the clean, readable style of other settings sections
</details>

- Center-align all column headers and data cells in AGP report table for improved readability
- Update demo CGM data to have realistic glucose variability matching clinical distribution (1% very low, 2% low, 71% in range, 19% high, 7% very high)

### Documentation
- [#159](../../pull/159) Add link to published app (https://glooko.iric.online) in README Quick Start section
Simplify README by keeping only one screenshot and essential information
<details>
<summary>Details</summary>

  - Move all additional screenshots to new docs/SCREENSHOTS.md page
  - Add comprehensive documentation links section in README
  - Move developer-specific content (Available Scripts, Project Structure) to CONTRIBUTING.md
  - Improve README organization and readability
</details>

- Add docs/REPORTS.md with comprehensive feature documentation and screenshots
- Document alternative visualization options for future implementation
Update docs/REPORTS.md with AGP Report screenshots and enhanced descriptions
<details>
<summary>Details</summary>

  - Add AGP graph visualization screenshot showing percentile bands and target ranges
  - Enhance AGP section with detailed interpretation guide
  - Add clinical context and usage tips for both In-Range and AGP reports
  - Update "How to Use" section with step-by-step instructions for both reports
  - Expand "Understanding Your Results" with AGP interpretation guidelines
</details>


### Other
[#220](../../pull/220) Restructure codebase with feature-based architecture to minimize merge conflicts
<details>
<summary>Details</summary>

  - Split xlsxUtils.ts (435 lines) into 5 focused modules in `src/features/export/utils/`
  - Move zipUtils.ts (240 lines) to `src/features/dataUpload/utils/`
  - Move FileList and FileUploadZone components to `src/features/dataUpload/components/`
  - Create barrel exports for clean import syntax
  - Add path aliases (@/features, @/utils, @/types, etc.) in tsconfig and vite config
  - Add comprehensive `src/features/README.md` documenting architecture patterns
  - Old files in `src/utils/` and `src/components/` remain for backward compatibility
  - Expected benefit: 70-80% reduction in merge conflicts
</details>

[#162](../../pull/162) Fix CHANGELOG.md by replacing all #XXX placeholder entries with correct PR numbers
<details>
<summary>Details</summary>

  - Identified 11 placeholder entries with #XXX format
  - Used GitHub API to search for and identify correct PR numbers
  - All PR links now point to their correct pull requests
</details>

[#161](../../pull/161) Optimize test execution performance with parallel test running
<details>
<summary>Details</summary>

  - Enable parallel test execution in Vitest configuration using thread pool
  - Run tests once with JSON reporter to extract statistics immediately
  - Eliminate duplicate test run in CI workflow (previously ran tests twice)
  - Expected improvement: 50% reduction in CI test execution time
</details>


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
1. Add an entry under the appropriate version section (current: 1.1.x)
2. Place the entry in the correct category based on the PR/issue label:
   - **New Features** - for ✨ Feature label
   - **Fixes** - for 🪲 Bug label
   - **Documentation** - for 📚 Documentation label
   - **Other** - for other changes
3. **Entry format - Use markdown links (NOT HTML):**
   - Each entry must start with a markdown link like `[#152](../../pull/152)` followed by the description
   - **Always use relative paths:** `../../pull/PR_NUMBER` or `../../issues/ISSUE_NUMBER`
   - **Example:** `- [#152](../../pull/152) Add new feature description`
   - **For issues without PRs:** `- [Issue #100](../../issues/100) Description`
   - **Never use HTML anchor tags** like `<a href="...">` - only use markdown format
4. Entries within each category should be sorted by PR/issue number (descending - highest first)
