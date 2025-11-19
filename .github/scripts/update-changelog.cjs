#!/usr/bin/env node

/**
 * Script to automatically update CHANGELOG.md after PR merges
 * 
 * This script is triggered by GitHub Actions when a PR is merged to main.
 * It adds entries to CHANGELOG.md in the collapsible details format.
 * 
 * Usage: node update-changelog.cjs <pr_number> <pr_title> [pr_labels] [version]
 * 
 * Arguments:
 *   pr_number  - PR number (required)
 *   pr_title   - PR title (required)
 *   pr_labels  - Comma-separated PR labels (optional, default: none)
 *   version    - Version to use (optional, default: read from package.json)
 * 
 * Examples:
 *   node update-changelog.cjs 123 "Fix bug"
 *   node update-changelog.cjs 123 "Fix bug" "bug,priority"
 *   node update-changelog.cjs 123 "Fix bug" "" "1.4.0"
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const [, , prNumber, prTitle, prLabels, versionArg] = process.argv;

if (!prNumber || !prTitle) {
  console.error('Usage: node update-changelog.cjs <pr_number> <pr_title> [pr_labels] [version]');
  process.exit(1);
}

const labels = prLabels ? prLabels.split(',').map(l => l.trim()) : [];

/**
 * Get version from package.json
 */
function getVersionFromPackageJson() {
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    // Extract major.minor from version (e.g., "1.3.0" -> "1.3")
    const version = packageJson.version;
    const match = version.match(/^(\d+\.\d+)/);
    if (match) {
      return match[1];
    }
    console.error(`Warning: Could not parse version from package.json: ${version}`);
    return null;
  } catch (error) {
    console.error(`Warning: Could not read version from package.json: ${error.message}`);
    return null;
  }
}

// Determine version to use
const version = versionArg || getVersionFromPackageJson();
if (!version) {
  console.error('Error: Could not determine version. Please provide version as argument or ensure package.json has a valid version.');
  process.exit(1);
}

console.log(`Processing PR #${prNumber}: ${prTitle}`);
console.log(`Labels: ${labels.join(', ') || 'none'}`);
console.log(`Using version: ${version}.x`);

// Read CHANGELOG.md
const changelogPath = path.join(__dirname, '../../CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

/**
 * Determine which category based on labels
 */
function getCategoryFromLabels(lbls) {
  if (lbls.includes('✨ Feature')) return 'New Features';
  if (lbls.includes('🪲 Bug')) return 'Fixes';
  if (lbls.includes('📚 Documentation')) return 'Documentation';
  return 'Other';
}

/**
 * Create a new CHANGELOG entry in collapsible format
 * Format:
 * <details>
 * <summary>213 Enable smaller data set for "Meal Timing" analysis</summary>
 * 
 * [#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis
 *   - [Auto-generated entry from PR merge]
 * </details>
 */
function createChangelogEntry(prNum, title) {
  return `<details>
<summary>${prNum} ${title}</summary>

[#${prNum}](../../pull/${prNum}) ${title}
  - [Auto-generated entry from PR merge]
</details>
`;
}

/**
 * Add new entry to the appropriate category in the current development version
 */
function addEntryToChangelog(content, prNum, title, lbls, ver) {
  const category = getCategoryFromLabels(lbls);
  const newEntry = createChangelogEntry(prNum, title);
  
  // Find the version section
  const versionMarker = `## [${ver}.x] - Current Development`;
  const versionIndex = content.indexOf(versionMarker);
  
  if (versionIndex === -1) {
    console.error(`Error: Could not find version ${ver}.x section`);
    return content;
  }
  
  // Find the category section
  const categoryMarker = `### ${category}`;
  const categoryIndex = content.indexOf(categoryMarker, versionIndex);
  
  if (categoryIndex === -1) {
    console.error(`Error: Could not find ${category} section in version ${ver}.x`);
    return content;
  }
  
  // Find where to insert the new entry
  // Insert after the category header and any existing entries
  const lines = content.split('\n');
  let insertLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(categoryMarker)) {
      // Found the category, now find the right insertion point
      // Skip past the category header
      insertLine = i + 1;
      
      // Insert at the beginning of the category (after header)
      // This ensures newest entries appear first
      break;
    }
  }
  
  if (insertLine !== -1) {
    lines.splice(insertLine, 0, newEntry);
    content = lines.join('\n');
    console.log(`Added entry to ${category} section`);
  } else {
    console.error('Error: Could not determine insertion point');
  }
  
  return content;
}

// Update CHANGELOG
changelog = addEntryToChangelog(changelog, prNumber, prTitle, labels, version);

// Write updated CHANGELOG
fs.writeFileSync(changelogPath, changelog, 'utf8');

console.log('✅ CHANGELOG update complete');
