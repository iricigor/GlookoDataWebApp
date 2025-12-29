@description('The name of the function app')
param functionAppName string

@description('The location for the function app')
param location string = resourceGroup().location

@description('The storage account name for function app storage')
param storageAccountName string

@description('The managed identity resource ID')
param managedIdentityId string

@description('The managed identity client ID')
param managedIdentityClientId string

@description('The key vault name for secrets')
param keyVaultName string

@description('The web app URL for CORS configuration')
param webAppUrl string

@description('Tags to apply to the function app')
param tags object = {}

@description('Whether to use managed identity for storage (requires Premium or Dedicated plan)')
param useManagedIdentityForStorage bool = false

@description('Use existing App Service Plan instead of creating a new one')
param useExistingAppServicePlan bool = false

@description('Name of existing App Service Plan to use (if useExistingAppServicePlan is true)')
param existingAppServicePlanName string = ''

@description('Application Insights resource ID for monitoring')
param appInsightsResourceId string = ''

var functionAppPlanName = '${functionAppName}-plan'
var functionRuntime = 'node'
var functionRuntimeVersion = '20'

// Get reference to storage account for connection string
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Reference to existing hosting plan (if using one)
resource existingHostingPlan 'Microsoft.Web/serverfarms@2023-01-01' existing = if (useExistingAppServicePlan) {
  name: existingAppServicePlanName
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = if (!useExistingAppServicePlan) {
  name: functionAppPlanName
  location: location
  tags: tags
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  tags: !empty(appInsightsResourceId) ? union(tags, {
    'hidden-link: /app-insights-resource-id': appInsightsResourceId
  }) : tags
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    serverFarmId: useExistingAppServicePlan ? existingHostingPlan.id : hostingPlan.id
    reserved: true
    // httpsOnly: true  // Removed - best practice, implement in separate PR (currently false in production)
    siteConfig: {
      linuxFxVersion: '${functionRuntime}|${functionRuntimeVersion}'
      appSettings: useManagedIdentityForStorage ? [
        // Managed Identity storage connection (Premium/Dedicated plans only)
        // Note: Consumption plans require connection strings from Key Vault
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccountName
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING__accountName'
          value: storageAccountName
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: functionRuntime
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~${functionRuntimeVersion}'
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: managedIdentityClientId
        }
        {
          name: 'USE_MANAGED_IDENTITY'
          value: 'true'
        }
        {
          name: 'KEY_VAULT_NAME'
          value: keyVaultName
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ] : [
        // Connection string-based storage (Consumption plan)
        // AzureWebJobsStorage uses connection string
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: functionRuntime
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~${functionRuntimeVersion}'
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: managedIdentityClientId
        }
        {
          name: 'USE_MANAGED_IDENTITY'
          value: 'true'
        }
        {
          name: 'KEY_VAULT_NAME'
          value: keyVaultName
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
      cors: {
        allowedOrigins: [
          webAppUrl
          'https://portal.azure.com'
        ]
        supportCredentials: true
      }
      // Best practice settings removed - implement in separate PR:
      // ftpsState: 'Disabled'
      // minTlsVersion: '1.2'
      // localMySqlEnabled: false
      // netFrameworkVersion: 'v4.6'
    }
  }
}

output functionAppId string = functionApp.id
output functionAppName string = functionApp.name
output functionAppDefaultHostName string = functionApp.properties.defaultHostName
