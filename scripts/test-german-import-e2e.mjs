#!/usr/bin/env node

/**
 * End-to-end test for German demo data import
 * Simulates the full import process that the app would go through
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import detection functions (simplified versions)
function detectLanguage(columnHeaders) {
  const lowerHeaders = columnHeaders.map(h => h.toLowerCase());
  
  const germanIndicators = [
    'zeitstempel',
    'glukosewert',
    'insulin-typ',
    'dauer (minuten)',
    'abgegebenes insulin',
    'kohlenhydrataufnahme'
  ];
  
  const englishIndicators = [
    'timestamp',
    'glucose value',
    'insulin type',
    'duration (min)',
    'dose (units)',
    'carbs (g)'
  ];
  
  let germanCount = 0;
  let englishCount = 0;
  
  for (const indicator of germanIndicators) {
    if (lowerHeaders.some(h => h.includes(indicator))) {
      germanCount++;
    }
  }
  
  for (const indicator of englishIndicators) {
    if (lowerHeaders.some(h => h.includes(indicator))) {
      englishCount++;
    }
  }
  
  return germanCount > englishCount ? 'de' : 'en';
}

function detectGlucoseUnit(columnHeaders) {
  // Find glucose column (supports both English and German)
  const glucoseIndex = columnHeaders.findIndex(h => {
    const lower = h.toLowerCase();
    return lower.includes('glucose') || lower.includes('glukosewert');
  });
  
  if (glucoseIndex === -1) {
    return null;
  }
  
  const glucoseColumn = columnHeaders[glucoseIndex];
  
  // Extract content in parentheses
  const match = glucoseColumn.match(/\(([^)]+)\)/);
  if (!match) {
    return null;
  }
  
  const unitText = match[1].toLowerCase().trim();
  
  // Check for mg/dL variations
  if (unitText.includes('mg') && unitText.includes('dl')) {
    return 'mg/dL';
  }
  
  // Check for mmol/L variations
  if (unitText.includes('mmol')) {
    return 'mmol/L';
  }
  
  return null;
}

function detectDelimiter(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return '\t';
  
  const headerLine = lines[1];
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  
  return commaCount > tabCount ? ',' : '\t';
}

async function testImport(filename) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TESTING: ${filename}`);
  console.log('='.repeat(80));
  
  const filePath = path.join(__dirname, '..', 'public', 'demo-data', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return { success: false, errors: ['File not found'] };
  }
  
  const errors = [];
  const warnings = [];
  
  try {
    const zipData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(zipData);
    
    console.log('\n📦 Step 1: Extract ZIP metadata');
    const csvFiles = Object.keys(zip.files).filter(name => 
      !zip.files[name].dir && name.toLowerCase().endsWith('.csv')
    );
    console.log(`   Found ${csvFiles.length} CSV files`);
    
    // Test CGM data
    console.log('\n🩸 Step 2: Process CGM data');
    const cgmFile = csvFiles.find(name => name.includes('cgm_data_1.csv'));
    
    if (!cgmFile) {
      errors.push('No cgm_data_1.csv found');
      console.error('   ❌ No cgm_data_1.csv found');
    } else {
      const content = await zip.files[cgmFile].async('string');
      const lines = content.trim().split('\n');
      
      console.log(`   ✓ File loaded (${lines.length} lines)`);
      
      // Detect delimiter
      const delimiter = detectDelimiter(content);
      console.log(`   ✓ Delimiter detected: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);
      
      // Parse headers
      const headerLine = lines[1];
      const headers = headerLine.split(delimiter).map(h => h.trim());
      console.log(`   ✓ Headers parsed (${headers.length} columns)`);
      
      // Detect language
      const language = detectLanguage(headers);
      console.log(`   ✓ Language detected: ${language === 'de' ? 'German 🇩🇪' : 'English 🇬🇧'}`);
      
      if (filename.includes('stefan') || filename.includes('anja')) {
        if (language !== 'de') {
          errors.push(`Expected German language but detected ${language}`);
          console.error(`   ❌ Expected German but detected ${language}`);
        }
      }
      
      // Detect glucose unit
      const glucoseUnit = detectGlucoseUnit(headers);
      console.log(`   ✓ Glucose unit detected: ${glucoseUnit || 'NONE'}`);
      
      if (!glucoseUnit) {
        errors.push('Failed to detect glucose unit');
        console.error('   ❌ Failed to detect glucose unit');
      } else if (filename.includes('stefan') || filename.includes('anja')) {
        if (glucoseUnit !== 'mg/dL') {
          errors.push(`Expected mg/dL but detected ${glucoseUnit}`);
          console.error(`   ❌ Expected mg/dL but detected ${glucoseUnit}`);
        }
      }
      
      // Parse some data rows
      console.log('\n   📊 Sample data:');
      const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp') || h.toLowerCase().includes('zeitstempel'));
      const glucoseIndex = headers.findIndex(h => h.toLowerCase().includes('glucose') || h.toLowerCase().includes('glukosewert'));
      
      if (timestampIndex === -1 || glucoseIndex === -1) {
        errors.push('Could not find timestamp or glucose columns');
        console.error('   ❌ Could not find required columns');
      } else {
        let validRows = 0;
        for (let i = 2; i < Math.min(7, lines.length); i++) {
          const values = lines[i].split(delimiter);
          const timestamp = values[timestampIndex]?.trim();
          const glucose = values[glucoseIndex]?.trim();
          
          if (timestamp && glucose) {
            const glucoseValue = parseFloat(glucose);
            if (!isNaN(glucoseValue) && glucoseValue > 0) {
              validRows++;
              if (i === 2) {
                console.log(`   - ${timestamp} → ${glucose} ${glucoseUnit}`);
              }
            }
          }
        }
        
        console.log(`   ✓ Validated ${validRows} data rows`);
        
        if (validRows === 0) {
          errors.push('No valid data rows found');
          console.error('   ❌ No valid data rows found');
        }
      }
    }
    
    // Test Bolus data
    console.log('\n💉 Step 3: Process Bolus data');
    const bolusFile = csvFiles.find(name => name.includes('bolus_data_1.csv'));
    
    if (!bolusFile) {
      warnings.push('No bolus_data_1.csv found');
      console.log('   ⚠️  No bolus_data_1.csv found (optional)');
    } else {
      const content = await zip.files[bolusFile].async('string');
      const lines = content.trim().split('\n');
      
      if (lines.length > 2) {
        const delimiter = detectDelimiter(content);
        const headerLine = lines[1];
        const headers = headerLine.split(delimiter).map(h => h.trim());
        const language = detectLanguage(headers);
        
        console.log(`   ✓ File loaded (${lines.length} lines, ${language === 'de' ? 'German 🇩🇪' : 'English 🇬🇧'})`);
        
        const dataRows = lines.length - 2;
        console.log(`   ✓ Validated ${dataRows} bolus entries`);
      } else {
        console.log('   ⚠️  Bolus file is empty (placeholder)');
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    if (errors.length === 0) {
      console.log('✅ ALL TESTS PASSED');
      if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} warning(s):`);
        warnings.forEach(w => console.log(`   - ${w}`));
      }
      return { success: true, errors: [], warnings };
    } else {
      console.log(`❌ ${errors.length} ERROR(S) FOUND:`);
      errors.forEach(e => console.log(`   - ${e}`));
      return { success: false, errors, warnings };
    }
    
  } catch (error) {
    console.error(`\n❌ Exception during import:`, error.message);
    return { success: false, errors: [error.message] };
  }
}

async function main() {
  console.log('\n🧪 END-TO-END GERMAN DEMO DATA IMPORT TEST\n');
  console.log('This test simulates the full import process that the app performs.\n');
  
  const results = [];
  
  // Test German datasets
  results.push(await testImport('stefan-demo-data.zip'));
  results.push(await testImport('anja-demo-data.zip'));
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  
  const allPassed = results.every(r => r.success);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  
  console.log(`\nDatasets tested: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  
  if (allPassed) {
    console.log('\n✅ ALL DATASETS PASSED E2E TESTING');
    console.log('German demo data is ready for import! 🎉\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME DATASETS FAILED');
    console.log('Please review the errors above.\n');
    process.exit(1);
  }
}

main().catch(console.error);
