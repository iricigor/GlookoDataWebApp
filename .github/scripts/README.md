# GitHub Actions Scripts

This directory contains scripts used by GitHub Actions workflows to automate various tasks.

## update-test-badge.sh

**Purpose**: Automatically updates the test count badge in README.md after tests run.

**How it works**:
1. Runs the test suite with JSON reporter to get the exact test count
2. Extracts the total number of tests from the JSON output
3. Compares the current badge count in README.md with the actual test count
4. Updates the badge if the counts differ

**Usage**: 
- Automatically triggered by the `test.yml` workflow on pushes to the `main` branch
- Can be run manually: `bash .github/scripts/update-test-badge.sh`

**Benefits**:
- ✅ No more manual updates when tests are added or removed
- ✅ README badge always reflects the current test count
- ✅ Commits use `[skip ci]` to avoid triggering infinite workflow loops
- ✅ Only runs on main branch, not on PRs

**Example commit message**: `chore: auto-update test count badge [skip ci]`
