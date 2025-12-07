#!/usr/bin/env node
/**
 * Translation Placeholder Checker
 * 
 * This script scans translation files for placeholder markers like [DE], [CS], etc.
 * These markers indicate that a translation hasn't been completed yet.
 * 
 * Usage: tsx scripts/check-translation-placeholders.ts
 * Exit codes:
 *   0 - All translations are complete
 *   1 - Found untranslated placeholders
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Placeholder pattern: [XX] where XX is a language code
// Currently supporting: DE (German), CS (Czech), EN (English)
const PLACEHOLDER_PATTERN = /\[(DE|CS|EN)\]/gi;

interface TranslationIssue {
  file: string;
  key: string;
  value: string;
  placeholders: string[];
}

/**
 * Recursively get all translation keys and values from a nested object
 */
function getAllTranslations(
  obj: Record<string, unknown>,
  prefix = ''
): Array<{ key: string; value: string }> {
  let translations: Array<{ key: string; value: string }> = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      translations = translations.concat(
        getAllTranslations(value as Record<string, unknown>, fullKey)
      );
    } else if (typeof value === 'string') {
      translations.push({ key: fullKey, value });
    }
  }
  
  return translations;
}

/**
 * Check a translation file for placeholders
 */
function checkTranslationFile(filePath: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    const allTranslations = getAllTranslations(translations);
    
    for (const { key, value } of allTranslations) {
      const matches = value.match(PLACEHOLDER_PATTERN);
      if (matches) {
        issues.push({
          file: filePath,
          key,
          value,
          placeholders: matches
        });
      }
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  
  return issues;
}

/**
 * Recursively scan a directory for JSON files
 */
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else if (entry.endsWith('.json')) {
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
  console.log('🔍 Checking for translation placeholders...\n');
  
  const localesPath = join(process.cwd(), 'public/locales');
  const translationFiles = scanDirectory(localesPath);
  
  console.log(`Found ${translationFiles.length} translation files to check\n`);
  
  let totalIssues = 0;
  const issuesByFile: Record<string, TranslationIssue[]> = {};
  
  for (const file of translationFiles) {
    const issues = checkTranslationFile(file);
    if (issues.length > 0) {
      issuesByFile[file] = issues;
      totalIssues += issues.length;
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ All translations are complete! No placeholders found.\n');
    process.exit(0);
  }
  
  // Report issues
  console.log(`❌ Found ${totalIssues} untranslated placeholder(s):\n`);
  
  for (const [file, issues] of Object.entries(issuesByFile)) {
    const relativePath = file.replace(process.cwd(), '.');
    console.log(`📄 ${relativePath} (${issues.length} issue(s)):`);
    
    for (const issue of issues) {
      console.log(`  🔸 Key: ${issue.key}`);
      console.log(`     Value: "${issue.value}"`);
      console.log(`     Placeholders: ${issue.placeholders.join(', ')}`);
      console.log('');
    }
  }
  
  console.log('ℹ️  Translation placeholders like [DE], [CS] indicate incomplete translations.');
  console.log('   Please complete these translations before merging.\n');
  
  process.exit(1);
}

main();
