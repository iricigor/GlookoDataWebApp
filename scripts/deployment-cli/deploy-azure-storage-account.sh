#!/bin/bash

################################################################################
# Azure Storage Account Deployment Script
# 
# This script creates and configures Azure Storage Account for the 
# GlookoDataWebApp application with optional managed identity support.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - For managed identity: run deploy-azure-managed-identity.sh first
#
# Usage:
#   ./deploy-azure-storage-account.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Storage account name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#   --use-managed-identity  Configure for managed identity access
#   --show-connection       Display connection string (default if not using MI)
#
# Examples:
#   ./deploy-azure-storage-account.sh
#   ./deploy-azure-storage-account.sh --use-managed-identity
#   LOCATION=westus2 ./deploy-azure-storage-account.sh
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
    echo "Please ensure config-lib.sh is in the same directory as this script"
    exit 1
fi

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << EOF
Azure Storage Account Deployment Script

Usage: $(basename "$0") [OPTIONS]

This script creates and configures Azure Storage Account with optional
managed identity support for secure, secret-free authentication.

Options:
  -h, --help              Show this help message and exit
  -n, --name NAME         Storage account name (overrides config/default)
  -g, --resource-group RG Resource group name (overrides config/default)
  -l, --location LOCATION Azure region (overrides config/default)
  -c, --config FILE       Use custom configuration file
  --use-managed-identity  Configure for managed identity access
  --show-connection       Display connection string (shown by default if not using MI)
  -s, --save              Save arguments to local configuration file
  -v, --verbose           Enable verbose output

Configuration:
  $(show_config_help)

Examples:
  # Deploy with default configuration
  ./$(basename "$0")

  # Deploy with managed identity support
  ./$(basename "$0") --use-managed-identity

  # Deploy with custom name and location
  ./$(basename "$0") --name mystorageacct --location westus2

  # Use custom config file
  ./$(basename "$0") --config ~/my-config.json

Environment Variables:
  STORAGE_ACCOUNT_NAME   - Override storage account name
  RESOURCE_GROUP         - Override resource group name
  LOCATION               - Override Azure region
  USE_MANAGED_IDENTITY   - Use managed identity (true/false)
  CONFIG_FILE            - Use custom configuration file

For more information, visit:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/scripts/deployment

EOF
}

# Parse command-line arguments
parse_arguments() {
    SAVE_CONFIG=false
    VERBOSE=false
    SHOW_CONNECTION=""
    USE_MI_FLAG=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -n|--name)
                STORAGE_ACCOUNT_NAME="$2"
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
            --use-managed-identity)
                USE_MI_FLAG="true"
                shift
                ;;
            --show-connection)
                SHOW_CONNECTION="true"
                shift
                ;;
            -s|--save)
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
# RESOURCE CREATION FUNCTIONS
################################################################################

# Create Storage Account
create_storage_account() {
    print_section "Creating Storage Account"
    
    local storage_name="${CONFIG_STORAGE_ACCOUNT_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    local location="${CONFIG_LOCATION}"
    
    print_info "Checking if storage account exists: ${storage_name}"
    
    if resource_exists "storage-account" "${storage_name}" "${rg_name}"; then
        print_warning "Storage account '${storage_name}' already exists"
        STORAGE_EXISTS=true
    else
        print_info "Creating storage account: ${storage_name}"
        print_info "This may take a few minutes..."
        
        az storage account create \
            --name "${storage_name}" \
            --resource-group "${rg_name}" \
            --location "${location}" \
            --sku Standard_LRS \
            --kind StorageV2 \
            --https-only true \
            --min-tls-version TLS1_2 \
            --allow-blob-public-access false \
            --tags ${CONFIG_TAGS}
        
        print_success "Storage account created successfully"
        STORAGE_EXISTS=false
    fi
    
    print_info "Storage Account: ${storage_name}"
}

# Configure managed identity access (if using MI)
configure_managed_identity_access() {
    if [ "$CONFIG_USE_MANAGED_IDENTITY" != "true" ]; then
        print_info "Managed identity not configured (using connection strings)"
        return 0
    fi
    
    print_section "Configuring Managed Identity Access"
    
    local identity_name="${CONFIG_MANAGED_IDENTITY_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    local storage_name="${CONFIG_STORAGE_ACCOUNT_NAME}"
    
    # Check if managed identity exists
    if ! resource_exists "identity" "${identity_name}" "${rg_name}"; then
        print_warning "Managed identity '${identity_name}' not found"
        print_info "Run deploy-azure-managed-identity.sh to create it"
        print_info "Continuing without managed identity configuration"
        return 0
    fi
    
    print_info "Assigning storage roles to managed identity..."
    
    # Get managed identity principal ID
    local principal_id
    principal_id=$(get_managed_identity_principal_id "${identity_name}" "${rg_name}")
    
    # Get storage account scope
    local storage_scope
    storage_scope=$(az storage account show \
        --name "${storage_name}" \
        --resource-group "${rg_name}" \
        --query id -o tsv)
    
    # Assign roles
    print_info "Assigning 'Storage Blob Data Contributor' role..."
    if az role assignment create \
        --assignee "${principal_id}" \
        --role "Storage Blob Data Contributor" \
        --scope "${storage_scope}" &> /dev/null; then
        print_success "Storage Blob Data Contributor role assigned"
    else
        print_info "Role may already be assigned (this is normal)"
    fi
    
    print_info "Assigning 'Storage Table Data Contributor' role..."
    if az role assignment create \
        --assignee "${principal_id}" \
        --role "Storage Table Data Contributor" \
        --scope "${storage_scope}" &> /dev/null; then
        print_success "Storage Table Data Contributor role assigned"
    else
        print_info "Role may already be assigned (this is normal)"
    fi
    
    print_success "Managed identity configured for storage access"
}

# Get Storage Account Connection String
get_connection_string() {
    # Skip if using managed identity and not explicitly requested
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ] && [ "$SHOW_CONNECTION" != "true" ]; then
        print_info "Using managed identity - connection string not needed"
        CONNECTION_STRING=""
        STORAGE_KEY=""
        return 0
    fi
    
    print_section "Retrieving Storage Account Details"
    
    local storage_name="${CONFIG_STORAGE_ACCOUNT_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    print_info "Getting storage account connection string..."
    
    CONNECTION_STRING=$(az storage account show-connection-string \
        --name "${storage_name}" \
        --resource-group "${rg_name}" \
        --query connectionString -o tsv)
    
    print_success "Connection string retrieved"
}

# Get Storage Account Key
get_storage_key() {
    # Skip if using managed identity and not explicitly requested
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ] && [ "$SHOW_CONNECTION" != "true" ]; then
        return 0
    fi
    
    print_section "Retrieving Storage Account Key"
    
    local storage_name="${CONFIG_STORAGE_ACCOUNT_NAME}"
    local rg_name="${CONFIG_RESOURCE_GROUP}"
    
    print_info "Getting storage account key..."
    
    STORAGE_KEY=$(az storage account keys list \
        --resource-group "${rg_name}" \
        --account-name "${storage_name}" \
        --query "[0].value" -o tsv)
    
    print_success "Storage key retrieved"
}

# Save configuration if requested
save_configuration() {
    if [ "$SAVE_CONFIG" = true ]; then
        print_section "Saving Configuration"
        
        print_info "Saving configuration to local file..."
        save_config_value "storageAccountName" "${CONFIG_STORAGE_ACCOUNT_NAME}"
        save_config_value "resourceGroup" "${CONFIG_RESOURCE_GROUP}"
        save_config_value "location" "${CONFIG_LOCATION}"
        save_config_value "useManagedIdentity" "${CONFIG_USE_MANAGED_IDENTITY}"
        
        print_success "Configuration saved to ${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    fi
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Azure Storage Account configured successfully!"
    echo ""
    print_info "Resource Details:"
    echo "  - Resource Group: ${CONFIG_RESOURCE_GROUP}"
    echo "  - Storage Account: ${CONFIG_STORAGE_ACCOUNT_NAME}"
    echo "  - Location: ${CONFIG_LOCATION}"
    echo "  - Using Managed Identity: ${CONFIG_USE_MANAGED_IDENTITY}"
    echo ""
    
    if [ "${STORAGE_EXISTS}" = true ]; then
        print_info "Note: Storage account already existed (not created)"
    fi
    
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ]; then
        print_success "Managed Identity Configuration:"
        echo "  - Identity: ${CONFIG_MANAGED_IDENTITY_NAME}"
        echo "  - Roles: Storage Blob Data Contributor, Storage Table Data Contributor"
        echo ""
        print_info "Authentication will use managed identity (no connection strings needed)"
    else
        print_warning "Using Connection Strings (consider upgrading to managed identity)"
    fi
    echo ""
    
    print_warning "Security Information:"
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ]; then
        echo "  ✅ Using managed identity (secure, no secrets)"
        echo "  ✅ No connection strings to manage"
        echo "  ✅ Automatic credential rotation"
    else
        echo "  ⚠️  Never commit connection strings or keys to source control"
        echo "  ⚠️  Store connection string in Azure Static Web App environment variables"
        echo "  ⚠️  Consider using managed identity for production deployments"
    fi
    echo ""
    
    print_info "Next Steps:"
    echo ""
    echo "  1. Run the table creation scripts to set up tables:"
    echo "     - ./deploy-azure-user-settings-table.sh"
    echo "     - ./deploy-azure-pro-users-table.sh (optional)"
    echo ""
    
    if [ "$CONFIG_USE_MANAGED_IDENTITY" = "true" ]; then
        echo "  2. Configure your Static Web App to use managed identity:"
        echo "     - Deploy or update Static Web App with managed identity"
        echo "     - ./deploy-azure-static-web-app.sh --sku Standard --managed-identity"
        echo ""
        echo "  3. Update application code to use DefaultAzureCredential:"
        echo "     - Remove connection strings from application configuration"
        echo "     - Use Azure Identity SDK for authentication"
    else
        echo "  2. Add the following to your Static Web App configuration:"
        echo ""
        echo "     Environment Variable:"
        echo "       Name: AZURE_STORAGE_CONNECTION_STRING"
        echo "       Value: <connection-string>"
        echo ""
        echo "  3. To set the environment variable in Azure Static Web App:"
        echo "     az staticwebapp appsettings set \\"
        echo "       --name <your-static-web-app-name> \\"
        echo "       --setting-names AZURE_STORAGE_CONNECTION_STRING=\"\${CONNECTION_STRING}\""
        
        if [ -n "$CONNECTION_STRING" ]; then
            echo ""
            print_info "Connection String (SAVE THIS SECURELY):"
            echo ""
            echo "${CONNECTION_STRING}"
            echo ""
            print_info "Storage Account Key (SAVE THIS SECURELY):"
            echo ""
            echo "${STORAGE_KEY}"
        fi
    fi
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
    if [ -n "$USE_MI_FLAG" ]; then
        CONFIG_USE_MANAGED_IDENTITY="$USE_MI_FLAG"
    fi
    
    # Display deployment information
    print_section "Azure Storage Account Deployment"
    print_info "Storage Account: ${CONFIG_STORAGE_ACCOUNT_NAME}"
    print_info "Resource Group: ${CONFIG_RESOURCE_GROUP}"
    print_info "Location: ${CONFIG_LOCATION}"
    print_info "Managed Identity: ${CONFIG_USE_MANAGED_IDENTITY}"
    echo ""
    
    # Run validation checks
    check_prerequisites
    
    # Create resources
    ensure_resource_group
    create_storage_account
    configure_managed_identity_access
    get_connection_string
    get_storage_key
    
    # Save configuration if requested
    save_configuration
    
    # Display results
    display_summary
    
    print_section "Deployment Complete"
    print_success "Storage Account is ready for use!"
}

# Run main function
main "$@"
