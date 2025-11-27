# Changelog - Version 1.1.x (Released)

[← Back to Main Changelog](../../CHANGELOG.md)

---

## [1.1.x] - Released

### New Features
<details>
<summary>144 Add swipe gesture navigation for mobile devices</summary>

[#144](../../pull/144) Add swipe gesture navigation for mobile devices
  - Horizontal swipe left/right to navigate between pages
  - Page order: Home → Data Upload → Reports → AI Analysis → Settings
  - Custom `useSwipeGesture` hook with configurable sensitivity
  - Works on both touch devices (mobile) and mouse (desktop testing)
  - Prevents accidental triggers with vertical scroll detection
</details>

<details>
<summary>148 Add bug report and feature request links to Settings page</summary>

[#148](../../pull/148) Add bug report and feature request links to Settings page
  - New "Support" section at the top of Settings page
  - Quick access buttons to create GitHub issues directly from the app
  - Bug report button links to bug_report.yml template
  - Feature request button links to feature_request.yml template
  - Opens in new tab with proper security attributes (noopener noreferrer)
</details>

<details>
<summary>142 Add first AI analysis prompts to AI Analysis page</summary>

[#142](../../pull/142) Add first AI analysis prompts to AI Analysis page
  - Two collapsible accordion sections (both collapsed by default)
  - First prompt: "Time in Range Analysis" displays calculated glucose percentage in range
  - "Analyze with AI" button (enabled only when API key is configured)
  - Button shows helper text before clicking, changes to "AI analysis not implemented yet" after click
  - Second prompt: "Additional Analysis" placeholder with "To be added soon" message
  - UI setup for future AI functionality integration
</details>

<details>
<summary>138 Add AGP report filters and CSV export</summary>

[#138](../../pull/138) Add AGP report filters and CSV export
  - Day-of-week filter dropdown with options: All Days, Mon-Sun, Workdays, Weekends
  - Time range filters (start/end) to analyze specific hours of the day
  - CSV export button for AGP statistics table with hover effect
</details>

<details>
<summary>131 Add AI settings configuration in Settings page</summary>

[#131](../../pull/131) Add AI settings with Perplexity API key configuration
  - Password-type input field for Perplexity API key with visual confirmation checkmark
  - API key stored securely in browser cookies with persistent storage
  - AI Analysis page displays helpful message with link to Settings when API key is not configured
  - Follows existing settings patterns with Fluent UI components for consistency
</details>
<details>
<summary>140 Enhanced API key input with inline label layout and comprehensive security explanation</summary>

[#140](../../pull/140) Enhanced API key input with inline label layout and comprehensive security explanation
  - Label and input field now displayed in the same row for improved visual organization
  - Detailed security explanation covering storage mechanism (browser cookies, 1-year expiry)
  - Privacy transparency: explains no server transmission, client-side only processing
  - Best practices guidance with links to Perplexity API settings for minimal permissions
  - Risk warning about session compromise with mitigation strategies
  - Link to GitHub repository for open source transparency
</details>

<details>
<summary>122 Add CSV export functionality to all data tables</summary>

[#122](../../pull/122) Add CSV export functionality to all data tables
  - Copy icon appears in top-right corner on table hover with "Copy As CSV" tooltip
  - Export FileList table showing uploaded files with metadata
  - Export In Range reports (Day of Week, Weekly, Daily tables)
  - Proper CSV formatting with comma escaping and quote handling
  - Visual feedback with checkmark icon after successful copy
</details>

<details>
<summary>120 Add realistic demo data for John Doe that automatically loads on app startup</summary>

[#120](../../pull/120) Add realistic demo data auto-loading on app startup
  - Add realistic demo data for John Doe (two weeks of diabetes data) that automatically loads when app starts
  - Demo file: demo-data.zip with 9,435 data points across 12 datasets
  - CGM: 6,984 readings with circadian patterns (dawn phenomenon, meal responses)
  - Data spans Jan 1-14, 2025 with proper Glooko CSV format
  - Auto-loading implementation using useEffect hook in App.tsx
  - Graceful degradation if file unavailable (console warning, no error thrown)
</details>
<details>
<summary>114 Optimize Reports page with collapsible sections for better organization and scalability</summary>

[#114](../../pull/114) Optimize Reports page with collapsible sections for better organization and scalability
  - Selected Data Package section now shows filename, patient name, and metadata in header, details collapsed by default
  - In Range report displays header with summary bar and legend inside collapsed section
</details>

<details>
<summary>121 AGP (Ambulatory Glucose Profile) report with statistical analysis</summary>

[#121](../../pull/121) Implement AGP (Ambulatory Glucose Profile) report with percentile statistics
  - Interactive AGP graph visualization showing glucose patterns over 24-hour period
  - Percentile bands (10-90% and 25-75%) with median line for easy trend identification
  - Target range indicators (3.9-10 mmol/L after-meal target) displayed on graph
  - Displays glucose statistics for each 5-minute period throughout the day (00:00 to 23:55)
  - Shows lowest, 10th, 25th, 50th (median), 75th, 90th percentiles, and highest values for each time slot
  - Calculates percentiles across all days for each time period
  - Supports both CGM and BG data sources
  - Includes comprehensive unit tests for AGP calculations
</details>
<details>
<summary>111 and 113 In-Range Report feature with glucose range analysis by day of week and by date</summary>

[#111](../../pull/111) Add glucose range analysis with configurable data sources and category modes
[#113](../../pull/113) Enhance In Range report with summary bar, date filtering, and improved UX
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
</details>

### Fixes
<details>
<summary>184 Fix Grok API key not recognized in Meal Timing analysis</summary>

[#184](../../pull/184) Fix Grok API key not recognized in Meal Timing analysis
  - Fixed bug where Grok API key was not being passed to AI API in Meal Timing analysis
  - Updated `handleMealTimingClick` to include Grok in API key selection (matching pattern from other handlers)
  - Added unit tests to verify correct API key is used for each provider (Perplexity, Grok, Gemini)
  - Meal Timing analysis now works correctly with all three AI providers
</details>

<details>
<summary>212 Fix AI analysis helper text and provider display issues</summary>

[#212](../../pull/212) Fix AI analysis helper text and provider display issues
  - Helper text now correctly reappears after cooldown completes and button returns to "Analyze with AI"
  - All three AI tabs (Time in Range, Glucose & Insulin, Meal Timing) now display active AI provider name in helper text
  - Helper text now shows "Click Analyze to get AI-powered analysis (using Perplexity)" or similar based on active provider
  - Fixed conditional logic to show appropriate helper text in all states (initial, analyzing, cooldown, ready for new analysis)
  - Applied consistent logic across all three AI analysis tabs
  - Fixed Meal Timing tab to properly extract bolus insulin data by improving column matching logic to include "delivered" pattern
  - Fixed insulin data extraction to process basal and bolus files even when manual insulin file is present in ZIP
</details>

<details>
<summary>181 Fix BG Values graph UI issues and improve Detailed CGM report</summary>

[#181](../../pull/181) Fix BG Values graph UI issues and improve Detailed CGM report
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

<details>
<summary>191 Simplify XLSX export to use metadata-based approach</summary>

[#191](../../pull/191) Simplify XLSX export to use metadata-based approach
  - Removed `findCSVFileName` fallback function that tried to guess file names based on patterns
  - XLSX export now always uses `sourceFiles` array from metadata (populated by `groupCsvFiles`)
  - Eliminates inconsistency between Summary sheet (which shows all datasets) and actual exported sheets
  - Added warning messages when source files are not found in ZIP
  - Ensures "For each line in summary page, we need to have one sheet in excel" as requested
  - All 20 unit tests passing including edge cases with missing files and merged datasets
</details>

<details>
<summary>175 Fix black screen overlay when clicking hamburger menu on mobile devices</summary>

[#175](../../pull/175) Fix mobile hamburger menu black overlay
  - Added `inline` prop to Menu component in Navigation.tsx
  - Prevents modal backdrop from covering the screen when menu is open
  - Similar fix to the dropdown issue that was previously resolved on Reports page
</details>

<details>
<summary>171 Make version footer visible without scrolling on all pages</summary>

[#171](../../pull/171) Fix footer visibility across all pages by constraining viewport height
  - Changed app container from min-height to fixed height (100vh) to constrain layout
  - Made main-content scrollable with overflow-y: auto to keep footer always visible
  - Removed minHeight constraints from all page components (DataUpload, Reports, AIAnalysis, Settings)
  - Footer now always remains visible at bottom of viewport, content scrolls within main area
</details>

<details>
<summary>168 Fix AI response to use European glucose units (mmol/L) and direct second-person language</summary>

[#168](../../pull/168) Fix AI responses to use mmol/L units and direct second-person language
  - Updated system message to specify all glucose measurements are in mmol/L (European standard)
  - Changed prompt from third-person ("patient's") to first/second-person ("my"/"your") language
  - Added explicit reminder that glucose values are in mmol/L (not mg/dL)
  - Instructed AI to communicate directly without assuming healthcare provider intermediary
  - Added comprehensive unit tests for new prompt content
</details>
<details>
<summary>157 Make version footer visible without scrolling on home page</summary>

[#157](../../pull/157) Fix footer visibility on home page by reducing excessive spacing
  - Reduced container top/bottom padding from 40px to 24px
  - Reduced header margin-bottom from 40px to 24px
  - Reduced title margin-bottom from 16px to 12px
  - Reduced cards grid gap from 24px to 16px
  - Reduced navigation card minimum height from 200px to 190px
  - Footer now fits within viewport on standard screen sizes
</details>

<details>
<summary>151 Fix CHANGELOG entry format instructions to prevent HTML anchor tags</summary>

[#151](../../pull/151) Fix CHANGELOG entry format instructions to prevent HTML anchor tags
  - Updated copilot instructions to explicitly require markdown link format
  - Added clear examples and warnings against using HTML anchor tags
  - Clarified that relative paths must always be used for PR/issue links
  - Updated CHANGELOG.md instructions to match copilot instructions
  - Fixed current version reference from 1.0.x to 1.1.x
</details>

<details>
<summary>146 Improve AI settings text clarity by restructuring into separate paragraphs</summary>

[#146](../../pull/146) Improve AI settings text clarity by restructuring into separate paragraphs
  - Replace inline `<br/>` tags with proper paragraph structure using `<Text as="p">` components
  - Increase font size from Base200 to Base300 and adjust line height for better readability
  - Add proper spacing between paragraphs with marginBottom style
  - Text now matches the clean, readable style of other settings sections
</details>

<details>
<summary>124 Center-align all column headers and data cells in AGP report table for improved readability</summary>

[#124](../../pull/124) Center-align AGP report table headers and data
  - Center-align all column headers and data cells in AGP report table for improved readability
</details>

<details>
<summary>Update demo CGM data to have realistic glucose variability matching clinical distribution</summary>

Update demo CGM data to have realistic glucose variability matching clinical distribution (1% very low, 2% low, 71% in range, 19% high, 7% very high)
</details>

### Documentation
- [#159](../../pull/159) Add link to published app (https://glooko.iric.online) in README Quick Start section
  - Move all additional screenshots to new docs/SCREENSHOTS.md page
  - Add comprehensive documentation links section in README
  - Move developer-specific content (Available Scripts, Project Structure) to CONTRIBUTING.md
  - Improve README organization and readability
<details>
<summary>137 Add docs/REPORTS.md with comprehensive feature documentation and screenshots</summary>

[#137](../../pull/137) docs: update REPORTS.md with AGP screenshots and enhanced clinical context
  - Add docs/REPORTS.md with comprehensive feature documentation and screenshots
  - Document alternative visualization options for future implementation
  - Update docs/REPORTS.md with AGP Report screenshots and enhanced descriptions
  - Add AGP graph visualization screenshot showing percentile bands and target ranges
  - Enhance AGP section with detailed interpretation guide
  - Add clinical context and usage tips for both In-Range and AGP reports
  - Update "How to Use" section with step-by-step instructions for both reports
  - Expand "Understanding Your Results" with AGP interpretation guidelines
</details>

### Other
<details>
<summary>220 Restructure codebase with feature-based architecture to minimize merge conflicts</summary>

[#220](../../pull/220) Restructure codebase with feature-based architecture to minimize merge conflicts
  - Split xlsxUtils.ts (435 lines) into 5 focused modules in `src/features/export/utils/`
  - Move zipUtils.ts (240 lines) to `src/features/dataUpload/utils/`
  - Move FileList and FileUploadZone components to `src/features/dataUpload/components/`
  - Create barrel exports for clean import syntax
  - Add path aliases (@/features, @/utils, @/types, etc.) in tsconfig and vite config
  - Add comprehensive `src/features/README.md` documenting architecture patterns
  - Old files in `src/utils/` and `src/components/` remain for backward compatibility
  - Expected benefit: 70-80% reduction in merge conflicts
</details>

<details>
<summary>162 Fix CHANGELOG.md by replacing all #XXX placeholder entries with correct PR numbers</summary>

[#162](../../pull/162) Fix CHANGELOG.md by replacing all #XXX placeholder entries with correct PR numbers
  - Identified 11 placeholder entries with #XXX format
  - Used GitHub API to search for and identify correct PR numbers
  - All PR links now point to their correct pull requests
</details>

<details>
<summary>161 Optimize test execution performance with parallel test running</summary>

[#161](../../pull/161) Optimize test execution performance with parallel test running
  - Enable parallel test execution in Vitest configuration using thread pool
  - Run tests once with JSON reporter to extract statistics immediately
  - Eliminate duplicate test run in CI workflow (previously ran tests twice)
  - Expected improvement: 50% reduction in CI test execution time
</details>


---

[← Back to Main Changelog](../../CHANGELOG.md)
