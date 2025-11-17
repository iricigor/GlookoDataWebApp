#!/bin/bash

################################################################################
# Azure Master Deployment Script
# 
# This is the master orchestration script for deploying all Azure resources
# for the GlookoDataWebApp application. It coordinates the execution of
# individual deployment scripts with centralized configuration management.
#
# Features:
#   - Downloads individual deployment scripts from GitHub
#   - Centralized configuration management with local overrides
#   - Validates all configuration arguments across scripts
#   - Supports dry-run mode for validation
#   - Manages execution order and dependencies
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create all resources
#   - Contributor or Owner role on the subscription
#
# Usage:
#   ./deploy-azure-master.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -a, --all               Deploy all resources
#   -d, --dry-run           Validate configuration without deploying
#   -c, --config FILE       Use custom configuration file
#   --create-config         Create a new configuration file interactively
#   --show-config           Display current configuration
#   --download-only         Download scripts without executing
#   -v, --verbose           Enable verbose output
#
# Examples:
#   ./deploy-azure-master.sh --all
#   ./deploy-azure-master.sh --dry-run --show-config
#   ./deploy-azure-master.sh --create-config
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Script version
readonly SCRIPT_VERSION="1.0.0"

# GitHub repository information
readonly GITHUB_REPO="iricigor/GlookoDataWebApp"
readonly GITHUB_BRANCH="${DEPLOY_BRANCH:-main}"
readonly GITHUB_BASE_URL="https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/scripts/deployment"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Temporary directory for downloaded scripts
TEMP_SCRIPT_DIR="${SCRIPT_DIR}/.deploy-temp"

################################################################################
# BOOTSTRAP - Download config-lib.sh if needed
################################################################################

# Source configuration library (download if not present)
if [ ! -f "${SCRIPT_DIR}/config-lib.sh" ]; then
    echo "Downloading config-lib.sh..."
    mkdir -p "${SCRIPT_DIR}"
    curl -sSL "${GITHUB_BASE_URL}/config-lib.sh" -o "${SCRIPT_DIR}/config-lib.sh"
    chmod +x "${SCRIPT_DIR}/config-lib.sh"
fi

source "${SCRIPT_DIR}/config-lib.sh"

################################################################################
# SCRIPT DEFINITIONS
################################################################################

# Array of deployment scripts in execution order
declare -a DEPLOYMENT_SCRIPTS=(
    "deploy-azure-managed-identity.sh"
    "deploy-azure-storage-account.sh"
    "deploy-azure-user-settings-table.sh"
    "deploy-azure-pro-users-table.sh"
    "deploy-azure-app-registration.sh"
    "deploy-azure-static-web-app.sh"
)

# Script descriptions
declare -A SCRIPT_DESCRIPTIONS=(
    ["deploy-azure-managed-identity.sh"]="Create user-assigned managed identity"
    ["deploy-azure-storage-account.sh"]="Create storage account and resource group"
    ["deploy-azure-user-settings-table.sh"]="Create UserSettings table"
    ["deploy-azure-pro-users-table.sh"]="Create ProUsers table (optional)"
    ["deploy-azure-app-registration.sh"]="Configure Microsoft authentication"
    ["deploy-azure-static-web-app.sh"]="Create Static Web App"
)

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << EOF
Azure Master Deployment Script v${SCRIPT_VERSION}

Usage: $(basename "$0") [OPTIONS]

This master script orchestrates the deployment of all Azure resources for
GlookoDataWebApp with centralized configuration management.

Deployment Options:
  -a, --all               Deploy all resources in order
  --identity              Deploy only managed identity
  --storage               Deploy only storage account
  --tables                Deploy only tables (UserSettings, ProUsers)
  --auth                  Deploy only app registration
  --webapp                Deploy only static web app

Configuration Options:
  -c, --config FILE       Use custom configuration file
  --create-config         Create configuration file interactively
  --show-config           Display current configuration
  --edit-config           Edit configuration file

Script Management:
  --download-only         Download scripts without executing
  --clean                 Remove downloaded scripts
  --update-scripts        Update local scripts from GitHub

Other Options:
  -d, --dry-run           Validate configuration without deploying
  -v, --verbose           Enable verbose output
  -h, --help              Show this help message
  --version               Show script version

Configuration Priority:
  1. Command-line arguments (highest)
  2. Configuration file (~/.glookodata/config.json)
  3. Script defaults (lowest)

Examples:
  # Interactive setup
  ./$(basename "$0") --create-config
  ./$(basename "$0") --all

  # Deploy specific components
  ./$(basename "$0") --identity --storage

  # Validate configuration
  ./$(basename "$0") --dry-run --show-config

  # Download scripts for offline use
  ./$(basename "$0") --download-only

  # Use custom configuration
  ./$(basename "$0") --config ~/my-config.json --all

Environment Variables:
  DEPLOY_BRANCH    - GitHub branch for scripts (default: main)
  CONFIG_FILE      - Configuration file location
  All config-lib.sh environment variables are supported

For detailed documentation:
  https://github.com/iricigor/GlookoDataWebApp/tree/main/docs/DEPLOYMENT.md

EOF
}

# Parse command-line arguments
parse_arguments() {
    DEPLOY_ALL=false
    DEPLOY_IDENTITY=false
    DEPLOY_STORAGE=false
    DEPLOY_TABLES=false
    DEPLOY_AUTH=false
    DEPLOY_WEBAPP=false
    DRY_RUN=false
    VERBOSE=false
    DOWNLOAD_ONLY=false
    SHOW_CONFIG=false
    CREATE_CONFIG=false
    EDIT_CONFIG=false
    CLEAN=false
    UPDATE_SCRIPTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --version)
                echo "$(basename "$0") version ${SCRIPT_VERSION}"
                exit 0
                ;;
            -a|--all)
                DEPLOY_ALL=true
                shift
                ;;
            --identity)
                DEPLOY_IDENTITY=true
                shift
                ;;
            --storage)
                DEPLOY_STORAGE=true
                shift
                ;;
            --tables)
                DEPLOY_TABLES=true
                shift
                ;;
            --auth)
                DEPLOY_AUTH=true
                shift
                ;;
            --webapp)
                DEPLOY_WEBAPP=true
                shift
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --create-config)
                CREATE_CONFIG=true
                shift
                ;;
            --show-config)
                SHOW_CONFIG=true
                shift
                ;;
            --edit-config)
                EDIT_CONFIG=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            --download-only)
                DOWNLOAD_ONLY=true
                shift
                ;;
            --clean)
                CLEAN=true
                shift
                ;;
            --update-scripts)
                UPDATE_SCRIPTS=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # If --all is specified, enable all deployments
    if [ "$DEPLOY_ALL" = true ]; then
        DEPLOY_IDENTITY=true
        DEPLOY_STORAGE=true
        DEPLOY_TABLES=true
        DEPLOY_AUTH=true
        DEPLOY_WEBAPP=true
    fi
}

################################################################################
# CONFIGURATION MANAGEMENT
################################################################################

# Create configuration interactively
create_configuration_interactive() {
    print_section "Creating Configuration File"
    
    ensure_config_dir
    
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    
    if [ -f "$config_file" ]; then
        print_warning "Configuration file already exists: $config_file"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing configuration"
            return 0
        fi
    fi
    
    print_info "Creating new configuration file: $config_file"
    echo ""
    
    # Download template
    local template_file="${SCRIPT_DIR}/config.template.json"
    if [ ! -f "$template_file" ]; then
        print_info "Downloading configuration template..."
        curl -sSL "${GITHUB_BASE_URL}/config.template.json" -o "$template_file"
    fi
    
    # Copy template to config location
    cp "$template_file" "$config_file"
    
    print_success "Configuration file created"
    print_info "Location: $config_file"
    echo ""
    print_info "You can now edit this file with your preferred values."
    print_info "Default values are already filled in."
    echo ""
    
    read -p "Do you want to edit the configuration now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        edit_configuration "$config_file"
    fi
}

# Edit configuration file
edit_configuration() {
    local config_file="${1:-${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}}"
    
    if [ ! -f "$config_file" ]; then
        print_error "Configuration file not found: $config_file"
        print_info "Run with --create-config to create one"
        exit 1
    fi
    
    print_section "Editing Configuration"
    
    # Determine available editor
    if command -v code &> /dev/null; then
        print_info "Opening in Cloud Shell editor..."
        code "$config_file"
    elif command -v nano &> /dev/null; then
        print_info "Opening in nano editor..."
        nano "$config_file"
    elif command -v vi &> /dev/null; then
        print_info "Opening in vi editor..."
        vi "$config_file"
    else
        print_error "No editor found"
        print_info "Please edit manually: $config_file"
    fi
}

# Display current configuration
show_configuration() {
    print_section "Current Configuration"
    
    load_config
    
    echo ""
    print_info "Configuration Values:"
    echo "  Resource Group:      ${CONFIG_RESOURCE_GROUP}"
    echo "  Location:            ${CONFIG_LOCATION}"
    echo "  App Name:            ${CONFIG_APP_NAME}"
    echo "  Storage Account:     ${CONFIG_STORAGE_ACCOUNT_NAME}"
    echo "  Managed Identity:    ${CONFIG_MANAGED_IDENTITY_NAME}"
    echo "  Static Web App:      ${CONFIG_STATIC_WEB_APP_NAME}"
    echo "  Static Web App SKU:  ${CONFIG_STATIC_WEB_APP_SKU}"
    echo "  Web App URL:         ${CONFIG_WEB_APP_URL}"
    echo "  App Registration:    ${CONFIG_APP_REGISTRATION_NAME}"
    echo "  Sign-in Audience:    ${CONFIG_SIGN_IN_AUDIENCE}"
    echo "  Use Managed ID:      ${CONFIG_USE_MANAGED_IDENTITY}"
    echo ""
    
    local config_file="${CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"
    if [ -f "$config_file" ]; then
        print_info "Configuration file: $config_file"
    else
        print_info "No configuration file found (using defaults)"
    fi
}

################################################################################
# SCRIPT DOWNLOAD MANAGEMENT
################################################################################

# Download a script from GitHub
download_script() {
    local script_name="$1"
    local dest_dir="${2:-$TEMP_SCRIPT_DIR}"
    
    mkdir -p "$dest_dir"
    
    local url="${GITHUB_BASE_URL}/${script_name}"
    local dest_file="${dest_dir}/${script_name}"
    
    if curl -sSL "$url" -o "$dest_file"; then
        chmod +x "$dest_file"
        return 0
    else
        print_error "Failed to download: $script_name"
        return 1
    fi
}

# Download all deployment scripts
download_all_scripts() {
    print_section "Downloading Deployment Scripts"
    
    print_info "Downloading from: ${GITHUB_REPO} (${GITHUB_BRANCH} branch)"
    print_info "Destination: ${TEMP_SCRIPT_DIR}"
    echo ""
    
    local failed_downloads=0
    
    # Download config library
    print_info "Downloading config-lib.sh..."
    if download_script "config-lib.sh" "$TEMP_SCRIPT_DIR"; then
        print_success "config-lib.sh downloaded"
    else
        ((failed_downloads++))
    fi
    
    # Download config template
    print_info "Downloading config.template.json..."
    if curl -sSL "${GITHUB_BASE_URL}/config.template.json" -o "${TEMP_SCRIPT_DIR}/config.template.json"; then
        print_success "config.template.json downloaded"
    else
        ((failed_downloads++))
    fi
    
    # Download each deployment script
    for script in "${DEPLOYMENT_SCRIPTS[@]}"; do
        print_info "Downloading ${script}..."
        if download_script "$script" "$TEMP_SCRIPT_DIR"; then
            print_success "${script} downloaded"
        else
            ((failed_downloads++))
        fi
    done
    
    echo ""
    if [ $failed_downloads -eq 0 ]; then
        print_success "All scripts downloaded successfully"
        print_info "Scripts location: ${TEMP_SCRIPT_DIR}"
    else
        print_warning "${failed_downloads} script(s) failed to download"
        return 1
    fi
}

# Clean downloaded scripts
clean_scripts() {
    print_section "Cleaning Downloaded Scripts"
    
    if [ -d "$TEMP_SCRIPT_DIR" ]; then
        print_info "Removing: ${TEMP_SCRIPT_DIR}"
        rm -rf "$TEMP_SCRIPT_DIR"
        print_success "Downloaded scripts removed"
    else
        print_info "No downloaded scripts to clean"
    fi
}

# Update local scripts from GitHub
update_scripts() {
    print_section "Updating Scripts"
    
    print_info "Updating scripts from GitHub..."
    
    # Clean old downloads
    clean_scripts
    
    # Download fresh copies
    download_all_scripts
}

################################################################################
# DEPLOYMENT EXECUTION
################################################################################

# Execute a deployment script
execute_script() {
    local script_name="$1"
    local script_path="${TEMP_SCRIPT_DIR}/${script_name}"
    
    if [ ! -f "$script_path" ]; then
        print_error "Script not found: $script_path"
        return 1
    fi
    
    print_section "Executing: ${script_name}"
    print_info "Description: ${SCRIPT_DESCRIPTIONS[$script_name]}"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would execute $script_name"
        return 0
    fi
    
    # Execute the script
    bash "$script_path"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "${script_name} completed successfully"
        return 0
    else
        print_error "${script_name} failed with exit code: $exit_code"
        return $exit_code
    fi
}

# Run deployment based on selected components
run_deployment() {
    print_section "Starting Deployment"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - No resources will be created"
    fi
    
    echo ""
    print_info "Deployment Plan:"
    [ "$DEPLOY_IDENTITY" = true ] && echo "  ✓ Managed Identity"
    [ "$DEPLOY_STORAGE" = true ] && echo "  ✓ Storage Account"
    [ "$DEPLOY_TABLES" = true ] && echo "  ✓ Tables (UserSettings, ProUsers)"
    [ "$DEPLOY_AUTH" = true ] && echo "  ✓ App Registration"
    [ "$DEPLOY_WEBAPP" = true ] && echo "  ✓ Static Web App"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    local failed_count=0
    
    # Execute scripts in order based on selections
    if [ "$DEPLOY_IDENTITY" = true ]; then
        execute_script "deploy-azure-managed-identity.sh" || ((failed_count++))
    fi
    
    if [ "$DEPLOY_STORAGE" = true ]; then
        execute_script "deploy-azure-storage-account.sh" || ((failed_count++))
    fi
    
    if [ "$DEPLOY_TABLES" = true ]; then
        execute_script "deploy-azure-user-settings-table.sh" || ((failed_count++))
        execute_script "deploy-azure-pro-users-table.sh" || ((failed_count++))
    fi
    
    if [ "$DEPLOY_AUTH" = true ]; then
        execute_script "deploy-azure-app-registration.sh" || ((failed_count++))
    fi
    
    if [ "$DEPLOY_WEBAPP" = true ]; then
        execute_script "deploy-azure-static-web-app.sh" || ((failed_count++))
    fi
    
    # Display final summary
    print_section "Deployment Summary"
    
    if [ $failed_count -eq 0 ]; then
        print_success "All deployments completed successfully!"
    else
        print_warning "${failed_count} deployment(s) failed"
        print_info "Check the logs above for details"
        return 1
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Display header
    print_section "Azure Master Deployment Script v${SCRIPT_VERSION}"
    print_info "GlookoDataWebApp Infrastructure Deployment"
    echo ""
    
    # Handle utility actions
    if [ "$CLEAN" = true ]; then
        clean_scripts
        exit 0
    fi
    
    if [ "$UPDATE_SCRIPTS" = true ]; then
        update_scripts
        exit 0
    fi
    
    if [ "$CREATE_CONFIG" = true ]; then
        create_configuration_interactive
        exit 0
    fi
    
    if [ "$EDIT_CONFIG" = true ]; then
        edit_configuration
        exit 0
    fi
    
    # Load configuration
    load_config
    
    if [ "$SHOW_CONFIG" = true ]; then
        show_configuration
        if [ "$DRY_RUN" = false ]; then
            exit 0
        fi
    fi
    
    # Download scripts
    if ! [ -d "$TEMP_SCRIPT_DIR" ] || [ "$UPDATE_SCRIPTS" = true ]; then
        download_all_scripts || exit 1
    fi
    
    if [ "$DOWNLOAD_ONLY" = true ]; then
        print_success "Scripts downloaded successfully"
        exit 0
    fi
    
    # Check if any deployment is selected
    if [ "$DEPLOY_IDENTITY" = false ] && [ "$DEPLOY_STORAGE" = false ] && \
       [ "$DEPLOY_TABLES" = false ] && [ "$DEPLOY_AUTH" = false ] && \
       [ "$DEPLOY_WEBAPP" = false ]; then
        print_warning "No deployment components selected"
        print_info "Use --all or specify individual components (--identity, --storage, etc.)"
        print_info "Use --help for more information"
        exit 0
    fi
    
    # Run prerequisite checks
    check_prerequisites
    
    # Run deployment
    run_deployment
    
    print_section "Deployment Complete"
    print_success "All operations completed!"
    print_info "Check the output above for resource details"
}

# Run main function
main "$@"
