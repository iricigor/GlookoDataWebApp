#!/usr/bin/env node

/**
 * Test script for update-readme.js
 * 
 * This tests the README update automation without modifying the actual README.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing README update script...\n');

// Create a backup of the current README
const readmePath = path.join(__dirname, '../../README.md');
const backupPath = path.join(__dirname, '../../README.md.backup');

fs.copyFileSync(readmePath, backupPath);

try {
  // Test 1: Feature PR
  console.log('Test 1: Feature PR');
  execSync('node .github/scripts/update-readme.cjs 123 "Add new feature" "✨ Feature"', {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit'
  });
  
  // Read and verify changes
  let readme = fs.readFileSync(readmePath, 'utf8');
  if (readme.includes('PR #123') && readme.includes('Add new feature')) {
    console.log('✅ Test 1 passed\n');
  } else {
    console.error('❌ Test 1 failed\n');
    process.exit(1);
  }
  
  // Test 2: Bug fix PR
  console.log('Test 2: Bug fix PR');
  execSync('node .github/scripts/update-readme.cjs 124 "Fix critical bug" "🪲 Bug"', {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit'
  });
  
  readme = fs.readFileSync(readmePath, 'utf8');
  if (readme.includes('PR #124') && readme.includes('Fix critical bug')) {
    console.log('✅ Test 2 passed\n');
  } else {
    console.error('❌ Test 2 failed\n');
    process.exit(1);
  }
  
  // Test 3: Verify only top 5 are kept
  console.log('Test 3: Adding multiple PRs (should keep only top 5)');
  for (let i = 125; i <= 130; i++) {
    execSync(`node .github/scripts/update-readme.cjs ${i} "PR ${i}" "✨ Feature"`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe'
    });
  }
  
  readme = fs.readFileSync(readmePath, 'utf8');
  const recentSection = readme.split('## 📋 Recent Updates')[1]?.split('##')[0] || '';
  const updateCount = (recentSection.match(/^- /gm) || []).length;
  
  if (updateCount <= 5) {
    console.log(`✅ Test 3 passed (${updateCount} updates shown)\n`);
  } else {
    console.error(`❌ Test 3 failed (${updateCount} updates shown, expected max 5)\n`);
    process.exit(1);
  }
  
  console.log('✅ All tests passed!');
  
  // Show the updated section
  console.log('\n📋 Recent Updates section preview:');
  console.log(recentSection.trim());
  
} finally {
  // Restore the original README
  fs.copyFileSync(backupPath, readmePath);
  fs.unlinkSync(backupPath);
  console.log('\n🔄 README restored to original state');
}
