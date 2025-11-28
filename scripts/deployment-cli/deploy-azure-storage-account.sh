#!/bin/bash

################################################################################
# Azure Storage Account Deployment Script
# 
# This script creates and configures an Azure Storage Account for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#
# Usage:
#   ./deploy-azure-storage-account.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Storage account name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#   -s, --save              Save configuration after deployment
#   -v, --verbose           Enable verbose output
#   --sku SKU               Storage SKU (default: Standard_LRS)
#   --kind KIND             Storage kind (default: StorageV2)
#   --access-tier TIER      Access tier (default: Hot)
#
# Examples:
#   ./deploy-azure-storage-account.sh
#   ./deploy-azure-storage-account.sh --name mystorageacct --location westus2
#   ./deploy-azure-storage-account.sh --sku Standard_GRS --access-tier Cool
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get script directory for sourcing config-lib
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration library
if [ -f "${SCRIPT_DIR}/config-lib.sh" ]; then
    # shellcheck source=config-lib.sh
    source "${SCRIPT_DIR}/config-lib.sh"
else
    echo "ERROR: config-lib.sh not found in ${SCRIPT_DIR}"
    exit 1
fi

################################################################################
# DEFAULT VALUES
################################################################################

STORAGE_SKU="Standard_LRS"
STORAGE_KIND="StorageV2"
ACCESS_TIER="Hot"
MIN_TLS_VERSION="TLS1_2"

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Storage Account Deployment Script

Creates and configures an Azure Storage Account for GlookoDataWebApp.

Usage: ./deploy-azure-storage-account.sh [OPTIONS]

Options:
  -h, --help              Show this help message
  -n, --name NAME         Storage account name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output
  --sku SKU               Storage SKU (Standard_LRS, Standard_GRS, etc.)
  --kind KIND             Storage kind (StorageV2, BlobStorage, etc.)
  --access-tier TIER      Access tier (Hot, Cool, Archive)

Examples:
  ./deploy-azure-storage-account.sh
  ./deploy-azure-storage-account.sh --name mystorageacct --location westus2
  ./deploy-azure-storage-account.sh --sku Standard_GRS --access-tier Cool

EOF
}

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
                STORAGE_ACCOUNT_NAME="$2"
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
                shift
                ;;
            --sku)
                STORAGE_SKU="$2"
                shift 2
                ;;
            --kind)
                STORAGE_KIND="$2"
                shift 2
                ;;
            --access-tier)
                ACCESS_TIER="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

################################################################################
# VALIDATION FUNCTIONS
################################################################################

# Validate storage account name
validate_storage_account_name() {
    local name="$1"
    
    # Storage account names must be 3-24 characters, lowercase letters and numbers only
    if [[ ! "${name}" =~ ^[a-z0-9]{3,24}$ ]]; then
        print_error "Storage account name must be 3-24 lowercase letters and numbers only"
        print_info "Current name: ${name}"
        return 1
    fi
    return 0
}

################################################################################
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Create the storage account
create_storage_account() {
    print_section "Creating Azure Storage Account"
    
    # Validate storage account name
    if ! validate_storage_account_name "${STORAGE_ACCOUNT_NAME}"; then
        exit 1
    fi
    
    # Check if storage account already exists
    if resource_exists "storage" "${STORAGE_ACCOUNT_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Storage account '${STORAGE_ACCOUNT_NAME}' already exists"
        STORAGE_ACCOUNT_EXISTS=true
    else
        print_info "Creating storage account '${STORAGE_ACCOUNT_NAME}'..."
        
        az storage account create \
            --name "${STORAGE_ACCOUNT_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --sku "${STORAGE_SKU}" \
            --kind "${STORAGE_KIND}" \
            --access-tier "${ACCESS_TIER}" \
            --min-tls-version "${MIN_TLS_VERSION}" \
            --allow-blob-public-access false \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Storage account created successfully"
        STORAGE_ACCOUNT_EXISTS=false
    fi
}

# Configure storage account settings
configure_storage_account() {
    print_section "Configuring Storage Account"
    
    # Enable blob versioning for data protection
    print_info "Configuring blob service properties..."
    az storage account blob-service-properties update \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --enable-delete-retention true \
        --delete-retention-days 7 \
        --output none 2>/dev/null || true
    
    print_success "Storage account configured"
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    # Get storage account details
    local storage_id
    storage_id=$(az storage account show \
        --name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    local primary_endpoint
    primary_endpoint=$(az storage account show \
        --name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query primaryEndpoints.blob \
        -o tsv)
    
    print_success "Azure Storage Account deployed successfully!"
    echo ""
    echo "  Resource Group:      ${RESOURCE_GROUP}"
    echo "  Storage Account:     ${STORAGE_ACCOUNT_NAME}"
    echo "  Location:            ${LOCATION}"
    echo "  SKU:                 ${STORAGE_SKU}"
    echo "  Kind:                ${STORAGE_KIND}"
    echo "  Access Tier:         ${ACCESS_TIER}"
    echo "  Min TLS Version:     ${MIN_TLS_VERSION}"
    echo "  Blob Endpoint:       ${primary_endpoint}"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Create tables using deploy-azure-user-settings-table.sh"
    echo "  2. Create managed identity using deploy-azure-managed-identity.sh"
    echo "  3. Assign RBAC roles for managed identity access"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Storage Account Deployment"
    print_info "Storage Account: ${STORAGE_ACCOUNT_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    
    check_prerequisites
    ensure_resource_group
    create_storage_account
    configure_storage_account
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
