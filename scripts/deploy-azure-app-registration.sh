#!/bin/bash

################################################################################
# Azure App Registration Deployment Script
# 
# This script creates and configures an Azure App Registration for Microsoft
# authentication on the GlookoDataWebApp website.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash)
#   - Must have appropriate permissions to create App Registrations
#   - Azure CLI is pre-installed in Cloud Shell
#
# Usage:
#   ./deploy-azure-app-registration.sh
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

################################################################################
# CONFIGURATION CONSTANTS
################################################################################

# Application Configuration
readonly APP_NAME="GlookoDataWebApp"
# APP_DESCRIPTION reserved for future use (e.g., app manifest updates)
readonly APP_DESCRIPTION="Web application for importing, visualizing, and analyzing diabetes data from Glooko platform"

# Web Application URL
readonly WEB_APP_URL="https://glooko.iric.online"

# Redirect URIs (add more if needed for development/testing)
readonly REDIRECT_URIS=(
    "${WEB_APP_URL}"
    "${WEB_APP_URL}/"
    "${WEB_APP_URL}/auth/callback"
    "http://localhost:5173"
    "http://localhost:5173/"
    "http://localhost:5173/auth/callback"
)

# LOGOUT_URL reserved for future use (e.g., front-channel logout configuration)
# Logout URL
readonly LOGOUT_URL="${WEB_APP_URL}/auth/logout"

# Account Types
# - AzureADMyOrg: Single tenant (only your organization)
# - AzureADMultipleOrgs: Multi-tenant (any organization)
# - AzureADandPersonalMicrosoftAccount: Multi-tenant + personal accounts
# - PersonalMicrosoftAccount: Personal Microsoft accounts only
readonly SIGN_IN_AUDIENCE="PersonalMicrosoftAccount"

# API Permissions (Microsoft Graph)
# Using delegated permissions for user sign-in
readonly GRAPH_RESOURCE_ID="00000003-0000-0000-c000-000000000000"  # Microsoft Graph
readonly OPENID_PERMISSION_ID="37f7f235-527c-4136-accd-4a02d197296e"      # openid
readonly PROFILE_PERMISSION_ID="14dad69e-099b-42c9-810b-d002981feec1"     # profile
readonly EMAIL_PERMISSION_ID="64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"       # email
readonly USER_READ_PERMISSION_ID="e1fe6dd8-ba31-4d61-89e7-88639da4683d"   # User.Read

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
# VALIDATION FUNCTIONS
################################################################################

# Check if Azure CLI is installed
check_azure_cli() {
    print_section "Checking Prerequisites"
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed or not in PATH"
        print_info "This script should be run in Azure Cloud Shell"
        exit 1
    fi
    
    print_success "Azure CLI is available"
}

# Check if user is logged in
check_azure_login() {
    print_info "Checking Azure login status..."
    
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure"
        print_info "Please run 'az login' first or use Azure Cloud Shell"
        exit 1
    fi
    
    local account_name
    local subscription_id
    account_name=$(az account show --query name -o tsv)
    subscription_id=$(az account show --query id -o tsv)
    
    print_success "Logged in to Azure"
    print_info "Account: ${account_name}"
    print_info "Subscription ID: ${subscription_id}"
}

################################################################################
# MAIN DEPLOYMENT FUNCTIONS
################################################################################

# Create the App Registration
create_app_registration() {
    print_section "Creating App Registration"
    
    print_info "Creating app registration: ${APP_NAME}"
    print_info "Sign-in audience: ${SIGN_IN_AUDIENCE}"
    
    # Check if app already exists
    local existing_app_id
    existing_app_id=$(az ad app list --display-name "${APP_NAME}" --query "[0].appId" -o tsv)
    
    if [ -n "${existing_app_id}" ]; then
        print_warning "App registration '${APP_NAME}' already exists (App ID: ${existing_app_id})"
        read -p "Do you want to update it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Exiting without changes"
            exit 0
        fi
        APP_ID="${existing_app_id}"
    else
        # Create new app registration
        APP_ID=$(az ad app create \
            --display-name "${APP_NAME}" \
            --sign-in-audience "${SIGN_IN_AUDIENCE}" \
            --query appId -o tsv)
        
        print_success "App registration created successfully"
        print_info "Application (client) ID: ${APP_ID}"
    fi
}

# Configure redirect URIs
configure_redirect_uris() {
    print_section "Configuring Redirect URIs"
    
    print_info "Setting up Single Page Application (SPA) redirect URIs..."
    
    # Build redirect URIs JSON array
    local redirect_uris_json="["
    for i in "${!REDIRECT_URIS[@]}"; do
        if [ "$i" -gt 0 ]; then
            redirect_uris_json+=","
        fi
        redirect_uris_json+="\"${REDIRECT_URIS[$i]}\""
    done
    redirect_uris_json+="]"
    
    # Build the complete SPA JSON payload
    # The spa property needs to be a complete JSON object with redirectUris array
    local spa_payload="{\"redirectUris\":${redirect_uris_json}}"
    
    # Update the app registration with SPA redirect URIs
    # Using --set to configure spa property in the application manifest
    # The spa payload must be a complete JSON object, not just the redirectUris array
    az ad app update \
        --id "${APP_ID}" \
        --set spa="${spa_payload}" \
        --enable-id-token-issuance true \
        --enable-access-token-issuance true
    
    print_success "Redirect URIs configured:"
    for uri in "${REDIRECT_URIS[@]}"; do
        print_info "  - ${uri}"
    done
}

# Configure API permissions
configure_api_permissions() {
    print_section "Configuring API Permissions"
    
    print_info "Adding Microsoft Graph permissions..."
    
    # Add required permissions
    # Format: resourceAppId=<Graph_API_ID> resourceAccess=<PERMISSION_ID>=Scope
    az ad app permission add \
        --id "${APP_ID}" \
        --api "${GRAPH_RESOURCE_ID}" \
        --api-permissions \
            "${OPENID_PERMISSION_ID}=Scope" \
            "${PROFILE_PERMISSION_ID}=Scope" \
            "${EMAIL_PERMISSION_ID}=Scope" \
            "${USER_READ_PERMISSION_ID}=Scope"
    
    print_success "API permissions added:"
    print_info "  - openid"
    print_info "  - profile"
    print_info "  - email"
    print_info "  - User.Read"
    
    print_warning "Note: Admin consent may be required for these permissions"
    print_info "To grant admin consent, run:"
    print_info "  az ad app permission admin-consent --id ${APP_ID}"
}

# Get tenant information
get_tenant_info() {
    print_section "Retrieving Tenant Information"
    
    TENANT_ID=$(az account show --query tenantId -o tsv)
    
    print_success "Tenant ID: ${TENANT_ID}"
}

# Display summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Azure App Registration configured successfully!"
    echo ""
    print_info "Application Details:"
    echo "  - Application Name: ${APP_NAME}"
    echo "  - Application (client) ID: ${APP_ID}"
    echo "  - Directory (tenant) ID: ${TENANT_ID}"
    echo "  - Sign-in Audience: ${SIGN_IN_AUDIENCE}"
    echo ""
    print_info "Redirect URIs:"
    for uri in "${REDIRECT_URIS[@]}"; do
        echo "  - ${uri}"
    done
    echo ""
    print_info "Next Steps:"
    echo "  1. Add the following configuration to your web application:"
    echo ""
    echo "     {" 
    echo "       \"clientId\": \"${APP_ID}\","
    echo "       \"authority\": \"https://login.microsoftonline.com/consumers\","
    echo "       \"redirectUri\": \"${WEB_APP_URL}\""
    echo "     }"
    echo ""
    echo "  2. For personal Microsoft accounts, use authority:"
    echo "     https://login.microsoftonline.com/consumers"
    echo ""
    echo "  3. If admin consent is required, run:"
    echo "     az ad app permission admin-consent --id ${APP_ID}"
    echo ""
    print_warning "Security Reminder:"
    echo "  - Never commit client secrets to source control"
    echo "  - For SPAs, use Authorization Code Flow with PKCE"
    echo "  - Client ID is safe to expose in client-side code"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    print_section "Azure App Registration Deployment"
    print_info "Application: ${APP_NAME}"
    print_info "Target URL: ${WEB_APP_URL}"
    echo ""
    
    # Run validation checks
    check_azure_cli
    check_azure_login
    
    # Perform deployment
    create_app_registration
    configure_redirect_uris
    configure_api_permissions
    get_tenant_info
    
    # Display results
    display_summary
    
    print_section "Deployment Complete"
    print_success "App Registration is ready for use!"
}

# Run main function
main "$@"
