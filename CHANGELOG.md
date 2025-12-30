# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **📋 Complete Change History:** For a comprehensive list of all changes, see [All Merged Pull Requests](https://github.com/iricigor/GlookoDataWebApp/pulls?q=is%3Apr+is%3Aclosed+is%3Amerged).

## Table of Contents

- [Unreleased](#unreleased---partial-rollback-of-cloud-features)
- [Current Development - 1.8.x](#18x---current-development)
- [Version 1.7.x](#17x---released)
- [Version 1.6.x](#16x---released)
- [Version 1.5.x](#15x---released)
- [Version 1.4.x](#14x---released)
- [Version 1.3.x](#13x---released)
- [Version 1.2.x](#12x---released)
- [Version 1.1.x](#11x---released)
- [Version 1.0.x](#10x---released)
- [Future Versions](#future-versions)
- [Version Format](#version-format)
- [How to Update This File](#how-to-update-this-file)

## [Unreleased] - Partial Rollback of Cloud Features

### Added

- **Documentation for Admin Page**: Comprehensive guide for the Admin page
  - Added `docs/ADMIN_PAGE.md` with full feature documentation
  - Documented access requirements for Pro users
  - Included user statistics, API/web traffic monitoring, and AI testing features
- **Documentation for API Documentation Page**: Comprehensive guide for the API docs page
  - Added `docs/API_DOCUMENTATION.md` with full interactive API explorer guide
  - Documented authentication integration and Swagger UI features
  - Included developer information for updating OpenAPI specs
- **README Updates**: Added visibility for advanced hidden pages
  - New "Advanced Pages" section highlighting Admin and API Docs pages
  - Updated "Documentation" section with links to new guides
  - Direct links to both pages from the main README

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

---

## [1.8.x] - Current Development

> **📖 Full Details:** [View complete 1.8.x changelog](docs/changelogs/CHANGELOG-1.8.x.md)

### Summary

Version 1.8 focuses on new features and enhancements.

### Planned Features

*(To be added as development progresses)*

---

## [1.7.x] - Released

> **📖 Full Details:** [View complete 1.7.x changelog](docs/changelogs/CHANGELOG-1.7.x.md)

### Summary

Version 1.7 represents a major expansion of the platform with the introduction of Google OAuth authentication, Pro Users features with backend AI capabilities, comprehensive admin dashboard with Application Insights integration, Infrastructure as Code using Bicep templates, enhanced AI analysis capabilities, improved mobile UI, and expanded localization support including Serbian and Czech languages.

### Major Features

- **Google OAuth Integration** - Complete sign-in flow with Authorization Code Flow, provider-agnostic authentication, and Azure Key Vault integration
- **Pro Users Program** - Secure backend AI endpoint with rate limiting, Pro user markers (✨), and automatic API key fallback
- **Admin Dashboard & Statistics** - Application Insights integration, user analytics, traffic monitoring, and admin-only access control
- **Infrastructure as Code (Bicep)** - Complete Azure infrastructure templates with configurable parameters and Key Vault references
- **AI Analysis Enhancements** - Unified system prompts, enhanced hypoglycemia analysis with LBGI stats, inline TIR analysis
- **UI/UX Improvements** - Mobile UI overhaul, file info popover, improved navigation, sticky filters with transparency
- **Localization** - Serbian (Latin) and Czech language support with comprehensive translations
- **Performance & Storage** - IndexedDB file caching, persistent accordion and tab states
- **Code Quality** - Refactored utilities, custom hooks, separated workflows, improved E2E tests

---

## [1.6.x] - Released

> **📖 Full Details:** [View complete 1.6.x changelog](docs/changelogs/CHANGELOG-1.6.x.md)

### Summary

Version 1.6 focuses on branding updates and UI improvements.

### Planned Features

- **New Favicon Design** - Modern favicon with blood drop and ECG pulse line on dark circular background
- **UI Refinements** - Continued improvements to user experience

---

## [1.5.x] - Released

> **📖 Full Details:** [View complete 1.5.x changelog](docs/changelogs/CHANGELOG-1.5.x.md)

### Summary

Version 1.5 brought significant enhancements to reporting capabilities, AI analysis features, cloud infrastructure, and deployment automation. This release introduced the Daily BG report combining glucose, insulin, and IOB data, expanded the BG Overview page with sticky filters and period sections, and added AI-powered hypoglycemia pattern detection. Major infrastructure work included Azure Functions API deployment, cloud sync for user settings, centralized logging with correlation IDs, and comprehensive deployment scripts for Azure resources including Key Vault, Storage Tables, and Managed Identities.

### Major Features

- **Daily BG Report** - New comprehensive report combining glucose, insulin, and IOB data visualization
- **BG Overview Enhancements** - Extended with sticky filters, period section, and time-of-day analysis
- **AI Hypos Analysis** - Hypoglycemia pattern detection with risk assessment and bolus context analysis
- **Cloud Settings Sync** - User settings synchronization via Azure Table Storage for logged-in users
- **API Documentation** - Swagger UI page with Microsoft authentication support
- **Centralized Logging** - Correlation IDs for UI and API request tracking
- **Azure Infrastructure** - Complete deployment scripts for Function Apps, Key Vault, Storage, and Managed Identities
- **JWT Validation** - Token validation with JWKS signature verification for API security
- **LBGI/HBGI Metrics** - Low/High Blood Glucose Index and BGRI statistics in reports

---

## [1.4.x] - Released

> **📖 Full Details:** [View complete 1.4.x changelog](docs/changelogs/CHANGELOG-1.4.x.md)

### Summary

Version 1.4 introduces comprehensive glucose analytics with Rate of Change (RoC) analysis featuring gradient-colored visualizations, Hypoglycemia detection with statistics and nadir markers, and HbA1c estimation in both NGSP and IFCC units. The BG Overview page now consolidates Time in Range and AGP visualizations with period breakdowns. UI improvements include horizontal pivot tabs for desktop, RSuite DatePicker with Fluent UI styling, and Coefficient of Variation (CV%) metrics. The changelog was reorganized into version-specific files for better maintainability.

### Major Features

- **Rate of Change (RoC) Analysis** - New report tab with gradient-colored line visualization, interval slider, and statistical summary
- **Hypoglycemia Analysis** - Detection, statistics cards, and color-coded visualization with nadir markers
- **HbA1c Estimate** - Estimated HbA1c calculation with NGSP (%) and IFCC (mmol/mol) units
- **BG Overview Consolidation** - Unified Time in Range and AGP visualization with period breakdown and hourly charts
- **Horizontal Pivot Tabs** - Desktop-optimized horizontal tab navigation matching Microsoft 365 patterns
- **RSuite DatePicker** - Enhanced date selection with Fluent UI styling
- **Changelog Reorganization** - Split large changelog into version-specific files for better maintainability

---

## [1.3.x] - Released

> **📖 Full Details:** [View complete 1.3.x changelog](docs/changelogs/CHANGELOG-1.3.x.md)

### Summary

Version 1.3 represents a major milestone with the implementation of Microsoft authentication and cloud-based user settings synchronization. This release enables users to sign in with their personal Microsoft accounts, automatically sync their preferences across devices via Azure Table Storage, and provides comprehensive deployment infrastructure for Azure-based hosting.

### Major Features

- **Microsoft Authentication Flow** - Complete OAuth 2.0 login/logout experience using MSAL.js with personal Microsoft account support
- **Cloud-Based Settings Synchronization** - Azure Table Storage backend for user preferences with cross-device sync
- **Azure Infrastructure & Deployment** - Managed identity support, centralized configuration, and deployment automation
- **Multi-language Support** - German and Serbian language support for AI responses, plus automatic German CSV import detection
- **Blood Glucose Unit Conversion** - Support for both mmol/L and mg/dL units with automatic conversion
- **Unified Insulin & CGM View** - Combined visualization with toggle controls and high-resolution data
- **IOB (Insulin on Board) Reporting** - New report tab with date picker and graph visualization
- **Shared Date Picker** - Cookie-persistent date selection across all reports

---

## [1.2.x] - Released

> **📖 Full Details:** [View complete 1.2.x changelog](docs/changelogs/CHANGELOG-1.2.x.md)

### Summary

Version 1.2 focused on AI-powered analysis capabilities and comprehensive reporting features.

### Major Features

- **AI Analysis Expansion** - Meal timing analysis, Grok AI provider support, Google Gemini integration
- **Enhanced Reports** - BG Values graph, Detailed CGM report, improved UI with vertical tabs
- **Playwright E2E Testing** - Comprehensive test suite with Page Object Model architecture
- **Glucose & Insulin Correlation** - AI-powered analysis combining glucose ranges with insulin doses
- **Markdown Rendering** - Rich formatting for AI responses with tables, code blocks, and lists

---

## [1.1.x] - Released

> **📖 Full Details:** [View complete 1.1.x changelog](docs/changelogs/CHANGELOG-1.1.x.md)

### Summary

Version 1.1 introduced AI analysis capabilities and improved user experience.

### Major Features

- **Perplexity AI Integration** - Time-in-range glucose analysis with AI-powered recommendations
- **AGP (Ambulatory Glucose Profile)** - Interactive graph with percentile statistics
- **In-Range Report** - Glucose range analysis by day of week and date with filtering
- **Demo Data Auto-loading** - Realistic sample data for immediate exploration
- **Mobile Swipe Navigation** - Touch gesture support for page navigation
- **CSV Export** - Export data tables to clipboard in CSV format

---

## [1.0.x] - Released

> **📖 Full Details:** [View complete 1.0.x changelog](docs/changelogs/CHANGELOG-1.0.x.md)

### Summary

Initial release establishing the foundation of the application.

### Major Features

- **Metadata Parsing** - CSV file processing with comma and tab-separated format support
- **Version Tracking** - Build ID system with dynamic test count badges
- **Core UI** - Footer positioning, responsive layout, and basic application structure

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

**Note:** Detailed changelog entries are now maintained in version-specific files in `docs/changelogs/`. The main CHANGELOG.md contains only summaries.

When creating a pull request:
1. The automated changelog workflow will update the version-specific file (e.g., `docs/changelogs/CHANGELOG-1.3.x.md`)
2. The main CHANGELOG.md is only updated when starting a new version or updating the summary

### Entry Format for Version-Specific Files

Use collapsible details with plain text summary:
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
- Entries within each category should be sorted by PR/issue number (descending - highest first)
