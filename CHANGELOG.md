# Changelog

All notable changes to GlookoDataWebApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Current Development - 1.0.x](#10x---current-development)
- [Future Versions](#future-versions)
- [Version Format](#version-format)
- [How to Update This File](#how-to-update-this-file)

## [1.0.x] - Current Development

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

### [1.1.x] - Nov 9
- Provide static data analysis under Reports page

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
