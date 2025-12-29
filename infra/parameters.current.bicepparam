using './main.bicep'

// Current production deployment parameters
param location = 'westeurope'
param storageAccountName = 'glookodatawebappstorage'
param managedIdentityName = 'glookodatawebapp-identity'
param keyVaultName = 'glookodatawebapp-kv'
param functionAppName = 'glookodatawebapp-func'
param staticWebAppName = 'GlookoData'
param staticWebAppSku = 'Standard'
param webAppUrl = 'https://glooko.iric.online'
param storageSku = 'Standard_LRS'
param tableNames = [
  'UserSettings'
  'ProUsers'
  'AIQueryLogs'
]

// CORS configuration for Table Storage
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Use existing App Service Plan
param useExistingAppServicePlan = true
param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'

// Application Insights integration
param appInsightsResourceId = '/subscriptions/6558e738-8188-4771-a5fb-b62f974f971c/resourceGroups/Glooko/providers/microsoft.insights/components/glookodatawebapp-func'

// Resource-specific tags to preserve existing Azure resource tags
// Note: These tags match the exact current state in Azure to prevent any modifications
// The Environment tag for managedIdentity contains concatenated values - this is the current state
param managedIdentityTags = {
  Environment: 'Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp'
}

param storageTags = {
  Application: 'glookodatawebapp'
  Purpose: 'UserSettings'
}

param keyVaultTags = {
  ManagedBy: 'AzureDeploymentScripts'
}

param functionAppTags = {
  ManagedBy: 'AzureDeploymentScripts'
}

param staticWebAppTags = {}
