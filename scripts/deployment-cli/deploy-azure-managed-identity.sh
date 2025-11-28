#!/bin/bash

################################################################################
# Azure User-Assigned Managed Identity Deployment Script
# 
# This script creates and configures a user-assigned managed identity for the
# GlookoDataWebApp application. The managed identity is used by other Azure
# resources (Function App, Static Web App) for passwordless authentication.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#
# Usage:
#   ./deploy-azure-managed-identity.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -n, --name NAME             Managed identity name (default from config)
#   -g, --resource-group RG     Resource group name (default from config)
#   -l, --location LOCATION     Azure region (default from config)
#   -c, --config FILE           Custom configuration file path
#   -s, --save                  Save configuration after deployment
#   -v, --verbose               Enable verbose output
#
# Examples:
#   ./deploy-azure-managed-identity.sh
#   ./deploy-azure-managed-identity.sh --name my-identity --location westus2
#   ./deploy-azure-managed-identity.sh --save
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
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure User-Assigned Managed Identity Deployment Script

Creates and configures a user-assigned managed identity for GlookoDataWebApp.
The managed identity provides passwordless authentication for Azure resources.

Usage: ./deploy-azure-managed-identity.sh [OPTIONS]

Options:
  -h, --help                  Show this help message
  -n, --name NAME             Managed identity name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output

Examples:
  ./deploy-azure-managed-identity.sh
  ./deploy-azure-managed-identity.sh --name my-identity --location westus2
  ./deploy-azure-managed-identity.sh --save

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
                shift
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
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Create the user-assigned managed identity
create_managed_identity() {
    print_section "Creating User-Assigned Managed Identity"
    
    # Check if managed identity already exists
    if resource_exists "identity" "${MANAGED_IDENTITY_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Managed identity '${MANAGED_IDENTITY_NAME}' already exists"
        IDENTITY_EXISTS=true
    else
        print_info "Creating managed identity '${MANAGED_IDENTITY_NAME}'..."
        
        az identity create \
            --name "${MANAGED_IDENTITY_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Managed identity created successfully"
        IDENTITY_EXISTS=false
    fi
}

# Get and display managed identity properties
get_identity_properties() {
    print_section "Managed Identity Properties"
    
    # Get the identity details
    IDENTITY_CLIENT_ID=$(get_managed_identity_id)
    IDENTITY_PRINCIPAL_ID=$(get_managed_identity_principal_id)
    IDENTITY_RESOURCE_ID=$(get_managed_identity_resource_id)
    
    if [ -z "${IDENTITY_CLIENT_ID}" ] || [ -z "${IDENTITY_PRINCIPAL_ID}" ]; then
        print_error "Failed to retrieve managed identity properties"
        exit 1
    fi
    
    print_success "Managed identity properties retrieved"
    echo ""
    echo "  Client ID:     ${IDENTITY_CLIENT_ID}"
    echo "  Principal ID:  ${IDENTITY_PRINCIPAL_ID}"
    echo "  Resource ID:   ${IDENTITY_RESOURCE_ID}"
    echo ""
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "User-Assigned Managed Identity deployed successfully!"
    echo ""
    echo "  Resource Group:        ${RESOURCE_GROUP}"
    echo "  Managed Identity Name: ${MANAGED_IDENTITY_NAME}"
    echo "  Location:              ${LOCATION}"
    echo ""
    echo "  Client ID:             ${IDENTITY_CLIENT_ID}"
    echo "  Principal ID:          ${IDENTITY_PRINCIPAL_ID}"
    echo ""
    echo "Next Steps:"
    echo "  1. Deploy the Azure Function App:    ./deploy-azure-function.sh"
    echo "  2. Assign RBAC roles to the identity as needed"
    echo ""
    echo "Usage in other scripts:"
    echo "  The managed identity will be automatically used by deploy-azure-function.sh"
    echo "  to configure passwordless authentication to Storage Account and Key Vault."
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure User-Assigned Managed Identity Deployment"
    print_info "Managed Identity: ${MANAGED_IDENTITY_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    
    check_prerequisites
    ensure_resource_group
    create_managed_identity
    get_identity_properties
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
