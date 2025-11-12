# Automated README Updates

This document explains how the automated README update system works in this repository.

## Overview

When a pull request is merged to the `main` branch, a GitHub Action automatically updates the README.md file with information about the merged PR. This ensures the README stays current without manual intervention and prevents conflicts on feature branches.

## How It Works

### Workflow Trigger

The automation is triggered when:
1. A pull request is **merged** (not just closed) to the `main` branch
2. The GitHub Action `update-readme.yml` runs
3. It extracts the PR number, title, and labels
4. Calls the update script to modify README.md
5. Commits and pushes changes back to `main` (if any changes were made)

### What Gets Updated

The script maintains a **"Recent Updates"** section in the README that shows the 5 most recent merged PRs. Each entry includes:
- An emoji based on the PR's label
- The PR number (linked)
- The PR title

Example output:
```markdown
## 📋 Recent Updates

- ✨ **PR #123**: Add new AI analysis feature
- 🐛 **PR #122**: Fix data upload bug
- 📚 **PR #121**: Update documentation
- ⚡ **PR #120**: Improve performance
- 🔧 **PR #119**: Refactor code
```

### Label to Emoji Mapping

The PR labels determine which emoji appears:

| Label | Emoji | Meaning |
|-------|-------|---------|
| `✨ Feature` | ✨ | New feature |
| `🪲 Bug` | 🐛 | Bug fix |
| `📚 Documentation` | 📚 | Documentation update |
| `⚡ Performance` | ⚡ | Performance improvement |
| (no label) | 🔧 | General change |

## Best Practices

### For Contributors

1. **Add appropriate labels** to your PRs to get the right emoji in the README
2. **Write clear PR titles** as they appear directly in the README
3. **Don't manually edit** the "Recent Updates" section - it's auto-generated
4. The automation runs only on main, so **feature branches aren't affected**

### For Maintainers

1. **Review PR titles** before merging to ensure they're clear and concise
2. **Apply correct labels** to PRs for proper categorization
3. The workflow uses `[skip ci]` to **prevent infinite loops**
4. Changes are committed by `github-actions[bot]`

## Configuration

### Workflow File

Location: `.github/workflows/update-readme.yml`

Key settings:
- Triggers on `pull_request` with type `closed`
- Runs only if `github.event.pull_request.merged == true`
- Requires `contents: write` permission
- Uses `[skip ci]` in commit message

### Update Script

Location: `.github/scripts/update-readme.cjs`

Features:
- Written in CommonJS for GitHub Actions compatibility
- Keeps maximum 5 recent updates
- Inserts section before "Tech Stack" if not present
- Smart emoji selection based on labels

### Testing

Location: `.github/scripts/test-update-readme.cjs`

Run tests locally:
```bash
node .github/scripts/test-update-readme.cjs
```

This creates a temporary backup, runs tests, and restores the original README.

## Troubleshooting

### README Not Updating

1. Check if PR was actually merged (not just closed)
2. Verify the workflow ran: Go to Actions tab in GitHub
3. Check workflow logs for errors
4. Ensure PR had proper metadata (number, title)

### Wrong Emoji

- Check PR labels - emoji is based on the label
- Default emoji (🔧) is used if no matching label

### Section Not Created

- Ensure README has a "## 🛠️ Tech Stack" section
- The "Recent Updates" section is inserted before it

## Future Enhancements

Possible improvements:
- Update version numbers automatically
- Generate contributor list
- Update feature list based on merged features
- Add release notes generation

## Related Documentation

- [GitHub Actions Scripts README](.github/scripts/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Pull Request Template](.github/ISSUE_TEMPLATE/)

---

**Note**: This automation only affects the `main` branch. Feature branches and local work are never modified by this system.
