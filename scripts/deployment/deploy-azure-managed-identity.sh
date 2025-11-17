#!/bin/bash

################################################################################
# Azure User Managed Identity Deployment Script
# 
# This script creates and configures a user-assigned managed identity for the
# GlookoDataWebApp application. The managed identity is used to authenticate
# Azure resources without managing secrets.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create managed identities
#   - Contributor or Owner role on the subscription
#
# Usage:
#   ./deploy-azure-managed-identity.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Managed identity name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#
# Examples:
#   ./deploy-azure-managed-identity.sh
#   ./deploy-azure-managed-identity.sh --name my-identity --location westus2
#   LOCATION=westus2 ./deploy-azure-managed-identity.sh
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get script directory for sourcing config-lib
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration library
if [ -f "${SCRIPT_DIR}/config-lib.sh" ]; then
    source "${SCRIPT_DIR}/config-lib.sh"
else
    echo "ERROR: config-lib.sh not found in ${SCRIPT_DIR}"
    exit 1
fi

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << EOF
Azure User Managed Identity Deployment Script

Usage: $(basename "$0") [OPTIONS]

This script creates and configures a user-assigned managed identity for
authenticating Azure resources without managing secrets or connection strings.

Options:
  -h, --help              Show this help message and exit
  -n, --name NAME         Managed identity name (overrides config/default)
  -g, --resource-group RG Resource group name (overrides config/default)
  -l, --location LOCATION Azure region (overrides config/default)
  -c, --config FILE       Use custom configuration file
  -s, --save              Save arguments to local configuration file
  -v, --verbose           Enable verbose output

Configuration:
  $(show_config_help)

Examples:
  # Deploy with default configuration
  ./$(basename "$0")

  # Deploy with custom name and location
  ./$(basename "$0") --name my-app-identity --location westus2

  # Use custom config file
  ./$(basename "$0") --config ~/my-config.json

  # Save configuration for future runs
  ./$(basename "$0") --name my-identity --save

Environment Variables:
  MANAGED_IDENTITY_NAME  - Override managed identity name
  RESOURCE_GROUP         - Override resource group name
  LOCATION               - Override Azure region
  CONFIG_FILE            - Use custom configuration file

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

EOF
}

# Parse command-line arguments
parse_arguments() {
    SAVE_CONFIG=false
    VERBOSE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -n|--name)
                MANAGED_IDENTITY_NAME="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -l|--location)
                LOCATION="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -s|--save)
                SAVE_CONFIG=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                set -x  # Enable bash debug mode
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

################################################################################
# MANAGED IDENTITY DEPLOYMENT FUNCTIONS
################################################################################

# Create managed identity
create_managed_identity() {
    print_section "Creating User-Assigned Managed Identity"
    
    local identity_name="${CONFIG_MANAGED_IDENTITY_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    local location="${CONFIG_LOCATION}"
    
    print_info "Checking if managed identity exists: ${identity_name}"
    
    if resource_exists "identity" "${identity_name}" "${rg_name}"; then
        print_warning "Managed identity '${identity_name}' already exists"
        IDENTITY_EXISTS=true
    else
        print_info "Creating managed identity: ${identity_name}"
        az identity create \
            --name "${identity_name}" \
            --resource-group "${rg_name}" \
            --location "${location}" \
            --tags ${CONFIG_TAGS}
        
        print_success "Managed identity created successfully"
        IDENTITY_EXISTS=false
    fi
}

# Get managed identity details
get_identity_details() {
    print_section "Retrieving Managed Identity Details"
    
    local identity_name="${CONFIG_MANAGED_IDENTITY_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    print_info "Getting managed identity information..."
    
    IDENTITY_CLIENT_ID=$(get_managed_identity_id "${identity_name}" "${rg_name}")
    IDENTITY_PRINCIPAL_ID=$(get_managed_identity_principal_id "${identity_name}" "${rg_name}")
    IDENTITY_RESOURCE_ID=$(az identity show \
        --name "${identity_name}" \
        --resource-group "${rg_name}" \
        --query id -o tsv)
    
    if [ -z "$IDENTITY_CLIENT_ID" ] || [ -z "$IDENTITY_PRINCIPAL_ID" ]; then
        print_error "Failed to retrieve managed identity details"
        exit 1
    fi
    
    print_success "Managed identity details retrieved"
}

# Assign role to managed identity for storage account
assign_storage_roles() {
    print_section "Configuring Storage Account Access"
    
    local storage_account="${CONFIG_STORAGE_ACCOUNT_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    # Check if storage account exists
    if ! resource_exists "storage-account" "${storage_account}" "${rg_name}"; then
        print_warning "Storage account '${storage_account}' not found"
        print_info "Storage role assignment will be skipped"
        print_info "Run deploy-azure-storage-account.sh first, then re-run this script"
        return 0
    fi
    
    print_info "Assigning roles to managed identity for storage account..."
    
    # Get storage account scope
    local storage_scope
    storage_scope=$(az storage account show \
        --name "${storage_account}" \
        --resource-group "${rg_name}" \
        --query id -o tsv)
    
    # Assign Storage Blob Data Contributor role
    print_info "Assigning 'Storage Blob Data Contributor' role..."
    if az role assignment create \
        --assignee "${IDENTITY_PRINCIPAL_ID}" \
        --role "Storage Blob Data Contributor" \
        --scope "${storage_scope}" &> /dev/null; then
        print_success "Storage Blob Data Contributor role assigned"
    else
        print_warning "Role may already be assigned (this is normal)"
    fi
    
    # Assign Storage Table Data Contributor role
    print_info "Assigning 'Storage Table Data Contributor' role..."
    if az role assignment create \
        --assignee "${IDENTITY_PRINCIPAL_ID}" \
        --role "Storage Table Data Contributor" \
        --scope "${storage_scope}" &> /dev/null; then
        print_success "Storage Table Data Contributor role assigned"
    else
        print_warning "Role may already be assigned (this is normal)"
    fi
    
    print_success "Storage account roles configured"
    print_info "The managed identity can now access storage without connection strings"
}

# Save configuration if requested
save_configuration() {
    if [ "$SAVE_CONFIG" = true ]; then
        print_section "Saving Configuration"
        
        print_info "Saving configuration to local file..."
        save_config_value "managedIdentityName" "${CONFIG_MANAGED_IDENTITY_NAME}"
        save_config_value "resourceGroup" "${CONFIG_RESOURCE_GROUP}"
        save_config_value "location" "${CONFIG_LOCATION}"
        
        print_success "Configuration saved to ${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    fi
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "User-Assigned Managed Identity configured successfully!"
    echo ""
    print_info "Managed Identity Details:"
    echo "  - Name: ${CONFIG_MANAGED_IDENTITY_NAME}"
    echo "  - Resource Group: ${CONFIG_RESOURCE_GROUP}"
    echo "  - Location: ${CONFIG_LOCATION}"
    echo "  - Client ID: ${IDENTITY_CLIENT_ID}"
    echo "  - Principal ID: ${IDENTITY_PRINCIPAL_ID}"
    echo "  - Resource ID: ${IDENTITY_RESOURCE_ID}"
    echo ""
    
    if [ "${IDENTITY_EXISTS}" = true ]; then
        print_info "Note: Managed identity already existed (not created)"
    fi
    
    print_info "What is a Managed Identity?"
    echo "  A managed identity is an Azure AD identity that can be used to authenticate"
    echo "  to Azure services without storing credentials in your code or configuration."
    echo ""
    echo "  Benefits:"
    echo "  - No secrets to manage (no connection strings, passwords, or keys)"
    echo "  - Automatic credential rotation by Azure"
    echo "  - Improved security and compliance"
    echo "  - Simplified access management"
    echo ""
    
    print_info "Assigned Roles:"
    echo "  - Storage Blob Data Contributor (if storage account exists)"
    echo "  - Storage Table Data Contributor (if storage account exists)"
    echo ""
    
    print_info "Next Steps:"
    echo ""
    echo "  1. Deploy or update other Azure resources to use this managed identity:"
    echo "     - Static Web App: ./deploy-azure-static-web-app.sh"
    echo "     - Storage Account: ./deploy-azure-storage-account.sh --use-managed-identity"
    echo ""
    echo "  2. Assign additional roles if needed:"
    echo "     az role assignment create \\"
    echo "       --assignee ${IDENTITY_PRINCIPAL_ID} \\"
    echo "       --role 'Role Name' \\"
    echo "       --scope '/subscriptions/<subscription-id>/resourceGroups/<rg-name>'"
    echo ""
    echo "  3. Use the managed identity in your Static Web App:"
    echo "     - Configure the Static Web App to use this managed identity"
    echo "     - Remove connection strings from configuration"
    echo "     - The app will authenticate using the managed identity"
    echo ""
    
    print_warning "Security Best Practices:"
    echo "  - Managed identities eliminate the need for secrets in code"
    echo "  - Use least-privilege access (assign only required roles)"
    echo "  - Monitor managed identity usage via Azure Monitor"
    echo "  - Review and audit role assignments regularly"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    # Parse command-line arguments
    parse_arguments "$@"
    
    # Load configuration
    load_config
    
    # Display deployment information
    print_section "Azure User Managed Identity Deployment"
    print_info "Identity Name: ${CONFIG_MANAGED_IDENTITY_NAME}"
    print_info "Resource Group: ${CONFIG_RESOURCE_GROUP}"
    print_info "Location: ${CONFIG_LOCATION}"
    echo ""
    
    # Run prerequisite checks
    check_prerequisites
    
    # Ensure resource group exists
    ensure_resource_group
    
    # Create managed identity
    create_managed_identity
    
    # Get identity details
    get_identity_details
    
    # Assign storage roles if storage account exists
    assign_storage_roles
    
    # Save configuration if requested
    save_configuration
    
    # Display summary
    display_summary
    
    print_section "Deployment Complete"
    print_success "Managed Identity is ready for use!"
}

# Run main function
main "$@"
