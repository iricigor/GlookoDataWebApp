# Corrected AI Flow Architecture

## Issue Addressed
User feedback: "frontened should send additional data directly to AI as additional comment in existing session opened by API. This additional data must never come to API."

## Original (Incorrect) Flow
```
Frontend → Backend /api/ai/start-session → Get temp token
Frontend → Backend /api/ai/query (with temp token) → Gemini AI
                    ❌ Wrong: Additional data went through our backend
```

## Corrected Flow
```
Backend /api/ai/start-session:
1. Validate Pro user
2. Get Gemini API key from Key Vault
3. Generate ephemeral Gemini token (30min expiry)
4. Send initial prompt to Gemini API
5. Return: { token, expiresAt, initialResponse }

Frontend:
1. Call /api/ai/start-session
2. Display initialResponse
3. Use ephemeral token to call Gemini DIRECTLY:
   fetch('https://generativelanguage.googleapis.com/...', {
     headers: { 'x-goog-api-key': ephemeralToken }
   })
4. Append additional response
   ✅ Correct: Additional data goes directly to Gemini
```

## Key Changes

### Backend (`api/src/functions/startAISession.ts`)
**Before:**
- Generated simple base64 token
- Returned initialPrompt text
- Frontend would send this to our backend

**After:**
- Generates Google ephemeral token via `/v1/authTokens:create`
- Sends initial prompt to Gemini and gets response
- Returns ephemeral token + initial AI response
- Frontend uses token for direct Gemini communication

### Frontend (`src/components/BGOverviewReport/TimeInRangeDetailsCard.tsx`)
**Before:**
```typescript
// Step 2: Send additional data to AI using the backend AI endpoint
const aiResult = await callBackendAI(idToken, followUpPrompt);
```

**After:**
```typescript
// Step 2: Send additional data directly to Gemini AI using the ephemeral token
const geminiResponse = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': sessionResult.token, // Ephemeral token
    },
    body: JSON.stringify({ /* prompt */ }),
  }
);
```

## Security Benefits
1. **Ephemeral tokens** - 30-minute expiry, single-use
2. **Master API key** never exposed to frontend
3. **Additional data** never stored on our backend
4. **Direct communication** between frontend and Gemini
5. **Pro user validation** still enforced on backend

## Data Flow Comparison

### Original (Incorrect)
```
User Data → Frontend
         ↓
    /api/ai/start-session (get temp token)
         ↓
    /api/ai/query (send user data)  ← ❌ User data hits our backend
         ↓
    Gemini AI
```

### Corrected
```
User Data → Frontend
         ↓
    /api/ai/start-session (get ephemeral token + initial response)
         ↓
    Frontend → Gemini AI directly  ← ✅ User data goes straight to Gemini
    (using ephemeral token)
```

## Testing
- ✅ All 1717 unit tests pass
- ✅ Frontend build successful
- ✅ Backend build successful
- ✅ TypeScript compilation clean
- ✅ No linting errors

## Commit
- Hash: `39e89e0`
- Message: "Fix AI flow: frontend now sends additional data directly to Gemini AI"
- Files changed: 4 (backend endpoint, frontend component, API client, OpenAPI docs)

## Summary
The implementation now correctly follows the requirement that "additional data must never come to API." The frontend uses an ephemeral Gemini token to communicate directly with Google's AI service, bypassing our backend entirely for the additional data submission.
