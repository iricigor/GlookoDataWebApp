# Path-Based Filtering in Production Deployment Workflow

This document explains how the Production Deployment workflow determines what to deploy based on file changes.

## Overview

The workflow uses **path-based filtering** to intelligently decide whether to deploy infrastructure, application, or both. This prevents unnecessary deployments and ensures infrastructure changes require manual approval while application changes deploy automatically.

## The Question: "No Changes Compared to What?"

When we say "skip infrastructure deployment if no infra changes," we mean:

### For Push Events (Automatic Deployment)

**Comparison:** `github.event.before` → `github.event.after`

- `github.event.before` = The commit SHA **before** the push started
- `github.event.after` = The commit SHA **after** the push completed

**Why this matters:**
This captures **ALL files changed across ALL commits** in the push, not just the last commit.

**Example Scenario:**
```bash
# Developer makes multiple commits
git commit -m "Update infrastructure"     # Changes: infra/main.bicep
git commit -m "Add new feature"           # Changes: src/App.tsx
git commit -m "Update documentation"      # Changes: README.md

# Push all 3 commits at once
git push origin main
```

**What the workflow sees:**
- `before` = commit hash before any of these 3 commits
- `after` = commit hash after all 3 commits
- Files changed = ALL files across all 3 commits
- Result: Both infrastructure AND application deployments are triggered ✅

**If we only compared HEAD^ to HEAD** (wrong approach):
- Would only check the last commit (documentation change)
- Would SKIP both deployments ❌ (incorrect!)

### For Workflow Dispatch (Manual Deployment)

**Comparison:** No file comparison

Instead, the workflow uses manual input checkboxes:
- "Deploy infrastructure" - defaults to `false`
- "Deploy application" - defaults to `true`

The user decides what to deploy.

## File Paths That Trigger Deployments

### Infrastructure Deployment Triggers

Files matching these patterns will trigger infrastructure deployment:

```regex
^(infra|scripts)/
```

**Includes:**
- `infra/**` - All Bicep templates, parameters, documentation
- `scripts/**` - Deployment scripts, helpers, utilities

**Examples:**
- ✅ `infra/main.bicep`
- ✅ `infra/parameters.current.bicepparam`
- ✅ `infra/module_storage.bicep`
- ✅ `scripts/deployment-cli/deploy-azure-function.sh`
- ✅ `scripts/check-translation-placeholders.ts`
- ❌ `src/App.tsx` (application file)
- ❌ `docs/DEPLOYMENT.md` (documentation)

### Application Deployment Triggers

Files matching these patterns will trigger application deployment:

```regex
^(src|api|public|package\.json|package-lock\.json|vite\.config\.ts|staticwebapp\.config\.json)
```

**Includes:**
- `src/**` - React application source code
- `api/**` - Azure Function backend code
- `public/**` - Static assets
- `package.json` - Dependencies
- `package-lock.json` - Locked dependencies
- `vite.config.ts` - Build configuration
- `staticwebapp.config.json` - SWA configuration

**Examples:**
- ✅ `src/components/Dashboard.tsx`
- ✅ `src/App.tsx`
- ✅ `api/src/functions/user-settings.ts`
- ✅ `public/locales/en/translation.json`
- ✅ `package.json`
- ✅ `vite.config.ts`
- ❌ `infra/main.bicep` (infrastructure file)
- ❌ `README.md` (documentation)
- ❌ `tests/e2e/login.spec.ts` (test file - not deployed)

## Implementation in Workflow

### Step 1: Checkout with Full History

```yaml
- name: 📥 Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Fetch all history for proper diff
```

**Why `fetch-depth: 0`?**
- Ensures we have access to both `before` and `after` commits
- Without this, `git diff` would fail

### Step 2: Check Changed Files

```bash
# Get the commit range from GitHub event
BEFORE="${{ github.event.before }}"
AFTER="${{ github.event.after }}"

# Check for infrastructure changes
if git diff --name-only "$BEFORE" "$AFTER" | grep -qE '^(infra|scripts)/'; then
  echo "infra=true" >> $GITHUB_OUTPUT
else
  echo "infra=false" >> $GITHUB_OUTPUT
fi

# Check for application changes
if git diff --name-only "$BEFORE" "$AFTER" | grep -qE '^(src|api|public|package\.json|...)'; then
  echo "app=true" >> $GITHUB_OUTPUT
else
  echo "app=false" >> $GITHUB_OUTPUT
fi
```

### Step 3: Conditional Job Execution

```yaml
deploy-infra:
  needs: check-changes
  if: needs.check-changes.outputs.infra_changed == 'true'
  # Only runs if infrastructure files changed

deploy-app:
  needs: [check-changes, deploy-infra]
  if: |
    always() && 
    needs.check-changes.outputs.app_changed == 'true' && 
    (needs.check-changes.outputs.infra_changed == 'false' || needs.deploy-infra.result == 'success')
  # Only runs if:
  # - Application files changed AND
  # - (Infrastructure didn't change OR infrastructure deployed successfully)
```

## Behavior Examples

### Example 1: Infrastructure Change Only

**Files Changed:**
- `infra/main.bicep` - Modified storage configuration

**Workflow Behavior:**
1. `check-changes` job runs
   - Compares: `before_commit` → `after_commit`
   - Finds: `infra/main.bicep` changed
   - Sets: `infra_changed=true`, `app_changed=false`

2. `deploy-infra` job runs
   - Condition: `infra_changed == true` ✅
   - Waits for manual approval (Infra-Prod environment)
   - Deploys infrastructure after approval

3. `deploy-app` job skipped
   - Condition: `app_changed == false` ❌
   - Skipped

**Result:** ✅ Infrastructure deployed, ⏭️ Application skipped

---

### Example 2: Application Change Only

**Files Changed:**
- `src/components/Dashboard.tsx` - Added new chart
- `src/utils/analytics.ts` - New analytics helper

**Workflow Behavior:**
1. `check-changes` job runs
   - Compares: `before_commit` → `after_commit`
   - Finds: `src/**` files changed
   - Sets: `infra_changed=false`, `app_changed=true`

2. `deploy-infra` job skipped
   - Condition: `infra_changed == false` ❌
   - Skipped

3. `deploy-app` job runs
   - Condition: `app_changed == true` AND `infra_changed == false` ✅
   - Runs immediately (no waiting for deploy-infra)
   - Deploys application

**Result:** ⏭️ Infrastructure skipped, ✅ Application deployed

---

### Example 3: Both Infrastructure and Application Changes

**Files Changed:**
- `infra/main.bicep` - Added new table
- `src/services/api.ts` - Updated to use new table
- `api/src/functions/data.ts` - Backend for new table

**Workflow Behavior:**
1. `check-changes` job runs
   - Compares: `before_commit` → `after_commit`
   - Finds: Both `infra/**` and `src/**`/`api/**` changed
   - Sets: `infra_changed=true`, `app_changed=true`

2. `deploy-infra` job runs
   - Condition: `infra_changed == true` ✅
   - Waits for manual approval
   - Deploys infrastructure after approval

3. `deploy-app` job runs
   - Condition: `app_changed == true` AND `infra_changed == true` ✅
   - **Waits** for `deploy-infra` to complete successfully
   - Then deploys application

**Result:** ✅ Infrastructure deployed first, ✅ Application deployed after

**Why this order matters:**
The application might depend on new infrastructure (e.g., new database table). Deploying infrastructure first ensures the application has everything it needs.

---

### Example 4: Documentation Change Only

**Files Changed:**
- `README.md` - Updated setup instructions
- `docs/DEPLOYMENT.md` - Added new section

**Workflow Behavior:**
1. `check-changes` job runs
   - Compares: `before_commit` → `after_commit`
   - Finds: Only `docs/**` and `README.md` changed
   - Sets: `infra_changed=false`, `app_changed=false`

2. `deploy-infra` job skipped
   - Condition: `infra_changed == false` ❌

3. `deploy-app` job skipped
   - Condition: `app_changed == false` ❌

**Result:** ⏭️ Both deployments skipped (no deployment needed)

---

### Example 5: Multiple Commits in One Push

**Developer Workflow:**
```bash
# Commit 1: Infrastructure change
git add infra/main.bicep
git commit -m "Add new storage table"

# Commit 2: Application change
git add src/App.tsx
git commit -m "Update UI for new feature"

# Commit 3: Documentation
git add README.md
git commit -m "Update docs"

# Push all 3 commits at once
git push origin main
```

**Workflow Behavior:**
1. `check-changes` job runs
   - Compares: `commit_before_push` → `commit_after_all_3_commits`
   - Git diff shows:
     - `infra/main.bicep` (from commit 1) ✅
     - `src/App.tsx` (from commit 2) ✅
     - `README.md` (from commit 3) ❌ (not a deployment trigger)
   - Sets: `infra_changed=true`, `app_changed=true`

2. Both deployments triggered ✅

**Key Point:** The workflow doesn't care about individual commits. It looks at the **total set of files changed** in the entire push.

## Edge Cases and Special Behaviors

### Edge Case 1: First Push to Empty Repository

**Scenario:** `github.event.before` = `0000000000000000000000000000000000000000` (null SHA)

**Behavior:**
- Git diff compares from "nothing" to current state
- All files are considered "changed"
- Both infrastructure and application deployments triggered

**Solution:** This is correct behavior for initial deployment

### Edge Case 2: Force Push

**Scenario:** Force push rewrites history

**Behavior:**
- `github.event.before` points to old (now unreachable) commit
- Git diff may fail or show unexpected results
- Workflow may fail

**Solution:** Force pushes to `main` should be avoided. If necessary, use manual deployment (`workflow_dispatch`)

### Edge Case 3: Merge Commit from PR

**Scenario:** PR merges to main

**Behavior:**
- `github.event.before` = commit on main before merge
- `github.event.after` = merge commit
- Git diff shows all changes from the PR branch

**Result:** Works correctly ✅

### Edge Case 4: Path Filter Doesn't Match Trigger Paths

**Scenario:** Workflow triggered by change to `.github/workflows/deploy-production.yml` (workflow file itself)

**Behavior:**
- File path matches trigger: `paths: ['infra/**', 'scripts/**', ...]` ❌
- Workflow runs, but `check-changes` finds no infra/app changes
- Both deployments skipped

**Solution:** Workflow file changes don't trigger deployment (by design). To deploy after workflow changes, use manual dispatch.

## Debugging Path-Based Filtering

### View What the Workflow Sees

The workflow outputs debug information:

```bash
echo "Comparing changes from $BEFORE to $AFTER"
git diff --name-only "$BEFORE" "$AFTER"
```

This appears in the workflow logs under the "Check changed files" step.

### Manually Test the Logic

```bash
# Set the commit range
BEFORE="abc123"  # Replace with actual commit SHA
AFTER="def456"   # Replace with actual commit SHA

# Check for infrastructure changes
git diff --name-only "$BEFORE" "$AFTER" | grep -E '^(infra|scripts)/'

# Check for application changes
git diff --name-only "$BEFORE" "$AFTER" | grep -E '^(src|api|public|package\.json|package-lock\.json|vite\.config\.ts|staticwebapp\.config\.json)'
```

### Common Issues

**Issue:** Deployment skipped even though files changed

**Causes:**
1. File path doesn't match regex pattern
2. `fetch-depth: 0` missing (can't access history)
3. `before` or `after` commit not available

**Solution:** Check workflow logs for the file list and regex matches

## Security Considerations

### Why Manual Approval for Infrastructure?

Infrastructure changes can:
- Delete resources (data loss)
- Change permissions (security risk)
- Modify configurations (service disruption)
- Incur costs (budget impact)

**Manual approval ensures:**
- Human review before deployment
- Awareness of infrastructure changes
- Ability to abort if needed

### Why Auto-Approval for Application?

Application changes:
- Don't affect infrastructure
- Can be rolled back easily
- Are frequently deployed (agile development)
- Have lower risk

**Auto-approval enables:**
- Faster deployment cycles
- Continuous delivery
- Developer productivity

## Summary

**Path-based filtering compares:**
- All files changed between `github.event.before` and `github.event.after` for push events
- Manual checkboxes for workflow_dispatch events

**Infrastructure files:** `infra/**`, `scripts/**`

**Application files:** `src/**`, `api/**`, `public/**`, config files

**Result:**
- Smart deployments that only run when needed
- Infrastructure requires manual approval
- Application deploys automatically
- Proper execution order when both change

This ensures secure, efficient, and reliable deployments while maintaining developer productivity.
