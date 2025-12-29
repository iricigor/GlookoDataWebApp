@description('The name of the static web app')
param staticWebAppName string

@description('The location for the static web app')
param location string = resourceGroup().location

@description('The SKU for the static web app')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Standard'

@description('The managed identity resource ID (optional)')
param managedIdentityId string = ''

@description('Tags to apply to the static web app')
param tags object = {}

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  identity: !empty(managedIdentityId) ? {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  } : {
    type: 'None'
  }
  properties: {
    repositoryUrl: 'https://github.com/iricigor/GlookoDataWebApp'
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'dist'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostName string = staticWebApp.properties.defaultHostname
