#!/bin/bash
#
# Bicep Infrastructure Verification Script
# 
# This script helps verify the Bicep infrastructure matches the current Azure deployment
# by running what-if analysis and checking for unexpected changes.
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# print_info prints an informational message prefixed with an info icon in blue to stdout.
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# print_success prints the provided message prefixed with a checkmark in green to stdout.
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# print_warning prints a warning message prefixed with a warning emoji and colored yellow. It accepts a single argument: the message text.
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# print_error prints an error message prefixed with a red cross and resets terminal color.
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# print_section prints a blue, framed section header with the given title to stdout.
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# usage displays the help text showing available options, defaults, and examples for the Bicep infrastructure verification script.
usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Verify Bicep infrastructure matches current Azure deployment using what-if analysis.

OPTIONS:
    -h, --help              Show this help message
    -g, --resource-group RG Resource group name (default: Glooko)
    -p, --parameters FILE   Parameter file (default: parameters.current.bicepparam)
    -v, --verbose           Enable verbose output
    --generic               Use generic parameters instead of current

EXAMPLES:
    # Verify current production infrastructure
    $0

    # Verify with generic parameters
    $0 --generic

    # Verify specific resource group
    $0 --resource-group my-rg --parameters parameters.generic.bicepparam

    # Verbose output
    $0 --verbose
EOF
}

# Default values
RESOURCE_GROUP="Glooko"
PARAMETERS_FILE="parameters.current.bicepparam"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -p|--parameters)
            PARAMETERS_FILE="$2"
            shift 2
            ;;
        --generic)
            PARAMETERS_FILE="parameters.generic.bicepparam"
            RESOURCE_GROUP="glooko-rg"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

print_section "Bicep Infrastructure Verification"

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

if ! command -v az &>/dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi
print_success "Azure CLI is installed"

# Check if logged in
if ! az account show &>/dev/null; then
    print_error "Not logged in to Azure. Please run: az login"
    exit 1
fi
print_success "Logged in to Azure"

ACCOUNT_NAME=$(az account show --query name -o tsv)
print_info "Using Azure account: ${ACCOUNT_NAME}"

# Step 2: Check Bicep version
BICEP_VERSION=$(az bicep version 2>/dev/null || echo "unknown")
print_info "Bicep CLI version: ${BICEP_VERSION}"

# Step 3: Validate Bicep files
print_section "Validating Bicep Syntax"

cd "${SCRIPT_DIR}"

print_info "Building main.bicep..."
if az bicep build --file main.bicep; then
    print_success "Bicep syntax is valid"
else
    print_error "Bicep syntax validation failed"
    exit 1
fi

# Step 4: Check if resource group exists
print_section "Checking Resource Group"

if az group show --name "${RESOURCE_GROUP}" &>/dev/null; then
    print_success "Resource group '${RESOURCE_GROUP}' exists"
    RG_LOCATION=$(az group show --name "${RESOURCE_GROUP}" --query location -o tsv)
    print_info "Location: ${RG_LOCATION}"
else
    print_warning "Resource group '${RESOURCE_GROUP}' does not exist"
    print_info "The deployment would create it"
fi

# Step 5: Run what-if analysis
print_section "Running What-If Analysis"

print_info "Using parameter file: ${PARAMETERS_FILE}"
print_info "Target resource group: ${RESOURCE_GROUP}"

WHAT_IF_OUTPUT=$(mktemp)

print_info "Running az deployment group what-if..."
print_info "This may take 1-2 minutes..."

set +e
az deployment group what-if \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file main.bicep \
    --parameters "${PARAMETERS_FILE}" \
    --result-format FullResourcePayloads \
    2>&1 | tee "${WHAT_IF_OUTPUT}"

WHAT_IF_EXIT_CODE=$?
set -e

# Step 6: Analyze what-if results
print_section "What-If Results Analysis"

if [ ${WHAT_IF_EXIT_CODE} -ne 0 ]; then
    print_error "What-if analysis failed"
    print_info "Check the output above for errors"
    rm -f "${WHAT_IF_OUTPUT}"
    exit 1
fi

# Count changes
CREATE_COUNT=$(grep -c "^  + Create" "${WHAT_IF_OUTPUT}" 2>/dev/null || echo "0")
DELETE_COUNT=$(grep -c "^  - Delete" "${WHAT_IF_OUTPUT}" 2>/dev/null || echo "0")
MODIFY_COUNT=$(grep -c "^  ~ Modify" "${WHAT_IF_OUTPUT}" 2>/dev/null || echo "0")
IGNORE_COUNT=$(grep -c "^  \* Ignore" "${WHAT_IF_OUTPUT}" 2>/dev/null || echo "0")
NOCHANGE_COUNT=$(grep -c "^  = NoChange" "${WHAT_IF_OUTPUT}" 2>/dev/null || echo "0")

print_info "Changes detected:"
echo "  - Create:   ${CREATE_COUNT}"
echo "  - Delete:   ${DELETE_COUNT}"
echo "  - Modify:   ${MODIFY_COUNT}"
echo "  - Ignore:   ${IGNORE_COUNT}"
echo "  - NoChange: ${NOCHANGE_COUNT}"

# Determine success
SUCCESS=true

if [ "${CREATE_COUNT}" -gt 0 ]; then
    print_warning "Deployment would CREATE ${CREATE_COUNT} resource(s)"
    print_info "This may be expected for new resources"
    if [ "${VERBOSE}" = true ]; then
        echo ""
        grep "^  + Create" "${WHAT_IF_OUTPUT}" || true
    fi
fi

if [ "${DELETE_COUNT}" -gt 0 ]; then
    print_error "Deployment would DELETE ${DELETE_COUNT} resource(s)"
    print_error "This is likely UNEXPECTED for matching existing infrastructure"
    SUCCESS=false
    if [ "${VERBOSE}" = true ]; then
        echo ""
        grep "^  - Delete" "${WHAT_IF_OUTPUT}" || true
    fi
fi

if [ "${MODIFY_COUNT}" -gt 0 ]; then
    print_warning "Deployment would MODIFY ${MODIFY_COUNT} resource(s)"
    print_info "Review the changes to ensure they are expected"
    if [ "${VERBOSE}" = true ]; then
        echo ""
        grep "^  ~ Modify" "${WHAT_IF_OUTPUT}" || true
    fi
fi

if [ "${IGNORE_COUNT}" -gt 0 ]; then
    print_info "Ignored ${IGNORE_COUNT} non-functional change(s)"
fi

if [ "${NOCHANGE_COUNT}" -gt 0 ]; then
    print_success "${NOCHANGE_COUNT} resource(s) have no changes"
fi

# Clean up
rm -f "${WHAT_IF_OUTPUT}"

# Final verdict
print_section "Verification Result"

if [ "${SUCCESS}" = true ] && [ "${DELETE_COUNT}" -eq 0 ]; then
    print_success "✅ Bicep infrastructure appears to match the current deployment"
    
    if [ "${CREATE_COUNT}" -eq 0 ] && [ "${MODIFY_COUNT}" -eq 0 ]; then
        print_success "No unexpected changes detected - infrastructure is identical"
    else
        print_warning "Some changes detected - review the what-if output above"
    fi
    
    print_info ""
    print_info "Next steps:"
    print_info "1. Review the what-if output carefully"
    print_info "2. If satisfied, you can deploy with:"
    echo ""
    echo "   az deployment group create \\"
    echo "     --resource-group ${RESOURCE_GROUP} \\"
    echo "     --template-file main.bicep \\"
    echo "     --parameters ${PARAMETERS_FILE} \\"
    echo "     --confirm-with-what-if"
    echo ""
else
    print_error "⚠️  Unexpected changes detected in the what-if analysis"
    print_error "Review the output above before proceeding with deployment"
    exit 1
fi