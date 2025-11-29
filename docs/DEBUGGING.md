# Debugging and Monitoring Guide

This guide explains how to use the logging and monitoring capabilities in GlookoDataWebApp to debug issues between the UI and API.

## Overview

GlookoDataWebApp includes structured logging with **correlation IDs** that allow you to trace requests from the browser through to the Azure Functions API. This makes it easy to debug issues by connecting related log entries across different components.

## For Users: Debugging in the Browser

### Viewing Console Logs

1. **Open Browser Developer Tools**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+I`

2. **Navigate to the Console Tab**
   - You'll see structured log messages from the application

3. **Understanding Log Messages**
   
   Each log message includes:
   - **Timestamp**: When the event occurred
   - **Log Level**: `[INFO]`, `[WARN]`, `[ERROR]`, or `[DEBUG]`
   - **Message**: Description of what happened
   - **Context Object**: Additional details (click to expand)

   Example log output:
   ```
   [2025-11-29T20:48:20.770Z] [GlookoUI] [INFO] API GET request started {
     correlationId: 'b122e041',
     endpoint: '/api/user/settings',
     component: 'ApiClient'
   }
   ```

### Finding the Correlation ID

When an API call fails, look for the **correlationId** in the log message:

```
[2025-11-29T20:48:20.815Z] [GlookoUI] [ERROR] API request failed {
  correlationId: 'b122e041',    ← Use this ID to find related logs
  endpoint: '/api/user/settings',
  error: 'Unauthorized access',
  errorType: 'unauthorized',
  statusCode: 401,
  durationMs: 45
}
```

This `correlationId` is also sent to the server, so you can use it to find the corresponding server-side logs.

### Filtering Console Logs

Use these tips to filter logs:
- Type `GlookoUI` in the filter box to see only app logs
- Type `ERROR` to see only errors
- Type the correlation ID (e.g., `b122e041`) to find all related logs

### Checking Network Requests

1. Go to the **Network** tab in Developer Tools
2. Filter by `XHR` or `Fetch` to see API calls
3. Look for the `x-correlation-id` header in both request and response headers
4. Click on a request to see full details including response body and timing

## For App Owners: Debugging in Azure

### Azure Application Insights

The Azure Functions API logs are automatically sent to Application Insights if configured.

#### Finding Logs by Correlation ID

1. **Open Azure Portal** → Navigate to your Application Insights resource
2. Go to **Logs** (under Monitoring)
3. Run this query to find all logs for a specific correlation ID:

```kusto
traces
| where message contains "b122e041"  // Replace with your correlation ID
| order by timestamp asc
```

#### Viewing Request Details

To see all request logs with their context:

```kusto
traces
| where customDimensions.correlationId != ""
| project timestamp, message, 
    correlationId = tostring(customDimensions.correlationId),
    method = tostring(customDimensions.method),
    path = tostring(customDimensions.path),
    statusCode = toint(customDimensions.statusCode),
    durationMs = toint(customDimensions.durationMs)
| order by timestamp desc
| take 100
```

#### Finding Errors

To find all error logs:

```kusto
traces
| where severityLevel >= 3  // 3 = Error, 4 = Critical
| project timestamp, message,
    correlationId = tostring(customDimensions.correlationId),
    error = tostring(customDimensions.error),
    errorType = tostring(customDimensions.errorType)
| order by timestamp desc
| take 50
```

#### Tracking Authentication Issues

```kusto
traces
| where message contains "Authentication"
| project timestamp, message,
    correlationId = tostring(customDimensions.correlationId),
    authSuccess = tobool(customDimensions.authSuccess),
    authFailReason = tostring(customDimensions.authFailReason)
| order by timestamp desc
```

### Azure Functions Logs

If you don't have Application Insights, you can still view logs:

1. **Open Azure Portal** → Navigate to your Function App
2. Go to **Functions** → Select a function (e.g., `userSettings`)
3. Click **Monitor** to see recent invocations
4. Click on any invocation to see detailed logs

### Log Stream (Real-time)

For real-time debugging:

1. **Open Azure Portal** → Navigate to your Function App
2. Go to **Log stream** (under Monitoring)
3. Watch logs appear in real-time as requests come in

## Log Format Reference

### UI Logs (Browser Console)

| Field | Description |
|-------|-------------|
| `correlationId` | Unique ID linking UI and API logs |
| `endpoint` | API endpoint being called |
| `component` | Component name (e.g., 'ApiClient') |
| `statusCode` | HTTP status code |
| `durationMs` | Request duration in milliseconds |
| `error` | Error message if request failed |
| `errorType` | Classification: 'unauthorized', 'network', 'infrastructure', 'unknown' |

### API Logs (Azure Functions)

| Field | Description |
|-------|-------------|
| `correlationId` | Unique ID linking UI and API logs |
| `method` | HTTP method (GET, POST, PUT, etc.) |
| `path` | Request URL path |
| `functionName` | Azure Function name |
| `statusCode` | HTTP status code |
| `durationMs` | Request duration in milliseconds |
| `userId` | Anonymized user identifier |
| `authSuccess` | Whether authentication succeeded |
| `storageOperation` | Table Storage operation being performed |
| `error` | Error message if request failed |
| `errorType` | Error classification |

## Common Debugging Scenarios

### Scenario 1: "Settings won't save"

1. Open browser console
2. Try to save settings
3. Look for `API PUT request started` log with `/api/user/settings`
4. Check if followed by `completed successfully` or `failed`
5. If failed, note the `correlationId` and error details
6. Search Azure logs using the correlation ID

### Scenario 2: "Login keeps failing"

1. Open browser console
2. Attempt to log in
3. Look for `API GET request started` with `/api/user/check-first-login`
4. Check the `errorType`:
   - `unauthorized` → Token issue, check MSAL authentication
   - `infrastructure` → Azure Storage connection issue
   - `network` → Connectivity problem

### Scenario 3: "Intermittent errors"

1. In Azure Application Insights, run:
   ```kusto
   traces
   | where severityLevel >= 3
   | summarize count() by bin(timestamp, 1h), tostring(customDimensions.errorType)
   | render timechart
   ```
2. This shows error patterns over time to identify intermittent issues

## Troubleshooting Tips

### No logs appearing in browser?
- Make sure you're using the browser console (F12)
- Check that log level filtering isn't hiding messages
- Try refreshing the page

### Correlation ID not in Azure logs?
- Ensure Application Insights is connected to the Function App
- Check that the `x-correlation-id` header is being sent (Network tab → Request Headers)

### Logs showing in Log Stream but not Application Insights?
- There may be a delay (up to a few minutes) before logs appear in Application Insights
- Check that the instrumentation key is correctly configured

## Best Practices

1. **Always note the correlation ID** when reporting issues
2. **Check both UI and API logs** to get the full picture
3. **Look at the timestamp** to understand the sequence of events
4. **Filter by error level** first to focus on problems
5. **Use the duration (durationMs)** to identify slow operations
