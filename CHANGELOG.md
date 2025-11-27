# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **📋 Complete Change History:** For a comprehensive list of all changes, see [All Merged Pull Requests](https://github.com/iricigor/GlookoDataWebApp/pulls?q=is%3Apr+is%3Aclosed+is%3Amerged).

## Table of Contents

- [Unreleased](#unreleased---partial-rollback-of-cloud-features)
- [Current Development - 1.4.x](#14x---current-development)
- [Version 1.3.x](#13x---released)
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

---

## [1.4.x] - Current Development

> **📖 Full Details:** [View complete 1.4.x changelog](docs/changelogs/CHANGELOG-1.4.x.md)

### Summary

Version 1.4 focuses on improving maintainability and organization of the codebase.

### Major Features

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
