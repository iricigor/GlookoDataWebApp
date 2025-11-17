#!/bin/bash

################################################################################
# Configuration Library for Azure Deployment Scripts
# 
# This library provides shared configuration management functionality that can
# be sourced by deployment scripts. It handles:
#   - Loading configuration from JSON files
#   - Command-line argument parsing
#   - Configuration precedence (CLI > local config > defaults)
#   - Helper functions for common tasks
#
# Usage:
#   source ./config-lib.sh
#   load_config
#   # Now use CONFIG_* variables in your script
#
################################################################################

# Default configuration file location in Cloud Shell
readonly DEFAULT_CONFIG_DIR="${HOME}/.glookodata"
readonly DEFAULT_CONFIG_FILE="${DEFAULT_CONFIG_DIR}/config.json"

# Output colors
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_NC='\033[0m' # No Color

################################################################################
# HELPER FUNCTIONS
################################################################################

# Print colored messages
print_info() {
    echo -e "${COLOR_BLUE}ℹ️  $1${COLOR_NC}"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${COLOR_NC}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠️  $1${COLOR_NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${COLOR_NC}"
}

# Print section header
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${COLOR_BLUE}$1${COLOR_NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

################################################################################
# CONFIGURATION FUNCTIONS
################################################################################

# Get value from JSON config file
# Usage: get_config_value "key" "default_value"
get_config_value() {
    local key="$1"
    local default="${2:-}"
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    
    if [ -f "$config_file" ]; then
        # Try to extract value using Python (available in Cloud Shell)
        if command -v python3 &> /dev/null; then
            local value
            value=$(python3 -c "import json, sys; data=json.load(open('$config_file')); print(data.get('$key', ''))" 2>/dev/null || echo "")
            if [ -n "$value" ]; then
                echo "$value"
                return
            fi
        fi
        
        # Fallback to grep/sed if Python fails
        local value
        value=$(grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$config_file" 2>/dev/null | sed 's/.*":\s*"\(.*\)"/\1/')
        if [ -n "$value" ]; then
            echo "$value"
            return
        fi
    fi
    
    # Return default if not found
    echo "$default"
}

# Load configuration with precedence: CLI args > local config > defaults
# Sets CONFIG_* variables for use in scripts
load_config() {
    print_section "Loading Configuration"
    
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    
    if [ -f "$config_file" ]; then
        print_success "Found local configuration: $config_file"
    else
        print_info "No local configuration found (checked: $config_file)"
        print_info "Using default values from script"
    fi
    
    # Load configuration values with precedence handling
    # Format: CONFIG_VAR="${CLI_ARG:-$(get_config_value "jsonKey" "defaultValue")}"
    
    CONFIG_RESOURCE_GROUP="${RESOURCE_GROUP:-$(get_config_value "resourceGroup" "glookodatawebapp-rg")}"
    CONFIG_LOCATION="${LOCATION:-$(get_config_value "location" "eastus")}"
    CONFIG_APP_NAME="${APP_NAME:-$(get_config_value "appName" "glookodatawebapp")}"
    CONFIG_STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-$(get_config_value "storageAccountName" "glookodatawebappstorage")}"
    CONFIG_MANAGED_IDENTITY_NAME="${MANAGED_IDENTITY_NAME:-$(get_config_value "managedIdentityName" "glookodatawebapp-identity")}"
    CONFIG_STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-$(get_config_value "staticWebAppName" "glookodatawebapp-swa")}"
    CONFIG_STATIC_WEB_APP_SKU="${STATIC_WEB_APP_SKU:-$(get_config_value "staticWebAppSku" "Free")}"
    CONFIG_WEB_APP_URL="${WEB_APP_URL:-$(get_config_value "webAppUrl" "https://glooko.iric.online")}"
    CONFIG_APP_REGISTRATION_NAME="${APP_REGISTRATION_NAME:-$(get_config_value "appRegistrationName" "GlookoDataWebApp")}"
    CONFIG_SIGN_IN_AUDIENCE="${SIGN_IN_AUDIENCE:-$(get_config_value "signInAudience" "PersonalMicrosoftAccount")}"
    CONFIG_USE_MANAGED_IDENTITY="${USE_MANAGED_IDENTITY:-$(get_config_value "useManagedIdentity" "true")}"
    
    # Build tags string
    CONFIG_TAGS="Application=${CONFIG_APP_NAME} Environment=Production ManagedBy=AzureDeploymentScripts"
    
    print_info "Configuration loaded:"
    print_info "  Resource Group: ${CONFIG_RESOURCE_GROUP}"
    print_info "  Location: ${CONFIG_LOCATION}"
    print_info "  App Name: ${CONFIG_APP_NAME}"
    print_info "  Use Managed Identity: ${CONFIG_USE_MANAGED_IDENTITY}"
}

# Create config directory if it doesn't exist
ensure_config_dir() {
    if [ ! -d "$DEFAULT_CONFIG_DIR" ]; then
        print_info "Creating configuration directory: $DEFAULT_CONFIG_DIR"
        mkdir -p "$DEFAULT_CONFIG_DIR"
    fi
}

# Save configuration to local file
# Usage: save_config "key" "value"
save_config_value() {
    local key="$1"
    local value="$2"
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    
    ensure_config_dir
    
    # Create empty config if it doesn't exist
    if [ ! -f "$config_file" ]; then
        echo "{}" > "$config_file"
    fi
    
    # Update using Python (more reliable than sed for JSON)
    if command -v python3 &> /dev/null; then
        python3 -c "
import json
try:
    with open('$config_file', 'r') as f:
        data = json.load(f)
except:
    data = {}
data['$key'] = '$value'
with open('$config_file', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null
        return $?
    fi
    
    return 1
}

################################################################################
# AZURE VALIDATION FUNCTIONS
################################################################################

# Check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed or not in PATH"
        print_info "This script should be run in Azure Cloud Shell"
        return 1
    fi
    print_success "Azure CLI is available"
    return 0
}

# Check if user is logged in
check_azure_login() {
    print_info "Checking Azure login status..."
    
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure"
        print_info "Please run 'az login' first or use Azure Cloud Shell"
        return 1
    fi
    
    local account_name
    local subscription_id
    account_name=$(az account show --query name -o tsv)
    subscription_id=$(az account show --query id -o tsv)
    
    print_success "Logged in to Azure"
    print_info "Account: ${account_name}"
    print_info "Subscription ID: ${subscription_id}"
    return 0
}

# Run all prerequisite checks
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    if ! check_azure_cli; then
        exit 1
    fi
    
    if ! check_azure_login; then
        exit 1
    fi
}

################################################################################
# AZURE RESOURCE FUNCTIONS
################################################################################

# Create resource group if it doesn't exist
ensure_resource_group() {
    local rg_name="${1:-$CONFIG_RESOURCE_GROUP}"
    local location="${2:-$CONFIG_LOCATION}"
    
    print_info "Checking if resource group exists: ${rg_name}"
    
    if az group show --name "${rg_name}" &> /dev/null; then
        print_success "Resource group '${rg_name}' already exists"
    else
        print_info "Creating resource group: ${rg_name}"
        az group create \
            --name "${rg_name}" \
            --location "${location}" \
            --tags ${CONFIG_TAGS}
        
        print_success "Resource group created successfully"
    fi
}

# Check if a resource exists
# Usage: resource_exists "type" "name" "resource-group"
resource_exists() {
    local resource_type="$1"
    local resource_name="$2"
    local rg_name="${3:-$CONFIG_RESOURCE_GROUP}"
    
    case "$resource_type" in
        "storage-account")
            az storage account show --name "$resource_name" --resource-group "$rg_name" &> /dev/null
            ;;
        "identity")
            az identity show --name "$resource_name" --resource-group "$rg_name" &> /dev/null
            ;;
        "staticwebapp")
            az staticwebapp show --name "$resource_name" --resource-group "$rg_name" &> /dev/null
            ;;
        *)
            print_error "Unknown resource type: $resource_type"
            return 2
            ;;
    esac
    
    return $?
}

################################################################################
# MANAGED IDENTITY FUNCTIONS
################################################################################

# Get managed identity client ID
get_managed_identity_id() {
    local identity_name="${1:-$CONFIG_MANAGED_IDENTITY_NAME}"
    local rg_name="${2:-$CONFIG_RESOURCE_GROUP}"
    
    az identity show \
        --name "$identity_name" \
        --resource-group "$rg_name" \
        --query clientId -o tsv 2>/dev/null
}

# Get managed identity principal ID
get_managed_identity_principal_id() {
    local identity_name="${1:-$CONFIG_MANAGED_IDENTITY_NAME}"
    local rg_name="${2:-$CONFIG_RESOURCE_GROUP}"
    
    az identity show \
        --name "$identity_name" \
        --resource-group "$rg_name" \
        --query principalId -o tsv 2>/dev/null
}

################################################################################
# HELP AND USAGE
################################################################################

# Display usage information for configuration
show_config_help() {
    cat << EOF
Configuration Management:

The scripts support configuration through multiple sources with this precedence:
  1. Command-line arguments (highest priority)
  2. Local configuration file (~/.glookodata/config.json)
  3. Script default values (lowest priority)

Environment Variables:
  All configuration values can be set via environment variables before running:
  
  RESOURCE_GROUP         - Azure resource group name
  LOCATION               - Azure region (e.g., eastus, westus2)
  APP_NAME               - Application base name
  STORAGE_ACCOUNT_NAME   - Storage account name
  MANAGED_IDENTITY_NAME  - Managed identity name
  STATIC_WEB_APP_NAME    - Static Web App name
  USE_MANAGED_IDENTITY   - Use managed identity (true/false)
  CONFIG_FILE            - Custom config file location

Example:
  LOCATION=westus2 ./deploy-azure-storage-account.sh

Configuration File:
  Create ~/.glookodata/config.json with your custom values.
  See config.template.json for the schema and available options.

EOF
}

# Export functions for use in other scripts
export -f print_info
export -f print_success
export -f print_warning
export -f print_error
export -f print_section
export -f get_config_value
export -f load_config
export -f ensure_config_dir
export -f save_config_value
export -f check_azure_cli
export -f check_azure_login
export -f check_prerequisites
export -f ensure_resource_group
export -f resource_exists
export -f get_managed_identity_id
export -f get_managed_identity_principal_id
export -f show_config_help
