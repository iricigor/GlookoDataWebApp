#!/bin/bash

################################################################################
# Azure Storage Tables Provider Column Migration Script
# 
# This script adds the Provider column to ProUsers and UserSettings tables
# in Azure Table Storage with a default value of "Microsoft" for existing records
# that don't have this column.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to access the storage tables
#   - Storage Account and tables must already exist
#   - Python 3 for URL encoding (pre-installed in Azure Cloud Shell)
#   - jq for JSON processing (pre-installed in Azure Cloud Shell)
#
# Usage:
#   ./migrate-provider-column.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -a, --storage-account   Storage account name (default from config)
#   -g, --resource-group    Resource group name (default from config)
#   -c, --config FILE       Custom configuration file path
#   -v, --verbose           Enable verbose output
#   --dry-run               Show what would be updated without making changes
#
# Examples:
#   ./migrate-provider-column.sh
#   ./migrate-provider-column.sh --storage-account mystorageacct
#   ./migrate-provider-column.sh --dry-run
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

DEFAULT_PROVIDER="Microsoft"
DRY_RUN=false

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Storage Tables Provider Column Migration Script

Adds Provider column to ProUsers and UserSettings tables with default value
"Microsoft" for existing records that don't have this column.

Usage: ./migrate-provider-column.sh [OPTIONS]

Options:
  -h, --help              Show this help message
  -a, --storage-account   Storage account name
  -g, --resource-group    Resource group name
  -c, --config FILE       Custom configuration file path
  -v, --verbose           Enable verbose output
  --dry-run               Show what would be updated without making changes

Tables Updated:
  - ProUsers: Professional user information
  - UserSettings: User preferences and settings

Migration Logic:
  - If Provider column exists: No change (preserve existing value)
  - If Provider column missing: Add Provider=Microsoft

Examples:
  ./migrate-provider-column.sh
  ./migrate-provider-column.sh --storage-account mystorageacct
  ./migrate-provider-column.sh --dry-run

EOF
}

parse_arguments() {
    VERBOSE=false
    SAVE_CONFIG=false
    
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
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
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

# Check if Python 3 is available (required for URL encoding)
check_python3() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed or not in PATH"
        print_info "Python 3 is required for URL encoding"
        print_info "Install Python 3 or use Azure Cloud Shell which has it pre-installed"
        exit 1
    fi
}

# Check if jq is available (required for JSON processing)
check_jq() {
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed or not in PATH"
        print_info "jq is required for JSON processing"
        print_info "Install jq or use Azure Cloud Shell which has it pre-installed"
        exit 1
    fi
}

################################################################################
# STORAGE TABLE FUNCTIONS
################################################################################

# Check if storage account exists
check_storage_account() {
    if ! resource_exists "storage" "${STORAGE_ACCOUNT_NAME}" "${RESOURCE_GROUP}"; then
        print_error "Storage account '${STORAGE_ACCOUNT_NAME}' does not exist in resource group '${RESOURCE_GROUP}'"
        print_info "Please run deploy-azure-storage-account.sh first"
        exit 1
    fi
}

# Migrate ProUsers table
migrate_pro_users_table() {
    local table_name="ProUsers"
    local partition_key="ProUser"
    
    print_section "Migrating ProUsers Table"
    
    # Check if table exists
    local table_exists
    table_exists=$(az storage table exists \
        --name "${table_name}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --query "exists" \
        -o tsv 2>/dev/null || echo "false")
    
    if [ "$table_exists" != "true" ]; then
        print_warning "Table '${table_name}' does not exist"
        print_info "Skipping ${table_name} migration"
        return 0
    fi
    
    # Query all entities in ProUsers table
    local entities
    entities=$(az storage entity query \
        --table-name "${table_name}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --filter "PartitionKey eq '${partition_key}'" \
        -o json 2>/dev/null || echo "[]")
    
    local total_count
    total_count=$(echo "$entities" | jq 'length')
    
    if [ "$total_count" -eq 0 ]; then
        print_info "No entities found in ${table_name} table"
        return 0
    fi
    
    print_info "Found ${total_count} entities in ${table_name} table"
    
    # Process each entity
    echo "$entities" | jq -c '.[]' | while read -r entity; do
        local row_key
        row_key=$(echo "$entity" | jq -r '.RowKey')
        
        # Note: ProUsers table uses 'Email' (capital E) as per Azure Table Storage schema
        local email
        email=$(echo "$entity" | jq -r '.Email // ""')
        
        # Check if Provider column exists
        local has_provider
        has_provider=$(echo "$entity" | jq 'has("Provider")')
        
        if [ "$has_provider" = "true" ]; then
            local provider_value
            provider_value=$(echo "$entity" | jq -r '.Provider')
            if [ "$VERBOSE" = true ]; then
                print_info "Skipping ${email}: Provider already set to '${provider_value}'"
            fi
        else
            if [ "$DRY_RUN" = true ]; then
                print_info "[DRY-RUN] Would add Provider=${DEFAULT_PROVIDER} to ${email}"
            else
                print_info "Adding Provider=${DEFAULT_PROVIDER} to ${email}"
                
                # Update entity with Provider column
                az storage entity merge \
                    --table-name "${table_name}" \
                    --account-name "${STORAGE_ACCOUNT_NAME}" \
                    --auth-mode login \
                    --entity "PartitionKey=${partition_key}" "RowKey=${row_key}" "Provider=${DEFAULT_PROVIDER}" \
                    --output none
            fi
        fi
    done
    
    # Count entities that need updating
    updated_count=$(echo "$entities" | jq '[.[] | select(has("Provider") | not)] | length')
    
    skipped_count=$((total_count - updated_count))
    
    if [ "$DRY_RUN" = true ]; then
        print_success "[DRY-RUN] Would update ${updated_count} entities in ${table_name}"
    else
        print_success "Updated ${updated_count} entities in ${table_name}"
    fi
    print_info "Skipped ${skipped_count} entities (already have Provider)"
}

# Migrate UserSettings table
migrate_user_settings_table() {
    local table_name="UserSettings"
    local partition_key="users"
    
    print_section "Migrating UserSettings Table"
    
    # Check if table exists
    local table_exists
    table_exists=$(az storage table exists \
        --name "${table_name}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --query "exists" \
        -o tsv 2>/dev/null || echo "false")
    
    if [ "$table_exists" != "true" ]; then
        print_warning "Table '${table_name}' does not exist"
        print_info "Skipping ${table_name} migration"
        return 0
    fi
    
    # Query all entities in UserSettings table
    local entities
    entities=$(az storage entity query \
        --table-name "${table_name}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --filter "PartitionKey eq '${partition_key}'" \
        -o json 2>/dev/null || echo "[]")
    
    local total_count
    total_count=$(echo "$entities" | jq 'length')
    
    if [ "$total_count" -eq 0 ]; then
        print_info "No entities found in ${table_name} table"
        return 0
    fi
    
    print_info "Found ${total_count} entities in ${table_name} table"
    
    # Process each entity
    echo "$entities" | jq -c '.[]' | while read -r entity; do
        local row_key
        row_key=$(echo "$entity" | jq -r '.RowKey')
        
        # Note: UserSettings table uses 'email' (lowercase e) as per Azure Table Storage schema
        local email
        email=$(echo "$entity" | jq -r '.email // "unknown"')
        
        # Check if Provider column exists
        local has_provider
        has_provider=$(echo "$entity" | jq 'has("Provider")')
        
        if [ "$has_provider" = "true" ]; then
            local provider_value
            provider_value=$(echo "$entity" | jq -r '.Provider')
            if [ "$VERBOSE" = true ]; then
                print_info "Skipping ${email}: Provider already set to '${provider_value}'"
            fi
        else
            if [ "$DRY_RUN" = true ]; then
                print_info "[DRY-RUN] Would add Provider=${DEFAULT_PROVIDER} to ${email} (userId: ${row_key})"
            else
                print_info "Adding Provider=${DEFAULT_PROVIDER} to ${email} (userId: ${row_key})"
                
                # Update entity with Provider column
                az storage entity merge \
                    --table-name "${table_name}" \
                    --account-name "${STORAGE_ACCOUNT_NAME}" \
                    --auth-mode login \
                    --entity "PartitionKey=${partition_key}" "RowKey=${row_key}" "Provider=${DEFAULT_PROVIDER}" \
                    --output none
            fi
        fi
    done
    
    # Count entities that need updating
    updated_count=$(echo "$entities" | jq '[.[] | select(has("Provider") | not)] | length')
    
    skipped_count=$((total_count - updated_count))
    
    if [ "$DRY_RUN" = true ]; then
        print_success "[DRY-RUN] Would update ${updated_count} entities in ${table_name}"
    else
        print_success "Updated ${updated_count} entities in ${table_name}"
    fi
    print_info "Skipped ${skipped_count} entities (already have Provider)"
}

# Display migration summary
display_summary() {
    print_section "Migration Summary"
    
    if [ "$DRY_RUN" = true ]; then
        print_success "Provider column migration completed (DRY-RUN mode)!"
        echo ""
        echo "  Resource Group:      ${RESOURCE_GROUP}"
        echo "  Storage Account:     ${STORAGE_ACCOUNT_NAME}"
        echo "  Default Provider:    ${DEFAULT_PROVIDER}"
        echo "  Mode:                DRY-RUN (no changes made)"
        echo ""
        echo "Run without --dry-run to apply the changes."
    else
        print_success "Provider column migration completed successfully!"
        echo ""
        echo "  Resource Group:      ${RESOURCE_GROUP}"
        echo "  Storage Account:     ${STORAGE_ACCOUNT_NAME}"
        echo "  Default Provider:    ${DEFAULT_PROVIDER}"
        echo ""
        echo "Migration Details:"
        echo "  - ProUsers table: Updated entities with Provider=${DEFAULT_PROVIDER}"
        echo "  - UserSettings table: Updated entities with Provider=${DEFAULT_PROVIDER}"
        echo "  - Existing Provider values: Preserved (not modified)"
    fi
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Provider Column Migration"
    print_info "Storage Account: ${STORAGE_ACCOUNT_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Default Provider: ${DEFAULT_PROVIDER}"
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY-RUN MODE: No changes will be made"
    fi
    
    check_prerequisites
    check_python3
    check_jq
    check_storage_account
    
    migrate_pro_users_table
    migrate_user_settings_table
    
    display_summary
    
    print_section "Migration Complete"
}

main "$@"
