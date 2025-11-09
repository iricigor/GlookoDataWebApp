# Dynamic Test Badge Setup

This document explains how to set up and use the dynamic test count badge for GlookoDataWebApp.

## How It Works

The test badge uses a **dynamic endpoint badge** approach (similar to the [Glooko repository](https://github.com/iricigor/Glooko)):

1. GitHub Actions runs tests and extracts test statistics
2. The workflow uses `schneegans/dynamic-badges-action` to update a GitHub Gist with test data
3. The badge in README.md reads from the Gist endpoint URL
4. The badge updates automatically without committing to the repository

## Setup Instructions

### 1. Create a GitHub Gist

1. Go to https://gist.github.com/
2. Create a **public** gist with filename: `glookodata-webapp-tests.json`
3. Initial content (will be auto-updated):
   ```json
   {
     "schemaVersion": 1,
     "label": "tests",
     "message": "122/122 passing",
     "color": "brightgreen"
   }
   ```
4. Save the gist and note the **Gist ID** from the URL (e.g., `7d87b86e6e187d46c3d1da7b851e3207`)

### 2. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: `GlookoDataWebApp Test Badge`
4. Select scope: **`gist`** (only this permission is needed)
5. Generate token and copy it immediately (you won't be able to see it again)

### 3. Add the Token as a Repository Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GIST_TOKEN`
4. Value: Paste the personal access token from step 2
5. Click "Add secret"

### 4. Update the Workflow File

Edit `.github/workflows/test.yml` and replace `TBD-CREATE-NEW-GIST` with your actual Gist ID:

```yaml
- name: Update Test Count Badge
  uses: schneegans/dynamic-badges-action@v1.7.0
  if: github.ref == 'refs/heads/main' && always()
  with:
    auth: ${{ secrets.GIST_TOKEN }}
    gistID: YOUR-GIST-ID-HERE  # Replace with actual Gist ID
    filename: glookodata-webapp-tests.json
    label: tests
    message: ${{ env.TESTS_PASSED }}/${{ env.TESTS_TOTAL }} passing
    color: ${{ env.TESTS_FAILED == '0' && 'brightgreen' || 'critical' }}
```

### 5. Update the README Badge

Replace the current static badge in `README.md`:

```markdown
<!-- OLD: Static badge -->
[![Tests](https://img.shields.io/badge/tests-122%20passing-brightgreen)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)

<!-- NEW: Dynamic endpoint badge -->
[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/iricigor/YOUR-GIST-ID/raw/glookodata-webapp-tests.json)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)
```

Replace `YOUR-GIST-ID` with your actual Gist ID.

## Benefits

✅ **No repository commits** - Badge updates without creating commits  
✅ **Always accurate** - Updates automatically after each test run on main  
✅ **Clean git history** - No automated commit noise  
✅ **Works on forks** - Each fork can have its own badge with their own gist  
✅ **Real-time updates** - Badge updates within seconds of tests completing  

## How the Badge Updates

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Push to main branch                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions runs tests                                │
│    - npm test -- --run --reporter=json                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Extract test statistics                                  │
│    - TESTS_TOTAL, TESTS_PASSED, TESTS_FAILED               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Update Gist via dynamic-badges-action                    │
│    - Updates glookodata-webapp-tests.json                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Badge in README automatically reflects new count         │
│    - Reads from Gist endpoint URL                           │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Badge shows "invalid"
- Check that the Gist is **public** (not secret)
- Verify the Gist ID and filename in the workflow match the README URL
- Ensure the JSON file in the Gist has valid syntax

### Badge doesn't update
- Verify `GIST_TOKEN` secret is set correctly in repository settings
- Check that the token has `gist` permission
- Review GitHub Actions logs for the "Update Test Count Badge" step

### Token expired
- Personal access tokens can expire
- Create a new token and update the `GIST_TOKEN` secret

## Example from Glooko Repository

See the working implementation in the [Glooko repository](https://github.com/iricigor/Glooko):
- Workflow: [test.yml](https://github.com/iricigor/Glooko/blob/main/.github/workflows/test.yml)
- Gist: [glooko-windows-tests.json](https://gist.githubusercontent.com/iricigor/7d87b86e6e187d46c3d1da7b851e3207/raw/glooko-windows-tests.json)
- Badge: [![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/iricigor/7d87b86e6e187d46c3d1da7b851e3207/raw/glooko-windows-tests.json)](https://github.com/iricigor/Glooko/actions/workflows/test.yml)
