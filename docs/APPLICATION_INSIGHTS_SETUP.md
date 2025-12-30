# Application Insights Configuration for GlookoDataWebApp

## Overview

The `/api/glookoAdmin/stats/traffic` endpoint requires Azure Application Insights to be configured to provide API and web traffic statistics. The endpoint returns a 503 error when Application Insights is not properly set up.

## Error Message

If you see this error:
```json
{
  "error": "Service unavailable - Application Insights not configured",
  "errorType": "infrastructure",
  "code": "APPINSIGHTS_NOT_CONFIGURED"
}
```

This means the `APPLICATIONINSIGHTS_WORKSPACE_ID` environment variable is missing from your Function App configuration.

## Solution: Configure Application Insights

### Option 1: Create Application Insights Resource (Recommended)

If you don't have Application Insights yet, create one:

#### Step 1: Create Application Insights

```bash
# Set your variables
RESOURCE_GROUP="Glooko"
APP_INSIGHTS_NAME="glookodatawebapp-insights"
LOCATION="westeurope"

# Create Application Insights
az monitor app-insights component create \
  --app ${APP_INSIGHTS_NAME} \
  --location ${LOCATION} \
  --resource-group ${RESOURCE_GROUP} \
  --application-type web \
  --kind web \
  --workspace $(az monitor log-analytics workspace list \
    --resource-group ${RESOURCE_GROUP} \
    --query "[0].id" -o tsv)
```

If you don't have a Log Analytics workspace, create one first:

```bash
WORKSPACE_NAME="glookodatawebapp-workspace"

# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group ${RESOURCE_GROUP} \
  --workspace-name ${WORKSPACE_NAME} \
  --location ${LOCATION}

# Now create Application Insights with the workspace
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group ${RESOURCE_GROUP} \
  --workspace-name ${WORKSPACE_NAME} \
  --query id -o tsv)

az monitor app-insights component create \
  --app ${APP_INSIGHTS_NAME} \
  --location ${LOCATION} \
  --resource-group ${RESOURCE_GROUP} \
  --application-type web \
  --kind web \
  --workspace ${WORKSPACE_ID}
```

#### Step 2: Get the Workspace ID

```bash
# Get the Log Analytics Workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group ${RESOURCE_GROUP} \
  --workspace-name ${WORKSPACE_NAME} \
  --query customerId -o tsv)

echo "Workspace ID: ${WORKSPACE_ID}"
```

#### Step 3: Configure Function App

Add the workspace ID to your Function App settings:

```bash
FUNCTION_APP_NAME="glookodatawebapp-func"

az functionapp config appsettings set \
  --name ${FUNCTION_APP_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --settings APPLICATIONINSIGHTS_WORKSPACE_ID="${WORKSPACE_ID}"
```

#### Step 4: Link Application Insights to Function App

```bash
# Get Application Insights connection string
APP_INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app ${APP_INSIGHTS_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --query connectionString -o tsv)

# Configure the Function App to use Application Insights
az functionapp config appsettings set \
  --name ${FUNCTION_APP_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="${APP_INSIGHTS_CONNECTION_STRING}"
```

### Option 2: Use Existing Application Insights

If you already have Application Insights:

#### Step 1: Find Your Workspace ID

```bash
# List all Log Analytics workspaces
az monitor log-analytics workspace list \
  --resource-group ${RESOURCE_GROUP} \
  --output table

# Get the workspace ID
WORKSPACE_NAME="your-workspace-name"
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group ${RESOURCE_GROUP} \
  --workspace-name ${WORKSPACE_NAME} \
  --query customerId -o tsv)

echo "Workspace ID: ${WORKSPACE_ID}"
```

#### Step 2: Configure Function App

```bash
az functionapp config appsettings set \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --settings APPLICATIONINSIGHTS_WORKSPACE_ID="${WORKSPACE_ID}"
```

### Option 3: Using Azure Portal

1. **Navigate to your Function App** in the Azure Portal
2. Go to **Settings** → **Configuration**
3. Click **+ New application setting**
4. Add:
   - **Name**: `APPLICATIONINSIGHTS_WORKSPACE_ID`
   - **Value**: Your Log Analytics Workspace ID (GUID format)
5. Click **OK** and then **Save**

To find your Workspace ID in the portal:
1. Navigate to your **Log Analytics workspace** resource
2. Go to **Properties**
3. Copy the **Workspace ID** (it's a GUID like `12345678-1234-1234-1234-123456789abc`)

## Verification

After configuration, verify that the endpoint works:

```bash
# Test the endpoint (replace with your actual URL and token)
curl -X GET \
  'https://glooko.iric.online/api/glookoAdmin/stats/traffic?timePeriod=1hour' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <your-token>'
```

Expected response (200 OK):
```json
{
  "webCalls": 123,
  "webErrors": 5,
  "apiCalls": 456,
  "apiErrors": 2,
  "timePeriod": "1hour"
}
```

## Infrastructure as Code (Bicep)

To include Application Insights in your infrastructure deployment, update your Bicep templates:

### Update `infra/main.bicep`

Add Application Insights module deployment and pass the workspace ID to the Function App:

```bicep
// Add this parameter
@description('Application Insights workspace ID')
param appInsightsWorkspaceId string = ''

// Update function app module call
module functionApp 'modules/function-app.bicep' = {
  name: 'deploy-function-app'
  params: {
    // ... existing parameters ...
    appInsightsWorkspaceId: appInsightsWorkspaceId
  }
}
```

### Update `infra/modules/function-app.bicep`

Add the workspace ID to the Function App settings:

```bicep
@description('Application Insights workspace ID')
param appInsightsWorkspaceId string = ''

// In the appSettings array, add:
{
  name: 'APPLICATIONINSIGHTS_WORKSPACE_ID'
  value: appInsightsWorkspaceId
}
```

## Troubleshooting

### Error: "Failed to query Application Insights"

This could mean:
1. **Wrong Workspace ID**: Verify the GUID is correct
2. **Permissions Issue**: The Function App's managed identity needs **Monitoring Reader** role on the workspace
3. **Workspace Deleted**: The workspace might have been deleted

Grant permissions:
```bash
# Get the Function App's managed identity principal ID
PRINCIPAL_ID=$(az functionapp identity show \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --query principalId -o tsv)

# Get the workspace resource ID
WORKSPACE_RESOURCE_ID=$(az monitor log-analytics workspace show \
  --resource-group Glooko \
  --workspace-name ${WORKSPACE_NAME} \
  --query id -o tsv)

# Grant Monitoring Reader role
az role assignment create \
  --assignee ${PRINCIPAL_ID} \
  --role "Monitoring Reader" \
  --scope ${WORKSPACE_RESOURCE_ID}
```

### Checking Current Configuration

```bash
# View all Function App settings
az functionapp config appsettings list \
  --name glookodatawebapp-func \
  --resource-group Glooko \
  --output table | grep -i insights
```

## Cost Considerations

Application Insights pricing is based on data ingestion:
- **First 5 GB/month**: Free
- **Beyond 5 GB**: ~$2.30/GB

For a typical small application:
- Expected usage: 0.5-2 GB/month
- Estimated cost: Free to $5/month

Monitor your usage:
```bash
az monitor app-insights component billing show \
  --app ${APP_INSIGHTS_NAME} \
  --resource-group ${RESOURCE_GROUP}
```

## Alternative: Disable the Traffic Endpoint

If you don't need traffic statistics and want to avoid the cost of Application Insights, you can:

1. Use the unified stats endpoint `/api/glookoAdmin/stats` which gracefully handles missing Application Insights
2. Or implement a feature flag to disable the traffic statistics feature

The unified endpoint returns zeros for traffic metrics when Application Insights is not configured, while still providing user counts.

## References

- [Azure Application Insights Documentation](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Log Analytics Workspace Overview](https://learn.microsoft.com/azure/azure-monitor/logs/log-analytics-workspace-overview)
- [Azure Functions Monitoring](https://learn.microsoft.com/azure/azure-functions/functions-monitoring)
