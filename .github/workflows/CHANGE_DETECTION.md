# Change Detection in Production Deployment Workflow

This document explains how the Production Deployment workflow tracks and analyzes changes since the last successful deployment.

## Overview

Even though the workflow is **manual-only**, it provides intelligent change detection to help you make informed deployment decisions. Before each deployment, the workflow:

1. Finds the last successful infrastructure deployment
2. Compares the current code to that deployment
3. Shows what changed (infrastructure vs application files)
4. Provides warnings if you're skipping something that has changed

## How Change Detection Works

### Step 1: Find Last Successful Deployment

The workflow looks for git tags with the pattern `deploy-infra-YYYYMMDD-HHMMSS`:

```bash
# Example tags
deploy-infra-20260102-143052
deploy-infra-20260105-091234
deploy-infra-20260108-164521
```

**Process:**
1. Lists all tags matching `deploy-infra-*`
2. Sorts by version (most recent first)
3. Gets the commit SHA from the most recent tag
4. Falls back to `origin/main` if no deployment tags exist

### Step 2: Compare Current Code to Last Deployment

```bash
LAST_COMMIT="abc123"  # From deployment tag
CURRENT_COMMIT="def456"  # Current HEAD

git diff --name-only "$LAST_COMMIT" "$CURRENT_COMMIT"
```

This shows ALL files changed between the two commits, regardless of how many commits are in between.

### Step 3: Categorize Changes

The workflow categorizes changed files into two groups:

**Infrastructure Files:**
```regex
^(infra|scripts)/
```
- `infra/**` - Bicep templates, parameters, documentation
- `scripts/**` - Deployment scripts, utilities

**Application Files:**
```regex
^(src|api|public|package\.json|package-lock\.json|vite\.config\.ts|staticwebapp\.config\.json)
```
- `src/**` - React frontend code
- `api/**` - Azure Function backend code
- `public/**` - Static assets
- Configuration files

### Step 4: Provide Recommendations

Based on the analysis, the workflow shows:

✅ **What changed:** Infrastructure files, application files, or both

⚠️ **Warnings:** If files changed but you're not deploying them

ℹ️ **Notes:** Additional context about the deployment

## Deployment Tagging

### Why Tag Deployments?

Git tags provide a permanent, immutable reference to successful deployments:

- ✅ **Traceable:** Know exactly what code was deployed and when
- ✅ **Reproducible:** Can checkout the exact deployment state later
- ✅ **Comparable:** Easy to see what changed since last deployment
- ✅ **Auditable:** Complete deployment history in git

### Tag Format

```
deploy-infra-YYYYMMDD-HHMMSS
```

**Examples:**
- `deploy-infra-20260102-143052` - Deployed on Jan 2, 2026 at 14:30:52
- `deploy-infra-20260108-091234` - Deployed on Jan 8, 2026 at 09:12:34

### Tag Content

Each tag includes metadata:

```bash
git show deploy-infra-20260102-143052

tag deploy-infra-20260102-143052
Tagger: github-actions[bot] <github-actions[bot]@users.noreply.github.com>
Date:   Thu Jan 2 14:30:52 2026 +0000

Infrastructure deployment at 20260102-143052

Commit: abc123def456...
Workflow Run: 1234567890
Triggered by: john-doe
```

### When Tags Are Created

Tags are created automatically:
- ✅ After successful infrastructure deployment
- ✅ Only if the `deploy-infra` job completes successfully
- ✅ Pushed to the repository automatically

Tags are NOT created:
- ❌ If infrastructure deployment fails
- ❌ If only application is deployed (no infrastructure)
- ❌ If the workflow is cancelled

## Change Detection Examples

### Example 1: No Changes Since Last Deployment

**Scenario:**
- Last deployment: Commit `abc123` (2 days ago)
- Current commit: `abc123` (same commit)

**Output:**
```
Last deployment commit: abc123
Current commit: abc123

Changes since last deployment:
- Infrastructure files changed: false
- Application files changed: false

ℹ️ No changes detected since last deployment.
```

**Result:** You can deploy with confidence knowing nothing has changed.

---

### Example 2: Infrastructure Changed, Deploying Both

**Scenario:**
- Last deployment: Commit `abc123` (2 days ago)
- Current commit: `def456`
- Changes: `infra/main.bicep`, `src/App.tsx`
- Selected: ✅ Infrastructure, ✅ Application

**Output:**
```
Last deployment commit: abc123
Current commit: def456

Changes since last deployment:
- Infrastructure files changed: true
  - infra/main.bicep
- Application files changed: true
  - src/App.tsx

✅ Deploying both infrastructure and application as expected.
```

**Result:** Workflow deploys infrastructure first, then application.

---

### Example 3: Infrastructure Changed, NOT Deploying Infrastructure

**Scenario:**
- Last deployment: Commit `abc123` (2 days ago)
- Current commit: `def456`
- Changes: `infra/main.bicep`, `src/App.tsx`
- Selected: ❌ Infrastructure, ✅ Application

**Output:**
```
Last deployment commit: abc123
Current commit: def456

Changes since last deployment:
- Infrastructure files changed: true
  - infra/main.bicep
- Application files changed: true
  - src/App.tsx

⚠️ WARNING: Infrastructure files have changed since last deployment,
but infrastructure deployment is not selected.
```

**Result:** Workflow warns you but still deploys application only. This might be intentional (e.g., testing app changes before infrastructure), but the warning ensures you're aware.

---

### Example 4: Only Application Changed

**Scenario:**
- Last deployment: Commit `abc123` (2 days ago)
- Current commit: `def456`
- Changes: `src/components/Dashboard.tsx`, `api/src/functions/user.ts`
- Selected: ❌ Infrastructure, ✅ Application

**Output:**
```
Last deployment commit: abc123
Current commit: def456

Changes since last deployment:
- Infrastructure files changed: false
- Application files changed: true
  - src/components/Dashboard.tsx
  - api/src/functions/user.ts

✅ Deploying application only as expected.
```

**Result:** Workflow deploys application only. No warning because infrastructure hasn't changed.

---

### Example 5: Multiple Commits Between Deployments

**Scenario:**
- Last deployment: Commit `abc123` (1 week ago)
- Current commit: `xyz789`
- Commits in between: 25 commits
- Changes across all commits:
  - 5 commits modified `infra/main.bicep`
  - 15 commits modified application files
  - 5 commits modified documentation only

**Output:**
```
Last deployment commit: abc123 (7 days ago)
Current commit: xyz789

Changes since last deployment (25 commits):
- Infrastructure files changed: true
  - infra/main.bicep
  - scripts/deploy.sh
- Application files changed: true
  - src/** (multiple files)
  - api/** (multiple files)

ℹ️ Note: 25 commits since last deployment. Review changes carefully.
```

**Result:** The workflow compares the full diff, not individual commits. All infrastructure and application changes are detected.

## Comparison: Before vs After Last Deployment

### Understanding "Since Last Deployment"

**Key Concept:** The comparison is **not** between individual commits, but between two **states** of the codebase:

```
State A (Last Deployment):     State B (Current):
Commit: abc123                 Commit: xyz789
Date: 7 days ago              Date: Today
Tagged: deploy-infra-*         Tagged: (will be after deployment)

git diff --name-only abc123 xyz789
```

This shows **ALL changes accumulated** since the last deployment, regardless of:
- How many commits are in between
- Whether commits were squashed or merged
- Branch history or merge strategy

### Visual Example

```
Timeline:

abc123 ─┬─ commit1 ─┬─ commit2 ─┬─ ... ─┬─ xyz789
        │            │            │        │
   Last Deploy    (infra)      (app)   (docs)   Current
   ↓                                              ↓
Tagged:                                      About to deploy:
deploy-infra-*                               - Check diff
                                             - Show changes
                                             - Deploy
                                             - Create new tag
```

**What the workflow sees:**
- Start: `abc123` (last deployment tag)
- End: `xyz789` (current HEAD)
- Changes: Everything that differs between these two points

**What the workflow does NOT see:**
- Individual commit messages
- Merge commits
- Branch history

## Benefits of Change Detection

### 1. Informed Decision Making

**Without change detection:**
```
Run workflow → Check boxes → Hope for the best
```

**With change detection:**
```
Run workflow → See what changed → Make informed choice → Deploy confidently
```

### 2. Prevent Mistakes

**Common mistakes prevented:**
- Deploying app without infrastructure when both changed
- Accidentally skipping infrastructure updates
- Deploying old code (no changes since last deployment)

### 3. Deployment Audit Trail

Git tags provide a complete audit trail:

```bash
# List all deployments
git tag --list "deploy-infra-*"

# See what was deployed when
git log --tags="deploy-infra-*" --oneline --decorate

# Compare two deployments
git diff deploy-infra-20260101-120000 deploy-infra-20260108-120000

# Rollback to previous deployment (if needed)
git checkout deploy-infra-20260101-120000
```

### 4. Better Collaboration

Team members can see:
- When was the last deployment
- What's pending deployment
- Who triggered the last deployment
- What commit was deployed

## Fallback Behavior

### No Deployment Tags Exist

**Scenario:** First deployment or tags were deleted

**Behavior:**
```bash
# Fallback to main branch
LAST_COMMIT=$(git rev-parse origin/main)
```

**Output:**
```
No deployment tag found, using current main branch as comparison point.
```

**Result:** Compares current commit to `origin/main`. This ensures the workflow always has something to compare against.

### Unable to Compare Commits

**Scenario:** Git diff fails (corrupted repo, force push, etc.)

**Behavior:**
```bash
if [ $? -ne 0 ]; then
  echo "::warning::Unable to compare commits. Assuming changes exist."
  echo "infra_files_changed=unknown" >> $GITHUB_OUTPUT
  echo "app_files_changed=unknown" >> $GITHUB_OUTPUT
fi
```

**Output:**
```
⚠️ Unable to compare commits. Change status: unknown
```

**Result:** Workflow continues but doesn't show change information. You can still deploy based on manual inputs.

## Best Practices

### 1. Review Change Detection Output

Always review the "Changes Since Last Deployment" section before deploying:

```
✅ Check: What files changed?
✅ Check: Does the change category match what you expect?
✅ Check: Any warnings about skipped deployments?
```

### 2. Deploy Related Changes Together

If both infrastructure and application changed together:

```
Recommended: ✅ Infrastructure + ✅ Application
Avoid: ✅ Application only (may break if app depends on new infrastructure)
```

### 3. Use Tags for Rollback Planning

Before deploying a major change:

```bash
# Note the current deployment tag
git tag --list "deploy-infra-*" | tail -1

# If deployment fails, you know exactly where to rollback
```

### 4. Don't Delete Deployment Tags

Keep deployment tags in the repository:
- They're small (just a pointer to a commit)
- They provide deployment history
- They enable change detection

If you must clean up, keep at least the last 10-20 tags.

## Summary

**Change detection provides:**
- ✅ Context about what changed since last deployment
- ✅ Warnings if you're skipping necessary deployments
- ✅ Audit trail via git tags
- ✅ Informed decision making

**It does NOT:**
- ❌ Force you to deploy anything
- ❌ Prevent deployments
- ❌ Automatically select deployment options

**You're always in control** - change detection just provides helpful information to make better deployment decisions.
