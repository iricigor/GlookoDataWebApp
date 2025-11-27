# Changelog - Version 1.2.x (Released)

[← Back to Main Changelog](../../CHANGELOG.md)

---

## [1.2.x] - Released

### New Features
<details>
<summary>213 Enable smaller data set for "Meal Timing" analysis</summary>

[#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis
  - Add automatic fallback to last 28 days when AI API returns "request too large" error
  - New utility functions: `filterGlucoseReadingsToLastDays()` and `filterInsulinReadingsToLastDays()`
  - Enhanced error detection for request size limitations (checks for "too large", "exceeds", "maximum", "limit", "token limit", "payload large", "request size")
  - Filtered dataset automatically includes note indicating "Analysis based on the last 28 days of data"
  - If filtered dataset still fails, error is returned to user
  - 16 comprehensive unit tests for filtering functions covering various scenarios
</details>

<details>
<summary>217 Implement comprehensive Playwright E2E testing suite by @oguzc</summary>

[#217](../../pull/217) Implement comprehensive Playwright E2E testing suite by @oguzc
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

<details>
<summary>208 Add BG Values graph to Reports page</summary>

[#208](../../pull/208) Add BG Values graph to Reports page
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

<details>
<summary>206 Simplify Glucose & Insulin AI prompt by removing correlation analysis</summary>

[#206](../../pull/206) Simplify Glucose & Insulin AI prompt by removing correlation analysis
  - Remove complex correlation analysis from AI prompt in favor of simpler tiering approach
  - Replace "Insulin Efficacy Correlation" section with "Insulin Efficacy Tiers (Simplified and Actionable)"
  - New tiering analysis: Group days into Low/Medium/High Total Insulin tiers with average BG In Range (%) for each
  - New bolus ratio impact: Compare average BG Above (%) for days with bolus ratio above vs below median
  - Enhanced anomalies section: Report average Basal and Bolus doses for 3 best and 3 worst days with key differences
  - Updated actionable summary to provide recommendations based on tier and outlier data instead of correlations
  - Keep temporal trends section unchanged (best/worst days, multi-day patterns)
  - Updated unit tests to validate new prompt structure and content
</details>

<details>
<summary>207 Add Grok AI provider support</summary>

[#207](../../pull/207) Add Grok AI provider support
  - Add xAI Grok API integration using grok-beta model
  - New Grok AI API key input in Settings > Data & AI tab
  - Priority order for AI providers: Perplexity > Grok AI > Google Gemini
  - Full support for all AI analysis features (Time in Range, Glucose & Insulin)
  - Cookie-based persistence for Grok API key (1-year expiry)
  - Comprehensive test coverage for Grok API integration
</details>

<details>
<summary>209 Add comprehensive meal timing analysis</summary>

[#209](../../pull/209) Add comprehensive meal timing analysis
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

<details>
<summary>202 UI refinements and enablements</summary>

[#202](../../pull/202) UI refinements and enablements
  - Remove accordion from file info display in Reports and AI Analysis pages (since we now use tabs)
  - Add "Meal Timing" tab to AI Analysis page with placeholder text for future implementation
  - Add "Detailed CGM" and "Detailed Insulin" tabs to Reports page with placeholder texts for future implementation
  - Improve Data & AI tab layout in Settings page with better vertical spacing and organization
</details>

<details>
<summary>192 Align UI pages with consistent width and vertical tabs</summary>

[#192](../../pull/192) Align UI pages with consistent width and vertical tabs
  - Standardize all page widths to 1200px for visual consistency (Home, Settings, DataUpload, Reports, AI Analysis)
  - Refactor Settings page to use vertical tabs on the left instead of stacked sections (7 tabs: Support, Theme, Export Format, Glucose Thresholds, AI, Data Privacy, Version Info)
  - Refactor Reports page to use vertical tabs on the left instead of top-level accordions (2 tabs: Time in Range, AGP Data)
  - Refactor AI Analysis page to use vertical tabs on the left instead of top-level accordions (2 tabs: Time in Range, Glucose & Insulin)
  - Maintain all existing functionality while improving navigation and visual consistency
</details>

<details>
<summary>185 Finalize second AI prompt with glucose and insulin correlation analysis</summary>

[#185](../../pull/185) Implement second AI prompt with glucose-insulin correlation analysis
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
<details>
<summary>181 Enhance daily glucose reports with insulin data</summary>

[#181](../../pull/181) Add insulin data integration and second AI prompt section
  - Add "Day of Week" column to "Glucose Range by Date" table in Reports page
  - Add three new columns: Basal Insulin (Units), Bolus Insulin (Units), Total Insulin (Units)
  - Insulin data automatically merged with glucose data by date
  - Missing insulin data displayed as "-" for dates without insulin records
</details>
<details>
<summary>171 Align Reports page with Fluent UI design standards</summary>

[#171](../../pull/171) Align Reports page with Fluent UI design standards
  - Wrap In Range summary data in Fluent UI Card component for better visual organization
  - Replace button groups with Fluent UI TabList for Data Source (CGM/BG) and Categories (3/5) selectors
  - Add rounded corners and subtle elevation to main content container for improved visual hierarchy
  - Standardize all interactive elements with consistent Fluent UI styling
</details>

<details>
<summary>172 Add Google Gemini AI integration alongside Perplexity AI</summary>

[#172](../../pull/172) Add Google Gemini AI provider with automatic selection
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
<details>
<summary>166 Implement markdown rendering for AI responses</summary>

[#166](../../pull/166) Implement markdown rendering for AI responses
  - Add react-markdown library for proper markdown formatting
  - Create MarkdownRenderer component with Fluent UI styling
  - Display AI responses with proper headers, bold text, lists, and other markdown features
  - Comprehensive styling for all markdown elements (headings, lists, code, tables, blockquotes, links)
  - 10 unit tests covering various markdown rendering scenarios
</details>

<details>
<summary>163 Implement Perplexity AI integration for time-in-range glucose analysis</summary>

[#163](../../pull/163) Implement Perplexity AI integration for time-in-range analysis
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
<summary>Fix missing tabs in Excel export for single-file datasets</summary>

Fix missing tabs in Excel export for single-file datasets
  - Fixed `groupCsvFiles` function in zipUtils.ts to preserve original file names in `sourceFiles` field
  - Previously, only merged datasets had their source files tracked, causing single-file datasets to be missing from Excel exports
  - Ensures all datasets shown in Summary sheet get their own tabs in exported xlsx file
  - Fixes missing tabs for: basal, bolus, exercise, food, manual_insulin, medication, notes
  - Added comprehensive test reproducing the bug with 12 datasets
</details>

<details>
<summary>Fix insulin dataset being exported with wrong column headers from manual_insulin</summary>

Fix insulin dataset being exported with wrong column headers from manual_insulin
  - Fixed `findCSVFileName` function fallback logic to use prefix matching instead of substring matching
  - Prevents "insulin" search from incorrectly matching "manual_insulin_data_1.csv"
  - Insulin data now exports correctly with proper columns: Timestamp, Total Bolus (U), Total Insulin (U), Total Basal (U), Serial Number
  - Added comprehensive bug reproduction tests
</details>
<details>
<summary>173 Fix AI analysis button not returning to initial state after cooldown</summary>

[#173](../../pull/173) Fix AI analysis button not returning to initial state after cooldown
  - Button now correctly returns to "Analyze with AI" after 3-second cooldown completes
  - Previous behavior: button stayed as "Click to enable new analysis" indefinitely
  - Added `readyForNewAnalysis` state to track post-cooldown status
  - Accordion now opens by default for better user experience
  - Added ResizeObserver mock for test environment
  - Added new test to verify button state after cooldown completion
</details>

<details>
<summary>174 Fix AI analysis response persistence and button state management</summary>

[#174](../../pull/174) Fix AI analysis response persistence and prevent button spam
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
<details>
<summary>275 Fix AI response truncation by increasing token limits and adding completion markers</summary>

[#275](../../pull/275) Fix AI response truncation by increasing token limits and adding completion markers
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>273 Add copy-to-clipboard button for AI analysis responses</summary>

[#273](../../pull/273) Add copy-to-clipboard button for AI analysis responses
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>270 [WIP] Fix nine failing tests in the test suite</summary>

[#270](../../pull/270) [WIP] Fix nine failing tests in the test suite
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>268 Add Pump Settings Verification AI Analysis Tab</summary>

[#268](../../pull/268) Add Pump Settings Verification AI Analysis Tab
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>260 Add inline AI provider selection with smart auto-selection</summary>

[#260](../../pull/260) Add inline AI provider selection with smart auto-selection
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>262 Add vertical summary bar to CGM details graph</summary>

[#262](../../pull/262) Add vertical summary bar to CGM details graph
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>264 Add vertical totals bar to insulin timeline showing basal vs bolus ratio</summary>

[#264](../../pull/264) Add vertical totals bar to insulin timeline showing basal vs bolus ratio
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>266 Extend AI analysis descriptions to two sentences</summary>

[#266](../../pull/266) Extend AI analysis descriptions to two sentences
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>258 Fix markdown table rendering in AI responses</summary>

[#258](../../pull/258) Fix markdown table rendering in AI responses
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>256 Fix: Capture token limit errors in HTTP 200 responses from all AI providers</summary>

[#256](../../pull/256) Fix: Capture token limit errors in HTTP 200 responses from all AI providers
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>254 Unify Security & Privacy information with collapsible accordions</summary>

[#254](../../pull/254) Unify Security & Privacy information with collapsible accordions
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>252 Fix nightly E2E test failures and update schedule to 3AM CET</summary>

[#252](../../pull/252) Fix nightly E2E test failures and update schedule to 3AM CET
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>251 Fix color scheme dropdown overlay hiding page in Detailed CGM report</summary>

[#251](../../pull/251) Fix color scheme dropdown overlay hiding page in Detailed CGM report
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>247 Add DeepSeek AI provider support</summary>

[#247](../../pull/247) Add DeepSeek AI provider support
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>248 Update version info to link to GitHub Releases</summary>

[#248](../../pull/248) Update version info to link to GitHub Releases
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>245 Add color scheme selector to BG Values graph</summary>

[#245](../../pull/245) Add color scheme selector to BG Values graph
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>244 Fix CHANGELOG: wrap unnamed issues in collapsible details format</summary>

[#244](../../pull/244) Fix CHANGELOG: wrap unnamed issues in collapsible details format
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>236 Fix CHANGELOG: Add collapsible format, document it, and automate updates via workflow</summary>

[#236](../../pull/236) Fix CHANGELOG: Add collapsible format, document it, and automate updates via workflow
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>221 Automate README updates on main branch after PR merges</summary>

[#221](../../pull/221) Automate README updates on main branch after PR merges
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

[← Back to Main Changelog](../../CHANGELOG.md)
