#!/usr/bin/env node

/**
 * Script to generate demo datasets from real CGM Records data
 * 
 * This script processes real CGM data from multiple subjects and creates
 * demo datasets in the format expected by the application.
 * 
 * Data source: CGM Records.zip from the AZT1D dataset
 * Attribution: Khamesian et al., 2025, CC BY 4.0
 * DOI: 10.17632/gk9m674wcx.1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert mg/dL to mmol/L
function mgdlToMmol(mgdl) {
  return Math.round((mgdl / 18.0) * 10) / 10;
}

// Select a trend arrow based on current and previous glucose value
function selectTrendArrow(current, previous) {
  const diff = current - previous;
  
  // Thresholds in mmol/L
  if (diff <= -0.22) return 'DoubleDown';
  if (diff <= -0.11) return 'SingleDown';
  if (diff >= 0.22) return 'DoubleUp';
  if (diff >= 0.11) return 'SingleUp';
  return 'Flat';
}

/**
 * Parse a CSV line from the real CGM data
 */
function parseCsvLine(line) {
  const parts = line.split(',');
  if (parts.length < 9) return null;
  
  return {
    eventDateTime: parts[0],
    deviceMode: parts[1] || '',
    bolusType: parts[2] || '',
    basal: parts[3] || '',
    correctionDelivered: parts[4] || '',
    totalBolusInsulinDelivered: parts[5] || '',
    foodDelivered: parts[6] || '',
    carbSize: parts[7] || '',
    cgm: parts[8] ? parseFloat(parts[8]) : null
  };
}

/**
 * Process a subject's CSV file and extract data
 */
async function processSubjectData(csvContent) {
  const lines = csvContent.trim().split('\n');
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const cgmData = [];
  const bolusData = [];
  const basalData = [];
  
  for (const line of dataLines) {
    const data = parseCsvLine(line);
    if (!data) continue;
    
    // Extract CGM readings
    if (data.cgm !== null && !isNaN(data.cgm)) {
      cgmData.push({
        timestamp: data.eventDateTime,
        glucose: mgdlToMmol(data.cgm)
      });
    }
    
    // Extract bolus data
    if (data.bolusType && (data.totalBolusInsulinDelivered || data.foodDelivered)) {
      bolusData.push({
        timestamp: data.eventDateTime,
        bolusType: data.bolusType,
        dose: parseFloat(data.totalBolusInsulinDelivered) || 0,
        carbs: parseFloat(data.carbSize) || 0
      });
    }
    
    // Extract basal data
    if (data.basal) {
      basalData.push({
        timestamp: data.eventDateTime,
        basal: parseFloat(data.basal),
        mode: data.deviceMode
      });
    }
  }
  
  return { cgmData, bolusData, basalData };
}

/**
 * Generate CGM CSV file content
 */
function generateCGMFile(name, cgmData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Timestamp\tGlucose Value (mmol/L)\tTrend Arrow\tTransmitter ID');
  
  // Add data rows
  let previousValue = cgmData[0]?.glucose || 5.5;
  
  for (const reading of cgmData) {
    const trendArrow = selectTrendArrow(reading.glucose, previousValue);
    lines.push(`${reading.timestamp}\t${reading.glucose}\t${trendArrow}\tDXC4B2P`);
    previousValue = reading.glucose;
  }
  
  return lines.join('\n');
}

/**
 * Generate bolus CSV file content
 */
function generateBolusFile(name, bolusData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Timestamp\tBolus Type\tDose (units)\tCarbs (g)\tNotes');
  
  // Add data rows
  for (const bolus of bolusData) {
    const type = bolus.bolusType.includes('Extended') ? 'Extended' : 'Normal';
    const notes = bolus.carbs > 0 ? 'Meal' : 'Correction';
    lines.push(`${bolus.timestamp}\t${type}\t${bolus.dose.toFixed(1)}\t${Math.round(bolus.carbs)}\t${notes}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate basal CSV file content
 */
function generateBasalFile(name, basalData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Timestamp\tBasal Rate (units/hr)\tDuration (min)\tType');
  
  // Add data rows
  for (const basal of basalData) {
    const type = basal.mode === 'exercise' ? 'Temp' : 'Scheduled';
    lines.push(`${basal.timestamp}\t${basal.basal.toFixed(2)}\t5\t${type}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate empty placeholder files for other data types
 */
function generatePlaceholderFile(name, fileType, startDate, endDate) {
  const lines = [];
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  
  switch (fileType) {
    case 'alarms':
      lines.push('Timestamp\tAlarm Type\tDuration\tNotes');
      break;
    case 'bg':
      lines.push('Timestamp\tBG Value (mmol/L)\tMeter\tNotes');
      break;
    case 'carbs':
      lines.push('Timestamp\tCarbs (g)\tFood\tNotes');
      break;
    case 'exercise':
      lines.push('Timestamp\tExercise Type\tDuration (min)\tIntensity');
      break;
    case 'food':
      lines.push('Timestamp\tFood Item\tCarbs (g)\tNotes');
      break;
    case 'insulin':
      lines.push('Timestamp\tInsulin Type\tDose (units)\tNotes');
      break;
    case 'manual_insulin':
      lines.push('Timestamp\tInsulin Type\tDose (units)\tNotes');
      break;
    case 'medication':
      lines.push('Timestamp\tMedication\tDose\tNotes');
      break;
    case 'notes':
      lines.push('Timestamp\tNote');
      break;
  }
  
  return lines.join('\n');
}

/**
 * Main function to generate demo datasets
 */
async function main() {
  console.log('Generating demo datasets from real CGM Records data...\n');
  
  // Path to the CGM Records.zip file on main branch
  const cgmRecordsPath = path.join(__dirname, '..', 'public', 'demo-data', 'CGM Records.zip');
  
  if (!fs.existsSync(cgmRecordsPath)) {
    console.error('Error: CGM Records.zip not found at:', cgmRecordsPath);
    console.error('Please ensure the file is available from the main branch.');
    process.exit(1);
  }
  
  // Read and extract the ZIP file
  console.log('Reading CGM Records.zip...');
  const zipData = fs.readFileSync(cgmRecordsPath);
  const zip = await JSZip.loadAsync(zipData);
  
  // Define the 6 demo datasets we want to create
  const datasets = [
    { id: 'joshua', name: 'Joshua', subjectId: 5, description: 'Male, 25-45, Active lifestyle' },
    { id: 'charles', name: 'Charles', subjectId: 10, description: 'Male, 45-65, Regular schedule' },
    { id: 'albert', name: 'Albert', subjectId: 15, description: 'Male, 65-85, Retired' },
    { id: 'hannah', name: 'Hannah', subjectId: 20, description: 'Female, 25-45, Active lifestyle' },
    { id: 'nancy', name: 'Nancy', subjectId: 3, description: 'Female, 45-65, Professional' },
    { id: 'dorothy', name: 'Dorothy', subjectId: 8, description: 'Female, 65-85, Retired' }
  ];
  
  const outputDir = path.join(__dirname, '..', 'public', 'demo-data');
  
  // Process each dataset
  for (const dataset of datasets) {
    console.log(`\nProcessing ${dataset.name} (Subject ${dataset.subjectId})...`);
    
    // Find the subject's CSV file in the ZIP
    const subjectPath = `CGM Records/Subject ${dataset.subjectId}/Subject ${dataset.subjectId}.csv`;
    const subjectFile = zip.file(subjectPath);
    
    if (!subjectFile) {
      console.error(`  Error: Could not find ${subjectPath} in ZIP`);
      continue;
    }
    
    // Extract and process the CSV content
    const csvContent = await subjectFile.async('string');
    const { cgmData, bolusData, basalData } = await processSubjectData(csvContent);
    
    console.log(`  CGM readings: ${cgmData.length}`);
    console.log(`  Bolus entries: ${bolusData.length}`);
    console.log(`  Basal entries: ${basalData.length}`);
    
    if (cgmData.length === 0) {
      console.error(`  Error: No CGM data found for Subject ${dataset.subjectId}`);
      continue;
    }
    
    // Determine date range from the data
    const firstTimestamp = new Date(cgmData[0].timestamp);
    const lastTimestamp = new Date(cgmData[cgmData.length - 1].timestamp);
    
    // Create a new ZIP file for this demo dataset
    const demoZip = new JSZip();
    
    // Generate CGM files (3 files as per original format)
    const cgm1Content = generateCGMFile(dataset.name, cgmData.slice(0, Math.floor(cgmData.length / 3)), firstTimestamp, lastTimestamp);
    const cgm2Content = generateCGMFile(dataset.name, cgmData.slice(Math.floor(cgmData.length / 3), Math.floor(2 * cgmData.length / 3)), firstTimestamp, lastTimestamp);
    const cgm3Content = generateCGMFile(dataset.name, cgmData.slice(Math.floor(2 * cgmData.length / 3)), firstTimestamp, lastTimestamp);
    
    demoZip.file('cgm_data_1.csv', cgm1Content);
    demoZip.file('cgm_data_2.csv', cgm2Content);
    demoZip.file('cgm_data_3.csv', cgm3Content);
    
    // Generate bolus files (2 files as per original format)
    const bolusHalfway = Math.floor(bolusData.length / 2);
    const bolus1Content = generateBolusFile(dataset.name, bolusData.slice(0, bolusHalfway), firstTimestamp, lastTimestamp);
    demoZip.file('bolus_data_1.csv', bolus1Content.length > 100 ? bolus1Content : generatePlaceholderFile(dataset.name, 'bolus', firstTimestamp, lastTimestamp) + '\n');
    
    // Generate basal files (2 files as per original format)
    const basalHalfway = Math.floor(basalData.length / 2);
    const basal1Content = generateBasalFile(dataset.name, basalData.slice(0, basalHalfway), firstTimestamp, lastTimestamp);
    const basal2Content = generateBasalFile(dataset.name, basalData.slice(basalHalfway), firstTimestamp, lastTimestamp);
    demoZip.file('basal_data_1.csv', basal1Content);
    demoZip.file('basal_data_2.csv', basal2Content);
    
    // Generate placeholder files for other data types
    demoZip.file('alarms_data_1.csv', generatePlaceholderFile(dataset.name, 'alarms', firstTimestamp, lastTimestamp));
    demoZip.file('bg_data_1.csv', generatePlaceholderFile(dataset.name, 'bg', firstTimestamp, lastTimestamp));
    demoZip.file('carbs_data_1.csv', generatePlaceholderFile(dataset.name, 'carbs', firstTimestamp, lastTimestamp));
    demoZip.file('exercise_data_1.csv', generatePlaceholderFile(dataset.name, 'exercise', firstTimestamp, lastTimestamp));
    demoZip.file('food_data_1.csv', generatePlaceholderFile(dataset.name, 'food', firstTimestamp, lastTimestamp));
    demoZip.file('insulin_data_1.csv', generatePlaceholderFile(dataset.name, 'insulin', firstTimestamp, lastTimestamp));
    demoZip.file('manual_insulin_data_1.csv', generatePlaceholderFile(dataset.name, 'manual_insulin', firstTimestamp, lastTimestamp));
    demoZip.file('medication_data_1.csv', generatePlaceholderFile(dataset.name, 'medication', firstTimestamp, lastTimestamp));
    demoZip.file('notes_data_1.csv', generatePlaceholderFile(dataset.name, 'notes', firstTimestamp, lastTimestamp));
    
    // Generate the ZIP file
    const zipContent = await demoZip.generateAsync({ type: 'nodebuffer' });
    const outputPath = path.join(outputDir, `${dataset.id}-demo-data.zip`);
    fs.writeFileSync(outputPath, zipContent);
    
    console.log(`  ✓ Generated: ${dataset.id}-demo-data.zip`);
  }
  
  console.log('\n✓ Demo datasets generated successfully!');
  console.log('\nNote: These datasets are based on real anonymized CGM data from the AZT1D dataset.');
  console.log('Each dataset shows natural day-to-day variability from actual T1D patients.');
}

main().catch(console.error);
