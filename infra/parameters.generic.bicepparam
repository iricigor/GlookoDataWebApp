using './main.bicep'

// Generic deployment parameters with standard naming
param location = 'westeurope'
param storageAccountName = 'glookodatawebappstorage'
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
param tags = {
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
  ManagedBy: 'Bicep'
}
