#!/bin/bash

################################################################################
# Azure Resource Group Deployment Script
# 
# This script creates and configures an Azure Resource Group for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#
# Usage:
#   ./deploy-azure-resource-group.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#   -s, --save              Save configuration after deployment
#   -v, --verbose           Enable verbose output
#
# Examples:
#   ./deploy-azure-resource-group.sh
#   ./deploy-azure-resource-group.sh --name my-rg --location westus2
#   ./deploy-azure-resource-group.sh --save
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
Azure Resource Group Deployment Script

Creates and configures an Azure Resource Group for GlookoDataWebApp.

Usage: ./deploy-azure-resource-group.sh [OPTIONS]

Options:
  -h, --help              Show this help message
  -n, --name NAME         Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output

Examples:
  ./deploy-azure-resource-group.sh
  ./deploy-azure-resource-group.sh --name my-rg --location westus2
  ./deploy-azure-resource-group.sh --save

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

# Create the resource group
create_resource_group() {
    print_section "Creating Azure Resource Group"
    
    # Check if resource group already exists
    if resource_exists "group" "${RESOURCE_GROUP}"; then
        print_warning "Resource group '${RESOURCE_GROUP}' already exists"
        RESOURCE_GROUP_EXISTS=true
        
        # Get existing location
        local existing_location
        existing_location=$(az group show --name "${RESOURCE_GROUP}" --query location -o tsv)
        print_info "Existing resource group location: ${existing_location}"
    else
        print_info "Creating resource group '${RESOURCE_GROUP}' in '${LOCATION}'..."
        
        az group create \
            --name "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Resource group created successfully"
        RESOURCE_GROUP_EXISTS=false
    fi
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    # Get resource group details
    local rg_id
    rg_id=$(az group show --name "${RESOURCE_GROUP}" --query id -o tsv)
    
    local rg_location
    rg_location=$(az group show --name "${RESOURCE_GROUP}" --query location -o tsv)
    
    local provisioning_state
    provisioning_state=$(az group show --name "${RESOURCE_GROUP}" --query properties.provisioningState -o tsv)
    
    print_success "Azure Resource Group configured successfully!"
    echo ""
    echo "  Resource Group:      ${RESOURCE_GROUP}"
    echo "  Location:            ${rg_location}"
    echo "  Provisioning State:  ${provisioning_state}"
    echo "  Resource ID:         ${rg_id}"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Create storage account using deploy-azure-storage-account.sh"
    echo "  2. Create managed identity using deploy-azure-managed-identity.sh"
    echo "  3. Create function app using deploy-azure-function.sh"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Resource Group Deployment"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    
    check_prerequisites
    create_resource_group
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
