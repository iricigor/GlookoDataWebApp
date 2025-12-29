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

@description('Tags to apply to all resources')
param tags object = {
  Application: 'GlookoDataWebApp'
  Environment: 'Production'
  ManagedBy: 'Bicep'
}

// 1. Deploy User-Assigned Managed Identity first
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'deploy-managed-identity'
  params: {
    managedIdentityName: managedIdentityName
    location: location
    tags: tags
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
    tags: tags
  }
}

// 3. Deploy Key Vault with RBAC for Managed Identity
module keyVault 'modules/key-vault.bicep' = {
  name: 'deploy-key-vault'
  params: {
    keyVaultName: keyVaultName
    location: location
    managedIdentityPrincipalId: managedIdentity.outputs.managedIdentityPrincipalId
    tags: tags
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
    tags: tags
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
    tags: tags
  }
}

// 6. RBAC Role Assignments for Managed Identity

// Get reference to the deployed storage account for RBAC scoping
resource storageAccountRef 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Storage Table Data Contributor role for Managed Identity on Storage Account
var storageTableDataContributorRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

resource storageTableDataContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountRef.id, managedIdentityName, storageTableDataContributorRoleId)
  scope: storageAccountRef
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataContributorRoleId)
    principalId: managedIdentity.outputs.managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Storage Blob Data Contributor role for Managed Identity on Storage Account
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource storageBlobDataContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountRef.id, managedIdentityName, storageBlobDataContributorRoleId)
  scope: storageAccountRef
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: managedIdentity.outputs.managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

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
