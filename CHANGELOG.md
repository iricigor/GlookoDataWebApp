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
- [#171](../../pull/171) Align Reports page with Fluent UI design standards
  - Wrap In Range summary data in Fluent UI Card component for better visual organization
  - Replace button groups with Fluent UI TabList for Data Source (CGM/BG) and Categories (3/5) selectors
  - Add rounded corners and subtle elevation to main content container for improved visual hierarchy
  - Standardize all interactive elements with consistent Fluent UI styling
- Add Google Gemini AI integration alongside Perplexity AI
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
- [#166](../../pull/166) Implement markdown rendering for AI responses
  - Add react-markdown library for proper markdown formatting
  - Create MarkdownRenderer component with Fluent UI styling
  - Display AI responses with proper headers, bold text, lists, and other markdown features
  - Comprehensive styling for all markdown elements (headings, lists, code, tables, blockquotes, links)
  - 10 unit tests covering various markdown rendering scenarios
- Implement Perplexity AI integration for time-in-range glucose analysis
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

### Fixes
- [#173](../../pull/173) Fix AI analysis button not returning to initial state after cooldown
  - Button now correctly returns to "Analyze with AI" after 3-second cooldown completes
  - Previous behavior: button stayed as "Click to enable new analysis" indefinitely
  - Added `readyForNewAnalysis` state to track post-cooldown status
  - Accordion now opens by default for better user experience
  - Added ResizeObserver mock for test environment
  - Added new test to verify button state after cooldown completion
- Fix AI analysis response persistence and button state management
  - AI responses now persist when navigating to other pages and returning
  - AI responses preserved even after failed API calls
  - Button changes to "Click to enable new analysis" after successful analysis
  - 3-second cooldown with progress bar when requesting new analysis
  - Cooldown prevents accidental multiple API calls
  - State lifted to App.tsx for proper persistence across navigation
  - Added comprehensive unit tests for new behavior (7 new tests)
  - Prevents users from spamming the analyze button

---

## [1.1.x] - Released

### New Features
- [#144](../../pull/144) Add swipe gesture navigation for mobile devices
  - Horizontal swipe left/right to navigate between pages
  - Page order: Home → Data Upload → Reports → AI Analysis → Settings
  - Custom `useSwipeGesture` hook with configurable sensitivity
  - Works on both touch devices (mobile) and mouse (desktop testing)
  - Prevents accidental triggers with vertical scroll detection
- [#148](../../pull/148) Add bug report and feature request links to Settings page
  - New "Support" section at the top of Settings page
  - Quick access buttons to create GitHub issues directly from the app
  - Bug report button links to bug_report.yml template
  - Feature request button links to feature_request.yml template
  - Opens in new tab with proper security attributes (noopener noreferrer)
- [#142](../../pull/142) Add first AI analysis prompts to AI Analysis page
  - Two collapsible accordion sections (both collapsed by default)
  - First prompt: "Time in Range Analysis" displays calculated glucose percentage in range
  - "Analyze with AI" button (enabled only when API key is configured)
  - Button shows helper text before clicking, changes to "AI analysis not implemented yet" after click
  - Second prompt: "Additional Analysis" placeholder with "To be added soon" message
  - UI setup for future AI functionality integration
- [#138](../../pull/138) Add AGP report filters and CSV export
  - Day-of-week filter dropdown with options: All Days, Mon-Sun, Workdays, Weekends
  - Time range filters (start/end) to analyze specific hours of the day
  - CSV export button for AGP statistics table with hover effect
- Add AI settings configuration in Settings page
  - Password-type input field for Perplexity API key with visual confirmation checkmark
  - API key stored securely in browser cookies with persistent storage
  - AI Analysis page displays helpful message with link to Settings when API key is not configured
  - Follows existing settings patterns with Fluent UI components for consistency
- [#140](../../pull/140) Enhanced API key input with inline label layout and comprehensive security explanation
  - Label and input field now displayed in the same row for improved visual organization
  - Detailed security explanation covering storage mechanism (browser cookies, 1-year expiry)
  - Privacy transparency: explains no server transmission, client-side only processing
  - Best practices guidance with links to Perplexity API settings for minimal permissions
  - Risk warning about session compromise with mitigation strategies
  - Link to GitHub repository for open source transparency
- [#122](../../pull/122) Add CSV export functionality to all data tables
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
- Fix black screen overlay when clicking hamburger menu on mobile devices
  - Added `inline` prop to Menu component in Navigation.tsx
  - Prevents modal backdrop from covering the screen when menu is open
  - Similar fix to the dropdown issue that was previously resolved on Reports page
- Make version footer visible without scrolling on all pages
  - Changed app container from min-height to fixed height (100vh) to constrain layout
  - Made main-content scrollable with overflow-y: auto to keep footer always visible
  - Removed minHeight constraints from all page components (DataUpload, Reports, AIAnalysis, Settings)
  - Footer now always remains visible at bottom of viewport, content scrolls within main area
- Fix AI response to use European glucose units (mmol/L) and direct second-person language
  - Updated system message to specify all glucose measurements are in mmol/L (European standard)
  - Changed prompt from third-person ("patient's") to first/second-person ("my"/"your") language
  - Added explicit reminder that glucose values are in mmol/L (not mg/dL)
  - Instructed AI to communicate directly without assuming healthcare provider intermediary
  - Added comprehensive unit tests for new prompt content
- [#157](../../pull/157) Make version footer visible without scrolling on home page
  - Reduced container top/bottom padding from 40px to 24px
  - Reduced header margin-bottom from 40px to 24px
  - Reduced title margin-bottom from 16px to 12px
  - Reduced cards grid gap from 24px to 16px
  - Reduced navigation card minimum height from 200px to 190px
  - Footer now fits within viewport on standard screen sizes
- [#151](../../pull/151) Fix CHANGELOG entry format instructions to prevent HTML anchor tags
  - Updated copilot instructions to explicitly require markdown link format
  - Added clear examples and warnings against using HTML anchor tags
  - Clarified that relative paths must always be used for PR/issue links
  - Updated CHANGELOG.md instructions to match copilot instructions
  - Fixed current version reference from 1.0.x to 1.1.x
- [#146](../../pull/146) Improve AI settings text clarity by restructuring into separate paragraphs
  - Replace inline `<br/>` tags with proper paragraph structure using `<Text as="p">` components
  - Increase font size from Base200 to Base300 and adjust line height for better readability
  - Add proper spacing between paragraphs with marginBottom style
  - Text now matches the clean, readable style of other settings sections
- Center-align all column headers and data cells in AGP report table for improved readability
- Update demo CGM data to have realistic glucose variability matching clinical distribution (1% very low, 2% low, 71% in range, 19% high, 7% very high)

### Documentation
- [#159](../../pull/159) Add link to published app (https://glooko.iric.online) in README Quick Start section
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
- [#162](../../pull/162) Fix CHANGELOG.md by replacing all #XXX placeholder entries with correct PR numbers
  - Identified 11 placeholder entries with #XXX format
  - Used GitHub API to search for and identify correct PR numbers
  - All PR links now point to their correct pull requests
- [#161](../../pull/161) Optimize test execution performance with parallel test running
  - Enable parallel test execution in Vitest configuration using thread pool
  - Run tests once with JSON reporter to extract statistics immediately
  - Eliminate duplicate test run in CI workflow (previously ran tests twice)
  - Expected improvement: 50% reduction in CI test execution time

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
