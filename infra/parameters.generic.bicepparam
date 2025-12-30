using './main.bicep'

// Generic deployment parameters with standard naming
param location = 'westeurope'
param storageAccountName = 'glookostorage'
param managedIdentityName = 'glooko-identity'
param keyVaultName = 'glooko-kv'
param functionAppName = 'glooko-func'
param staticWebAppName = 'glooko-swa'
param staticWebAppSku = 'Standard'
param webAppUrl = 'https://glooko.example.com'
param storageSku = 'Standard_LRS'
param tableNames = [
  'UserSettings'
  'ProUsers'
  'AIQueryLogs'
]

// CORS configuration for Table Storage (enable for web access)
param enableTableCors = true
param tableCorsAllowedOrigins = ['*']

// Create new App Service Plan for this deployment
param useExistingAppServicePlan = false
param existingAppServicePlanName = ''

// Application Insights integration (optional)
param appInsightsResourceId = ''

// Tags for resources (customize for your environment)
param managedIdentityTags = {
  Environment: 'Development'
  Application: 'GlookoDataWebApp'
}

param storageTags = {
  Application: 'GlookoDataWebApp'
  Purpose: 'UserSettings'
  Environment: 'Development'
}

param keyVaultTags = {
  Application: 'GlookoDataWebApp'
  Environment: 'Development'
}

param functionAppTags = {
  Application: 'GlookoDataWebApp'
  Environment: 'Development'
}

param staticWebAppTags = {
  Application: 'GlookoDataWebApp'
  Environment: 'Development'
}
