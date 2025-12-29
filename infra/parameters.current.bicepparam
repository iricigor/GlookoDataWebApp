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
param tags = {
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
  ManagedBy: 'Bicep'
}
