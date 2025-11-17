#!/bin/bash

################################################################################
# Azure Table Storage Deployment Script
# 
# This script creates and configures Azure Storage Account with Table Storage
# for storing user settings in the GlookoDataWebApp.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash)
#   - Must have appropriate permissions to create resources
#   - Azure CLI is pre-installed in Cloud Shell
#
# Usage:
#   ./deploy-azure-table-storage.sh
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

################################################################################
# CONFIGURATION CONSTANTS
################################################################################

# Resource Configuration
readonly APP_NAME="glookodatawebapp"
readonly RESOURCE_GROUP_NAME="${APP_NAME}-rg"
readonly STORAGE_ACCOUNT_NAME="${APP_NAME}storage"
readonly TABLE_NAME="UserSettings"
readonly LOCATION="eastus"  # Change this to your preferred region

# Tags for resource management
readonly TAGS="Application=${APP_NAME} Environment=Production Purpose=UserSettings"

# Output colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_NC='\033[0m' # No Color

################################################################################
# HELPER FUNCTIONS
################################################################################

# Print colored messages
print_info() {
    echo -e "${COLOR_BLUE}ℹ️  $1${COLOR_NC}"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${COLOR_NC}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠️  $1${COLOR_NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${COLOR_NC}"
}

# Print section header
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${COLOR_BLUE}$1${COLOR_NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

################################################################################
# VALIDATION FUNCTIONS
################################################################################

# Check if Azure CLI is installed
check_azure_cli() {
    print_section "Checking Prerequisites"
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed or not in PATH"
        print_info "This script should be run in Azure Cloud Shell"
        exit 1
    fi
    
    print_success "Azure CLI is available"
}

# Check if user is logged in
check_azure_login() {
    print_info "Checking Azure login status..."
    
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure"
        print_info "Please run 'az login' first or use Azure Cloud Shell"
        exit 1
    fi
    
    local account_name
    local subscription_id
    account_name=$(az account show --query name -o tsv)
    subscription_id=$(az account show --query id -o tsv)
    
    print_success "Logged in to Azure"
    print_info "Account: ${account_name}"
    print_info "Subscription ID: ${subscription_id}"
}

################################################################################
# RESOURCE CREATION FUNCTIONS
################################################################################

# Create Resource Group
create_resource_group() {
    print_section "Creating Resource Group"
    
    print_info "Checking if resource group exists: ${RESOURCE_GROUP_NAME}"
    
    if az group show --name "${RESOURCE_GROUP_NAME}" &> /dev/null; then
        print_warning "Resource group '${RESOURCE_GROUP_NAME}' already exists"
    else
        print_info "Creating resource group: ${RESOURCE_GROUP_NAME}"
        az group create \
            --name "${RESOURCE_GROUP_NAME}" \
            --location "${LOCATION}" \
            --tags ${TAGS}
        
        print_success "Resource group created successfully"
    fi
    
    print_info "Resource Group: ${RESOURCE_GROUP_NAME}"
    print_info "Location: ${LOCATION}"
}

# Create Storage Account
create_storage_account() {
    print_section "Creating Storage Account"
    
    print_info "Checking if storage account exists: ${STORAGE_ACCOUNT_NAME}"
    
    if az storage account show --name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" &> /dev/null; then
        print_warning "Storage account '${STORAGE_ACCOUNT_NAME}' already exists"
    else
        print_info "Creating storage account: ${STORAGE_ACCOUNT_NAME}"
        print_info "This may take a few minutes..."
        
        az storage account create \
            --name "${STORAGE_ACCOUNT_NAME}" \
            --resource-group "${RESOURCE_GROUP_NAME}" \
            --location "${LOCATION}" \
            --sku Standard_LRS \
            --kind StorageV2 \
            --https-only true \
            --min-tls-version TLS1_2 \
            --allow-blob-public-access false \
            --tags ${TAGS}
        
        print_success "Storage account created successfully"
    fi
    
    print_info "Storage Account: ${STORAGE_ACCOUNT_NAME}"
}

# Get Storage Account Connection String
get_connection_string() {
    print_section "Retrieving Storage Account Details"
    
    print_info "Getting storage account connection string..."
    
    CONNECTION_STRING=$(az storage account show-connection-string \
        --name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP_NAME}" \
        --query connectionString -o tsv)
    
    print_success "Connection string retrieved"
}

# Create Table
create_table() {
    print_section "Creating Table Storage"
    
    print_info "Checking if table exists: ${TABLE_NAME}"
    
    if az storage table exists \
        --name "${TABLE_NAME}" \
        --connection-string "${CONNECTION_STRING}" \
        --query exists -o tsv | grep -q "true"; then
        print_warning "Table '${TABLE_NAME}' already exists"
    else
        print_info "Creating table: ${TABLE_NAME}"
        
        az storage table create \
            --name "${TABLE_NAME}" \
            --connection-string "${CONNECTION_STRING}"
        
        print_success "Table created successfully"
    fi
    
    print_info "Table Name: ${TABLE_NAME}"
}

# Configure CORS for Static Web Apps
configure_cors() {
    print_section "Configuring CORS"
    
    print_info "Setting up CORS rules for Static Web Apps..."
    
    # CORS is needed for browser-based access from Static Web Apps
    az storage cors add \
        --services t \
        --methods GET PUT POST DELETE OPTIONS \
        --origins "https://glooko.iric.online" "http://localhost:5173" "http://127.0.0.1:5173" \
        --allowed-headers "*" \
        --exposed-headers "*" \
        --max-age 3600 \
        --connection-string "${CONNECTION_STRING}"
    
    print_success "CORS configured successfully"
}

# Get Storage Account Key
get_storage_key() {
    print_section "Retrieving Storage Account Key"
    
    print_info "Getting storage account key..."
    
    STORAGE_KEY=$(az storage account keys list \
        --resource-group "${RESOURCE_GROUP_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --query "[0].value" -o tsv)
    
    print_success "Storage key retrieved"
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Azure Table Storage configured successfully!"
    echo ""
    print_info "Resource Details:"
    echo "  - Resource Group: ${RESOURCE_GROUP_NAME}"
    echo "  - Storage Account: ${STORAGE_ACCOUNT_NAME}"
    echo "  - Table Name: ${TABLE_NAME}"
    echo "  - Location: ${LOCATION}"
    echo ""
    print_info "Storage Account Details:"
    echo "  - Storage Account Name: ${STORAGE_ACCOUNT_NAME}"
    echo "  - Connection String: (retrieved - do not expose)"
    echo ""
    print_warning "Security Information:"
    echo "  - Never commit connection strings or keys to source control"
    echo "  - Store connection string in Azure Static Web App environment variables"
    echo "  - Use Managed Identity for production deployments when possible"
    echo ""
    print_info "Next Steps:"
    echo ""
    echo "  1. Add the following to your Static Web App configuration:"
    echo ""
    echo "     Environment Variable:"
    echo "       Name: AZURE_STORAGE_CONNECTION_STRING"
    echo "       Value: <connection-string>"
    echo ""
    echo "  2. Or configure in staticwebapp.config.json with dataApiBuilder"
    echo ""
    echo "  3. To set the environment variable in Azure Static Web App:"
    echo "     az staticwebapp appsettings set \\"
    echo "       --name <your-static-web-app-name> \\"
    echo "       --setting-names AZURE_STORAGE_CONNECTION_STRING=\"\${CONNECTION_STRING}\""
    echo ""
    echo "  4. Update your application code to use the Data API"
    echo ""
    print_info "Connection String (SAVE THIS SECURELY):"
    echo ""
    echo "${CONNECTION_STRING}"
    echo ""
    print_info "Storage Account Key (SAVE THIS SECURELY):"
    echo ""
    echo "${STORAGE_KEY}"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    print_section "Azure Table Storage Deployment"
    print_info "Application: ${APP_NAME}"
    print_info "Location: ${LOCATION}"
    echo ""
    
    # Run validation checks
    check_azure_cli
    check_azure_login
    
    # Create resources
    create_resource_group
    create_storage_account
    get_connection_string
    create_table
    configure_cors
    get_storage_key
    
    # Display results
    display_summary
    
    print_section "Deployment Complete"
    print_success "Table Storage is ready for use!"
}

# Run main function
main "$@"
