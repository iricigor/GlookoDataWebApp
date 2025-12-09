# AI Analysis Feature for BG Overview - Time in Range Section

## Overview

This document describes the new AI analysis feature added to the Time in Range (TIR) card in the BG Overview tab. This feature provides users with instant, actionable insights about their glucose time-in-range statistics using AI-powered analysis.

## Feature Description

### Visual Implementation

The feature adds an inline AI analysis capability directly to the Time in Range card with the following components:

1. **Analyze with AI Button**
   - Positioned on the right side of the target info container
   - Original "Target: 70%..." text centered in the remaining left space
   - Button states:
     - Initial: "Analyze with AI"
     - During analysis: "Analyzing..." with spinner animation
     - After analysis: "Re-analyze" (with 3-second cooldown)

2. **AI Response Area**
   - Appears below the target info container after analysis completes
   - Collapsible/expandable with chevron icon
   - Distinct styling with gray background to differentiate from target text
   - Displays AI-generated markdown content

3. **Prompt Accordion** (Geek Stats Mode)
   - Visible only when "Show Geek Stats" setting is enabled
   - Displays the full AI prompt sent to the API
   - Located below the AI response area
   - Uses monospace font for technical readability

### AI Prompt Generation

The feature includes a new prompt generation function (`generateBGOverviewTIRPrompt`) that:

- **Includes comprehensive TIR statistics:**
  - 3-category mode: Low, In Range, High percentages
  - 5-category mode: Very Low, Low, In Range, High, Very High percentages
  
- **Requests specific output format:**
  - ONE brief sentence summarizing overall glucose control
  - THREE specific, actionable, behavioral recommendations
  - Total response under 150 words

- **Supports all configuration options:**
  - Multiple response languages (English, German, Czech, Serbian)
  - Both glucose units (mmol/L and mg/dL)
  - All AI providers (Perplexity, Gemini, Grok, DeepSeek)
  - Proper formatting rules (no greetings, direct start)
  - Medical disclaimer and completion marker

## Technical Implementation

### New Files Created

1. **`src/features/aiAnalysis/prompts/bgOverviewTIRPrompt.ts`**
   - Core prompt generation logic
   - Handles 3 and 5 category modes
   - Unit conversion for mg/dL
   - Language instruction integration

2. **`src/features/aiAnalysis/prompts/bgOverviewTIRPrompt.test.ts`**
   - Comprehensive test suite (12 tests)
   - Tests all language combinations
   - Tests all unit conversions
   - Tests both category modes

### Modified Files

1. **`src/components/BGOverviewReport/TimeInRangeCard.tsx`**
   - Converted to AI-enabled component
   - Added state management using `useAnalysisState` hook
   - Integrated AI API calls
   - Added error handling and cooldown logic
   - Implemented collapsible response UI

2. **`src/components/BGOverviewReport/BGOverviewReport.tsx`**
   - Added AI configuration props
   - Integrated `getActiveProvider` logic
   - Passes AI settings to TimeInRangeCard

3. **`src/pages/Reports.tsx`**
   - Passes AI configuration props through to BGOverviewReport

4. **`src/components/BGOverviewReport/styles.ts`**
   - Added styles for AI button container
   - Added styles for AI response area
   - Added styles for collapse/expand controls
   - Added styles for prompt accordion

### Translation Support

Added comprehensive translation keys in all supported languages:

- **English** (`en/reports.json`)
- **German** (`de/reports.json`)
- **Czech** (`cs/reports.json`)
- **Serbian** (`sr/reports.json`)

Translation keys added:
- `reports.bgOverview.tir.analyzeButton`: "Analyze with AI"
- `reports.bgOverview.tir.analyzingButton`: "Analyzing..."
- `reports.bgOverview.tir.reanalyzeButton`: "Re-analyze"
- `reports.bgOverview.tir.collapseButton`: "Collapse AI Analysis"
- `reports.bgOverview.tir.expandButton`: "Expand AI Analysis"
- `reports.bgOverview.tir.helperText`: Helper text description
- `reports.bgOverview.tir.accordionTitle`: "View AI Prompt"
- `reports.bgOverview.tir.waitMessage`: Cooldown message
- `reports.bgOverview.tir.errorPrefix`: "Error:"
- `reports.bgOverview.tir.successMessage`: Success message

## User Experience Flow

1. User navigates to Reports → BG Overview tab
2. Time in Range card displays with glucose statistics
3. If AI is configured (API key present), "Analyze with AI" button appears
4. User clicks button → Button changes to "Analyzing..." with spinner
5. AI processes request (typically 2-5 seconds)
6. Response appears below target info with success message
7. User can collapse/expand response using chevron icon
8. If "Show Geek Stats" is enabled, prompt accordion appears
9. User can click "Re-analyze" after 3-second cooldown

## Error Handling

- **No API Key**: Button is disabled, no error shown
- **API Error**: Error message displayed in red MessageBar
- **Network Error**: Previous response preserved (if exists), error shown
- **Cooldown Active**: Button disabled with countdown message

## Testing

### Automated Tests
- ✅ 12 unit tests for prompt generation (all passing)
- ✅ Tests cover all languages, units, and category modes
- ✅ Linter passes with no new errors/warnings
- ✅ Build succeeds without issues

### Manual Testing Checklist
- [ ] Test with 3-category mode
- [ ] Test with 5-category mode
- [ ] Test with different TIR percentages (low, medium, high)
- [ ] Test with English, German, Czech, Serbian languages
- [ ] Test with mmol/L and mg/dL units
- [ ] Test with different AI providers (Perplexity, Gemini, Grok, DeepSeek)
- [ ] Test accordion visibility with Geek Stats on/off
- [ ] Test error handling (invalid API key, network error)
- [ ] Test cooldown behavior (3-second delay before re-analysis)
- [ ] Test collapse/expand functionality
- [ ] Test responsive design on mobile devices

## Dependencies

The feature leverages existing infrastructure:
- `useAnalysisState` hook for state management
- `callAIApi` function for API calls
- `MarkdownRenderer` component for response display
- Existing AI prompt utilities (`getLanguageInstruction`, `getDisclaimerInstruction`)
- Fluent UI components for consistent styling

## Configuration Requirements

For the feature to be visible and functional:
1. User must have at least one AI provider API key configured in Settings
2. A valid data file must be uploaded with glucose readings
3. The Reports → BG Overview tab must display Time in Range data

## Future Enhancements

Potential improvements for future iterations:
- Add ability to save/export AI analysis
- Add comparison with previous analyses
- Add more detailed explanations for specific TIR patterns
- Add voice output for accessibility
- Add analysis history tracking

## Related Files

- Core implementation: `src/components/BGOverviewReport/TimeInRangeCard.tsx`
- Prompt generation: `src/features/aiAnalysis/prompts/bgOverviewTIRPrompt.ts`
- Tests: `src/features/aiAnalysis/prompts/bgOverviewTIRPrompt.test.ts`
- Styles: `src/components/BGOverviewReport/styles.ts`
- Translations: `public/locales/*/reports.json`
