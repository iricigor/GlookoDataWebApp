#!/bin/bash
# Quick validation script for Bicep templates and parameters
# This script validates the syntax and checks for common issues

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Bicep Template Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Step 1: Validate main Bicep template
echo "Step 1: Validating main.bicep..."
if az bicep build --file main.bicep > /dev/null 2>&1; then
    print_success "main.bicep is valid"
else
    print_error "main.bicep has syntax errors"
    az bicep build --file main.bicep
    exit 1
fi
echo ""

# Step 2: Validate parameter files
echo "Step 2: Validating parameter files..."
for param_file in parameters.current.bicepparam parameters.generic.bicepparam; do
    if [ -f "$param_file" ]; then
        if az bicep build-params --file "$param_file" > /dev/null 2>&1; then
            print_success "$param_file is valid"
        else
            print_error "$param_file has syntax errors"
            az bicep build-params --file "$param_file"
            exit 1
        fi
    else
        print_warning "$param_file not found"
    fi
done
echo ""

# Step 3: Check critical parameters in current deployment
echo "Step 3: Checking critical parameters in parameters.current.bicepparam..."

PARAM_FILE="parameters.current.bicepparam"
if [ ! -f "$PARAM_FILE" ]; then
    print_error "$PARAM_FILE not found"
    exit 1
fi

# Check for CORS configuration
if grep -q "param enableTableCors = true" "$PARAM_FILE"; then
    print_success "Table CORS is enabled"
else
    print_warning "Table CORS might be disabled - check enableTableCors parameter"
fi

# Check for existing hosting plan configuration
if grep -q "param useExistingAppServicePlan = true" "$PARAM_FILE"; then
    print_success "Using existing App Service Plan"
    
    # Check if plan name is specified
    if grep -q "param existingAppServicePlanName = 'WestEuropeLinuxDynamicPlan'" "$PARAM_FILE"; then
        print_success "Existing plan name: WestEuropeLinuxDynamicPlan"
    else
        print_warning "Existing plan name might not be set correctly"
    fi
else
    print_info "Creating new App Service Plan (verify this is intended)"
fi

# Check for App Insights integration
if grep -q "param appInsightsResourceId = '/subscriptions/" "$PARAM_FILE"; then
    print_success "App Insights integration configured"
else
    print_warning "App Insights resource ID might not be set"
fi

echo ""

# Step 4: Validate module files
echo "Step 4: Validating module files..."
for module in modules/*.bicep; do
    if [ -f "$module" ]; then
        module_name=$(basename "$module")
        if az bicep build --file "$module" > /dev/null 2>&1; then
            print_success "$module_name is valid"
        else
            print_error "$module_name has syntax errors"
            az bicep build --file "$module"
            exit 1
        fi
    fi
done
echo ""

# Step 5: Summary and next steps
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
print_success "All Bicep templates are syntactically valid"
print_success "Parameter files are valid"
echo ""
echo "Next Steps:"
echo "  1. Review parameters.current.bicepparam to ensure all settings are correct"
echo "  2. Run what-if analysis:"
echo ""
echo "     az deployment group what-if \\"
echo "       --resource-group Glooko \\"
echo "       --template-file main.bicep \\"
echo "       --parameters parameters.current.bicepparam"
echo ""
echo "  3. Review EXPECTED_WHAT_IF.md for what changes to expect"
echo "  4. If what-if looks good, deploy with:"
echo ""
echo "     az deployment group create \\"
echo "       --resource-group Glooko \\"
echo "       --template-file main.bicep \\"
echo "       --parameters parameters.current.bicepparam \\"
echo "       --confirm-with-what-if"
echo ""
print_info "See WHAT_IF_ANALYSIS.md for detailed explanation of changes"
print_info "See EXPECTED_WHAT_IF.md for expected what-if output and red flags"
echo ""
