#!/bin/bash

################################################################################
# Azure Static Web App Deployment Script
# 
# This script creates and configures an Azure Static Web App for the
# GlookoDataWebApp application with managed identity support.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create Static Web Apps
#   - Contributor or Owner role on the subscription
#   - Optionally run deploy-azure-managed-identity.sh first for managed identity
#
# Usage:
#   ./deploy-azure-static-web-app.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Static Web App name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -s, --sku SKU           SKU tier: Free or Standard (default from config)
#   -m, --managed-identity  Enable managed identity
#   -c, --config FILE       Custom configuration file path
#
# Examples:
#   ./deploy-azure-static-web-app.sh
#   ./deploy-azure-static-web-app.sh --sku Standard --managed-identity
#   STATIC_WEB_APP_SKU=Standard ./deploy-azure-static-web-app.sh
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
Azure Static Web App Deployment Script

Usage: $(basename "$0") [OPTIONS]

This script creates and configures an Azure Static Web App with optional
managed identity support for secure authentication to Azure resources.

Options:
  -h, --help              Show this help message and exit
  -n, --name NAME         Static Web App name (overrides config/default)
  -g, --resource-group RG Resource group name (overrides config/default)
  -l, --location LOCATION Azure region (overrides config/default)
  -s, --sku SKU           SKU tier: Free or Standard (overrides config/default)
  -m, --managed-identity  Enable managed identity (requires Standard SKU)
  -c, --config FILE       Use custom configuration file
  --save                  Save arguments to local configuration file
  -v, --verbose           Enable verbose output

Configuration:
  $(show_config_help)

Examples:
  # Deploy with Free SKU (default)
  ./$(basename "$0")

  # Deploy with Standard SKU and managed identity
  ./$(basename "$0") --sku Standard --managed-identity

  # Use custom config file
  ./$(basename "$0") --config ~/my-config.json

  # Deploy and save configuration
  ./$(basename "$0") --name my-swa --sku Standard --save

Environment Variables:
  STATIC_WEB_APP_NAME    - Override Static Web App name
  STATIC_WEB_APP_SKU     - Override SKU (Free or Standard)
  RESOURCE_GROUP         - Override resource group name
  LOCATION               - Override Azure region
  USE_MANAGED_IDENTITY   - Enable managed identity (true/false)
  CONFIG_FILE            - Use custom configuration file

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

EOF
}

# Parse command-line arguments
parse_arguments() {
    SAVE_CONFIG=false
    VERBOSE=false
    ENABLE_MANAGED_IDENTITY=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -n|--name)
                STATIC_WEB_APP_NAME="$2"
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
            -s|--sku)
                STATIC_WEB_APP_SKU="$2"
                shift 2
                ;;
            -m|--managed-identity)
                ENABLE_MANAGED_IDENTITY="true"
                shift
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --save)
                SAVE_CONFIG=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                set -x
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
# STATIC WEB APP DEPLOYMENT FUNCTIONS
################################################################################

# Validate SKU and managed identity compatibility
validate_configuration() {
    print_section "Validating Configuration"
    
    # If managed identity is requested, SKU must be Standard
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ] && [ "$CONFIG_STATIC_WEB_APP_SKU" = "Free" ]; then
        print_warning "Managed Identity requires Standard SKU"
        print_info "Upgrading to Standard SKU automatically"
        CONFIG_STATIC_WEB_APP_SKU="Standard"
    fi
    
    print_success "Configuration is valid"
    print_info "SKU: ${CONFIG_STATIC_WEB_APP_SKU}"
    print_info "Managed Identity: ${CONFIG_USE_MANAGED_IDENTITY}"
}

# Create Static Web App
create_static_web_app() {
    print_section "Creating Azure Static Web App"
    
    local swa_name="${CONFIG_STATIC_WEB_APP_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    local location="${CONFIG_LOCATION}"
    local sku="${CONFIG_STATIC_WEB_APP_SKU}"
    
    print_info "Checking if Static Web App exists: ${swa_name}"
    
    if resource_exists "staticwebapp" "${swa_name}" "${rg_name}"; then
        print_warning "Static Web App '${swa_name}' already exists"
        SWA_EXISTS=true
        
        # Check if we need to update SKU
        local current_sku
        current_sku=$(az staticwebapp show \
            --name "${swa_name}" \
            --resource-group "${rg_name}" \
            --query sku.name -o tsv 2>/dev/null || echo "Free")
        
        if [ "$current_sku" != "$sku" ]; then
            print_info "Current SKU: ${current_sku}, Requested SKU: ${sku}"
            print_warning "SKU change requires deleting and recreating the Static Web App"
            print_warning "This will cause downtime and require GitHub Actions reconfiguration"
            read -p "Do you want to proceed? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "Keeping existing SKU: ${current_sku}"
                CONFIG_STATIC_WEB_APP_SKU="$current_sku"
            else
                print_info "Deleting existing Static Web App..."
                az staticwebapp delete \
                    --name "${swa_name}" \
                    --resource-group "${rg_name}" \
                    --yes
                SWA_EXISTS=false
            fi
        fi
    else
        SWA_EXISTS=false
    fi
    
    if [ "$SWA_EXISTS" = false ]; then
        print_info "Creating Static Web App: ${swa_name}"
        print_info "SKU: ${sku}"
        print_info "This may take a few minutes..."
        
        az staticwebapp create \
            --name "${swa_name}" \
            --resource-group "${rg_name}" \
            --location "${location}" \
            --sku "${sku}" \
            --tags ${CONFIG_TAGS}
        
        print_success "Static Web App created successfully"
    fi
}

# Configure managed identity
configure_managed_identity() {
    if [ "$CONFIG_USE_MANAGED_IDENTITY" != "true" ]; then
        print_info "Managed identity not requested, skipping"
        return 0
    fi
    
    print_section "Configuring Managed Identity"
    
    local swa_name="${CONFIG_STATIC_WEB_APP_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    local identity_name="${CONFIG_MANAGED_IDENTITY_NAME}"
    
    # Check if managed identity exists
    if ! resource_exists "identity" "${identity_name}" "${rg_name}"; then
        print_warning "Managed identity '${identity_name}' not found"
        print_info "Run deploy-azure-managed-identity.sh first"
        print_info "Skipping managed identity configuration"
        return 0
    fi
    
    # Get managed identity resource ID
    local identity_resource_id
    identity_resource_id=$(az identity show \
        --name "${identity_name}" \
        --resource-group "${rg_name}" \
        --query id -o tsv)
    
    print_info "Assigning managed identity to Static Web App..."
    
    az staticwebapp identity assign \
        --name "${swa_name}" \
        --resource-group "${rg_name}" \
        --identities "${identity_resource_id}"
    
    print_success "Managed identity assigned to Static Web App"
    print_info "Identity: ${identity_name}"
}

# Get deployment token
get_deployment_token() {
    print_section "Retrieving Deployment Token"
    
    local swa_name="${CONFIG_STATIC_WEB_APP_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    print_info "Getting deployment token..."
    
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
        --name "${swa_name}" \
        --resource-group "${rg_name}" \
        --query properties.apiKey -o tsv)
    
    if [ -z "$DEPLOYMENT_TOKEN" ]; then
        print_error "Failed to retrieve deployment token"
        return 1
    fi
    
    print_success "Deployment token retrieved"
}

# Get Static Web App details
get_swa_details() {
    print_section "Retrieving Static Web App Details"
    
    local swa_name="${CONFIG_STATIC_WEB_APP_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    print_info "Getting Static Web App information..."
    
    SWA_DEFAULT_HOSTNAME=$(az staticwebapp show \
        --name "${swa_name}" \
        --resource-group "${rg_name}" \
        --query defaultHostname -o tsv)
    
    SWA_RESOURCE_ID=$(az staticwebapp show \
        --name "${swa_name}" \
        --resource-group "${rg_name}" \
        --query id -o tsv)
    
    print_success "Static Web App details retrieved"
}

# Save configuration if requested
save_configuration() {
    if [ "$SAVE_CONFIG" = true ]; then
        print_section "Saving Configuration"
        
        print_info "Saving configuration to local file..."
        save_config_value "staticWebAppName" "${CONFIG_STATIC_WEB_APP_NAME}"
        save_config_value "staticWebAppSku" "${CONFIG_STATIC_WEB_APP_SKU}"
        save_config_value "resourceGroup" "${CONFIG_RESOURCE_GROUP}"
        save_config_value "location" "${CONFIG_LOCATION}"
        save_config_value "useManagedIdentity" "${CONFIG_USE_MANAGED_IDENTITY}"
        
        print_success "Configuration saved to ${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    fi
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Azure Static Web App configured successfully!"
    echo ""
    print_info "Static Web App Details:"
    echo "  - Name: ${CONFIG_STATIC_WEB_APP_NAME}"
    echo "  - Resource Group: ${CONFIG_RESOURCE_GROUP}"
    echo "  - Location: ${CONFIG_LOCATION}"
    echo "  - SKU: ${CONFIG_STATIC_WEB_APP_SKU}"
    echo "  - Default URL: https://${SWA_DEFAULT_HOSTNAME}"
    echo "  - Resource ID: ${SWA_RESOURCE_ID}"
    echo ""
    
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ]; then
        print_success "Managed Identity: Enabled"
        echo "  - Identity: ${CONFIG_MANAGED_IDENTITY_NAME}"
    else
        print_info "Managed Identity: Not enabled"
    fi
    echo ""
    
    if [ "${SWA_EXISTS}" = true ]; then
        print_info "Note: Static Web App already existed (not created)"
    fi
    
    print_warning "Deployment Token (SAVE THIS SECURELY):"
    echo "  This token is used for GitHub Actions deployment"
    echo ""
    echo "  ${DEPLOYMENT_TOKEN}"
    echo ""
    
    print_info "Next Steps:"
    echo ""
    echo "  1. Configure GitHub Actions for deployment:"
    echo "     - Add AZURE_STATIC_WEB_APPS_API_TOKEN as a repository secret"
    echo "     - Use the deployment token shown above"
    echo ""
    echo "  2. If using managed identity, configure application settings:"
    echo "     az staticwebapp appsettings set \\"
    echo "       --name ${CONFIG_STATIC_WEB_APP_NAME} \\"
    echo "       --resource-group ${CONFIG_RESOURCE_GROUP} \\"
    echo "       --setting-names UseAzureIdentity=true"
    echo ""
    echo "  3. Configure custom domain (optional):"
    echo "     az staticwebapp hostname set \\"
    echo "       --name ${CONFIG_STATIC_WEB_APP_NAME} \\"
    echo "       --resource-group ${CONFIG_RESOURCE_GROUP} \\"
    echo "       --hostname yourdomain.com"
    echo ""
    echo "  4. Deploy your application:"
    echo "     - Push to GitHub to trigger deployment"
    echo "     - Or use Azure CLI: az staticwebapp deploy"
    echo ""
    
    print_warning "Important Notes:"
    echo "  - Keep the deployment token secure (treat it like a password)"
    echo "  - Standard SKU provides:"
    echo "    • Custom domains with SSL"
    echo "    • Managed identity support"
    echo "    • Staging environments"
    echo "    • Enhanced performance"
    echo "  - Free SKU limitations:"
    echo "    • Single custom domain"
    echo "    • No managed identity"
    echo "    • Limited bandwidth"
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
    
    # Override with CLI flag if provided
    if [ -n "$ENABLE_MANAGED_IDENTITY" ]; then
        CONFIG_USE_MANAGED_IDENTITY="$ENABLE_MANAGED_IDENTITY"
    fi
    
    # Display deployment information
    print_section "Azure Static Web App Deployment"
    print_info "Static Web App: ${CONFIG_STATIC_WEB_APP_NAME}"
    print_info "Resource Group: ${CONFIG_RESOURCE_GROUP}"
    print_info "Location: ${CONFIG_LOCATION}"
    print_info "SKU: ${CONFIG_STATIC_WEB_APP_SKU}"
    print_info "Managed Identity: ${CONFIG_USE_MANAGED_IDENTITY}"
    echo ""
    
    # Run prerequisite checks
    check_prerequisites
    
    # Validate configuration
    validate_configuration
    
    # Ensure resource group exists
    ensure_resource_group
    
    # Create Static Web App
    create_static_web_app
    
    # Configure managed identity if requested
    configure_managed_identity
    
    # Get deployment token
    get_deployment_token
    
    # Get Static Web App details
    get_swa_details
    
    # Save configuration if requested
    save_configuration
    
    # Display summary
    display_summary
    
    print_section "Deployment Complete"
    print_success "Static Web App is ready for use!"
}

# Run main function
main "$@"
