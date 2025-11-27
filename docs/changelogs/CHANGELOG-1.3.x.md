# Changelog - Version 1.3.x (Released)

[← Back to Main Changelog](../../CHANGELOG.md)

---

## [1.3.x] - Released

### Overview

Version 1.3 represents a major milestone with the implementation of Microsoft authentication and cloud-based user settings synchronization. This release enables users to sign in with their personal Microsoft accounts, automatically sync their preferences across devices via Azure Table Storage, and provides comprehensive deployment infrastructure for Azure-based hosting.

### Major Features

**Microsoft Authentication Flow**
- Complete OAuth 2.0 login/logout experience using MSAL.js
- Personal Microsoft account support (outlook.com, hotmail.com, live.com)
- User profile integration with name, email, and avatar from Microsoft Graph API
- Persistent authentication across browser sessions
- Automated Azure App Registration deployment scripts

**Cloud-Based Settings Synchronization**
- Azure Table Storage backend for user preferences
- Automatic sync on login, settings change, and logout
- Cross-device settings persistence (theme, export format, glucose thresholds)
- Graceful fallback to local browser cookies when offline
- Excludes sensitive data (API keys, uploaded files) for security

**Azure Infrastructure &amp; Deployment**
- Managed identity support for secret-free authentication
- Centralized configuration system with JSON-based overrides
- Master orchestration script for automated multi-service deployment
- Comprehensive deployment documentation with cost estimates

### New Features

<details>
<summary>347 Add German and Serbian language support for AI responses</summary>

[#347](../../pull/347) Add German and Serbian language support for AI responses
  - Extended `ResponseLanguage` type to include 'german' and 'serbian' in addition to 'english' and 'czech'
  - Created shared `getLanguageInstruction()` utility function in `promptUtils.ts` to eliminate code duplication
  - Updated all 4 AI prompt generators to use the shared utility (timeInRange, glucoseInsulin, mealTiming, pumpSettings)
  - Added radio options in Settings UI for German (Deutsch) and Serbian (Srpski - latinica)
  - Clarified that only AI responses change - app interface remains English
  - Reduced codebase by 27 lines through code consolidation
  - Test coverage: 765 tests passing with new test cases for both languages
</details>

<details>
<summary>345 Add automatic German language support for Glooko CSV exports</summary>

[#345](../../pull/345) Add automatic German language support for Glooko CSV exports
  - New column mapping system (`columnMapper.ts`) with bidirectional English ↔ German mappings for all dataset types
  - Automatic language detection via header pattern matching
  - `findColumnIndex()` helper for language-agnostic column lookup
  - Updated data extraction modules (glucoseDataUtils, insulinDataUtils, glucoseUnitUtils) to use column mapper
  - Transparent processing - German columns mapped to English internally, existing logic unchanged
  - Zero configuration required - language detection and mapping happen automatically during file upload
  - 26 unit tests for column mapper (language detection, mapping, edge cases)
  - 3 integration tests with German CSV data (glucose and insulin extraction)
  - All 777 existing tests pass with no regressions
</details>

<details>
<summary>343 Detect and convert blood glucose units in CSV imports</summary>

[#343](../../pull/343) Detect and convert blood glucose units in CSV imports
  - Added `detectGlucoseUnit()` to parse column headers and extract units from parentheses notation
  - Case-insensitive matching for variations: mg/dL, mg/dl, mmol/L, mmol, etc.
  - Modified `extractZipMetadata()` to detect and store glucose units per dataset
  - Validates consistency between CGM and BG datasets when both present
  - Rejects files with mismatched units with clear error messages
  - Modified `parseGlucoseReadingsFromCSV()` to accept conversion flag
  - Automatically converts mg/dL → mmol/L during extraction using factor 1/18.018
  - All glucose values stored internally in mmol/L regardless of source format
  - Added `glucoseUnit?: GlucoseUnit | null` to `CsvFileMetadata` interface
  - Updated demo-data.zip to use consistent units (mmol/L for both CGM and BG)
  - 25 tests for unit detection, 8 tests for ZIP validation, 10 tests for data extraction with conversion
</details>

<details>
<summary>342 Add IOB tab to Reports page with date picker and graph placeholder</summary>

[#342](../../pull/342) Add IOB tab to Reports page with date picker and graph placeholder
  - New `IOBReport` component following existing report pattern with `DayNavigator`
  - Reports page updated with "IOB" tab in vertical TabList with routing to IOBReport
  - Date navigation controls (Previous Day/Next Day buttons and date picker)
  - Insulin data extraction for available dates
  - Placeholder message where IOB graph will be configured in future PR
  - Unit tests for component rendering and E2E test for tab visibility/interaction
</details>

<details>
<summary>339 Adapt app to support different BG units</summary>

[#339](../../pull/339) Adapt app to support different BG units
  - Component hierarchy passes glucoseUnit through App → Reports/AIAnalysis → Components
  - All 4 AI prompts specify response units dynamically based on user Settings
  - Updated report components (AGPReport, InRangeReport, BGValuesReport, UnifiedTimeline) to display values in selected unit
  - Y-axis labels and data points converted to display unit while maintaining internal mmol/L storage
  - Reference threshold lines converted to display unit
  - Max value selector supports mg/dL values (288/396) in addition to mmol/L
  - Color logic uses original mmol/L values to ensure thresholds remain accurate
  - Fixed "Detailed CGM" reference lines to properly convert to mg/dL when selected
  - Removed unnecessary "Show CGM" toggle from Unified Timeline
  - Updated all test files for comprehensive coverage
  - Build and lint passing successfully
</details>

<details>
<summary>337 Add glucose unit toggle (mmol/L ⇔ mg/dL) - Settings page only</summary>

[#337](../../pull/337) Add glucose unit toggle (mmol/L ⇔ mg/dL) - Settings page only
  - New `useGlucoseUnit` hook with cookie-persisted preference (like useExportFormat)
  - Conversion utilities: `mmolToMgdl()`, `mgdlToMmol()`, `displayGlucoseValue()` using factor 18.018
  - Added `GlucoseUnit = 'mmol/L' | 'mg/dL'` type definition
  - Radio group in Settings General tab for unit selection
  - Dynamic description text updates based on selected unit
  - `GlucoseThresholdsSection` converts values for display/input
  - Spin button ranges adjust: mmol/L (0.1-30, step 0.1), mg/dL (1-540, step 1)
  - "In Range" label updates: 3.9-10.0 mmol/L → 70-180 mg/dL
  - Internal storage remains mmol/L; conversion happens at display layer
  - 27 tests cover conversion logic and hook behavior
  - Display precision: mmol/L uses 1 decimal, mg/dL uses integers
</details>

<details>
<summary>335 Add unified insulin and CGM view with toggle control, glucose analytics, and high-resolution data visualization</summary>

[#335](../../pull/335) Add unified insulin and CGM view with toggle control, glucose analytics, and high-resolution data visualization
  - New components: `UnifiedDailyReport.tsx` (state and data loading), `UnifiedTimeline.tsx` (dual Y-axis chart)
  - Reports.tsx updated with "Unified view" tab
  - Chart displays basal insulin (green line, left axis), bolus insulin (blue bars, left axis)
  - High-resolution glucose values with dynamic coloring (right axis) when toggled on
  - Glucose threshold reference lines displayed when CGM enabled
  - Glucose range bar (left side) shows daily percentages for High, In Range, Low (60px width matching insulin totals bar)
  - Color scheme selector with 4 options: Monochrome, Basic Colors, HSV Spectrum, Clinical Zones
  - BG Max Value selector with simplified tabs (16.0 / 22.0 mmol/L)
  - Show CGM switch positioned next to title inside graph area for quick access
  - Title "Unified Timeline" always visible regardless of CGM state
  - Glucose data displayed at original 5-minute granularity (~288 points/day) instead of hourly averages
  - Gracefully handles missing CGM data by disabling the switch
  - Enhanced interactions: active state with scale(1.02) on Home page navigation cards
  - Consistent styling applied across BGValuesReport and DayNavigator components
</details>

<details>
<summary>333 Add shared date picker with cookie persistence across all reports</summary>

[#333](../../pull/333) Add shared date picker with cookie persistence across all reports
  - Created `useDateRange` hook for date range reports (Time in Range, AGP Data)
    - Manages shared date range state with cookie persistence, keyed by file ID
    - Follows existing pattern from useExportFormat and useGlucoseThresholds
    - Returns `{ startDate, endDate, setStartDate, setEndDate }` interface
  - Created `useSelectedDate` hook for single date reports (Detailed CGM, Detailed Insulin)
    - Manages shared single date state with cookie persistence, keyed by file ID
    - Returns `{ selectedDate, setSelectedDate }` interface
  - Enhanced `DayNavigator` and `InsulinDayNavigator` components with date picker input fields
    - New props: onDateSelect, minDate, maxDate
    - Date picker appears next to formatted date display for direct date selection
  - Integrated hooks in AGPReport.tsx, InRangeReport.tsx, BGValuesReport.tsx, InsulinDailyReport.tsx
  - Configuration priority: CLI args → environment variables → config file → defaults
  - Date selections persist when switching between related tabs and across browser sessions (365-day cookie expiration)
  - 13 tests for useDateRange hook and 10 tests for useSelectedDate hook
</details>

<details>
<summary>324 Add AI response language setting with Azure sync (English/Czech)</summary>

[#324](../../pull/324) Add AI response language setting with Azure sync (English/Czech)
  - New `useResponseLanguage` hook with cookie-persisted preference ('english' | 'czech')
  - Settings UI: "AI Response Language" section under General tab with radio group
  - All four prompt generators (timeInRange, glucoseInsulin, mealTiming, pumpSettings) accept optional language parameter
  - Appends language instruction: "Respond in English" or "Respond in Czech language (česky)"
  - Azure settings sync: Added `responseLanguage` to `UserSettings` interface and Azure storage
  - Updated `userSettingsService` to save/load language preference
  - Updated `useSettingsSync` hook to sync language across devices for authenticated users
  - Anonymous users continue to use cookie-based storage
  - Data flow: App.tsx passes language to AIAnalysis.tsx which uses it in prompt generation
</details>

<details>
<summary>322 Add 1.3.x section to CHANGELOG with Microsoft authentication and cloud sync features</summary>

[#322](../../pull/322) Add 1.3.x section to CHANGELOG with Microsoft authentication and cloud sync features
  - New 1.3.x section with overview of Microsoft OAuth 2.0 authentication and cloud-based settings synchronization
  - Documented 11 new features: MSAL.js integration, Azure Table Storage sync, managed identity infrastructure, deployment automation
  - Documented 4 bug fixes related to Azure App Registration script iterations
  - Documented 3 improvements: AI API refactoring, truncation detection, repository cleanup
  - Table of Contents updated: 1.3.x → 1.2.x → 1.1.x → 1.0.x
  - Moved 19 PRs (#287-#316, merged ≥2025-11-14) from 1.2.x to 1.3.x
  - Changed 1.2.x from "Current Development" to "Released"
  - Updated instructions to reference 1.3.x as current version
  - All entries follow collapsible details format with relative PR links and descending sort order
</details>

<details>
<summary>320 Add PowerShell 7 deployment scripts and reorganize into CLI/PS directories</summary>

[#320](../../pull/320) Add PowerShell 7 deployment scripts and reorganize into CLI/PS directories
  - New directory structure: `scripts/deployment-cli/` (bash) and `scripts/deployment-ps/` (PowerShell 7)
  - Created 8 PowerShell scripts with native parameter binding and validation attributes:
    - `config-lib.ps1` - Configuration library with dot-sourcing pattern
    - `deploy-azure-master.ps1` - Orchestration with parameter binding
    - `deploy-azure-managed-identity.ps1` - Identity management
    - `deploy-azure-storage-account.ps1` - Storage deployment
    - `deploy-azure-static-web-app.ps1` - Static web app with SKU validation
    - `deploy-azure-app-registration.ps1` - App registration
    - `deploy-azure-user-settings-table.ps1` - Table creation
    - `deploy-azure-pro-users-table.ps1` - Table creation
  - PowerShell 7.0+ required (`#Requires -Version 7.0`)
  - Dot-sourcing for shared library: `. ./config-lib.ps1`
  - PowerShell-native error handling with try/catch
  - Same configuration precedence: params → env vars → config file → defaults
  - Updated `scripts/deployment/README.md` with navigation to both implementations
  - Full feature parity for managed identity, configuration management, and deployment orchestration
</details>

<details>
<summary>316 Add managed identity infrastructure with centralized configuration system</summary>

[#316](../../pull/316) Add managed identity infrastructure with centralized configuration system
  - Create user-assigned managed identity with automatic RBAC role assignment
  - Deploy Static Web App with optional managed identity support (Standard SKU)
  - Master orchestration script downloads and executes deployment scripts from GitHub
  - Centralized JSON configuration system with local overrides in `~/.glookodata/config.json`
  - Configuration priority: CLI args → environment variables → JSON config → defaults
  - Update storage account script to support RBAC-based authentication via `--use-managed-identity` flag
  - New scripts: `deploy-azure-managed-identity.sh`, `deploy-azure-static-web-app.sh`, `deploy-azure-master.sh`, `config-lib.sh`
  - Comprehensive documentation in `docs/MANAGED_IDENTITY.md` covering architecture and migration
  - Eliminates secrets from configuration with automatic Azure credential rotation
  - Dry-run mode for configuration validation
  - Backward compatible with connection string authentication
</details>

<details>
<summary>314 Reorganize deployment scripts into dedicated folder with comprehensive documentation</summary>

[#314](../../pull/314) Reorganize deployment scripts into dedicated folder with comprehensive documentation
  - Move `deploy-azure-app-registration.sh` into `scripts/deployment/` directory
  - Split monolithic `deploy-azure-table-storage.sh` into focused scripts:
    - `deploy-azure-storage-account.sh` - Creates storage account and resource group
    - `deploy-azure-user-settings-table.sh` - Creates UserSettings table with CORS configuration
    - `deploy-azure-pro-users-table.sh` - Template for future ProUsers table
  - New `docs/DEPLOYMENT.md` with comprehensive deployment guide
  - Direct execution from Azure Cloud Shell via curl (no repository cloning required)
  - New `scripts/deployment/README.md` with script-specific documentation
  - Instructions for editing scripts in Azure Cloud Shell (nano, vi, code editor)
  - Deprecated `docs/AZURE_DEPLOYMENT.md` with migration pointers
  - All scripts are idempotent with validation and colored output
</details>

<details>
<summary>312 Implement Azure Table Storage sync for user settings</summary>

[#312](../../pull/312) Implement Azure Table Storage sync for user settings
  - Automated deployment script (`deploy-azure-table-storage.sh`) for Azure Storage Account, table, and CORS
  - Static Web App config (`staticwebapp.config.json`) integrates Data API Builder with authentication
  - New `userSettingsService.ts` with Azure Table Storage interface:
    - `loadUserSettings(email)` - Fetch settings by user email
    - `saveUserSettings(email, settings)` - Upsert settings with type safety
    - `isServiceAvailable()` - Graceful degradation check for offline scenarios
  - New `useSettingsSync.ts` hook manages automatic synchronization:
    - Load from Azure on login
    - Save to Azure on change (2-second debounce) and logout
    - Monitors auth state via `useAuth` hook
    - Falls back to cookies when Azure unavailable
  - Azure Table Storage schema: PartitionKey (user email), RowKey ("settings"), columns for ThemeMode, ExportFormat, GlucoseThresholds
  - Explicitly excludes API keys, uploaded files, and AI analysis results from sync
  - 11 comprehensive unit tests for service layer
  - Zero modifications to existing settings hooks - clean integration via composition
  - Documentation: `docs/AZURE_DEPLOYMENT.md` (cost: ~$1/month for 1k users), `docs/DEVELOPER_GUIDE_SETTINGS.md`
</details>

<details>
<summary>308 Add 7-day fallback for oversized AI analysis datasets</summary>

[#308](../../pull/308) Add 7-day fallback for oversized AI analysis datasets
  - Three-tier progressive fallback for Meal Timing and Pump Settings analysis: Full dataset → 28 days → 7 days
  - Real-time retry notifications with warning MessageBar displaying current attempt
  - Dataset transparency with success responses indicating which dataset size was used
  - Persistent analysis context with helper text remaining visible during analysis
  - Enhanced error handling specifically for token limit errors
  - Cascading fallback logic in `handleMealTimingClick` and `handlePumpSettingsClick`
  - Added `mealTimingRetryInfo` and `pumpSettingsRetryInfo` state for notification display
  - Time in Range and Glucose & Insulin tabs unchanged (different data structures)
</details>

<details>
<summary>304 Implement Microsoft authentication with MSAL</summary>

[#304](../../pull/304) Implement Microsoft authentication with MSAL
  - Replace demo authentication with Microsoft login using MSAL.js
  - MSAL configuration with Authorization Code Flow with PKCE
  - Client ID: `656dc9c9-bae3-4ed0-a550-0c3e8aa3f26c`
  - Authority: `login.microsoftonline.com/consumers` (personal accounts only)
  - Scopes: `openid`, `profile`, `email`, `User.Read`
  - New `useAuth.ts` hook with real MSAL integration replacing fake localStorage auth
  - Microsoft Graph API integration (`graphUtils.ts`):
    - `fetchUserProfile()` - retrieves name and email
    - `fetchUserPhoto()` - fetches profile picture as blob URL with fallback to auto-generated avatars
  - Enhanced UI components:
    - `LoginDialog` triggers Microsoft popup authentication with Microsoft logo
    - `LogoutDialog` displays user card with avatar, name, and email
    - `Navigation` renders authenticated user information in top-right corner
  - Dependencies: `@azure/msal-browser@4.26.1`, `@azure/msal-react@3.0.21`
  - Authentication persists across sessions via sessionStorage
  - Silent token acquisition handles session restoration
  - No changes required to existing Azure App Registration script
</details>

<details>
<summary>301 Unify table design with sticky headers and dual CSV export</summary>

[#301](../../pull/301) Unify table design with sticky headers and dual CSV export
  - New `TableContainer` component provides consistent table wrapper across app:
    - Sticky headers with `position: sticky, top: 0, z-index: 1`
    - Hover-triggered CSV button container with smooth transitions
    - Consistent padding and border styling via Fluent UI tokens
  - New `DownloadCsvButton` component triggers browser download (complements existing CopyToCsvButton)
  - Updated components: AGPReport, InRangeReport (3 tables), AIAnalysis, FileList
  - Highlighted columns use `backgroundColor: tokens.colorNeutralBackground2` and `fontWeight: 600`
  - Configurable highlighted columns per table (e.g., Time/Median in AGP, In Range in reports)
  - Unified table styling eliminates inconsistencies across data tables
</details>

<details>
<summary>300 Add login/logout UI to navigation bar</summary>

[#300](../../pull/300) Add login/logout UI to navigation bar
  - Implement fake authentication UI with login/logout dialogs for initial testing
  - New `useAuth` hook manages login state with localStorage persistence
  - `LoginDialog` component with modal for fake login flow (signs in as "John Doe")
  - `LogoutDialog` component with user profile button, avatar, and logout confirmation
  - Navigation bar conditionally renders login button or user profile based on authentication state
  - Exposes `isLoggedIn`, `userName`, `login()`, and `logout()` methods
  - Files: `src/hooks/useAuth.ts`, `src/components/shared/LoginDialog.tsx`, `src/components/shared/LogoutDialog.tsx`
  - Comprehensive unit tests for authentication hook and UI components
  - Foundation for real Microsoft authentication (replaced in PR #304)
</details>

<details>
<summary>293 Migrate to Fluent UI v9 motion tokens and bump to v1.3.0</summary>

[#293](../../pull/293) Migrate to Fluent UI v9 motion tokens and bump to v1.3.0
  - Replace all hardcoded transitions (`'all 0.2s ease'`) with Fluent UI motion primitives across 8 components
  - Use `tokens.durationNormal` for timing and `tokens.curveEasyEase` for easing
  - Enhanced interactions with `:active` state using `scale(1.02)` on Home page navigation cards
  - Consistent motion across file upload zones, reports, and interactive elements
  - Version bump to 1.3.0 in package.json
  - Data visualization colors remain domain-specific per medical standards
  - Completes Fluent UI v9 migration for motion system
</details>

<details>
<summary>287 Add Azure App Registration deployment script for Microsoft authentication</summary>

[#287](../../pull/287) Add Azure App Registration deployment script for Microsoft authentication
  - New `scripts/deploy-azure-app-registration.sh` automates Azure App Registration creation
  - Configuration: All settings defined as constants (app name, URL, redirect URIs, audience)
  - Sign-in audience restricted to `PersonalMicrosoftAccount` (outlook.com/hotmail.com/live.com)
  - Redirect URIs: `https://glooko.iric.online` and auth callback paths
  - API permissions: Microsoft Graph (openid, profile, email, User.Read)
  - Designed for Azure Cloud Shell with pre-installed Azure CLI and login validation
  - Color-coded output, existing app detection with update prompt, configuration summary
  - Documentation: `docs/AZURE_APP_REGISTRATION.md` with setup guide and MSAL.js integration examples
  - New `scripts/README.md` indexing all repository scripts
  - Outputs MSAL.js configuration (clientId, authority, redirectUri) for integration
</details>

<details>
<summary>285 Update screenshots documentation with comprehensive light/dark/mobile coverage</summary>

[#285](../../pull/285) Update screenshots documentation with comprehensive light/dark/mobile coverage
  - Reorganized `SCREENSHOTS.md` as landing page with overview and navigation links
  - Created three dedicated pages:
    - `SCREENSHOTS_LIGHT.md` - Desktop light mode (1920x1080) with 15 screenshots
    - `SCREENSHOTS_DARK.md` - Desktop dark mode (1920x1080) with 15 screenshots
    - `SCREENSHOTS_MOBILE.md` - Mobile dark theme (375x812) with 15 screenshots
  - Each mode covers: Home, Data Upload, Reports (5 tabs), AI Analysis (5 tabs), Settings (3 tabs)
  - New `scripts/capture-screenshots.ts` - Playwright-based automated capture
  - Handles theme switching, navigation, API key setup, desktop/mobile viewports
  - Updated `.gitignore` to allow `docs/screenshots/` while excluding temporary test screenshots
  - 45 total screenshots with detailed descriptions, design principles, and accessibility notes
</details>

<details>
<summary>289 Move screenshot documentation files into screenshots/ subfolder</summary>

[#289](../../pull/289) Move screenshot documentation files into screenshots/ subfolder
  - Reorganized screenshot documentation for better structure
  - Moved `SCREENSHOTS_DARK.md`, `SCREENSHOTS_LIGHT.md`, `SCREENSHOTS_MOBILE.md` from `docs/` to `docs/screenshots/`
  - Updated all cross-references in `SCREENSHOTS.md` to use `screenshots/` prefix
  - Updated image paths in moved files to be relative (from `screenshots/dark/` to `dark/`)
  - Colocated documentation files with their corresponding image directories
  - Updated parent and root README references with correct relative paths
</details>

### Fixes

<details>
<summary>326 Disable mouse swipe on desktop to prevent text selection conflicts</summary>

[#326](../../pull/326) Disable mouse swipe on desktop to prevent text selection conflicts
  - Removed all mouse event handlers (handleMouseDown, handleMouseMove, handleMouseUp) from `useSwipeGesture.ts`
  - Swipe navigation now only works on touch devices (mobile/tablet)
  - Eliminates conflicts with text selection on desktop
  - Mouse-based swipe disabled completely to prevent unwanted page navigation during text selection
  - Touch events only: touchstart, touchmove, touchend
  - Follows industry standard approach for swipe gesture handling
  - Removed ~50 lines of code and simplified implementation
  - Better performance with fewer event handlers
  - Updated documentation to reflect touch-only behavior
  - Removed mouse-related test cases, keeping only touch event tests
</details>

<details>
<summary>302 Fix Azure App Registration script SPA configuration format</summary>

[#302](../../pull/302) Fix Azure App Registration script SPA configuration format
  - Fixed Azure CLI command format: Changed from `--set spa.redirectUris=` to `--set spa=` with complete JSON object
  - Azure CLI expects `spa` as a complete JSON object `{"redirectUris":[...]}`, not nested property assignment
  - Added localhost URIs (`http://localhost:5173` variants) for local development testing
  - Total of 6 redirect URIs now configured (3 production + 3 localhost)
  - Fixed "Couldn't find 'spa' in ''" error during deployment
</details>

<details>
<summary>299 Fix Azure App Registration script: unquote JSON array in --set parameter</summary>

[#299](../../pull/299) Fix Azure App Registration script: unquote JSON array in --set parameter
  - Remove quotes from `${redirect_uris_json}` variable expansion in `az ad app update` command
  - Azure CLI's `--set` expects raw JSON for complex types, not string-wrapped JSON
  - Wrapping JSON array in quotes passes it as string literal instead of parsed JSON
  - Added comment explaining JSON parsing requirement
  - Suppressed shellcheck SC2086 with explanation (intentional unquoted expansion)
</details>

<details>
<summary>294 Fix Azure App registration script: use --set for spa.redirectUris</summary>

[#294](../../pull/294) Fix Azure App registration script: use --set for spa.redirectUris
  - Replace `--spa-redirect-uris` (doesn't exist in Azure CLI) with `--set spa.redirectUris=`
  - Use Azure CLI's generic update syntax for SPA configuration
  - Azure CLI provides platform-specific arguments for `web` and `publicClient`, but not for `spa`
  - SPA redirect URIs must be set via generic `--set` argument with application manifest property path
  - Added comment explaining the property path approach
</details>

<details>
<summary>291 Fix Azure App Registration script to use SPA redirect URIs parameter</summary>

[#291](../../pull/291) Fix Azure App Registration script to use SPA redirect URIs parameter
  - Changed `--web-redirect-uris` to `--spa-redirect-uris` in `az ad app update` command
  - Script was using wrong parameter for traditional web apps instead of SPAs
  - Fixed "Invalid value specified for property 'web' of resource 'Application'" error
</details>

### Documentation

<details>
<summary>Documentation improvements for deployment, managed identity, and developer guides</summary>

Documentation improvements for deployment, managed identity, and developer guides
  - New `docs/MANAGED_IDENTITY.md` - Comprehensive managed identity guide with architecture and migration
  - New `docs/DEPLOYMENT.md` - Complete deployment guide with direct Azure Cloud Shell execution
  - New `docs/AZURE_DEPLOYMENT.md` - Azure Table Storage deployment with cost estimates
  - New `docs/DEVELOPER_GUIDE_SETTINGS.md` - Guide for adding new settings and troubleshooting
  - New `docs/AZURE_APP_REGISTRATION.md` - Setup guide with MSAL.js integration examples
  - Updated `scripts/deployment/README.md` - Complete rewrite documenting all scripts
  - Updated `scripts/README.md` - Index of all repository scripts
  - Updated `README.md` - Added authentication features description
</details>

### Other
<details>
<summary>396 [WIP] Add enhancements to pump settings AI analysis</summary>

[#396](../../pull/396) [WIP] Add enhancements to pump settings AI analysis
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>393 Enhance meal timing prompt with precise detection criteria and weekday/weekend analysis</summary>

[#393](../../pull/393) Enhance meal timing prompt with precise detection criteria and weekday/weekend analysis
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>391 Enhance glucose insulin AI prompt with tercile-based analysis and safety features</summary>

[#391](../../pull/391) Enhance glucose insulin AI prompt with tercile-based analysis and safety features
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>387 Remove cloud storage settings sync while preserving basic authentication</summary>

[#387](../../pull/387) Remove cloud storage settings sync while preserving basic authentication
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>389 Enhance TIR prompt with target range, TAR percentage, and behavioral recommendations</summary>

[#389](../../pull/389) Enhance TIR prompt with target range, TAR percentage, and behavioral recommendations
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>385 Add first-time login welcome dialog and fix MSAL COOP error</summary>

[#385](../../pull/385) Add first-time login welcome dialog and fix MSAL COOP error
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>380 Fix date persistence bug by removing circular dependency in report components</summary>

[#380](../../pull/380) Fix date persistence bug by removing circular dependency in report components
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>381 Add German demo datasets to validate German language import support</summary>

[#381](../../pull/381) Add German demo datasets to validate German language import support
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>383 Fix module export bug causing Azure Cloud Shell failures</summary>

[#383](../../pull/383) Fix module export bug causing Azure Cloud Shell failures
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>373 Replace synthetic demo data with real AZT1D patient data for authentic variability</summary>

[#373](../../pull/373) Replace synthetic demo data with real AZT1D patient data for authentic variability
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>378 Fix Reports page header spacing</summary>

[#378](../../pull/378) Fix Reports page header spacing
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>376 Move icon files to dedicated public/favicon folder</summary>

[#376](../../pull/376) Move icon files to dedicated public/favicon folder
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>374 Optimize test execution with reduced timeout thresholds</summary>

[#374](../../pull/374) Optimize test execution with reduced timeout thresholds
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>372 Implement IOB graph with recharts line chart and accordion data table</summary>

[#372](../../pull/372) Implement IOB graph with recharts line chart and accordion data table
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>370 Add IOB preparation: configurable insulin duration and hourly data table</summary>

[#370](../../pull/370) Add IOB preparation: configurable insulin duration and hourly data table
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>367 Fix glucose tooltip value display in Unified Timeline and Detailed CGM charts</summary>

[#367](../../pull/367) Fix glucose tooltip value display in Unified Timeline and Detailed CGM charts
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>366 Fix Set-GlookoConfig JSON truncation and consolidate deployment into module</summary>

[#366](../../pull/366) Fix Set-GlookoConfig JSON truncation and consolidate deployment into module
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>353 Add extended demo data with 6 patient datasets and load UI</summary>

[#353](../../pull/353) Add extended demo data with 6 patient datasets and load UI
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>358 Fix report content alignment and add tab/date persistence</summary>

[#358](../../pull/358) Fix report content alignment and add tab/date persistence
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>355 Convert PowerShell deployment scripts to modular PowerShell module</summary>

[#355](../../pull/355) Convert PowerShell deployment scripts to modular PowerShell module
  - [Auto-generated entry from PR merge]
</details>

<details>
<summary>352 Auto-detect CHANGELOG version from package.json and add missing PR entries</summary>

[#352](../../pull/352) Auto-detect CHANGELOG version from package.json and add missing PR entries
  - [Auto-generated entry from PR merge]
</details>


<details>
<summary>283 Refactor AI API providers to eliminate duplication via shared base client</summary>

[#283](../../pull/283) Refactor AI API providers to eliminate duplication via shared base client
  - New shared `baseApiClient.ts` with reusable functions:
    - `validateInputs()` - Input validation
    - `handleHttpError()` - HTTP error response handling
    - `handleException()` - Network/exception handling
    - `callOpenAICompatibleApi()` - OpenAI-compatible API caller with automatic retry on truncation
  - Refactored providers use shared implementation (50% code reduction):
    - `perplexityApi.ts` - 60% reduction (201 → 80 lines)
    - `deepseekApi.ts` - 61% reduction (197 → 77 lines)
    - `grokApi.ts` - 61% reduction (197 → 77 lines)
    - `geminiApi.ts` - 22% reduction (223 → 173 lines)
  - New `baseApiClient.test.ts` with 19 comprehensive tests
  - Backward compatible - no API signature changes
  - Trivial extensibility - new OpenAI-compatible providers need ~10 lines
</details>

<details>
<summary>281 Detect and warn on truncated AI responses with automatic retry</summary>

[#281](../../pull/281) Detect and warn on truncated AI responses with automatic retry
  - Added truncation detection across all AI providers:
    - Check `finish_reason === 'length'` (Perplexity, Grok, DeepSeek)
    - Check `finishReason === 'MAX_TOKENS'` (Gemini)
  - Implemented automatic retry with increased token limits:
    - First attempt uses 4000 tokens
    - On truncation, automatically retries with 8000 tokens
    - If retry succeeds, returns complete response without warning
    - Only shows warning if still truncated after retry
  - Safe retry mechanism with `isRetry` flag prevents infinite loops
  - Enhanced API functions with optional `maxTokens` and `isRetry` parameters (backward compatible)
  - 8 new retry tests added (119 total tests passing)
</details>

<details>
<summary>280 [WIP] Reorganize repository to eliminate duplicate files</summary>

[#280](../../pull/280) [WIP] Reorganize repository to eliminate duplicate files
  - Phase 1: Delete backup/debug files (.bak and *-bug.test.ts)
  - Delete duplicate FileList and zipUtils files from src/components and src/utils
  - Create `src/components/shared/` directory for UI shell components
  - Move Navigation, Footer, MarkdownRenderer, InfoCard to shared/
  - Phase 2: Organize utils into subdirectories:
    - `src/utils/api/` - AI API files (perplexityApi, geminiApi, grokApi, deepseekApi, aiApi, aiPrompts)
    - `src/utils/data/` - Data processing (csvUtils, glucoseRangeUtils, glucoseDataUtils, insulinDataUtils, metadataUtils)
    - `src/utils/formatting/` - Formatting utilities (bgColorUtils, base64Utils)
    - `src/utils/visualization/` - Visualization (agpUtils)
  - Create index.ts barrel exports for all subdirectories
  - Update 40+ files with new import paths
  - Fix test mocks to reference new paths
  - Phase 3: Move prompts/* to `src/features/aiAnalysis/prompts/` (8 files)
  - Remove old prompts/ directory and create barrel exports
</details>

<details>
<summary>277 Fix clipboard formatting loss and screen flicker when copying AI responses</summary>

[#277](../../pull/277) Fix clipboard formatting loss and screen flicker when copying AI responses
  - Extended `copyToClipboard()` to write both `text/plain` and `text/html` using ClipboardItem API
  - Replaced custom markdown-to-HTML converter with unified/remark/rehype pipeline
  - Full markdown feature support including tables, strikethrough, task lists, headers, bold/italic, lists, links, code blocks
  - Uses `remark-gfm` for GitHub Flavored Markdown support
  - Added `rehype-stringify` package for robust HTML output
  - Includes fallback to `writeText()` when ClipboardItem unsupported
  - Fixed screen flicker by removing hover state from MarkdownRenderer
  - Removed Fluent UI Tooltip component causing dynamic FluentProvider portal divs
  - Replaced with native HTML `title` attribute for hover tooltips
  - Copy button now always visible instead of opacity-transitioning on hover
  - Eliminated XSS vulnerabilities from custom regex-based HTML generation
  - All 605/614 tests pass with new table conversion test
</details>

---

[← Back to Main Changelog](../../CHANGELOG.md)
