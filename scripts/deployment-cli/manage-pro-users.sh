#!/bin/bash

################################################################################
# Azure Storage Table Pro Users Management Script
# 
# This script enables management of Pro users in the ProUsers Azure Storage Table.
# Pro users are identified by their email address.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to access the storage table
#   - Storage Account and ProUsers table must already exist
#
# Usage:
#   ./manage-pro-users.sh [COMMAND] [OPTIONS]
#
# Commands:
#   list                    List all Pro users
#   add EMAIL               Add a new Pro user by email
#   remove EMAIL            Remove a Pro user by email
#   check EMAIL             Check if an email is a Pro user
#
# Options:
#   -h, --help              Show this help message
#   -a, --storage-account   Storage account name (default from config)
#   -g, --resource-group    Resource group name (default from config)
#   -c, --config FILE       Custom configuration file path
#   -v, --verbose           Enable verbose output
#
# Examples:
#   ./manage-pro-users.sh list
#   ./manage-pro-users.sh add user@example.com
#   ./manage-pro-users.sh remove user@example.com
#   ./manage-pro-users.sh check user@example.com
#   ./manage-pro-users.sh list --storage-account mystorageacct
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

TABLE_NAME="ProUsers"
PARTITION_KEY="ProUser"
COMMAND=""
EMAIL=""

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Storage Table Pro Users Management Script

Manages Pro users in the ProUsers Azure Storage Table.
Users are identified by their email address.

Usage: ./manage-pro-users.sh [COMMAND] [OPTIONS]

Commands:
  list                    List all Pro users
  add EMAIL               Add a new Pro user by email
  remove EMAIL            Remove a Pro user by email
  check EMAIL             Check if an email is a Pro user

Options:
  -h, --help              Show this help message
  -a, --storage-account   Storage account name
  -g, --resource-group    Resource group name
  -c, --config FILE       Custom configuration file path
  -v, --verbose           Enable verbose output

Examples:
  ./manage-pro-users.sh list
  ./manage-pro-users.sh add user@example.com
  ./manage-pro-users.sh remove user@example.com
  ./manage-pro-users.sh check user@example.com
  ./manage-pro-users.sh list --storage-account mystorageacct

Table Structure:
  - PartitionKey: "ProUser" (constant for all entries)
  - RowKey: Email address (URL-encoded)
  - Email: Email address (original format)
  - CreatedAt: ISO 8601 timestamp when the user was added

EOF
}

parse_arguments() {
    VERBOSE=false
    SAVE_CONFIG=false
    
    # Check for at least one argument
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
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
            list|add|remove|check)
                COMMAND="$1"
                shift
                # If command requires email, capture it
                if [[ "$COMMAND" == "add" || "$COMMAND" == "remove" || "$COMMAND" == "check" ]]; then
                    if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                        EMAIL="$1"
                        shift
                    fi
                fi
                ;;
            *)
                # Check if this looks like an email (for commands that need it)
                if [[ "$1" =~ @ && -z "$EMAIL" ]]; then
                    EMAIL="$1"
                    shift
                else
                    print_error "Unknown option or command: $1"
                    show_help
                    exit 1
                fi
                ;;
        esac
    done
    
    # Validate command
    if [[ -z "$COMMAND" ]]; then
        print_error "No command specified"
        show_help
        exit 1
    fi
    
    # Validate email for commands that require it
    if [[ "$COMMAND" == "add" || "$COMMAND" == "remove" || "$COMMAND" == "check" ]]; then
        if [[ -z "$EMAIL" ]]; then
            print_error "Email address is required for '$COMMAND' command"
            exit 1
        fi
        
        # Basic email validation
        if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            print_error "Invalid email format: $EMAIL"
            exit 1
        fi
    fi
}

################################################################################
# HELPER FUNCTIONS
################################################################################

# URL encode a string (for use as RowKey)
url_encode() {
    local string="$1"
    # Use Python for reliable URL encoding
    python3 -c "import urllib.parse; print(urllib.parse.quote('$string', safe=''))"
}

# Get current timestamp in ISO 8601 format
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
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

# Check if ProUsers table exists
check_table_exists() {
    local table_exists
    table_exists=$(az storage table exists \
        --name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --query "exists" \
        -o tsv 2>/dev/null || echo "false")
    
    if [ "$table_exists" != "true" ]; then
        print_error "Table '${TABLE_NAME}' does not exist in storage account '${STORAGE_ACCOUNT_NAME}'"
        print_info "Please run deploy-azure-storage-tables.sh first"
        exit 1
    fi
}

# List all Pro users
list_pro_users() {
    print_section "Pro Users"
    
    local users
    users=$(az storage entity query \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --filter "PartitionKey eq '${PARTITION_KEY}'" \
        --query "items[].{Email:Email, CreatedAt:CreatedAt}" \
        -o json 2>/dev/null || echo "[]")
    
    local count
    count=$(echo "$users" | jq 'length')
    
    if [ "$count" -eq 0 ]; then
        print_info "No Pro users found"
    else
        print_success "Found ${count} Pro user(s):"
        echo ""
        echo "$users" | jq -r '.[] | "  \(.Email)  (added: \(.CreatedAt // "unknown"))"'
    fi
    
    echo ""
    echo "Total: ${count} Pro user(s)"
}

# Add a new Pro user
add_pro_user() {
    local email="$1"
    local row_key
    row_key=$(url_encode "$email")
    local timestamp
    timestamp=$(get_timestamp)
    
    print_section "Adding Pro User"
    print_info "Email: ${email}"
    
    # Check if user already exists
    local existing
    existing=$(az storage entity show \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --partition-key "${PARTITION_KEY}" \
        --row-key "${row_key}" \
        -o json 2>/dev/null || echo "")
    
    if [ -n "$existing" ]; then
        print_warning "Pro user '${email}' already exists"
        return 0
    fi
    
    # Add new user
    az storage entity insert \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --entity "PartitionKey=${PARTITION_KEY}" "RowKey=${row_key}" "Email=${email}" "CreatedAt=${timestamp}" \
        --output none
    
    print_success "Pro user '${email}' added successfully"
}

# Remove a Pro user
remove_pro_user() {
    local email="$1"
    local row_key
    row_key=$(url_encode "$email")
    
    print_section "Removing Pro User"
    print_info "Email: ${email}"
    
    # Check if user exists
    local existing
    existing=$(az storage entity show \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --partition-key "${PARTITION_KEY}" \
        --row-key "${row_key}" \
        -o json 2>/dev/null || echo "")
    
    if [ -z "$existing" ]; then
        print_warning "Pro user '${email}' does not exist"
        return 0
    fi
    
    # Remove user
    az storage entity delete \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --partition-key "${PARTITION_KEY}" \
        --row-key "${row_key}" \
        --output none
    
    print_success "Pro user '${email}' removed successfully"
}

# Check if an email is a Pro user
check_pro_user() {
    local email="$1"
    local row_key
    row_key=$(url_encode "$email")
    
    print_section "Checking Pro User Status"
    print_info "Email: ${email}"
    
    # Check if user exists
    local existing
    existing=$(az storage entity show \
        --table-name "${TABLE_NAME}" \
        --account-name "${STORAGE_ACCOUNT_NAME}" \
        --auth-mode login \
        --partition-key "${PARTITION_KEY}" \
        --row-key "${row_key}" \
        -o json 2>/dev/null || echo "")
    
    if [ -n "$existing" ]; then
        local created_at
        created_at=$(echo "$existing" | jq -r '.CreatedAt // "unknown"')
        print_success "'${email}' is a Pro user (added: ${created_at})"
        return 0
    else
        print_info "'${email}' is NOT a Pro user"
        return 1
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Pro Users Management"
    print_info "Storage Account: ${STORAGE_ACCOUNT_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Command: ${COMMAND}"
    if [ -n "$EMAIL" ]; then
        print_info "Email: ${EMAIL}"
    fi
    
    check_prerequisites
    check_storage_account
    check_table_exists
    
    case "$COMMAND" in
        list)
            list_pro_users
            ;;
        add)
            add_pro_user "$EMAIL"
            ;;
        remove)
            remove_pro_user "$EMAIL"
            ;;
        check)
            check_pro_user "$EMAIL"
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            exit 1
            ;;
    esac
    
    print_section "Complete"
}

main "$@"
