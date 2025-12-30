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

// Tags for resources
param managedIdentityTags = {
  Environment: 'Production ManagedBy=GlookoDeploymentModule Application=glookodatawebapp'
}

param storageTags = {
  Application: 'glookodatawebapp'
  Purpose: 'UserSettings'
  Environment: 'Production'
}

param keyVaultTags = {
  ManagedBy: 'AzureDeploymentScripts'
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
}

param functionAppTags = {
  ManagedBy: 'AzureDeploymentScripts'
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
}

param staticWebAppTags = {}
