# Large Files Documentation

This document identifies large files in the GlookoDataWebApp repository and provides recommendations for potential splitting or optimization.
Last update on December 1, 2025.

## Table of Contents

- [Overview](#overview)
- [Large Source Code Files](#large-source-code-files)
  - [Files Over 1000 Lines](#files-over-1000-lines)
  - [Files 500-999 Lines](#files-500-999-lines)
  - [Files 200-499 Lines](#files-200-499-lines)
- [Splitting Recommendations](#splitting-recommendations)
- [Large Non-Source Files](#large-non-source-files)
  - [Demo Data Files](#demo-data-files)
  - [Package Lock File](#package-lock-file)
  - [Screenshots](#screenshots)
- [Summary](#summary)

---

## Overview

Large files in a repository can cause:
- Slower git operations (clone, pull, fetch)
- Increased merge conflict potential
- Higher memory usage during development
- Longer build times

The project guidelines recommend keeping component files **under 200 lines** when possible to minimize merge conflicts.

---

## Large Source Code Files

The following source files exceed the recommended 200-line guideline.

### Files Over 1000 Lines

| File | Lines | Type |
|------|-------|------|
| `src/components/RoCReport.tsx` | 1,040 | Component |

### Files 500-999 Lines

| File | Lines | Type |
|------|-------|------|
| `src/pages/Settings.tsx` | 996 | Page |
| `src/components/DailyBGReport.tsx` | 948 | Component |
| `src/components/InRangeReport.tsx` | 820 | Component |
| `src/utils/data/glucoseRangeUtils.ts` | 801 | Utility |
| `src/components/BGValuesReport.tsx` | 730 | Component |
| `src/utils/data/rocDataUtils.ts` | 676 | Utility |
| `src/utils/api/userSettingsApi.ts` | 604 | Utility |
| `src/components/UnifiedTimeline.tsx` | 577 | Component |
| `src/utils/data/insulinDataUtils.ts` | 523 | Utility |
| `src/components/BGOverviewReport/styles.ts` | 521 | Styles |
| `src/features/dataUpload/components/FileList.tsx` | 516 | Component |

### Files 200-499 Lines

| File | Lines | Type |
|------|-------|------|
| `src/pages/AIAnalysis/tabs/HyposTab.tsx` | 469 | Component |
| `src/utils/data/hypoAIDataUtils.ts` | 465 | Utility |
| `src/utils/xlsxUtils.ts` | 435 | Utility |
| `src/components/AGPReport.tsx` | 432 | Component |
| `src/components/BGOverviewReport/BGOverviewReport.tsx` | 431 | Component |
| `src/components/IOBReport.tsx` | 419 | Component |
| `src/App.tsx` | 414 | App Root |
| `src/components/HyposReport/HyposReport.tsx` | 379 | Component |
| `src/components/HyposReport/HyposChart.tsx` | 359 | Component |
| `src/components/shared/Navigation.tsx` | 336 | Component |
| `src/pages/AIAnalysis/AIAnalysis.tsx` | 335 | Page |
| `src/types/index.ts` | 333 | Types |
| `api/src/utils/azureUtils.ts` | 331 | Utility |
| `src/utils/logger.ts` | 305 | Utility |
| `src/utils/data/csvUtils.ts` | 288 | Utility |
| `src/components/AGPGraph.tsx` | 286 | Component |
| `api/src/utils/logger.ts` | 284 | Utility |
| `src/pages/AIAnalysis/tabs/PumpSettingsTab.tsx` | 282 | Component |
| `src/components/BGOverviewReport/DetailedBreakdownAccordion.tsx` | 281 | Component |
| `src/components/UnifiedDailyReport.tsx` | 280 | Component |
| `src/pages/AIAnalysis/tabs/MealTimingTab.tsx` | 279 | Component |
| `src/pages/AIAnalysis/tabs/GlucoseInsulinTab.tsx` | 274 | Component |
| `src/features/dataUpload/utils/zipUtils.ts` | 267 | Utility |
| `src/features/aiAnalysis/prompts/pumpSettingsPrompt.ts` | 264 | Utility |
| `src/components/HyposReport/HyposStatsCards.tsx` | 264 | Component |
| `src/pages/APIDocs.tsx` | 261 | Page |
| `src/components/InsulinDailyReport.tsx` | 260 | Component |
| `src/utils/data/hypoDataUtils.ts` | 258 | Utility |
| `src/utils/api/baseApiClient.ts` | 248 | Utility |
| `scripts/capture-screenshots.ts` | 243 | Script |
| `src/utils/data/columnMapper.ts` | 240 | Utility |
| `src/components/InsulinTimeline.tsx` | 236 | Component |
| `api/src/functions/userSettings.ts` | 225 | Function |
| `src/pages/AIAnalysis/AnalysisComponents.tsx` | 219 | Component |
| `src/hooks/useUserSettings.ts` | 215 | Hook |
| `src/pages/Reports.tsx` | 210 | Page |
| `src/components/GlucoseThresholdsSection.tsx` | 206 | Component |
| `src/utils/data/glucoseDataUtils.ts` | 205 | Utility |
| `src/utils/api/aiApi.ts` | 204 | Utility |
| `src/utils/visualization/agpUtils.ts` | 203 | Utility |

---

## Splitting Recommendations

When splitting components:

1. **Keep backward compatibility** - Export from original file path if needed
2. **Follow existing patterns** - Look at how other components are structured
3. **Update imports** - Ensure all imports are updated
4. **Test thoroughly** - Run existing tests after refactoring
5. **Consider hooks** - Extract shared logic to custom hooks in `src/hooks/`

### Benefits of Splitting

1. **Reduced Merge Conflicts** - Smaller files mean changes are less likely to conflict
2. **Better Code Organization** - Easier to find and understand code
3. **Improved Testing** - Smaller components are easier to unit test
4. **Better Reusability** - Extracted components can be reused elsewhere
5. **Faster Development** - Developers can work on separate components simultaneously

---

## Large Non-Source Files

### Demo Data Files

**Total: ~7.9 MB across 10 files**

| File | Size | Purpose |
|------|------|---------|
| `public/demo-data/CGM Records.zip` | 1.3 MB | CGM records dataset |
| `public/demo-data/anja-demo-data.zip` | 1.1 MB | Demo dataset |
| `public/demo-data/stefan-demo-data.zip` | 912 KB | Demo dataset |
| `public/demo-data/charles-demo-data.zip` | 820 KB | Demo dataset |
| `public/demo-data/nancy-demo-data.zip` | 820 KB | Demo dataset |
| `public/demo-data/joshua-demo-data.zip` | 816 KB | Demo dataset |
| `public/demo-data/hannah-demo-data.zip` | 780 KB | Demo dataset |
| `public/demo-data/dorothy-demo-data.zip` | 780 KB | Demo dataset |
| `public/demo-data/albert-demo-data.zip` | 712 KB | Demo dataset |
| `public/demo-data.zip` | 380 KB | Demo dataset bundle |

**Recommendation:** ⚠️ Consider alternatives
- These files are intentional for demo purposes
- If repo size becomes an issue, consider:
  - Moving to Git LFS (Large File Storage)
  - Hosting demo data externally and downloading on demand
  - Reducing the number of demo datasets
- **No immediate action needed** - these serve a valid purpose

### Package Lock File

| File | Size | Lines |
|------|------|-------|
| `package-lock.json` | 444 KB | 11,937 |

**Recommendation:** ✅ Keep as-is
- Auto-generated by npm, should not be manually edited
- Essential for reproducible builds
- Size is normal for a project of this complexity

### Screenshots

**48 files in `docs/screenshots/`** organized by theme (light/dark/mobile).

The screenshot files range from 64 KB to 132 KB each.

**Recommendation:** ✅ Keep as-is
- Screenshots are necessary for documentation
- PNG format is appropriate for UI screenshots

---

## Summary

| Category | Count | Recommendation |
|----------|-------|----------------|
| Files over 1000 lines | 1 file | **Split recommended** |
| Files 500-999 lines | 11 files | Split when modifying |
| Files 200-499 lines | 40 files | Monitor and split as needed |
| Demo Data | 10 files (~7.9 MB) | Consider Git LFS if repo size becomes an issue |
| Package Lock | 1 file (444 KB) | Keep as-is (auto-generated) |
| Screenshots | 48 files | Keep as-is (documentation) |

**Total source files in repo:** 172 (excluding test files)

**Files exceeding 200-line guideline:** 52 files (~30% of source files)
