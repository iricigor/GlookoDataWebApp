# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Unreleased](#unreleased---partial-rollback-of-cloud-features)
- [Current Development - 1.3.x](#13x---current-development)
- [Version 1.2.x](#12x---released)
- [Version 1.1.x](#11x---released)
- [Version 1.0.x](#10x---released)
- [Future Versions](#future-versions)
- [Version Format](#version-format)
- [How to Update This File](#how-to-update-this-file)

## [Unreleased] - Partial Rollback of Cloud Features

### Removed

- **Settings Synchronization**: Cloud-based settings sync removed
  - Removed Azure Table Storage integration
  - Removed userSettingsService and useSettingsSync hooks
  - Removed WelcomeDialog for first-time login setup
  - Settings now stored locally in browser cookies only
- **Data API Builder**: Removed API configuration from staticwebapp.config.json
- **Deployment Infrastructure**: Removed all non-SWA deployment resources
  - Removed deployment scripts for Storage Account and Table Storage
  - Removed PowerShell deployment module
  - Removed CLI deployment scripts
  - Simplified documentation to focus only on Azure Static Web Apps

### Retained

- **Microsoft Authentication**: Basic login/logout functionality preserved
  - MSAL integration for Microsoft sign-in
  - LoginDialog and LogoutDialog UI components
  - User profile display with name, email, and photo
  - Authentication state management via useAuth hook

### Notes

All data processing continues to happen client-side in the browser. Settings are stored locally. Authentication is optional and provides a personalized experience without cloud storage dependencies. The application works fully offline after initial load.

## [1.3.x] - Current Development

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

**Azure Infrastructure & Deployment**
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
1. Add an entry under the appropriate version section (current: 1.3.x)
2. Place the entry in the correct category based on the PR/issue label:
   - **New Features** - for ✨ Feature label
   - **Fixes** - for 🪲 Bug label
   - **Documentation** - for 📚 Documentation label
   - **Other** - for other changes
3. **Entry format - Use collapsible details with plain text summary:**
   ```markdown
   <details>
   <summary>213 Enable smaller data set for "Meal Timing" analysis</summary>
   
   [#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis
     - Add automatic fallback to last 28 days when AI API returns "request too large" error
     - New utility functions: `filterGlucoseReadingsToLastDays()` and `filterInsulinReadingsToLastDays()`
     - Enhanced error detection for request size limitations
     - [... more sub-bullets as needed ...]
   </details>
   ```
   - **Summary tag**: Plain PR number (no `#`) + title (no hyperlink)
   - **First line in details**: Full hyperlinked version with `#` symbol: `[#213](../../pull/213) Title`
   - **Always use relative paths:** `../../pull/PR_NUMBER` or `../../issues/ISSUE_NUMBER`
   - **Sub-bullets**: List all changes as indented bullet points (2 spaces + dash)
   - **Never use HTML anchor tags** like `<a href="...">` - only use markdown format
   - **For issues without PRs:** `[Issue #100](../../issues/100) Description`
4. Entries within each category should be sorted by PR/issue number (descending - highest first)
