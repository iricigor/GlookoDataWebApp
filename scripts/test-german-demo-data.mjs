#!/usr/bin/env node

/**
 * Test script to verify German demo data can be loaded and parsed correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect language from column headers
function detectLanguage(headers) {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  const germanIndicators = [
    'zeitstempel',
    'glukosewert',
    'insulin-typ',
    'dauer (minuten)',
    'abgegebenes insulin',
    'kohlenhydrataufnahme',
    'seriennummer'
  ];
  
  const englishIndicators = [
    'timestamp',
    'glucose value',
    'insulin type',
    'duration (min)',
    'dose (units)',
    'carbs (g)',
    'serial number'
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

// Test loading a demo dataset
async function testDemoDataset(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${filename}`);
  console.log('='.repeat(60));
  
  const filePath = path.join(__dirname, '..', 'public', 'demo-data', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  
  try {
    const zipData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(zipData);
    
    console.log(`\n📦 ZIP Contents:`);
    const fileNames = Object.keys(zip.files);
    fileNames.forEach(name => {
      if (!name.endsWith('/')) {
        console.log(`  - ${name}`);
      }
    });
    
    // Test CGM data
    console.log(`\n🩸 CGM Data Analysis:`);
    const cgmFile = zip.file('cgm_data_1.csv');
    if (cgmFile) {
      const content = await cgmFile.async('string');
      const lines = content.trim().split('\n');
      
      console.log(`  Total lines: ${lines.length}`);
      console.log(`  First line (metadata): ${lines[0]}`);
      console.log(`  Second line (headers): ${lines[1]}`);
      
      // Detect delimiter
      const headerLine = lines[1];
      const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? '\t' : ',';
      console.log(`  Detected delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);
      
      // Parse headers
      const headers = headerLine.split(delimiter).map(h => h.trim());
      console.log(`  Headers (${headers.length}):`);
      headers.forEach((h, i) => console.log(`    ${i + 1}. ${h}`));
      
      // Detect language
      const language = detectLanguage(headers);
      console.log(`  Detected language: ${language === 'de' ? '🇩🇪 German' : '🇬🇧 English'}`);
      
      // Check for glucose column
      const glucoseIndex = headers.findIndex(h => 
        h.toLowerCase().includes('glucose') || h.toLowerCase().includes('glukosewert')
      );
      
      if (glucoseIndex === -1) {
        console.error(`  ❌ No glucose column found!`);
        return false;
      }
      
      console.log(`  ✓ Glucose column found at index ${glucoseIndex}: "${headers[glucoseIndex]}"`);
      
      // Parse a few data rows
      console.log(`\n  Sample data rows (first 3):`);
      for (let i = 2; i < Math.min(5, lines.length); i++) {
        const values = lines[i].split(delimiter);
        const timestamp = values[0];
        const glucose = values[glucoseIndex];
        console.log(`    Row ${i - 1}: ${timestamp} → ${glucose}`);
      }
      
      // Detect glucose unit from value range
      const dataLine = lines[2]?.split(delimiter);
      if (dataLine && dataLine[glucoseIndex]) {
        const glucoseValue = parseFloat(dataLine[glucoseIndex]);
        const unit = glucoseValue > 30 ? 'mg/dL' : 'mmol/L';
        console.log(`  Detected glucose unit: ${unit} (sample value: ${glucoseValue})`);
      }
    } else {
      console.error(`  ❌ cgm_data_1.csv not found in ZIP`);
      return false;
    }
    
    // Test Bolus data
    console.log(`\n💉 Bolus Data Analysis:`);
    const bolusFile = zip.file('bolus_data_1.csv');
    if (bolusFile) {
      const content = await bolusFile.async('string');
      const lines = content.trim().split('\n');
      
      console.log(`  Total lines: ${lines.length}`);
      
      if (lines.length > 1) {
        const headerLine = lines[1];
        const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? '\t' : ',';
        const headers = headerLine.split(delimiter).map(h => h.trim());
        
        console.log(`  Headers (${headers.length}):`);
        headers.forEach((h, i) => console.log(`    ${i + 1}. ${h}`));
        
        const language = detectLanguage(headers);
        console.log(`  Detected language: ${language === 'de' ? '🇩🇪 German' : '🇬🇧 English'}`);
        
        // Sample data
        if (lines.length > 2) {
          console.log(`\n  Sample data row (first entry):`);
          const values = lines[2].split(delimiter);
          values.forEach((val, i) => {
            if (i < headers.length) {
              console.log(`    ${headers[i]}: ${val}`);
            }
          });
        }
      }
    } else {
      console.log(`  ⚠️  bolus_data_1.csv not found (might be empty)`);
    }
    
    console.log(`\n✅ Successfully loaded and parsed ${filename}`);
    return true;
    
  } catch (error) {
    console.error(`\n❌ Error loading ${filename}:`, error.message);
    return false;
  }
}

// Main test function
async function main() {
  console.log('\n🧪 Testing German Demo Data Import\n');
  
  const datasets = [
    'stefan-demo-data.zip',
    'anja-demo-data.zip',
  ];
  
  let allPassed = true;
  
  for (const dataset of datasets) {
    const passed = await testDemoDataset(dataset);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  if (allPassed) {
    console.log('✅ All German demo datasets loaded successfully!');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ Some datasets failed to load');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main().catch(console.error);
