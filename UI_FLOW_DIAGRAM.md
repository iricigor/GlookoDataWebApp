# UI Flow Diagram - AI Session Test Implementation

## Visual Component Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Time In Range - Details Card                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▼ TIR by period                                           │
│     Content coming soon...                                  │
│                                                             │
│  ▼ TIR by day of week                                      │
│     Content coming soon...                                  │
│                                                             │
│  ▼ TIR by hour                                             │
│     Content coming soon...                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Readings in range: 1234    [Analyze with AI]  ← ENABLED  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  (When analyzing - shows spinner)                          │
│  ⏳ Analyzing...                                           │
├─────────────────────────────────────────────────────────────┤
│  (After analysis - AI response appears below)              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ AI Analysis                                           │ │
│  │                                                       │ │
│  │ [AI response text appears here after successful      │ │
│  │  completion of the full flow]                        │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  (On error - error message appears)                        │
│  ❌ Error: [error message]                                │
└─────────────────────────────────────────────────────────────┘
```

## API Flow Diagram

```
┌──────────────┐                                    ┌──────────────┐
│   Frontend   │                                    │   Backend    │
│  (Browser)   │                                    │   (Azure)    │
└──────────────┘                                    └──────────────┘
       │                                                     │
       │ 1. User clicks "Analyze with AI"                  │
       │────────────────────────────────────────────────────│
       │                                                     │
       │ 2. POST /api/ai/start-session                     │
       │    { testData: "Readings in range: 1234" }        │
       ├────────────────────────────────────────────────────>│
       │                                                     │
       │                                        3. Validate Pro user
       │                                        4. Generate session token
       │                                        5. Create test prompt
       │                                                     │
       │ 6. Response:                                       │
       │    {                                               │
       │      success: true,                                │
       │      token: "...",                                 │
       │      sessionId: "...",                            │
       │      initialPrompt: "..."                         │
       │    }                                               │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │ 7. POST /api/ai/query                             │
       │    {                                               │
       │      prompt: initialPrompt +                       │
       │        "Based on test data, analyze TIR..."       │
       │    }                                               │
       ├────────────────────────────────────────────────────>│
       │                                                     │
       │                                        8. Validate Pro user
       │                                        9. Call AI provider
       │                                        10. Get AI response
       │                                                     │
       │ 11. Response:                                      │
       │     {                                              │
       │       success: true,                               │
       │       content: "AI analysis text...",             │
       │       provider: "perplexity"                      │
       │     }                                              │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │ 12. Display AI response in UI                     │
       │                                                     │
```

## State Management

```
Component State:
┌─────────────────────────────────────┐
│ isAnalyzing: boolean                │  → Controls button state & spinner
│ aiResponse: string                  │  → Stores AI response text
│ error: string                       │  → Stores error messages
│ mockReadingsInRange: number = 1234 │  → Test data (will be real data later)
└─────────────────────────────────────┘

State Flow:
Initial:       isAnalyzing=false, aiResponse='', error=''
                        ↓
Click Button:  isAnalyzing=true
                        ↓
Success:       isAnalyzing=false, aiResponse='...', error=''
                        ↓
On Error:      isAnalyzing=false, aiResponse='', error='...'
```

## Error Handling

```
Error Types & Messages:
┌─────────────────────────────────────────────────────────────┐
│ unauthorized   → "Please log in to use AI analysis"        │
│ forbidden      → "This feature is only available for Pro   │
│                   users."                                   │
│ validation     → "Invalid request" (from backend)          │
│ infrastructure → "Service temporarily unavailable"         │
│ network        → "Network error. Check connection."        │
│ unknown        → "An unexpected error occurred"            │
└─────────────────────────────────────────────────────────────┘
```

## Translation Keys Used

```
Location: public/locales/*/reports.json

Key: reports.bgOverview.tirDetails.*
├── analyzeButton      → "Analyze with AI"
├── analyzingButton    → "Analyzing..."
├── readingsInRange    → "Readings in range: {{count}}"
├── aiResponse         → "AI Analysis"
└── errorPrefix        → "Error:"

Supported Languages:
✓ English (en)
✓ German (de)
✓ Czech (cs)
✓ Serbian (sr)
```

## Key Features Demonstrated

### 1. Multi-Step API Flow
✅ Step 1: Initialize session with backend
✅ Step 2: Use session token for AI query
✅ Step 3: Display response

### 2. State Management
✅ Loading states (spinner during analysis)
✅ Success states (display AI response)
✅ Error states (show error messages)

### 3. User Experience
✅ Disabled button during analysis
✅ Visual feedback (spinner + "Analyzing...")
✅ Clear error messages
✅ Response displayed in styled container

### 4. Code Quality
✅ Type-safe TypeScript
✅ Proper error handling
✅ Clean separation of concerns
✅ Reusable API client module

### 5. Internationalization
✅ All text via i18n
✅ Dynamic content ({{count}} interpolation)
✅ 4 language support

---

## Testing the Feature

### Prerequisites
1. User must be logged in
2. User must be a Pro user (in ProUsers table)
3. AI provider must be configured in backend

### Manual Test Steps
1. Navigate to Reports page → BG Overview tab
2. Scroll to "Time In Range - Details" card
3. Click "Analyze with AI" button
4. Observe:
   - Button becomes disabled
   - Text changes to "Analyzing..." with spinner
   - After ~2-5 seconds, AI response appears below
5. Verify in different languages

### Expected Results
- ✅ Button enables on Pro user login
- ✅ Loading state shows during analysis
- ✅ AI response displays in gray box
- ✅ "Readings in range: 1234" label visible
- ✅ Works in all 4 languages

### Error Scenarios to Test
- Non-Pro user: Should show "Pro users only" error
- Not logged in: Should show "Please log in" error
- Network error: Should show connection error
- Backend error: Should show appropriate error message

---

## Next Steps for Enhancement

1. **Replace Mock Data**: Use actual TIR statistics instead of hardcoded 1234
2. **Production Token**: Implement proper JWT with expiration
3. **Session Persistence**: Store session state for continuation
4. **Enhanced UI**: Add collapsible AI response section
5. **Telemetry**: Add analytics for usage tracking
6. **Rate Limiting**: Implement per-user limits
7. **Caching**: Cache similar queries to reduce API calls

---

**Status**: ✅ Implementation Complete
**Documentation**: Comprehensive
**Testing**: All automated tests passing
**Ready**: For manual testing and deployment
