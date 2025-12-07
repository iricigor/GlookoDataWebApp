#!/usr/bin/env node
/**
 * Hardcoded String Checker
 * 
 * This script detects potential hardcoded user-facing strings in React components
 * that should be using the i18next translation system instead.
 * 
 * It looks for:
 * - JSX text content that looks like user-facing text
 * - String literals in JSX attributes (title, placeholder, aria-label, etc.)
 * 
 * Usage: tsx scripts/check-hardcoded-strings.ts
 * Exit codes:
 *   0 - No issues found (or only acceptable exceptions)
 *   1 - Found hardcoded strings that should use i18n
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface HardcodedStringIssue {
  file: string;
  line: number;
  content: string;
  type: 'jsx-text' | 'jsx-attribute' | 'string-literal';
}

// Patterns that indicate user-facing strings
const USER_FACING_ATTRIBUTES = [
  'title',
  'placeholder',
  'aria-label',
  'aria-description',
  'label',
  'alt'
];

// Patterns to exclude (these are acceptable)
const EXCLUDE_PATTERNS = [
  /^[A-Z_]+$/, // Constants like API_KEY, MAX_VALUE
  /^https?:\/\//, // URLs
  /^\//, // Paths
  /^\d+$/, // Pure numbers
  /^[0-9.]+$/, // Numbers with decimals
  /^[%$€£¥]+$/, // Currency/percentage symbols only
  /^[\s\-_:;,.!?(){}[\]]+$/, // Punctuation only
  /^[a-z]+[A-Z]/, // camelCase identifiers
  /^[A-Z][a-z]+[A-Z]/, // PascalCase identifiers
  /className|style|onClick|onChange|onSubmit|onBlur|onFocus/, // React props
  /console\.(log|error|warn|info)/, // Console statements
  /^\{\{.*\}\}$/, // i18n interpolation variables
  /^[a-z]+:[a-z]+/, // Namespace patterns like "common:appTitle"
  /^data-/, // Data attributes
  /^test-/, // Test identifiers
];

// Files and directories to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /\/tests?\//,
  /\/test-utils\//,
  /\/testUtils\//,
  /\.config\.(ts|js)$/,
  /vite-env\.d\.ts$/,
  /\/dist\//,
  /\/build\//,
  /\/scripts\//,
  /\/docs\//,
  /main\.tsx$/, // Entry point usually has minimal text
];

/**
 * Check if a string looks like user-facing text
 */
function isUserFacingText(text: string): boolean {
  // Must have some alphabetic characters
  if (!/[a-zA-Z]/.test(text)) {
    return false;
  }
  
  // Check if it matches any exclusion pattern
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // Must be at least 3 characters for meaningful text
  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return false;
  }
  
  // Should contain at least one space or be a complete word (for UI labels)
  // Examples: "Save Changes", "Upload File", "Cancel"
  if (trimmed.length > 2 && !/\s/.test(trimmed) && /^[A-Z]/.test(trimmed)) {
    return true; // Capitalized words without spaces (likely UI labels)
  }
  
  return /\s/.test(trimmed) && trimmed.length > 5; // Multi-word text
}

/**
 * Check a TypeScript/TSX file for hardcoded strings
 */
function checkFile(filePath: string): HardcodedStringIssue[] {
  const issues: HardcodedStringIssue[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip import statements, comments, and t() calls
      if (
        line.trim().startsWith('import ') ||
        line.trim().startsWith('//') ||
        line.trim().startsWith('/*') ||
        line.trim().startsWith('*') ||
        /\bt\(['"']/.test(line) || // Already using i18n
        /useTranslation/.test(line)
      ) {
        continue;
      }
      
      // Check for JSX attributes with string literals
      for (const attr of USER_FACING_ATTRIBUTES) {
        const attrPattern = new RegExp(`${attr}=["']([^"']+)["']`, 'g');
        let match;
        
        while ((match = attrPattern.exec(line)) !== null) {
          const value = match[1];
          if (isUserFacingText(value)) {
            issues.push({
              file: filePath,
              line: lineNum,
              content: line.trim(),
              type: 'jsx-attribute'
            });
          }
        }
      }
      
      // Check for JSX text content (basic pattern)
      // This is a simple heuristic - looks for text between > and <
      const jsxTextPattern = />([^<>{}]+)</g;
      let match;
      
      while ((match = jsxTextPattern.exec(line)) !== null) {
        const text = match[1].trim();
        if (text && isUserFacingText(text)) {
          issues.push({
            file: filePath,
            line: lineNum,
            content: line.trim(),
            type: 'jsx-text'
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  
  return issues;
}

/**
 * Recursively scan directory for TypeScript/TSX files
 */
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      
      // Check skip patterns
      if (SKIP_PATTERNS.some(pattern => pattern.test(fullPath))) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else if (fullPath.match(/\.(tsx|ts)$/)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Checking for hardcoded user-facing strings...\n');
  
  const srcPath = join(process.cwd(), 'src');
  const sourceFiles = scanDirectory(srcPath);
  
  console.log(`Scanning ${sourceFiles.length} source files\n`);
  
  const issuesByFile: Record<string, HardcodedStringIssue[]> = {};
  let totalIssues = 0;
  
  for (const file of sourceFiles) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      issuesByFile[file] = issues;
      totalIssues += issues.length;
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ No hardcoded user-facing strings detected!\n');
    process.exit(0);
  }
  
  // Report issues
  console.log(`⚠️  Found ${totalIssues} potential hardcoded string(s):\n`);
  
  for (const [file, issues] of Object.entries(issuesByFile)) {
    const relativePath = relative(process.cwd(), file);
    console.log(`📄 ${relativePath} (${issues.length} issue(s)):`);
    
    for (const issue of issues) {
      console.log(`  Line ${issue.line} (${issue.type}):`);
      console.log(`    ${issue.content}`);
      console.log('');
    }
  }
  
  console.log('ℹ️  These strings might be hardcoded and should use i18next translation:');
  console.log('   Use the t() function: {t("namespace.key")} instead of hardcoded text.\n');
  console.log('⚠️  Note: This is a heuristic check and may have false positives.');
  console.log('   Please review each case manually.\n');
  
  // Don't fail the build for this check, just warn
  // Uncomment the next line to make it fail the build:
  // process.exit(1);
  process.exit(0);
}

main();
