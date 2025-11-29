#!/bin/bash

################################################################################
# Configuration Library for Azure Deployment Scripts
# 
# This library provides shared functionality for all Azure deployment scripts.
# It includes configuration management, Azure CLI validation, and output formatting.
#
# Usage:
#   source "${SCRIPT_DIR}/config-lib.sh"
#
################################################################################

# Configuration file location (persists in Azure Cloud Shell)
CONFIG_DIR="${HOME}/.glookodata"
CONFIG_FILE="${CONFIG_DIR}/config.json"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# OUTPUT FUNCTIONS
################################################################################

# Print info message with blue color and ℹ️ icon
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Print success message with green color and ✅ icon
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print warning message with yellow color and ⚠️ icon
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Print error message with red color and ❌ icon
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print section header with separator lines
print_section() {
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
}

################################################################################
# CONFIGURATION FUNCTIONS
################################################################################

# Ensure configuration directory exists
ensure_config_dir() {
    if [ ! -d "${CONFIG_DIR}" ]; then
        mkdir -p "${CONFIG_DIR}"
        print_info "Created configuration directory: ${CONFIG_DIR}"
    fi
}

# Get a value from the JSON configuration file
# Usage: get_config_value "propertyName" "defaultValue"
get_config_value() {
    local property="$1"
    local default="$2"
    
    if [ -f "${CONFIG_FILE}" ]; then
        local value
        value=$(jq -r ".${property} // empty" "${CONFIG_FILE}" 2>/dev/null)
        if [ -n "${value}" ] && [ "${value}" != "null" ]; then
            echo "${value}"
            return
        fi
    fi
    
    echo "${default}"
}

# Save a value to the JSON configuration file
# Usage: save_config_value "propertyName" "value"
save_config_value() {
    local property="$1"
    local value="$2"
    
    ensure_config_dir
    
    if [ -f "${CONFIG_FILE}" ]; then
        # Update existing config
        local temp_file="${CONFIG_FILE}.tmp"
        jq --arg prop "${property}" --arg val "${value}" '.[$prop] = $val' "${CONFIG_FILE}" > "${temp_file}"
        mv "${temp_file}" "${CONFIG_FILE}"
    else
        # Create new config with initial property
        echo "{\"${property}\": \"${value}\"}" | jq '.' > "${CONFIG_FILE}"
    fi
}

# Load all configuration values with proper precedence
# CLI args > environment variables > config file > defaults
load_config() {
    # Default values
    DEFAULT_RESOURCE_GROUP="glookodatawebapp-rg"
    DEFAULT_LOCATION="eastus"
    DEFAULT_APP_NAME="glookodatawebapp"
    DEFAULT_STORAGE_ACCOUNT_NAME="glookodatawebappstorage"
    DEFAULT_MANAGED_IDENTITY_NAME="glookodatawebapp-identity"
    DEFAULT_STATIC_WEB_APP_NAME="glookodatawebapp-swa"
    DEFAULT_STATIC_WEB_APP_SKU="Standard"
    DEFAULT_KEY_VAULT_NAME="glookodatawebapp-kv"
    DEFAULT_FUNCTION_APP_NAME="glookodatawebapp-func"
    DEFAULT_WEB_APP_URL="https://glooko.iric.online"
    DEFAULT_APP_REGISTRATION_NAME="GlookoDataWebApp"
    DEFAULT_APP_REGISTRATION_CLIENT_ID=""
    DEFAULT_SIGN_IN_AUDIENCE="PersonalMicrosoftAccount"
    DEFAULT_USE_MANAGED_IDENTITY="true"
    
    # Load from config file with defaults
    RESOURCE_GROUP="${RESOURCE_GROUP:-$(get_config_value "resourceGroup" "${DEFAULT_RESOURCE_GROUP}")}"
    LOCATION="${LOCATION:-$(get_config_value "location" "${DEFAULT_LOCATION}")}"
    APP_NAME="${APP_NAME:-$(get_config_value "appName" "${DEFAULT_APP_NAME}")}"
    STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-$(get_config_value "storageAccountName" "${DEFAULT_STORAGE_ACCOUNT_NAME}")}"
    MANAGED_IDENTITY_NAME="${MANAGED_IDENTITY_NAME:-$(get_config_value "managedIdentityName" "${DEFAULT_MANAGED_IDENTITY_NAME}")}"
    STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-$(get_config_value "staticWebAppName" "${DEFAULT_STATIC_WEB_APP_NAME}")}"
    STATIC_WEB_APP_SKU="${STATIC_WEB_APP_SKU:-$(get_config_value "staticWebAppSku" "${DEFAULT_STATIC_WEB_APP_SKU}")}"
    KEY_VAULT_NAME="${KEY_VAULT_NAME:-$(get_config_value "keyVaultName" "${DEFAULT_KEY_VAULT_NAME}")}"
    FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-$(get_config_value "functionAppName" "${DEFAULT_FUNCTION_APP_NAME}")}"
    WEB_APP_URL="${WEB_APP_URL:-$(get_config_value "webAppUrl" "${DEFAULT_WEB_APP_URL}")}"
    APP_REGISTRATION_NAME="${APP_REGISTRATION_NAME:-$(get_config_value "appRegistrationName" "${DEFAULT_APP_REGISTRATION_NAME}")}"
    APP_REGISTRATION_CLIENT_ID="${APP_REGISTRATION_CLIENT_ID:-$(get_config_value "appRegistrationClientId" "${DEFAULT_APP_REGISTRATION_CLIENT_ID}")}"
    SIGN_IN_AUDIENCE="${SIGN_IN_AUDIENCE:-$(get_config_value "signInAudience" "${DEFAULT_SIGN_IN_AUDIENCE}")}"
    USE_MANAGED_IDENTITY="${USE_MANAGED_IDENTITY:-$(get_config_value "useManagedIdentity" "${DEFAULT_USE_MANAGED_IDENTITY}")}"
    
    # Build tags string for Azure CLI
    CONFIG_TAGS="Application=${APP_NAME} Environment=Production ManagedBy=AzureDeploymentScripts"
}

# Save current configuration to file
save_configuration() {
    if [ "${SAVE_CONFIG}" = true ]; then
        ensure_config_dir
        
        # Create config JSON
        cat > "${CONFIG_FILE}" << EOF
{
  "resourceGroup": "${RESOURCE_GROUP}",
  "location": "${LOCATION}",
  "appName": "${APP_NAME}",
  "storageAccountName": "${STORAGE_ACCOUNT_NAME}",
  "managedIdentityName": "${MANAGED_IDENTITY_NAME}",
  "staticWebAppName": "${STATIC_WEB_APP_NAME}",
  "staticWebAppSku": "${STATIC_WEB_APP_SKU}",
  "keyVaultName": "${KEY_VAULT_NAME}",
  "functionAppName": "${FUNCTION_APP_NAME}",
  "webAppUrl": "${WEB_APP_URL}",
  "appRegistrationName": "${APP_REGISTRATION_NAME}",
  "appRegistrationClientId": "${APP_REGISTRATION_CLIENT_ID}",
  "signInAudience": "${SIGN_IN_AUDIENCE}",
  "useManagedIdentity": ${USE_MANAGED_IDENTITY},
  "tags": {
    "Application": "${APP_NAME}",
    "Environment": "Production",
    "ManagedBy": "AzureDeploymentScripts"
  }
}
EOF
        print_success "Configuration saved to ${CONFIG_FILE}"
    fi
}

################################################################################
# AZURE VALIDATION FUNCTIONS
################################################################################

# Check if Azure CLI is available
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed or not in PATH"
        print_info "Please install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        return 1
    fi
    return 0
}

# Check if user is logged in to Azure
check_azure_login() {
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure"
        print_info "Please run: az login"
        return 1
    fi
    return 0
}

# Check all prerequisites for deployment
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    if ! check_azure_cli; then
        exit 1
    fi
    print_success "Azure CLI is installed"
    
    if ! check_azure_login; then
        exit 1
    fi
    print_success "Logged in to Azure"
    
    # Show current subscription
    local subscription
    subscription=$(az account show --query name -o tsv)
    print_info "Using subscription: ${subscription}"
}

################################################################################
# RESOURCE MANAGEMENT FUNCTIONS
################################################################################

# Check if a resource exists
# Usage: resource_exists "resourceType" "resourceName" "resourceGroup"
resource_exists() {
    local resource_type="$1"
    local resource_name="$2"
    local resource_group="$3"
    
    case "${resource_type}" in
        "storage")
            az storage account show --name "${resource_name}" --resource-group "${resource_group}" &> /dev/null
            ;;
        "functionapp")
            az functionapp show --name "${resource_name}" --resource-group "${resource_group}" &> /dev/null
            ;;
        "keyvault")
            az keyvault show --name "${resource_name}" --resource-group "${resource_group}" &> /dev/null
            ;;
        "identity")
            az identity show --name "${resource_name}" --resource-group "${resource_group}" &> /dev/null
            ;;
        "staticwebapp")
            az staticwebapp show --name "${resource_name}" --resource-group "${resource_group}" &> /dev/null
            ;;
        "group")
            az group show --name "${resource_name}" &> /dev/null
            ;;
        *)
            print_error "Unknown resource type: ${resource_type}"
            return 1
            ;;
    esac
}

# Ensure resource group exists
ensure_resource_group() {
    if resource_exists "group" "${RESOURCE_GROUP}"; then
        print_info "Resource group '${RESOURCE_GROUP}' already exists"
    else
        print_info "Creating resource group '${RESOURCE_GROUP}' in '${LOCATION}'..."
        az group create \
            --name "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --tags ${CONFIG_TAGS} \
            --output none
        print_success "Resource group created"
    fi
}

################################################################################
# MANAGED IDENTITY FUNCTIONS
################################################################################

# Get the client ID of the managed identity
get_managed_identity_id() {
    az identity show \
        --name "${MANAGED_IDENTITY_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query clientId \
        -o tsv 2>/dev/null
}

# Get the principal ID of the managed identity
get_managed_identity_principal_id() {
    az identity show \
        --name "${MANAGED_IDENTITY_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query principalId \
        -o tsv 2>/dev/null
}

# Get the resource ID of the managed identity
get_managed_identity_resource_id() {
    az identity show \
        --name "${MANAGED_IDENTITY_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv 2>/dev/null
}

################################################################################
# INITIALIZATION
################################################################################

# Ensure jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Some features may not work correctly."
    print_info "Install jq: sudo apt-get install jq (Linux) or brew install jq (macOS)"
fi
