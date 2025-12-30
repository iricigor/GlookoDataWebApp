# AI Flow Architecture

## Overview
The `startAISession` endpoint enables Pro users to interact with Gemini AI while keeping the master API key secure on the backend.

## Flow

### Backend (`POST /api/ai/start-session`)
1. Validates Pro user status
2. Retrieves Gemini API key from Key Vault
3. Generates ephemeral Gemini token (30min expiry, single-use)
4. Sends initial prompt to Gemini API
5. Returns: `{ token, expiresAt, initialResponse }`

### Frontend
1. Calls `/api/ai/start-session`
2. Displays initial AI response
3. Uses ephemeral token to call Gemini API directly:
   ```typescript
   fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
     headers: { 'x-goog-api-key': ephemeralToken }
   })
   ```
4. Displays additional AI response

## Key Points
- **Direct communication**: Frontend sends additional data directly to Gemini (bypasses our backend)
- **Ephemeral tokens**: 30-minute expiry, single-use for security
- **No data storage**: Additional user data never touches our backend
- **Pro user validation**: Enforced on backend before token generation

## Implementation Files
- Backend: `api/src/functions/startAISession.ts`
- Frontend: `src/components/BGOverviewReport/TimeInRangeDetailsCard.tsx`
- API Client: `src/utils/api/startAISessionApi.ts`
- API Docs: `public/api-docs/openapi.json`

