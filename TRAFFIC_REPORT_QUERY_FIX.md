# Traffic Report Query Fix - Testing Guide

## Issue
The traffic report was returning zeros for both web traffic and API errors.

## Root Cause - Web Traffic Zeros
In Azure Static Web Apps with Application Insights:
- The `requests` table only contains **server-side API calls** (Azure Functions)
- Static web page requests **would be** tracked in the `pageViews` table, but this requires client-side SDK integration
- The `pageViews` table is **empty** because client-side Application Insights monitoring is not configured
- **Result:** `webCalls` = 0, `webErrors` = 0 (expected for now)

## Root Cause - API Errors
The original query used `countif(success == false)` to detect errors, but this field doesn't always reflect HTTP-level errors correctly. 

User testing revealed actual errors exist in the data:
- **200:** 120 requests (successful)
- **401:** 29 requests (unauthorized errors)
- **503:** 8 requests (service unavailable errors)
- **Total:** 157 requests with 37 errors (23.6% error rate)

## Solution
Changed error detection from `success == false` to checking HTTP status codes:
- **Before:** `countif(success == false)` - returned 0 errors incorrectly
- **After:** `countif(toint(resultCode) >= 400)` - correctly counts 4xx and 5xx errors

This properly detects all client errors (4xx) and server errors (5xx) based on the `resultCode` field.

## Updated Query (Current Implementation)
```kusto
let apiData = requests
| where timestamp > ago(1d)  // or ago(1h)
| summarize 
    TotalCalls = count(),
    Errors = countif(toint(resultCode) >= 400)
| extend isApiCall = true;

let webData = pageViews
| where timestamp > ago(1d)  // or ago(1h)
| summarize 
    TotalCalls = count(),
    Errors = 0
| extend isApiCall = false;

union apiData, webData
| project isApiCall, TotalCalls, Errors
```

## Expected Results

### Current Status (1 day period)
- **API Calls:** 157 ✅
- **API Errors:** 37 (29 × 401 + 8 × 503) ✅
- **Web Calls:** 0 (pageViews is empty - accepted) ✅
- **Web Errors:** 0 (pageViews is empty - accepted) ✅

## Diagnostic Queries for Verification

### Query 1: Total Request Count
```kusto
requests
| where timestamp > ago(1d)
| summarize count()
```
Expected: 157

### Query 2: Result Code Distribution
```kusto
requests
| where timestamp > ago(1d)
| summarize count() by resultCode
| order by count_ desc
```
Expected:
- 200: 120
- 401: 29
- 503: 8

### Query 3: Verify Error Count
```kusto
requests
| where timestamp > ago(1d)
| summarize 
    Total = count(),
    Errors = countif(toint(resultCode) >= 400)
```
Expected: Total = 157, Errors = 37

### Query 4: Error Breakdown by Status Code
```kusto
requests
| where timestamp > ago(1d)
| where toint(resultCode) >= 400
| summarize count() by resultCode
| order by resultCode asc
```
Expected:
- 401: 29
- 503: 8

## Files Changed
- `api/src/functions/adminApiStats.ts` - Updated error detection to use `resultCode >= 400`
- `api/src/functions/adminStatsUnified.ts` - Updated error detection to use `resultCode >= 400`


