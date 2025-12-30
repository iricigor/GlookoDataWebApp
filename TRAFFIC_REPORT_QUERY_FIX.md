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
Need to verify if API errors are being tracked correctly in the `success` field of the `requests` table.

## Testing Queries for Application Insights

### Query 1: Check Total API Requests (should return 157 for 1 day)
```kusto
requests
| where timestamp > ago(1d)
| summarize count()
```

### Query 2: Check Success Field Distribution
This will show how many requests have `success == true` vs `success == false`:
```kusto
requests
| where timestamp > ago(1d)
| summarize 
    Total = count(),
    SuccessTrue = countif(success == true),
    SuccessFalse = countif(success == false),
    SuccessNull = countif(isnull(success))
```

### Query 3: Check Result Codes
This will show the HTTP status codes returned:
```kusto
requests
| where timestamp > ago(1d)
| summarize count() by resultCode
| order by count_ desc
```

### Query 4: Show Sample Failed Requests
This will show details of any failed requests:
```kusto
requests
| where timestamp > ago(1d)
| where success == false
| project timestamp, name, resultCode, duration, success, url
| order by timestamp desc
| take 10
```

### Query 5: Show Requests with 4xx or 5xx Status Codes
Alternative way to find errors:
```kusto
requests
| where timestamp > ago(1d)
| where resultCode startswith "4" or resultCode startswith "5"
| project timestamp, name, resultCode, duration, success, url
| order by timestamp desc
| take 10
```

## Updated Query (Current Implementation)
```kusto
let apiData = requests
| where timestamp > ago(1d)  // or ago(1h)
| summarize 
    TotalCalls = count(),
    Errors = countif(success == false)
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

### Current Status
- **API Calls:** 157 (confirmed) ✅
- **API Errors:** Need to verify with queries above
- **Web Calls:** 0 (pageViews is empty - accepted for now) ✅
- **Web Errors:** 0 (pageViews is empty - accepted for now) ✅

### Next Steps
1. Run Query 2 to check if `success` field is populated correctly
2. Run Query 3 to see HTTP status codes
3. Run Query 4 and 5 to identify any failed requests
4. If errors exist but aren't showing up, investigate the `success` field format

## Potential Issues with Error Detection

### Issue 1: success field might not be boolean
The `success` field in Application Insights might be:
- A string: "True" / "False" instead of boolean true/false
- Null for some requests
- Not set at all

### Issue 2: Errors might be in exceptions table
Some API errors might be logged in the `exceptions` table instead of marking `success == false` in `requests`.

### Issue 3: All requests might be successful
If all 157 requests completed successfully (status 200), then 0 errors is correct.

## Files Changed
- `api/src/functions/adminApiStats.ts` - Updated KQL query
- `api/src/functions/adminStatsUnified.ts` - Updated KQL query

