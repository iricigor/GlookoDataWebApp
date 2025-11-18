#!/bin/bash

################################################################################
# Azure ProUsers Table Deployment Script
# 
# This script creates and configures the ProUsers table in Azure Table Storage
# for managing professional user accounts and permissions in GlookoDataWebApp.
#
# Prerequisites:
#   - Run deploy-azure-storage-account.sh first to create storage account
#   - Run this script in Azure Cloud Shell (bash)
#   - Must have appropriate permissions to create resources
#   - Azure CLI is pre-installed in Cloud Shell
#
# Usage:
#   ./deploy-azure-pro-users-table.sh
#
# Note: This script is a template for future implementation of professional
#       user management features.
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
readonly TABLE_NAME="ProUsers"

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

# Check if storage account exists
check_storage_account() {
    print_info "Checking if storage account exists: ${STORAGE_ACCOUNT_NAME}"
    
    if ! az storage account show --name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" &> /dev/null; then
        print_error "Storage account '${STORAGE_ACCOUNT_NAME}' does not exist"
        print_info "Please run deploy-azure-storage-account.sh first"
        exit 1
    fi
    
    print_success "Storage account found"
}

################################################################################
# TABLE CREATION FUNCTIONS
################################################################################

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

# Configure CORS for Static Web Apps (if needed)
configure_cors() {
    print_section "Configuring CORS"
    
    print_info "CORS configuration already set at storage account level"
    print_success "No additional CORS configuration needed"
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "ProUsers table configured successfully!"
    echo ""
    print_info "Table Details:"
    echo "  - Table Name: ${TABLE_NAME}"
    echo "  - Storage Account: ${STORAGE_ACCOUNT_NAME}"
    echo "  - Resource Group: ${RESOURCE_GROUP_NAME}"
    echo ""
    print_info "Proposed Table Schema (Future Implementation):"
    echo "  - PartitionKey: Organization or tenant identifier"
    echo "  - RowKey: User email or unique identifier"
    echo "  - UserType: 'pro', 'admin', 'healthcare_professional'"
    echo "  - Permissions: JSON string with permission flags"
    echo "  - SubscriptionStatus: 'active', 'trial', 'expired'"
    echo "  - Features: JSON string with enabled features"
    echo ""
    print_warning "Note: This table is a placeholder for future features"
    echo ""
    print_info "Next Steps:"
    echo ""
    echo "  1. Define detailed schema for professional users"
    echo "  2. Implement authentication and authorization logic"
    echo "  3. Create API endpoints for user management"
    echo "  4. Update staticwebapp.config.json with ProUsers API configuration"
    echo ""
    print_warning "Security Reminder:"
    echo "  - Implement strict access controls for user management"
    echo "  - Use role-based access control (RBAC)"
    echo "  - Audit all changes to user permissions"
    echo "  - Ensure compliance with data protection regulations"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    print_section "Azure ProUsers Table Deployment"
    print_info "Table Name: ${TABLE_NAME}"
    echo ""
    
    # Run validation checks
    check_azure_cli
    check_azure_login
    check_storage_account
    
    # Create table and configure
    get_connection_string
    create_table
    configure_cors
    
    # Display results
    display_summary
    
    print_section "Deployment Complete"
    print_success "ProUsers table is ready for future implementation!"
}

# Run main function
main "$@"
