# GitHub Actions Scripts

This directory contains scripts and documentation for GitHub Actions workflows.

## Automated README Updates

The repository uses an **automated README update system** that triggers when PRs are merged to main.

### How It Works

1. When a PR is merged to the main branch, the `update-readme.yml` workflow triggers
2. The workflow extracts PR metadata (number, title, labels)
3. The `update-readme.cjs` script updates the "Recent Updates" section in README.md
4. Updates are automatically committed and pushed to main
5. Only the 5 most recent updates are kept in the README

### Benefits

✅ **No manual updates** - README stays current automatically  
✅ **Main branch only** - No conflicts on feature branches  
✅ **Clean history** - Changes tracked in git with clear commit messages  
✅ **Emoji indicators** - Updates tagged with appropriate emoji based on PR labels  

### PR Label Mapping

The script uses PR labels to determine the emoji for each update:

- `✨ Feature` → ✨ (sparkles)
- `🪲 Bug` → 🐛 (bug)
- `📚 Documentation` → 📚 (books)
- `⚡ Performance` → ⚡ (zap)
- Default (no label) → 🔧 (wrench)

## Dynamic Test Badge System

The repository uses a **dynamic badge** approach for displaying test counts in README.md.

### How It Works

Instead of committing badge updates to the repository, the system:
1. Runs tests and extracts statistics via GitHub Actions
2. Updates a GitHub Gist with the test data using `schneegans/dynamic-badges-action`
3. The README badge reads from the Gist endpoint URL
4. Updates happen automatically without creating commits

### Setup Instructions

See **[BADGE_SETUP.md](BADGE_SETUP.md)** for complete setup instructions including:
- Creating a GitHub Gist
- Generating a personal access token
- Configuring repository secrets
- Updating the workflow and README

### Benefits

✅ **No repository commits** - Clean git history without automated commits  
✅ **Always accurate** - Badge updates automatically after tests run  
✅ **Real-time updates** - Changes reflect within seconds  
✅ **Works on forks** - Each fork can maintain its own badge  

### Example

This approach is used successfully in the [Glooko repository](https://github.com/iricigor/Glooko).

## Files

- **`update-readme.cjs`** - Script that updates README.md after PR merges
- **`test-update-readme.cjs`** - Test script for README automation
- **`BADGE_SETUP.md`** - Complete setup guide for the dynamic badge system
- **`update-test-badge.sh.deprecated`** - (Deprecated) Legacy script for direct README updates
- **`README.md`** - This file, documenting all automation scripts

## Migration Note

The original `update-test-badge.sh` script updated README.md directly and committed changes. This has been replaced with the dynamic badge approach which is cleaner and doesn't create automated commits.
