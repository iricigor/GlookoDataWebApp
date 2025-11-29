#!/bin/bash

################################################################################
# Azure Function App Deployment Script
# 
# This script creates and configures an Azure Function App for the
# GlookoDataWebApp application. The function app serves as the API backend
# for the Static Web App.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - Managed identity should exist (run deploy-azure-managed-identity.sh first)
#   - Storage account should exist (run deploy-azure-storage-account.sh first)
#   - Key Vault should exist (run deploy-azure-key-vault.sh first)
#
# Usage:
#   ./deploy-azure-function.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -n, --name NAME             Function app name (default from config)
#   -g, --resource-group RG     Resource group name (default from config)
#   -l, --location LOCATION     Azure region (default from config)
#   -c, --config FILE           Custom configuration file path
#   -s, --save                  Save configuration after deployment
#   -v, --verbose               Enable verbose output
#   --use-managed-identity      Configure with managed identity (default)
#   --runtime RUNTIME           Function runtime (default: node)
#   --runtime-version VERSION   Runtime version (default: 20)
#
# Examples:
#   ./deploy-azure-function.sh
#   ./deploy-azure-function.sh --name my-func --location westus2
#   ./deploy-azure-function.sh --runtime dotnet --runtime-version 8
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

FUNCTION_RUNTIME="node"
FUNCTION_RUNTIME_VERSION="20"
OS_TYPE="Linux"
FUNCTIONS_VERSION="4"

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Function App Deployment Script

Creates and configures an Azure Function App for GlookoDataWebApp.

Usage: ./deploy-azure-function.sh [OPTIONS]

Options:
  -h, --help                  Show this help message
  -n, --name NAME             Function app name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
  --use-managed-identity      Configure with managed identity (default)
  --runtime RUNTIME           Function runtime (node, dotnet, python, java)
  --runtime-version VERSION   Runtime version

Examples:
  ./deploy-azure-function.sh
  ./deploy-azure-function.sh --name my-func --location westus2
  ./deploy-azure-function.sh --runtime node --runtime-version 20

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
                FUNCTION_APP_NAME="$2"
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
            --use-managed-identity)
                USE_MANAGED_IDENTITY="true"
                shift
                ;;
            --runtime)
                FUNCTION_RUNTIME="$2"
                shift 2
                ;;
            --runtime-version)
                FUNCTION_RUNTIME_VERSION="$2"
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
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Verify that required resources exist
verify_prerequisites() {
    print_section "Verifying Prerequisites"
    
    local has_errors=false
    
    # Check for storage account
    if resource_exists "storage" "${STORAGE_ACCOUNT_NAME}" "${RESOURCE_GROUP}"; then
        print_success "Storage account '${STORAGE_ACCOUNT_NAME}' exists"
    else
        print_error "Storage account '${STORAGE_ACCOUNT_NAME}' not found"
        print_info "Run deploy-azure-storage-account.sh first"
        has_errors=true
    fi
    
    # Check for managed identity if using managed identity
    if [ "${USE_MANAGED_IDENTITY}" = "true" ]; then
        if resource_exists "identity" "${MANAGED_IDENTITY_NAME}" "${RESOURCE_GROUP}"; then
            print_success "Managed identity '${MANAGED_IDENTITY_NAME}' exists"
        else
            print_error "Managed identity '${MANAGED_IDENTITY_NAME}' not found"
            print_info "Run deploy-azure-managed-identity.sh first"
            has_errors=true
        fi
    fi
    
    # Check for key vault (optional but recommended)
    if resource_exists "keyvault" "${KEY_VAULT_NAME}" "${RESOURCE_GROUP}"; then
        print_success "Key Vault '${KEY_VAULT_NAME}' exists"
        KEY_VAULT_EXISTS=true
    else
        print_warning "Key Vault '${KEY_VAULT_NAME}' not found (optional)"
        KEY_VAULT_EXISTS=false
    fi
    
    if [ "${has_errors}" = true ]; then
        print_error "Prerequisites check failed"
        exit 1
    fi
}

# Create the function app
create_function_app() {
    print_section "Creating Azure Function App"
    
    # Check if function app already exists
    if resource_exists "functionapp" "${FUNCTION_APP_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Function app '${FUNCTION_APP_NAME}' already exists"
        FUNCTION_APP_EXISTS=true
    else
        print_info "Creating function app '${FUNCTION_APP_NAME}'..."
        
        # Get storage account connection string for function app storage
        local storage_connection_string
        storage_connection_string=$(az storage account show-connection-string \
            --name "${STORAGE_ACCOUNT_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --query connectionString \
            -o tsv)
        
        # Create the function app
        az functionapp create \
            --name "${FUNCTION_APP_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --storage-account "${STORAGE_ACCOUNT_NAME}" \
            --consumption-plan-location "${LOCATION}" \
            --runtime "${FUNCTION_RUNTIME}" \
            --runtime-version "${FUNCTION_RUNTIME_VERSION}" \
            --functions-version "${FUNCTIONS_VERSION}" \
            --os-type "${OS_TYPE}" \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Function app created successfully"
        FUNCTION_APP_EXISTS=false
    fi
}

# Assign managed identity to function app
assign_managed_identity() {
    if [ "${USE_MANAGED_IDENTITY}" != "true" ]; then
        print_info "Skipping managed identity assignment (not enabled)"
        return
    fi
    
    print_section "Configuring Managed Identity"
    
    # Get managed identity resource ID
    local identity_resource_id
    identity_resource_id=$(get_managed_identity_resource_id)
    
    if [ -z "${identity_resource_id}" ]; then
        print_error "Could not get managed identity resource ID"
        exit 1
    fi
    
    print_info "Assigning managed identity to function app..."
    
    az functionapp identity assign \
        --name "${FUNCTION_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --identities "${identity_resource_id}" \
        --output none
    
    print_success "Managed identity assigned to function app"
}

# Configure RBAC roles for managed identity
configure_rbac_roles() {
    if [ "${USE_MANAGED_IDENTITY}" != "true" ]; then
        print_info "Skipping RBAC configuration (managed identity not enabled)"
        return
    fi
    
    print_section "Configuring RBAC Roles"
    
    # Get the principal ID of the managed identity
    local principal_id
    principal_id=$(get_managed_identity_principal_id)
    
    if [ -z "${principal_id}" ]; then
        print_error "Could not get managed identity principal ID"
        exit 1
    fi
    
    # Get storage account resource ID
    local storage_id
    storage_id=$(az storage account show \
        --name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    # Assign Storage Table Data Contributor role
    # Note: stderr is suppressed for idempotent behavior - Azure CLI outputs an error when role already exists
    # We handle both success (new assignment) and "already exists" as acceptable outcomes
    print_info "Assigning 'Storage Table Data Contributor' role..."
    local role_output
    if role_output=$(az role assignment create \
        --assignee "${principal_id}" \
        --role "Storage Table Data Contributor" \
        --scope "${storage_id}" \
        --output json 2>&1); then
        print_success "Storage Table Data Contributor role assigned"
    elif echo "${role_output}" | grep -q "already exists"; then
        print_warning "Storage Table Data Contributor role already assigned"
    else
        print_warning "Role assignment failed: check permissions"
    fi
    
    # Assign Storage Blob Data Contributor role
    print_info "Assigning 'Storage Blob Data Contributor' role..."
    if role_output=$(az role assignment create \
        --assignee "${principal_id}" \
        --role "Storage Blob Data Contributor" \
        --scope "${storage_id}" \
        --output json 2>&1); then
        print_success "Storage Blob Data Contributor role assigned"
    elif echo "${role_output}" | grep -q "already exists"; then
        print_warning "Storage Blob Data Contributor role already assigned"
    else
        print_warning "Role assignment failed: check permissions"
    fi
    
    # Assign Key Vault access if Key Vault exists
    if [ "${KEY_VAULT_EXISTS}" = true ]; then
        local keyvault_id
        keyvault_id=$(az keyvault show \
            --name "${KEY_VAULT_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --query id \
            -o tsv)
        
        print_info "Assigning 'Key Vault Secrets User' role..."
        if role_output=$(az role assignment create \
            --assignee "${principal_id}" \
            --role "Key Vault Secrets User" \
            --scope "${keyvault_id}" \
            --output json 2>&1); then
            print_success "Key Vault Secrets User role assigned"
        elif echo "${role_output}" | grep -q "already exists"; then
            print_warning "Key Vault Secrets User role already assigned"
        else
            print_warning "Role assignment failed: check permissions"
        fi
    fi
}

# Configure function app settings
configure_app_settings() {
    print_section "Configuring Application Settings"
    
    # Use an array to safely handle settings
    local -a settings_array=()
    
    if [ "${USE_MANAGED_IDENTITY}" = "true" ]; then
        local identity_client_id
        identity_client_id=$(get_managed_identity_id)
        
        if [ -n "${identity_client_id}" ]; then
            settings_array+=("AZURE_CLIENT_ID=${identity_client_id}")
        fi
        settings_array+=("STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT_NAME}")
        
        if [ "${KEY_VAULT_EXISTS}" = true ]; then
            settings_array+=("KEY_VAULT_NAME=${KEY_VAULT_NAME}")
        fi
    fi
    
    # Add App Registration Client ID for JWT audience validation
    # This is the application (client) ID from Azure App Registration
    local app_client_id
    app_client_id=$(get_app_registration_client_id)
    if [ -n "${app_client_id}" ]; then
        settings_array+=("AZURE_AD_CLIENT_ID=${app_client_id}")
        print_info "App Registration Client ID: ${app_client_id}"
    else
        print_warning "Could not retrieve App Registration Client ID. JWT validation will use hardcoded fallback."
    fi
    
    # Add CORS settings for Static Web App
    settings_array+=("CORS_ALLOWED_ORIGINS=${WEB_APP_URL}")
    
    if [ ${#settings_array[@]} -gt 0 ]; then
        print_info "Setting application configuration..."
        az functionapp config appsettings set \
            --name "${FUNCTION_APP_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --settings "${settings_array[@]}" \
            --output none
        
        print_success "Application settings configured"
    fi
}

# Configure CORS for the function app
configure_cors() {
    print_section "Configuring CORS"
    
    print_info "Setting CORS allowed origins..."
    
    az functionapp cors add \
        --name "${FUNCTION_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --allowed-origins "${WEB_APP_URL}" \
        --output none 2>/dev/null || true
    
    print_success "CORS configured for ${WEB_APP_URL}"
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    # Get function app details
    local function_url
    function_url=$(az functionapp show \
        --name "${FUNCTION_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query defaultHostName \
        -o tsv)
    
    print_success "Azure Function App deployed successfully!"
    echo ""
    echo "  Resource Group:     ${RESOURCE_GROUP}"
    echo "  Function App Name:  ${FUNCTION_APP_NAME}"
    echo "  Location:           ${LOCATION}"
    echo "  Runtime:            ${FUNCTION_RUNTIME} ${FUNCTION_RUNTIME_VERSION}"
    echo "  Function URL:       https://${function_url}"
    echo ""
    
    if [ "${USE_MANAGED_IDENTITY}" = "true" ]; then
        echo "  Managed Identity:   ${MANAGED_IDENTITY_NAME}"
        echo "  RBAC Roles:         Storage Table Data Contributor"
        echo "                      Storage Blob Data Contributor"
        if [ "${KEY_VAULT_EXISTS}" = true ]; then
            echo "                      Key Vault Secrets User"
        fi
        echo ""
    fi
    
    echo "Next Steps:"
    echo "  1. Deploy your function code using Azure Functions Core Tools or CI/CD"
    echo "  2. Configure any additional application settings as needed"
    echo "  3. Test the function endpoints"
    echo ""
    
    if [ "${KEY_VAULT_EXISTS}" = false ]; then
        print_warning "Key Vault not configured. Run deploy-azure-key-vault.sh to add secret management."
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Function App Deployment"
    print_info "Function App: ${FUNCTION_APP_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    
    check_prerequisites
    ensure_resource_group
    verify_prerequisites
    create_function_app
    assign_managed_identity
    configure_rbac_roles
    configure_app_settings
    configure_cors
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
