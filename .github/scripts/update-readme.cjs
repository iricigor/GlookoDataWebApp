#!/usr/bin/env node

/**
 * Script to automatically update README.md after PR merges
 * 
 * This script is triggered by GitHub Actions when a PR is merged to main.
 * It updates relevant README sections based on the merged PR's metadata.
 * 
 * Usage: node update-readme.js <pr_number> <pr_title> <pr_labels>
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const [, , prNumber, prTitle, prLabels] = process.argv;

if (!prNumber || !prTitle) {
  console.error('Usage: node update-readme.js <pr_number> <pr_title> <pr_labels>');
  process.exit(1);
}

const labels = prLabels ? prLabels.split(',').map(l => l.trim()) : [];

console.log(`Processing PR #${prNumber}: ${prTitle}`);
console.log(`Labels: ${labels.join(', ') || 'none'}`);

// Read README.md
const readmePath = path.join(__dirname, '../../README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

// Function to update "Recent Updates" section
function updateRecentUpdates(content, prNum, title, lbls) {
  const recentUpdatesMarker = '## 📋 Recent Updates';
  
  // Create new entry with appropriate emoji based on labels
  let emoji = '🔧'; // Default
  if (lbls.includes('✨ Feature')) emoji = '✨';
  else if (lbls.includes('🪲 Bug')) emoji = '🐛';
  else if (lbls.includes('📚 Documentation')) emoji = '📚';
  else if (lbls.includes('⚡ Performance')) emoji = '⚡';
  
  const newEntry = `- ${emoji} **PR #${prNum}**: ${title}`;
  
  // Check if section exists
  if (!content.includes(recentUpdatesMarker)) {
    // Add section before Tech Stack
    const techStackMarker = '## 🛠️ Tech Stack';
    if (content.includes(techStackMarker)) {
      const newSection = `${recentUpdatesMarker}

${newEntry}

`;
      content = content.replace(techStackMarker, newSection + techStackMarker);
      console.log('Added Recent Updates section');
      return content;
    } else {
      console.log('Warning: Tech Stack section not found, cannot add Recent Updates');
      return content;
    }
  } else {
    // Section exists, add new entry at the top
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => line.includes(recentUpdatesMarker));
    
    if (sectionIndex !== -1) {
      // Find the next section or end of updates
      let insertIndex = sectionIndex + 1;
      
      // Skip empty lines after the section header
      while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
        insertIndex++;
      }
      
      // Keep only the 5 most recent updates
      const updateLines = [];
      let currentLine = insertIndex;
      while (currentLine < lines.length && lines[currentLine].startsWith('- ')) {
        updateLines.push(lines[currentLine]);
        currentLine++;
      }
      
      // Add new entry and keep only top 5
      updateLines.unshift(newEntry);
      const topUpdates = updateLines.slice(0, 5);
      
      // Replace the old updates with new ones
      // Remove old update lines and insert new ones
      const numLinesToRemove = currentLine - insertIndex;
      lines.splice(insertIndex, numLinesToRemove, ...topUpdates);
      content = lines.join('\n');
      console.log('Updated Recent Updates section');
    }
  }
  
  return content;
}

// Function to update last modified date
function updateLastModified(content) {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Look for a "Last Updated" line and update it, or add it if it doesn't exist
  const lastUpdatedRegex = /\*\*Last Updated:\*\* .+/;
  if (lastUpdatedRegex.test(content)) {
    content = content.replace(lastUpdatedRegex, `**Last Updated:** ${date}`);
    console.log('Updated last modified date');
  }
  
  return content;
}

// Update README sections
readme = updateRecentUpdates(readme, prNumber, prTitle, labels);
readme = updateLastModified(readme);

// Write updated README
fs.writeFileSync(readmePath, readme, 'utf8');

console.log('✅ README update complete');
