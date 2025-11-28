#!/bin/bash

################################################################################
# Azure Storage Tables Deployment Script
# 
# This script creates and configures Azure Storage Tables for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - Storage Account must already exist (run deploy-azure-storage-account.sh first)
#
# Usage:
#   ./deploy-azure-storage-tables.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -a, --storage-account NAME  Storage account name (default from config)
#   -g, --resource-group RG     Resource group name (default from config)
#   -c, --config FILE           Custom configuration file path
#   -s, --save                  Save configuration after deployment
#   -v, --verbose               Enable verbose output
#   --table NAME                Create specific table (can be repeated)
#   --assign-identity           Assign RBAC to managed identity if uniquely exists
#
# Examples:
#   ./deploy-azure-storage-tables.sh
#   ./deploy-azure-storage-tables.sh --storage-account mystorageacct
#   ./deploy-azure-storage-tables.sh --table UserSettings --table ProUsers
#   ./deploy-azure-storage-tables.sh --assign-identity
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

# Default tables to create
DEFAULT_TABLES=("UserSettings" "ProUsers")
TABLES_TO_CREATE=()
ASSIGN_IDENTITY=false

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Storage Tables Deployment Script

Creates and configures Azure Storage Tables for GlookoDataWebApp.

Usage: ./deploy-azure-storage-tables.sh [OPTIONS]

Options:
  -h, --help                  Show this help message
  -a, --storage-account NAME  Storage account name
  -g, --resource-group RG     Resource group name
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output
  --table NAME                Create specific table (can be repeated)
  --assign-identity           Assign RBAC to managed identity if uniquely exists

Tables Created (default):
  - UserSettings: Stores user preferences and settings
  - ProUsers: Stores professional user information

Examples:
  ./deploy-azure-storage-tables.sh
  ./deploy-azure-storage-tables.sh --storage-account mystorageacct
  ./deploy-azure-storage-tables.sh --table UserSettings --table ProUsers
  ./deploy-azure-storage-tables.sh --assign-identity

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
            -a|--storage-account)
                STORAGE_ACCOUNT_NAME="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
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
            --table)
                TABLES_TO_CREATE+=("$2")
                shift 2
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
    
    # If no specific tables requested, use defaults
    if [ ${#TABLES_TO_CREATE[@]} -eq 0 ]; then
        TABLES_TO_CREATE=("${DEFAULT_TABLES[@]}")
    fi
}

################################################################################
# VALIDATION FUNCTIONS
################################################################################

# Validate table name (must be alphanumeric, 3-63 characters, start with letter)
validate_table_name() {
    local name="$1"
    
    if [[ ! "${name}" =~ ^[A-Za-z][A-Za-z0-9]{2,62}$ ]]; then
        print_error "Table name must be 3-63 alphanumeric characters, starting with a letter"
        print_info "Invalid name: ${name}"
        return 1
    fi
    return 0
}

################################################################################
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Check if storage account exists
check_storage_account() {
    print_section "Checking Storage Account"
    
    if ! resource_exists "storage" "${STORAGE_ACCOUNT_NAME}" "${RESOURCE_GROUP}"; then
        print_error "Storage account '${STORAGE_ACCOUNT_NAME}' does not exist in resource group '${RESOURCE_GROUP}'"
        print_info "Please run deploy-azure-storage-account.sh first"
        exit 1
    fi
    
    print_success "Storage account '${STORAGE_ACCOUNT_NAME}' exists"
}

# Create a storage table
create_table() {
    local table_name="$1"
    
    # Validate table name
    if ! validate_table_name "${table_name}"; then
        return 1
    fi
    
    print_info "Creating table '${table_name}'..."
    
    # Check if table already exists
    local existing_table
    existing_table=$(az storage table list \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --query "[?name=='${table_name}'].name" \
        -o tsv 2>/dev/null || echo "")
    
    if [ -n "${existing_table}" ]; then
        print_warning "Table '${table_name}' already exists"
    else
        az storage table create \
            --name "${table_name}" \
            --account-name "${STORAGE_ACCOUNT_NAME}" \
            --auth-mode login \
            --output none
        
        print_success "Table '${table_name}' created successfully"
    fi
}

# Create all tables
create_tables() {
    print_section "Creating Azure Storage Tables"
    
    for table_name in "${TABLES_TO_CREATE[@]}"; do
        create_table "${table_name}"
    done
}

# Find unique managed identity in resource group
find_unique_managed_identity() {
    local identities
    identities=$(az identity list \
        --resource-group "${RESOURCE_GROUP}" \
        --query "[].name" \
        -o tsv 2>/dev/null)
    
    local count
    count=$(echo "${identities}" | grep -c . 2>/dev/null || echo "0")
    
    if [ "${count}" -eq 1 ]; then
        echo "${identities}"
    else
        echo ""
    fi
}

# Assign RBAC role to managed identity for table access
assign_identity_rbac() {
    print_section "Configuring Managed Identity Access"
    
    # Find unique managed identity in resource group
    local identity_name
    identity_name=$(find_unique_managed_identity)
    
    if [ -z "${identity_name}" ]; then
        print_warning "No unique managed identity found in resource group '${RESOURCE_GROUP}'"
        print_info "Skipping RBAC assignment. You can manually assign the 'Storage Table Data Contributor' role."
        return
    fi
    
    print_info "Found managed identity: ${identity_name}"
    
    # Get the principal ID of the managed identity
    local principal_id
    principal_id=$(az identity show \
        --name "${identity_name}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query principalId \
        -o tsv)
    
    if [ -z "${principal_id}" ]; then
        print_error "Failed to get principal ID for managed identity '${identity_name}'"
        return 1
    fi
    
    # Get storage account resource ID
    local storage_id
    storage_id=$(az storage account show \
        --name "${STORAGE_ACCOUNT_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv)
    
    # Assign Storage Table Data Contributor role
    local role_name="Storage Table Data Contributor"
    
    print_info "Assigning '${role_name}' role to managed identity..."
    
    # Check if role assignment already exists
    local existing_assignment
    existing_assignment=$(az role assignment list \
        --assignee "${principal_id}" \
        --role "${role_name}" \
        --scope "${storage_id}" \
        --query "[].id" \
        -o tsv 2>/dev/null || echo "")
    
    if [ -n "${existing_assignment}" ]; then
        print_warning "Role assignment already exists"
    else
        az role assignment create \
            --assignee "${principal_id}" \
            --role "${role_name}" \
            --scope "${storage_id}" \
            --output none
        
        print_success "Role assignment created successfully"
    fi
    
    print_success "Managed identity '${identity_name}' configured with table access"
}

# List all tables in the storage account
list_tables() {
    print_section "Storage Tables"
    
    local tables
    tables=$(az storage table list \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --query "[].name" \
        -o tsv 2>/dev/null)
    
    if [ -z "${tables}" ]; then
        print_info "No tables found in storage account"
    else
        print_success "Tables in '${STORAGE_ACCOUNT_NAME}':"
        echo "${tables}" | while read -r table; do
            echo "  - ${table}"
        done
    fi
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Azure Storage Tables deployed successfully!"
    echo ""
    echo "  Resource Group:      ${RESOURCE_GROUP}"
    echo "  Storage Account:     ${STORAGE_ACCOUNT_NAME}"
    echo ""
    echo "  Tables created:"
    for table_name in "${TABLES_TO_CREATE[@]}"; do
        echo "    - ${table_name}"
    done
    echo ""
    
    if [ "${ASSIGN_IDENTITY}" = true ]; then
        echo "  Managed Identity:    RBAC assigned (if unique identity found)"
    else
        echo "  Managed Identity:    Not configured (use --assign-identity to enable)"
    fi
    echo ""
    
    echo "Next Steps:"
    echo "  1. Create managed identity using deploy-azure-managed-identity.sh (if not exists)"
    echo "  2. Assign RBAC roles manually or rerun with --assign-identity"
    echo "  3. Deploy Azure Function App using deploy-azure-function.sh"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Storage Tables Deployment"
    print_info "Storage Account: ${STORAGE_ACCOUNT_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Tables to create: ${TABLES_TO_CREATE[*]}"
    
    check_prerequisites
    check_storage_account
    create_tables
    
    if [ "${ASSIGN_IDENTITY}" = true ]; then
        assign_identity_rbac
    fi
    
    list_tables
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
