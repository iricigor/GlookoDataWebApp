@description('The name of the managed identity')
param managedIdentityName string

@description('The location for the managed identity')
param location string = resourceGroup().location

@description('Tags to apply to the managed identity')
param tags object = {}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: tags
}

resource managedIdentityLock 'Microsoft.Authorization/locks@2020-05-01' = {
  scope: managedIdentity
  name: '${managedIdentityName}-lock'
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of the managed identity used for passwordless authentication across services.'
  }
}

output managedIdentityId string = managedIdentity.id
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output managedIdentityClientId string = managedIdentity.properties.clientId
