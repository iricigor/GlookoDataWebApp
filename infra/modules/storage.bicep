@description('The name of the storage account')
param storageAccountName string

@description('The location for the storage account')
param location string = resourceGroup().location

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param sku string = 'Standard_LRS'

@description('List of table names to create')
param tableNames array = [
  'UserSettings'
  'ProUsers'
  'AIQueryLogs'
]

@description('Enable CORS for Table Storage')
param enableTableCors bool = true

@description('CORS allowed origins for Table Storage')
param tableCorsAllowedOrigins array = ['*']

@description('Tags to apply to the storage account')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
        table: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: enableTableCors ? {
    cors: {
      corsRules: [
        {
          allowedOrigins: tableCorsAllowedOrigins
          allowedMethods: [
            'GET'
            'PUT'
            'POST'
            'DELETE'
          ]
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  } : {}
}

resource tables 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = [for tableName in tableNames: {
  parent: tableService
  name: tableName
}]

output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
output storageAccountPrimaryEndpoints object = storageAccount.properties.primaryEndpoints
