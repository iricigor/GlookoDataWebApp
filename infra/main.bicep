targetScope = 'resourceGroup'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the storage account')
param storageAccountName string

@description('The name of the managed identity')
param managedIdentityName string

@description('The name of the key vault')
param keyVaultName string

@description('The name of the function app')
param functionAppName string

@description('The name of the static web app')
param staticWebAppName string

@description('The SKU for the static web app')
@allowed([
  'Free'
  'Standard'
])
param staticWebAppSku string = 'Standard'

@description('The web app URL for CORS configuration')
param webAppUrl string

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageSku string = 'Standard_LRS'

@description('List of table names to create')
param tableNames array = [
  'UserSettings'
  'ProUsers'
  'AIQueryLogs'
]

@description('Enable CORS for Table Storage (required for web access)')
param enableTableCors bool = true

@description('CORS allowed origins for Table Storage')
param tableCorsAllowedOrigins array = ['*']

@description('Use existing App Service Plan instead of creating a new one')
param useExistingAppServicePlan bool = false

@description('Name of existing App Service Plan to use (if useExistingAppServicePlan is true)')
param existingAppServicePlanName string = ''

@description('Application Insights resource ID for Function App monitoring')
param appInsightsResourceId string = ''

// 1. Deploy User-Assigned Managed Identity first
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'deploy-managed-identity'
  params: {
    managedIdentityName: managedIdentityName
    location: location
    tags: {
      // Preserve existing tag to avoid modification in what-if
      Environment: 'Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp'
    }
  }
}

// 2. Deploy Storage Account with Tables
module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    storageAccountName: storageAccountName
    location: location
    sku: storageSku
    tableNames: tableNames
    enableTableCors: enableTableCors
    tableCorsAllowedOrigins: tableCorsAllowedOrigins
    tags: {
      // Preserve existing tags to avoid modification/deletion in what-if
      Application: 'glookodatawebapp'
      Purpose: 'UserSettings'
    }
  }
}

// 3. Deploy Key Vault with RBAC for Managed Identity
module keyVault 'modules/key-vault.bicep' = {
  name: 'deploy-key-vault'
  params: {
    keyVaultName: keyVaultName
    location: location
    managedIdentityPrincipalId: managedIdentity.outputs.managedIdentityPrincipalId
    tags: {
      // Preserve existing tag to avoid modification in what-if
      ManagedBy: 'AzureDeploymentScripts'
    }
  }
}

// 4. Deploy Function App
module functionApp 'modules/function-app.bicep' = {
  name: 'deploy-function-app'
  params: {
    functionAppName: functionAppName
    location: location
    storageAccountName: storageAccountName
    managedIdentityId: managedIdentity.outputs.managedIdentityId
    managedIdentityClientId: managedIdentity.outputs.managedIdentityClientId
    keyVaultName: keyVaultName
    webAppUrl: webAppUrl
    useManagedIdentityForStorage: false  // Consumption plan uses connection strings
    useExistingAppServicePlan: useExistingAppServicePlan
    existingAppServicePlanName: existingAppServicePlanName
    appInsightsResourceId: appInsightsResourceId
    tags: {
      // Preserve existing tag to avoid modification in what-if
      ManagedBy: 'AzureDeploymentScripts'
    }
  }
  dependsOn: [
    storage
    keyVault
  ]
}

// 5. Deploy Static Web App
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'deploy-static-web-app'
  params: {
    staticWebAppName: staticWebAppName
    location: location
    sku: staticWebAppSku
    managedIdentityId: managedIdentity.outputs.managedIdentityId
    tags: {}  // No existing tags to preserve
  }
}

// 6. RBAC Role Assignments for Managed Identity
// NOTE: Role assignments already exist in Azure and are managed separately
// Removed from template to avoid conflicts with existing assignments
// - Storage Table Data Contributor: 4949700a-2127-4912-bc2b-b46fe97fec30
// - Storage Blob Data Contributor: c351193c-5102-4e17-8d3a-8209023f503a

// Outputs
output managedIdentityId string = managedIdentity.outputs.managedIdentityId
output managedIdentityClientId string = managedIdentity.outputs.managedIdentityClientId
output managedIdentityPrincipalId string = managedIdentity.outputs.managedIdentityPrincipalId
output storageAccountName string = storage.outputs.storageAccountName
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output functionAppName string = functionApp.outputs.functionAppName
output functionAppDefaultHostName string = functionApp.outputs.functionAppDefaultHostName
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppDefaultHostName string = staticWebApp.outputs.staticWebAppDefaultHostName
