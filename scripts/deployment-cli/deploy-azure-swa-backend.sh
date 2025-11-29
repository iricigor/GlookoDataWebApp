#!/bin/bash

################################################################################
# Azure Static Web App Backend Linking Script
# 
# This script links an Azure Function App as the backend for an Azure Static
# Web App. This enables /api/* routes to be proxied to the Function App.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to modify resources
#   - Static Web App must exist
#   - Function App must exist
#
# Usage:
#   ./deploy-azure-swa-backend.sh [OPTIONS]
#
# Options:
#   -h, --help                  Show this help message
#   -n, --swa-name NAME         Static Web App name (default from config)
#   -f, --function-name NAME    Function App name (default from config)
#   -g, --resource-group RG     Resource group name (default from config)
#   -l, --location LOCATION     Azure region for backend (default from config)
#   -c, --config FILE           Custom configuration file path
#   -s, --save                  Save configuration after deployment
#   -v, --verbose               Enable verbose output
#
# Examples:
#   ./deploy-azure-swa-backend.sh
#   ./deploy-azure-swa-backend.sh --swa-name my-swa --function-name my-func
#   ./deploy-azure-swa-backend.sh --location westus2 --save
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
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << 'EOF'
Azure Static Web App Backend Linking Script

Links an Azure Function App as the backend for an Azure Static Web App.
This enables /api/* routes to be proxied to the Function App.

Usage: ./deploy-azure-swa-backend.sh [OPTIONS]

Options:
  -h, --help                  Show this help message
  -n, --swa-name NAME         Static Web App name
  -f, --function-name NAME    Function App name
  -g, --resource-group RG     Resource group name
  -l, --location LOCATION     Azure region for backend
  -c, --config FILE           Custom configuration file path
  -s, --save                  Save configuration after deployment
  -v, --verbose               Enable verbose output

Examples:
  ./deploy-azure-swa-backend.sh
  ./deploy-azure-swa-backend.sh --swa-name my-swa --function-name my-func
  ./deploy-azure-swa-backend.sh --location westus2 --save

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
            -n|--swa-name)
                STATIC_WEB_APP_NAME="$2"
                shift 2
                ;;
            -f|--function-name)
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
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

################################################################################
# RESOURCE VERIFICATION FUNCTIONS
################################################################################

# Verify that required resources exist
verify_prerequisites() {
    print_section "Verifying Prerequisites"
    
    local has_errors=false
    
    # Check for Static Web App
    if resource_exists "staticwebapp" "${STATIC_WEB_APP_NAME}" "${RESOURCE_GROUP}"; then
        print_success "Static Web App '${STATIC_WEB_APP_NAME}' exists"
    else
        print_error "Static Web App '${STATIC_WEB_APP_NAME}' not found"
        has_errors=true
    fi
    
    # Check for Function App
    if resource_exists "functionapp" "${FUNCTION_APP_NAME}" "${RESOURCE_GROUP}"; then
        print_success "Function App '${FUNCTION_APP_NAME}' exists"
    else
        print_error "Function App '${FUNCTION_APP_NAME}' not found"
        print_info "Run deploy-azure-function.sh first"
        has_errors=true
    fi
    
    if [ "${has_errors}" = true ]; then
        print_error "Prerequisites check failed"
        exit 1
    fi
}

################################################################################
# BACKEND LINKING FUNCTIONS
################################################################################

# Get the current linked backend (if any)
get_linked_backend() {
    az staticwebapp backends list \
        --name "${STATIC_WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query "[?backendResourceId!=null].backendResourceId" \
        -o tsv 2>/dev/null || echo ""
}

# Get the Function App resource ID
get_function_resource_id() {
    az functionapp show \
        --name "${FUNCTION_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query id \
        -o tsv 2>/dev/null
}

# Link the Function App to the Static Web App
link_backend() {
    print_section "Linking Backend"
    
    # Check if backend is already linked
    local existing_backend
    existing_backend=$(get_linked_backend)
    
    if [ -n "${existing_backend}" ]; then
        print_warning "Backend already linked: ${existing_backend}"
        
        # Check if it's the same function app
        if echo "${existing_backend}" | grep -q "${FUNCTION_APP_NAME}"; then
            print_info "The correct Function App is already linked"
            BACKEND_LINKED=true
            return 0
        else
            print_warning "A different backend is linked. Unlinking first..."
            
            # Unlink the existing backend
            az staticwebapp backends unlink \
                --name "${STATIC_WEB_APP_NAME}" \
                --resource-group "${RESOURCE_GROUP}" \
                --output none 2>/dev/null || true
            
            print_success "Previous backend unlinked"
        fi
    fi
    
    # Get Function App resource ID
    local function_resource_id
    function_resource_id=$(get_function_resource_id)
    
    if [ -z "${function_resource_id}" ]; then
        print_error "Could not get Function App resource ID"
        exit 1
    fi
    
    print_info "Function App Resource ID: ${function_resource_id}"
    print_info "Linking Function App to Static Web App..."
    
    # Link the backend
    az staticwebapp backends link \
        --name "${STATIC_WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --backend-resource-id "${function_resource_id}" \
        --backend-region "${LOCATION}" \
        --output none
    
    print_success "Backend linked successfully!"
    BACKEND_LINKED=true
}

# Verify the backend is linked correctly
verify_backend() {
    print_section "Verifying Backend Link"
    
    local linked_backend
    linked_backend=$(get_linked_backend)
    
    if [ -z "${linked_backend}" ]; then
        print_error "Backend is not linked"
        return 1
    fi
    
    if echo "${linked_backend}" | grep -q "${FUNCTION_APP_NAME}"; then
        print_success "Backend verified: ${linked_backend}"
        return 0
    else
        print_error "Unexpected backend linked: ${linked_backend}"
        return 1
    fi
}

################################################################################
# OUTPUT FUNCTIONS
################################################################################

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "Static Web App backend configured successfully!"
    echo ""
    echo "  Resource Group:      ${RESOURCE_GROUP}"
    echo "  Static Web App:      ${STATIC_WEB_APP_NAME}"
    echo "  Function App:        ${FUNCTION_APP_NAME}"
    echo "  Backend Region:      ${LOCATION}"
    echo ""
    echo "API endpoints:"
    echo "  The /api/* routes on your Static Web App will now be"
    echo "  proxied to the linked Function App."
    echo ""
    echo "Next Steps:"
    echo "  1. Deploy your function code to the Function App"
    echo "  2. Test the API endpoints via the Static Web App URL"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure Static Web App Backend Linking"
    print_info "Static Web App: ${STATIC_WEB_APP_NAME}"
    print_info "Function App: ${FUNCTION_APP_NAME}"
    print_info "Resource Group: ${RESOURCE_GROUP}"
    print_info "Backend Region: ${LOCATION}"
    
    check_prerequisites
    verify_prerequisites
    link_backend
    verify_backend
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
