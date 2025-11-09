# GitHub Actions Scripts

This directory contains scripts and documentation for GitHub Actions workflows.

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

- **`BADGE_SETUP.md`** - Complete setup guide for the dynamic badge system
- **`update-test-badge.sh`** - (Deprecated) Legacy script for direct README updates

## Migration Note

The original `update-test-badge.sh` script updated README.md directly and committed changes. This has been replaced with the dynamic badge approach which is cleaner and doesn't create automated commits.
