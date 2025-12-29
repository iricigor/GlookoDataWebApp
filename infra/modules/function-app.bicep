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

var functionAppPlanName = '${functionAppName}-plan'
var functionRuntime = 'node'
var functionRuntimeVersion = '20'

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
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
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    serverFarmId: hostingPlan.id
    reserved: true
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: '${functionRuntime}|${functionRuntimeVersion}'
      appSettings: [
        // Managed Identity authentication for storage (Functions v4)
        // Using __accountName suffix instead of connection strings for passwordless auth
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
      ]
      cors: {
        allowedOrigins: [
          webAppUrl
          'https://portal.azure.com'
        ]
        supportCredentials: true
      }
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
  }
}

output functionAppId string = functionApp.id
output functionAppName string = functionApp.name
output functionAppDefaultHostName string = functionApp.properties.defaultHostName
