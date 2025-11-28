#!/bin/bash

################################################################################
# Azure Deployment Verification Script
# 
# This script verifies the current deployment state of Azure resources for the
# GlookoDataWebApp application. For each resource, it reports one of three states:
#   - not existing
#   - existing, misconfigured
#   - existing, configured properly
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to read resources
#
# Usage:
#   ./test-azure-resources.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -g, --resource-group RG Resource group name (default from config)
#   -c, --config FILE       Custom configuration file path
#   -v, --verbose           Enable verbose output
#   --json                  Output results in JSON format
#
# Examples:
#   ./test-azure-resources.sh
#   ./test-azure-resources.sh --resource-group my-rg
#   ./test-azure-resources.sh --json
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

OUTPUT_JSON=false
VERBOSE=false

# Status codes
STATUS_NOT_EXISTING="not existing"
STATUS_MISCONFIGURED="existing, misconfigured"
STATUS_CONFIGURED="existing, configured properly"

# Track overall status
TOTAL_RESOURCES=0
EXISTING_RESOURCES=0
CONFIGURED_RESOURCES=0
MISCONFIGURED_RESOURCES=0
MISSING_RESOURCES=0

# Collect results for JSON output
declare -A RESULTS

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Deployment Verification Script

Verifies the current deployment state of Azure resources for GlookoDataWebApp.

Usage: ./test-azure-resources.sh [OPTIONS]

Options:
  -h, --help              Show this help message
  -g, --resource-group RG Resource group name
  -c, --config FILE       Custom configuration file path
  -v, --verbose           Enable verbose output
  --json                  Output results in JSON format

Resource Status Codes:
  - not existing           Resource does not exist
  - existing, misconfigured  Resource exists but has incorrect configuration
  - existing, configured properly  Resource exists with correct configuration

Examples:
  ./test-azure-resources.sh
  ./test-azure-resources.sh --resource-group my-rg
  ./test-azure-resources.sh --json

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -c|--config)
                # shellcheck disable=SC2034
                CONFIG_FILE="$2"  # Used by config-lib.sh
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --json)
                OUTPUT_JSON=true
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
# HELPER FUNCTIONS
################################################################################

# Record a result for a resource
record_result() {
    local resource_name="$1"
    local resource_type="$2"
    local status="$3"
    local details="${4:-}"
    
    TOTAL_RESOURCES=$((TOTAL_RESOURCES + 1))
    
    case "${status}" in
        "${STATUS_NOT_EXISTING}")
            MISSING_RESOURCES=$((MISSING_RESOURCES + 1))
            ;;
        "${STATUS_MISCONFIGURED}")
            EXISTING_RESOURCES=$((EXISTING_RESOURCES + 1))
            MISCONFIGURED_RESOURCES=$((MISCONFIGURED_RESOURCES + 1))
            ;;
        "${STATUS_CONFIGURED}")
            EXISTING_RESOURCES=$((EXISTING_RESOURCES + 1))
            CONFIGURED_RESOURCES=$((CONFIGURED_RESOURCES + 1))
            ;;
    esac
    
    # Store for JSON output
    RESULTS["${resource_type}"]="${status}"
    
    if [ "${OUTPUT_JSON}" = false ]; then
        case "${status}" in
            "${STATUS_NOT_EXISTING}")
                print_error "${resource_name}: ${status}"
                ;;
            "${STATUS_MISCONFIGURED}")
                print_warning "${resource_name}: ${status}"
                if [ -n "${details}" ] && [ "${VERBOSE}" = true ]; then
                    echo "    Details: ${details}"
                fi
                ;;
            "${STATUS_CONFIGURED}")
                print_success "${resource_name}: ${status}"
                ;;
        esac
    fi
}

################################################################################
# VERIFICATION FUNCTIONS
################################################################################

# Verify resource group
verify_resource_group() {
    local name="${RESOURCE_GROUP}"
    
    if ! resource_exists "group" "${name}"; then
        record_result "Resource Group '${name}'" "resourceGroup" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    # Check tags
    local tags
    tags=$(az group show --name "${name}" --query "tags" -o json 2>/dev/null)
    
    if [ -z "${tags}" ] || [ "${tags}" = "null" ]; then
        record_result "Resource Group '${name}'" "resourceGroup" "${STATUS_MISCONFIGURED}" "Missing tags"
    else
        record_result "Resource Group '${name}'" "resourceGroup" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify storage account
verify_storage_account() {
    local name="${STORAGE_ACCOUNT_NAME}"
    local rg="${RESOURCE_GROUP}"
    
    if ! resource_exists "storage" "${name}" "${rg}"; then
        record_result "Storage Account '${name}'" "storageAccount" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    local issues=()
    
    # Check TLS version
    local min_tls
    min_tls=$(az storage account show --name "${name}" --resource-group "${rg}" --query "minimumTlsVersion" -o tsv 2>/dev/null)
    if [ "${min_tls}" != "TLS1_2" ]; then
        issues+=("TLS version is ${min_tls}, expected TLS1_2")
    fi
    
    # Check public blob access
    local public_access
    public_access=$(az storage account show --name "${name}" --resource-group "${rg}" --query "allowBlobPublicAccess" -o tsv 2>/dev/null)
    if [ "${public_access}" = "true" ]; then
        issues+=("Public blob access is enabled")
    fi
    
    # Check HTTPS only
    local https_only
    https_only=$(az storage account show --name "${name}" --resource-group "${rg}" --query "enableHttpsTrafficOnly" -o tsv 2>/dev/null)
    if [ "${https_only}" != "true" ]; then
        issues+=("HTTPS-only traffic not enforced")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        record_result "Storage Account '${name}'" "storageAccount" "${STATUS_MISCONFIGURED}" "${issues[*]}"
    else
        record_result "Storage Account '${name}'" "storageAccount" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify managed identity
verify_managed_identity() {
    local name="${MANAGED_IDENTITY_NAME}"
    local rg="${RESOURCE_GROUP}"
    
    if ! resource_exists "identity" "${name}" "${rg}"; then
        record_result "Managed Identity '${name}'" "managedIdentity" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    # Check that client ID and principal ID exist
    local client_id
    local principal_id
    client_id=$(get_managed_identity_id)
    principal_id=$(get_managed_identity_principal_id)
    
    if [ -z "${client_id}" ] || [ -z "${principal_id}" ]; then
        record_result "Managed Identity '${name}'" "managedIdentity" "${STATUS_MISCONFIGURED}" "Missing client ID or principal ID"
    else
        record_result "Managed Identity '${name}'" "managedIdentity" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify function app
verify_function_app() {
    local name="${FUNCTION_APP_NAME}"
    local rg="${RESOURCE_GROUP}"
    
    if ! resource_exists "functionapp" "${name}" "${rg}"; then
        record_result "Function App '${name}'" "functionApp" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    local issues=()
    
    # Check if managed identity is assigned (if useManagedIdentity is true)
    if [ "${USE_MANAGED_IDENTITY}" = "true" ]; then
        local assigned_identities
        assigned_identities=$(az functionapp show --name "${name}" --resource-group "${rg}" --query "identity.userAssignedIdentities" -o json 2>/dev/null)
        
        if [ -z "${assigned_identities}" ] || [ "${assigned_identities}" = "null" ]; then
            issues+=("No managed identity assigned")
        elif ! echo "${assigned_identities}" | grep -q "${MANAGED_IDENTITY_NAME}"; then
            issues+=("Expected managed identity not assigned")
        fi
    fi
    
    # Check CORS configuration
    local cors_origins
    cors_origins=$(az functionapp cors show --name "${name}" --resource-group "${rg}" --query "allowedOrigins" -o json 2>/dev/null)
    
    if [ -z "${cors_origins}" ] || [ "${cors_origins}" = "null" ] || [ "${cors_origins}" = "[]" ]; then
        issues+=("No CORS origins configured")
    elif ! echo "${cors_origins}" | grep -q "${WEB_APP_URL}"; then
        issues+=("Web app URL not in CORS origins")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        record_result "Function App '${name}'" "functionApp" "${STATUS_MISCONFIGURED}" "${issues[*]}"
    else
        record_result "Function App '${name}'" "functionApp" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify key vault
verify_key_vault() {
    local name="${KEY_VAULT_NAME}"
    local rg="${RESOURCE_GROUP}"
    
    if ! resource_exists "keyvault" "${name}" "${rg}"; then
        record_result "Key Vault '${name}'" "keyVault" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    local issues=()
    
    # Check if RBAC is enabled
    local rbac_enabled
    rbac_enabled=$(az keyvault show --name "${name}" --resource-group "${rg}" --query "properties.enableRbacAuthorization" -o tsv 2>/dev/null)
    
    if [ "${rbac_enabled}" != "true" ]; then
        issues+=("RBAC authorization not enabled")
    fi
    
    # Check soft delete
    local soft_delete
    soft_delete=$(az keyvault show --name "${name}" --resource-group "${rg}" --query "properties.enableSoftDelete" -o tsv 2>/dev/null)
    
    if [ "${soft_delete}" != "true" ]; then
        issues+=("Soft delete not enabled")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        record_result "Key Vault '${name}'" "keyVault" "${STATUS_MISCONFIGURED}" "${issues[*]}"
    else
        record_result "Key Vault '${name}'" "keyVault" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify static web app
verify_static_web_app() {
    local name="${STATIC_WEB_APP_NAME}"
    local rg="${RESOURCE_GROUP}"
    
    if ! resource_exists "staticwebapp" "${name}" "${rg}"; then
        record_result "Static Web App '${name}'" "staticWebApp" "${STATUS_NOT_EXISTING}"
        return 1
    fi
    
    local issues=()
    
    # Check SKU
    local sku
    sku=$(az staticwebapp show --name "${name}" --resource-group "${rg}" --query "sku.name" -o tsv 2>/dev/null)
    
    if [ "${sku}" != "${STATIC_WEB_APP_SKU}" ]; then
        issues+=("SKU is ${sku}, expected ${STATIC_WEB_APP_SKU}")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        record_result "Static Web App '${name}'" "staticWebApp" "${STATUS_MISCONFIGURED}" "${issues[*]}"
    else
        record_result "Static Web App '${name}'" "staticWebApp" "${STATUS_CONFIGURED}"
    fi
    
    return 0
}

# Verify RBAC role assignments (only if managed identity exists)
verify_rbac_roles() {
    if ! resource_exists "identity" "${MANAGED_IDENTITY_NAME}" "${RESOURCE_GROUP}"; then
        return 0
    fi
    
    local principal_id
    principal_id=$(get_managed_identity_principal_id)
    
    if [ -z "${principal_id}" ]; then
        return 0
    fi
    
    local issues=()
    
    # Check storage account role assignments
    if resource_exists "storage" "${STORAGE_ACCOUNT_NAME}" "${RESOURCE_GROUP}"; then
        local storage_id
        storage_id=$(az storage account show --name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP}" --query id -o tsv 2>/dev/null)
        
        # Check for Storage Table Data Contributor
        local table_role
        table_role=$(az role assignment list --assignee "${principal_id}" --scope "${storage_id}" --role "Storage Table Data Contributor" -o json 2>/dev/null)
        
        if [ -z "${table_role}" ] || [ "${table_role}" = "[]" ]; then
            issues+=("Missing Storage Table Data Contributor role")
        fi
        
        # Check for Storage Blob Data Contributor
        local blob_role
        blob_role=$(az role assignment list --assignee "${principal_id}" --scope "${storage_id}" --role "Storage Blob Data Contributor" -o json 2>/dev/null)
        
        if [ -z "${blob_role}" ] || [ "${blob_role}" = "[]" ]; then
            issues+=("Missing Storage Blob Data Contributor role")
        fi
    fi
    
    # Check key vault role assignments
    if resource_exists "keyvault" "${KEY_VAULT_NAME}" "${RESOURCE_GROUP}"; then
        local keyvault_id
        keyvault_id=$(az keyvault show --name "${KEY_VAULT_NAME}" --resource-group "${RESOURCE_GROUP}" --query id -o tsv 2>/dev/null)
        
        # Check for Key Vault Secrets User
        local kv_role
        kv_role=$(az role assignment list --assignee "${principal_id}" --scope "${keyvault_id}" --role "Key Vault Secrets User" -o json 2>/dev/null)
        
        if [ -z "${kv_role}" ] || [ "${kv_role}" = "[]" ]; then
            issues+=("Missing Key Vault Secrets User role")
        fi
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        record_result "RBAC Role Assignments" "rbacRoles" "${STATUS_MISCONFIGURED}" "${issues[*]}"
    else
        record_result "RBAC Role Assignments" "rbacRoles" "${STATUS_CONFIGURED}"
    fi
}

################################################################################
# OUTPUT FUNCTIONS
################################################################################

# Output JSON results
output_json() {
    echo "{"
    echo "  \"summary\": {"
    echo "    \"total\": ${TOTAL_RESOURCES},"
    echo "    \"existing\": ${EXISTING_RESOURCES},"
    echo "    \"configured\": ${CONFIGURED_RESOURCES},"
    echo "    \"misconfigured\": ${MISCONFIGURED_RESOURCES},"
    echo "    \"missing\": ${MISSING_RESOURCES}"
    echo "  },"
    echo "  \"resources\": {"
    
    local first=true
    for key in "${!RESULTS[@]}"; do
        if [ "${first}" = true ]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"${key}\": \"${RESULTS[$key]}\""
    done
    echo ""
    
    echo "  },"
    echo "  \"configuration\": {"
    echo "    \"resourceGroup\": \"${RESOURCE_GROUP}\","
    echo "    \"location\": \"${LOCATION}\","
    echo "    \"storageAccountName\": \"${STORAGE_ACCOUNT_NAME}\","
    echo "    \"managedIdentityName\": \"${MANAGED_IDENTITY_NAME}\","
    echo "    \"functionAppName\": \"${FUNCTION_APP_NAME}\","
    echo "    \"keyVaultName\": \"${KEY_VAULT_NAME}\","
    echo "    \"staticWebAppName\": \"${STATIC_WEB_APP_NAME}\""
    echo "  }"
    echo "}"
}

# Display summary
display_summary() {
    print_section "Verification Summary"
    
    echo "  Total Resources Checked:    ${TOTAL_RESOURCES}"
    echo "  Existing Resources:         ${EXISTING_RESOURCES}"
    echo "  Properly Configured:        ${CONFIGURED_RESOURCES}"
    echo "  Misconfigured:              ${MISCONFIGURED_RESOURCES}"
    echo "  Missing:                    ${MISSING_RESOURCES}"
    echo ""
    
    if [ ${MISSING_RESOURCES} -eq 0 ] && [ ${MISCONFIGURED_RESOURCES} -eq 0 ]; then
        print_success "All resources are properly configured!"
    elif [ ${MISSING_RESOURCES} -gt 0 ]; then
        print_warning "Some resources are missing. Run deployment scripts to create them."
    elif [ ${MISCONFIGURED_RESOURCES} -gt 0 ]; then
        print_warning "Some resources are misconfigured. Run deployment scripts with --verbose for details."
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    if [ "${OUTPUT_JSON}" = false ]; then
        print_section "Azure Deployment Verification"
        print_info "Resource Group: ${RESOURCE_GROUP}"
        print_info "Location: ${LOCATION}"
    fi
    
    # Check prerequisites
    if ! check_azure_cli; then
        exit 1
    fi
    
    if ! check_azure_login; then
        exit 1
    fi
    
    if [ "${OUTPUT_JSON}" = false ]; then
        print_section "Verifying Resources"
    fi
    
    # Verify each resource type
    verify_resource_group
    verify_storage_account
    verify_managed_identity
    verify_function_app
    verify_key_vault
    verify_static_web_app
    verify_rbac_roles
    
    # Output results
    if [ "${OUTPUT_JSON}" = true ]; then
        output_json
    else
        display_summary
    fi
    
    # Exit with appropriate code
    if [ ${MISSING_RESOURCES} -gt 0 ] || [ ${MISCONFIGURED_RESOURCES} -gt 0 ]; then
        exit 1
    fi
    
    exit 0
}

main "$@"
