#!/bin/bash

################################################################################
# Azure Key Vault Deployment Script
# 
# This script creates and configures an Azure Key Vault for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - Managed Identity should exist for RBAC assignment (optional)
#
# Usage:
#   ./deploy-azure-key-vault.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Key Vault name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#   -s, --save              Save configuration after deployment
#   -v, --verbose           Enable verbose output
#   --assign-identity       Assign RBAC to managed identity if it exists
#
# Examples:
#   ./deploy-azure-key-vault.sh
#   ./deploy-azure-key-vault.sh --name my-keyvault --location westus2
#   ./deploy-azure-key-vault.sh --assign-identity
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

ASSIGN_IDENTITY=false

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Key Vault Deployment Script

Creates and configures an Azure Key Vault for GlookoDataWebApp.

Usage: ./deploy-azure-key-vault.sh [OPTIONS]

Options:
  -h, --help              Show this help message
  -n, --name NAME         Key Vault name
  -g, --resource-group RG Resource group name
  -l, --location LOCATION Azure region
  -c, --config FILE       Custom configuration file path
  -s, --save              Save configuration after deployment
  -v, --verbose           Enable verbose output
  --assign-identity       Assign RBAC to managed identity if it exists

Features:
  - Creates Key Vault with RBAC authorization (not access policies)
  - Enables soft delete and purge protection
  - Assigns Key Vault Secrets User role to managed identity (optional)
  - Idempotent - safe to run multiple times

Examples:
  ./deploy-azure-key-vault.sh
  ./deploy-azure-key-vault.sh --name my-keyvault --location westus2
  ./deploy-azure-key-vault.sh --assign-identity

After deployment, add secrets manually:
  az keyvault secret set --vault-name <name> --name "SecretName" --value "secret-value"

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
                KEY_VAULT_NAME="$2"
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
            --assign-identity)
                ASSIGN_IDENTITY=true
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
# VALIDATION FUNCTIONS
################################################################################

# Validate Key Vault name
validate_key_vault_name() {
    local name="$1"
    
    # Key Vault names must be 3-24 characters, alphanumeric and hyphens only
    # Must start with a letter and end with a letter or number
    if [[ ! "${name}" =~ ^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$ ]] && [[ ! "${name}" =~ ^[a-zA-Z][a-zA-Z0-9]{1,2}$ ]]; then
        print_error "Key Vault name must be 3-24 characters, alphanumeric and hyphens only"
        print_info "Must start with a letter and end with a letter or number"
        print_info "Current name: ${name}"
        return 1
    fi
    return 0
}

################################################################################
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Create the Key Vault
create_key_vault() {
    print_section "Creating Azure Key Vault"
    
    # Validate Key Vault name
    if ! validate_key_vault_name "${KEY_VAULT_NAME}"; then
        exit 1
    fi
    
    # Check if Key Vault already exists
    if resource_exists "keyvault" "${KEY_VAULT_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Key Vault '${KEY_VAULT_NAME}' already exists"
        KEY_VAULT_EXISTS=true
    else
        print_info "Creating Key Vault '${KEY_VAULT_NAME}'..."
        
        az keyvault create \
            --name "${KEY_VAULT_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --enable-rbac-authorization true \
            --enable-soft-delete true \
            --retention-days 90 \
            --sku standard \
            --tags ${CONFIG_TAGS} \
            --output none
        
        print_success "Key Vault created successfully"
        KEY_VAULT_EXISTS=false
    fi
}

# Assign RBAC roles to managed identity
assign_identity_roles() {
    if [ "${ASSIGN_IDENTITY}" = false ]; then
        return 0
    fi
    
    print_section "Assigning RBAC Roles"
    
    # Check if managed identity exists
    if ! resource_exists "identity" "${MANAGED_IDENTITY_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Managed identity '${MANAGED_IDENTITY_NAME}' not found, skipping RBAC assignment"
        return 0
    fi
    
    local principal_id
    principal_id=$(get_managed_identity_principal_id)
    
    if [ -z "${principal_id}" ]; then
        print_warning "Could not get managed identity principal ID, skipping RBAC assignment"
        return 0
    fi
    
    # Get Key Vault resource ID
    local keyvault_id
    keyvault_id=$(az keyvault show \
        --name "${KEY_VAULT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    # Assign Key Vault Secrets User role
    print_info "Assigning 'Key Vault Secrets User' role to managed identity..."
    
    # Check if role already assigned
    local existing_role
    existing_role=$(az role assignment list \
        --assignee "${principal_id}" \
        --scope "${keyvault_id}" \
        --role "Key Vault Secrets User" \
        -o json 2>/dev/null)
    
    if [ -n "${existing_role}" ] && [ "${existing_role}" != "[]" ]; then
        print_info "Role 'Key Vault Secrets User' already assigned"
    else
        az role assignment create \
            --assignee-object-id "${principal_id}" \
            --assignee-principal-type ServicePrincipal \
            --role "Key Vault Secrets User" \
            --scope "${keyvault_id}" \
            --output none
        
        print_success "Role 'Key Vault Secrets User' assigned successfully"
    fi
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    # Get Key Vault details
    local keyvault_id
    keyvault_id=$(az keyvault show \
        --name "${KEY_VAULT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    local vault_uri
    vault_uri=$(az keyvault show \
        --name "${KEY_VAULT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query properties.vaultUri \
        -o tsv)
    
    print_success "Azure Key Vault deployed successfully!"
    echo ""
    echo "  Resource Group:      ${RESOURCE_GROUP}"
    echo "  Key Vault:           ${KEY_VAULT_NAME}"
    echo "  Location:            ${LOCATION}"
    echo "  Vault URI:           ${vault_uri}"
    echo "  RBAC Authorization:  Enabled"
    echo "  Soft Delete:         Enabled (90 days)"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Add secrets manually using Azure CLI or Portal:"
    echo "     az keyvault secret set --vault-name ${KEY_VAULT_NAME} --name \"SecretName\" --value \"secret-value\""
    echo ""
    echo "  2. Expected secrets for GlookoDataWebApp:"
    echo "     - PerplexityApiKey: API key for Perplexity AI"
    echo "     - GeminiApiKey: API key for Google Gemini AI"
    echo ""
    echo "  3. Grant access to Azure Function App (if using managed identity):"
    echo "     - Run deploy-azure-function.sh to auto-configure RBAC"
    echo "     - Or manually assign 'Key Vault Secrets User' role"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Key Vault Deployment"
    print_info "Key Vault: ${KEY_VAULT_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Location: ${LOCATION}"
    
    check_prerequisites
    ensure_resource_group
    create_key_vault
    assign_identity_roles
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
