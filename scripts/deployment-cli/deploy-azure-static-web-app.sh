#!/bin/bash

################################################################################
# Azure Static Web App Deployment Script
# 
# This script creates and configures an Azure Static Web App for the
# GlookoDataWebApp application. It automatically configures Google authentication
# if the required secrets exist in the Key Vault.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - Key Vault with Google auth secrets (optional, for Google authentication):
#     * google-client-id
#     * google-client-secret
#
# Usage:
#   ./deploy-azure-static-web-app.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -n, --name NAME             Static Web App name (default from config)
#   -g, --resource-group RG     Resource group name (default from config)
#   -l, --location LOCATION     Azure region (default from config)
#   -k, --sku SKU               SKU tier (Free or Standard, default: Standard)
#   -i, --identity NAME         User-assigned managed identity name (optional)
#   -c, --config FILE           Custom configuration file path
#   -s, --save                  Save configuration after deployment
#   -v, --verbose               Enable verbose output
#
# Examples:
#   ./deploy-azure-static-web-app.sh
#   ./deploy-azure-static-web-app.sh --name my-swa --location westus2
#   ./deploy-azure-static-web-app.sh --sku Free --save
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
Azure Static Web App Deployment Script

Creates and configures an Azure Static Web App for GlookoDataWebApp.
Automatically configures Google authentication if secrets are available in Key Vault.

Usage: ./deploy-azure-static-web-app.sh [OPTIONS]

Options:
  -h, --help                  Show this help message
  -n, --name NAME             Static Web App name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region
  -k, --sku SKU               SKU tier (Free or Standard)
  -i, --identity NAME         User-assigned managed identity name
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output

Examples:
  ./deploy-azure-static-web-app.sh
  ./deploy-azure-static-web-app.sh --name my-swa --location westus2
  ./deploy-azure-static-web-app.sh --sku Free --save

EOF
}

parse_arguments() {
    SAVE_CONFIG=false
    VERBOSE=false
    ASSIGN_IDENTITY=false
    
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
            -k|--sku)
                STATIC_WEB_APP_SKU="$2"
                shift 2
                ;;
            -i|--identity)
                MANAGED_IDENTITY_NAME="$2"
                ASSIGN_IDENTITY=true
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

# Ensure resource group exists
ensure_resource_group() {
    print_section "Ensuring Resource Group Exists"
    
    if resource_exists "group" "${RESOURCE_GROUP}" "${RESOURCE_GROUP}"; then
        print_success "Resource group '${RESOURCE_GROUP}' already exists"
    else
        print_info "Creating resource group '${RESOURCE_GROUP}'..."
        az group create \
            --name "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --tags ${CONFIG_TAGS} \
            --output none
        print_success "Resource group created"
    fi
}

# Deploy Static Web App
deploy_static_web_app() {
    print_section "Creating Azure Static Web App"
    
    local swa_created=false
    
    if resource_exists "staticwebapp" "${STATIC_WEB_APP_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Static Web App '${STATIC_WEB_APP_NAME}' already exists"
    else
        print_info "Creating Static Web App '${STATIC_WEB_APP_NAME}'..."
        
        az staticwebapp create \
            --name "${STATIC_WEB_APP_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --sku "${STATIC_WEB_APP_SKU}" \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Static Web App created successfully"
        swa_created=true
    fi
    
    SWA_CREATED="${swa_created}"
}

# Assign managed identity to Static Web App
assign_managed_identity() {
    if [ "${ASSIGN_IDENTITY}" = false ]; then
        return 0
    fi
    
    print_section "Configuring User-Assigned Managed Identity"
    
    # Check if identity exists
    if ! resource_exists "identity" "${MANAGED_IDENTITY_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Managed identity '${MANAGED_IDENTITY_NAME}' not found. Skipping identity assignment."
        return 0
    fi
    
    print_success "Managed identity '${MANAGED_IDENTITY_NAME}' exists"
    
    # Get identity resource ID
    local identity_id
    identity_id=$(az identity show \
        --name "${MANAGED_IDENTITY_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    print_info "Assigning user-assigned managed identity to Static Web App..."
    
    az staticwebapp identity assign \
        --name "${STATIC_WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --identities "${identity_id}" \
        --output none
    
    print_success "User-assigned managed identity assigned"
}

# Configure Google Authentication
configure_google_auth() {
    print_section "Configuring Google Authentication"
    
    GOOGLE_AUTH_CONFIGURED=false
    
    # Check if Key Vault exists
    if ! resource_exists "keyvault" "${KEY_VAULT_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Key Vault '${KEY_VAULT_NAME}' not found. Skipping Google authentication configuration."
        print_info "Run deploy-azure-key-vault.sh to create the Key Vault first"
        return 0
    fi
    
    print_info "Retrieving Google auth secrets from Key Vault '${KEY_VAULT_NAME}'..."
    
    # Retrieve Google Client ID and Secret from Key Vault
    local google_client_id
    local google_client_secret
    
    google_client_id=$(az keyvault secret show \
        --vault-name "${KEY_VAULT_NAME}" \
        --name "google-client-id" \
        --query value \
        -o tsv 2>/dev/null || echo "")
    
    google_client_secret=$(az keyvault secret show \
        --vault-name "${KEY_VAULT_NAME}" \
        --name "google-client-secret" \
        --query value \
        -o tsv 2>/dev/null || echo "")
    
    if [ -z "${google_client_id}" ] || [ -z "${google_client_secret}" ]; then
        print_warning "Google auth secrets not found in Key Vault"
        print_info "Expected secrets: 'google-client-id' and 'google-client-secret'"
        print_info "Add them to Key Vault '${KEY_VAULT_NAME}' to enable Google authentication"
        return 0
    fi
    
    print_info "Configuring Google authentication for Static Web App..."
    
    # Configure SWA application settings for Google authentication
    az staticwebapp appsettings set \
        --name "${STATIC_WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --setting-names \
            "AUTH_GOOGLE_CLIENT_ID=${google_client_id}" \
            "AUTH_GOOGLE_CLIENT_SECRET=${google_client_secret}" \
        --output none
    
    print_success "Google authentication configured successfully"
    GOOGLE_AUTH_CONFIGURED=true
}

# Get Static Web App URL
get_swa_url() {
    local hostname
    hostname=$(az staticwebapp show \
        --name "${STATIC_WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query defaultHostname \
        -o tsv)
    
    echo "https://${hostname}"
}

################################################################################
# OUTPUT FUNCTIONS
################################################################################

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    local swa_url
    swa_url=$(get_swa_url)
    
    print_success "Azure Static Web App deployed successfully!"
    echo ""
    echo "  Resource Group:        ${RESOURCE_GROUP}"
    echo "  Static Web App Name:   ${STATIC_WEB_APP_NAME}"
    echo "  Location:              ${LOCATION}"
    echo "  SKU:                   ${STATIC_WEB_APP_SKU}"
    echo "  Default URL:           ${swa_url}"
    echo ""
    
    if [ "${ASSIGN_IDENTITY}" = true ]; then
        echo "  Managed Identity:      ${MANAGED_IDENTITY_NAME}"
        echo ""
    fi
    
    if [ "${GOOGLE_AUTH_CONFIGURED}" = true ]; then
        echo "  Google Authentication: Enabled"
        echo "  Login URL:             ${swa_url}/.auth/login/google"
        echo ""
    fi
    
    echo "Next Steps:"
    echo "  1. Deploy your web app code using GitHub Actions or Azure CLI"
    echo "  2. Link a backend using deploy-azure-swa-backend.sh if needed"
    echo "  3. Configure custom domain if needed"
    
    if [ "${GOOGLE_AUTH_CONFIGURED}" = true ]; then
        echo "  4. Test Google authentication by visiting ${swa_url}/.auth/login/google"
    else
        echo "  4. Add Google auth secrets to Key Vault to enable Google authentication:"
        echo "     - google-client-id"
        echo "     - google-client-secret"
    fi
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Static Web App Deployment"
    print_info "Static Web App: ${STATIC_WEB_APP_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    print_info "SKU: ${STATIC_WEB_APP_SKU}"
    
    check_prerequisites
    ensure_resource_group
    deploy_static_web_app
    assign_managed_identity
    configure_google_auth
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
