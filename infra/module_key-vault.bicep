@description('The name of the key vault')
param keyVaultName string

@description('The location for the key vault')
param location string = resourceGroup().location

@description('The principal ID to grant Key Vault Secrets User role')
param managedIdentityPrincipalId string

@description('Tags to apply to the key vault')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    // enablePurgeProtection: true  // Removed - best practice, implement in separate PR
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    // networkAcls removed - best practice, implement in separate PR
  }
}

// Key Vault Secrets User role definition ID
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource keyVaultSecretsUserRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentityPrincipalId, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource keyVaultLock 'Microsoft.Authorization/locks@2020-05-01' = {
  scope: keyVault
  name: '${keyVaultName}-lock'
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of the Key Vault containing critical secrets and API keys.'
  }
}

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
