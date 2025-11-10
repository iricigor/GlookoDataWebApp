#!/usr/bin/env node

/**
 * Script to generate demo CGM data with proper glucose distribution
 * 
 * Distribution requirements (in mmol/L):
 * - 1% very low < 3.0 mmol/L
 * - 2% low 3.0-3.8 mmol/L
 * - 71% in range 3.9-10.0 mmol/L
 * - 19% high 10.1-13.9 mmol/L
 * - 7% very high 14.0-16.5 mmol/L
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Glucose range definitions (in mmol/L)
const RANGES = {
  VERY_LOW: { min: 2.2, max: 2.9, percentage: 0.01 },
  LOW: { min: 3.0, max: 3.8, percentage: 0.02 },
  IN_RANGE: { min: 3.9, max: 10.0, percentage: 0.71 },
  HIGH: { min: 10.1, max: 13.9, percentage: 0.19 },
  VERY_HIGH: { min: 14.0, max: 16.5, percentage: 0.07 },
};

// Trend arrows
const TREND_ARROWS = ['DoubleDown', 'SingleDown', 'Flat', 'SingleUp', 'DoubleUp'];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max (inclusive), rounded to 1 decimal place
 */
function randomFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/**
 * Select a trend arrow based on current and previous glucose value
 * Thresholds are adjusted for mmol/L scale
 */
function selectTrendArrow(current, previous) {
  const diff = current - previous;
  
  // Thresholds in mmol/L: approximately 1/18 of mg/dL thresholds
  if (diff <= -0.22) return 'DoubleDown';
  if (diff <= -0.11) return 'SingleDown';
  if (diff >= 0.22) return 'DoubleUp';
  if (diff >= 0.11) return 'SingleUp';
  return 'Flat';
}

/**
 * Generate glucose values with the specified distribution
 */
function generateGlucoseValues(count) {
  const values = [];
  
  // Calculate counts for each range
  const veryLowCount = Math.round(count * RANGES.VERY_LOW.percentage);
  const lowCount = Math.round(count * RANGES.LOW.percentage);
  const inRangeCount = Math.round(count * RANGES.IN_RANGE.percentage);
  const highCount = Math.round(count * RANGES.HIGH.percentage);
  const veryHighCount = count - veryLowCount - lowCount - inRangeCount - highCount;
  
  // Generate values for each range
  for (let i = 0; i < veryLowCount; i++) {
    values.push(randomFloat(RANGES.VERY_LOW.min, RANGES.VERY_LOW.max));
  }
  for (let i = 0; i < lowCount; i++) {
    values.push(randomFloat(RANGES.LOW.min, RANGES.LOW.max));
  }
  for (let i = 0; i < inRangeCount; i++) {
    values.push(randomFloat(RANGES.IN_RANGE.min, RANGES.IN_RANGE.max));
  }
  for (let i = 0; i < highCount; i++) {
    values.push(randomFloat(RANGES.HIGH.min, RANGES.HIGH.max));
  }
  for (let i = 0; i < veryHighCount; i++) {
    values.push(randomFloat(RANGES.VERY_HIGH.min, RANGES.VERY_HIGH.max));
  }
  
  // Shuffle the values to distribute them throughout the dataset
  // Using Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  
  return values;
}

/**
 * Generate a CGM data CSV file
 */
function generateCGMFile(fileNumber, startDate, days) {
  const lines = [];
  
  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);
  
  // Add header lines
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:John Doe\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Timestamp\tGlucose Value (mmol/L)\tTrend Arrow\tTransmitter ID');
  
  // Calculate total readings (one every ~8.5 minutes for the number of days, matching original data density)
  const readingsPerDay = 166; // Match original data density (~166 readings per day for 14 days = 2326 total)
  const totalReadings = Math.floor(readingsPerDay * days);
  
  // Generate glucose values
  const glucoseValues = generateGlucoseValues(totalReadings);
  
  // Generate readings
  const currentDate = new Date(startDate);
  let previousValue = glucoseValues[0];
  
  for (let i = 0; i < totalReadings; i++) {
    const timestamp = currentDate.toISOString().replace('T', ' ').split('.')[0];
    const glucose = glucoseValues[i];
    const trendArrow = i === 0 ? 'Flat' : selectTrendArrow(glucose, previousValue);
    const transmitterID = 'DXC4B2P';
    
    lines.push(`${timestamp}\t${glucose}\t${trendArrow}\t${transmitterID}`);
    
    // Increment time by approximately 8.5 minutes (with some variation)
    const minutesIncrement = randomInt(7, 10);
    currentDate.setMinutes(currentDate.getMinutes() + minutesIncrement);
    
    previousValue = glucose;
  }
  
  return lines.join('\n');
}

/**
 * Copy file from source to destination
 */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

/**
 * Main function to generate demo data
 */
async function main() {
  console.log('Generating demo CGM data with improved variability...');
  
  // Extract existing demo data to preserve non-CGM files
  const demoDataPath = path.join(__dirname, '..', 'public', 'demo-data.zip');
  const tempDir = path.join(__dirname, '..', 'temp-demo-data');
  
  // Create temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Read existing zip to preserve non-CGM files
  if (fs.existsSync(demoDataPath)) {
    console.log('Extracting existing demo data...');
    const zipData = fs.readFileSync(demoDataPath);
    const zip = await JSZip.loadAsync(zipData);
    
    // Extract non-CGM files
    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && !filename.startsWith('cgm_data_')) {
        const content = await file.async('nodebuffer');
        fs.writeFileSync(path.join(tempDir, filename), content);
        console.log(`  Preserved: ${filename}`);
      }
    }
  }
  
  // Generate new CGM data files
  console.log('\nGenerating new CGM data files...');
  
  // Generate 3 CGM files with the same date range (14 days each)
  // All files cover the same period but represent different sensors/sources
  const startDate = new Date('2025-01-01T00:00:00Z');
  
  const cgm1Content = generateCGMFile(1, startDate, 14);
  const cgm2Content = generateCGMFile(2, startDate, 14);
  const cgm3Content = generateCGMFile(3, startDate, 14);
  
  fs.writeFileSync(path.join(tempDir, 'cgm_data_1.csv'), cgm1Content);
  fs.writeFileSync(path.join(tempDir, 'cgm_data_2.csv'), cgm2Content);
  fs.writeFileSync(path.join(tempDir, 'cgm_data_3.csv'), cgm3Content);
  
  console.log('  Generated: cgm_data_1.csv');
  console.log('  Generated: cgm_data_2.csv');
  console.log('  Generated: cgm_data_3.csv');
  
  // Create new ZIP file
  console.log('\nCreating new demo-data.zip...');
  const newZip = new JSZip();
  
  // Add all files from temp directory
  const files = fs.readdirSync(tempDir);
  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const content = fs.readFileSync(filePath);
    newZip.file(file, content);
  }
  
  // Generate ZIP
  const zipContent = await newZip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(demoDataPath, zipContent);
  
  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true });
  
  console.log('\nDemo data generated successfully!');
  console.log(`Output: ${demoDataPath}`);
  
  // Print statistics
  console.log('\nDistribution statistics:');
  const cgm1Lines = cgm1Content.split('\n');
  const values = cgm1Lines.slice(2).map(line => {
    const parts = line.split('\t');
    return parseFloat(parts[1]);
  }).filter(v => !isNaN(v));
  
  const veryLowCount = values.filter(v => v < 3.0).length;
  const lowCount = values.filter(v => v >= 3.0 && v <= 3.8).length;
  const inRangeCount = values.filter(v => v >= 3.9 && v <= 10.0).length;
  const highCount = values.filter(v => v >= 10.1 && v <= 13.9).length;
  const veryHighCount = values.filter(v => v >= 14.0).length;
  const total = values.length;
  
  console.log(`  Very Low (<3.0): ${veryLowCount} (${(veryLowCount/total*100).toFixed(1)}%)`);
  console.log(`  Low (3.0-3.8): ${lowCount} (${(lowCount/total*100).toFixed(1)}%)`);
  console.log(`  In Range (3.9-10.0): ${inRangeCount} (${(inRangeCount/total*100).toFixed(1)}%)`);
  console.log(`  High (10.1-13.9): ${highCount} (${(highCount/total*100).toFixed(1)}%)`);
  console.log(`  Very High (14.0-16.5): ${veryHighCount} (${(veryHighCount/total*100).toFixed(1)}%)`);
  console.log(`  Total readings: ${total}`);
}

main().catch(console.error);
