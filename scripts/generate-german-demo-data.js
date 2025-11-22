#!/usr/bin/env node

/**
 * Script to generate German demo datasets from real CGM Records data
 * 
 * This script creates demo datasets with German column headers and German units (mg/dL).
 * Based on the same approach as generate-demo-from-real-data.js but with German localization.
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

// Convert mmol/L to mg/dL (German exports typically use mg/dL)
function mmolToMgdl(mmol) {
  return Math.round(mmol * 18.0);
}

// Select a trend arrow based on current and previous glucose value
function selectTrendArrow(current, previous) {
  const diff = current - previous;
  
  // Thresholds in mg/dL
  if (diff <= -4) return 'DoubleDown';
  if (diff <= -2) return 'SingleDown';
  if (diff >= 4) return 'DoubleUp';
  if (diff >= 2) return 'SingleUp';
  return 'Flat';
}

/**
 * Parse a CSV line from the real CGM data
 */
function parseCsvLine(line) {
  const parts = line.split(',');
  if (parts.length < 7) return null;
  
  return {
    eventDateTime: parts[0],
    // Handle both formats: "CGM" column or "Readings (CGM / BGM)" column
    deviceMode: parts[1] || parts[8] || '',  // DeviceMode can be in different positions
    bolusType: parts[2] || '',
    basal: parts[3] || parts[1] || '',  // Basal can be in position 1 or 3
    correctionDelivered: parts[4] || '',
    totalBolusInsulinDelivered: parts[5] || parts[7] || '',
    foodDelivered: parts[6] || '',
    carbSize: parts[7] || parts[3] || '',
    cgm: parts[8] ? parseFloat(parts[8]) : (parts[6] ? parseFloat(parts[6]) : null)  // Try both CGM columns
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
    
    // Extract CGM readings (keep in mg/dL for German exports)
    if (data.cgm !== null && !isNaN(data.cgm)) {
      cgmData.push({
        timestamp: data.eventDateTime,
        glucose: Math.round(data.cgm)  // Keep as mg/dL, round to integer
      });
    }
    
    // Extract bolus data
    if (data.bolusType && (data.totalBolusInsulinDelivered || data.foodDelivered)) {
      bolusData.push({
        timestamp: data.eventDateTime,
        bolusType: data.bolusType,
        dose: parseFloat(data.totalBolusInsulinDelivered) || 0,
        carbs: parseFloat(data.carbSize) || 0,
        bgInput: data.cgm ? Math.round(data.cgm) : null  // BG input for bolus calculator
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
 * Generate German CGM CSV file content
 */
function generateGermanCGMFile(name, cgmData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Zeitstempel\tCGM-Glukosewert (mg/dl)\tSeriennummer');
  
  // Add data rows
  for (const reading of cgmData) {
    lines.push(`${reading.timestamp}\t${reading.glucose}\tDXC4B2P`);
  }
  
  return lines.join('\n');
}

/**
 * Generate German bolus CSV file content
 */
function generateGermanBolusFile(name, bolusData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Zeitstempel\tInsulin-Typ\tBlutzuckereingabe (mg/dl)\tKohlenhydrataufnahme (g)\tKohlenhydratverhältnis\tAbgegebenes Insulin (E)\tAnfängliche Abgabe (E)\tVerzögerte Abgabe (E)\tSeriennummer');
  
  // Add data rows
  for (const bolus of bolusData) {
    const type = bolus.bolusType.includes('Extended') ? 'Extended Bolus' : 'Normal Bolus';
    const bgInput = bolus.bgInput || '';
    const carbRatio = bolus.carbs > 0 ? '1:10' : '';  // Placeholder ratio
    const initialDose = bolus.dose;
    const delayedDose = 0;  // Most are normal bolus
    lines.push(`${bolus.timestamp}\t${type}\t${bgInput}\t${Math.round(bolus.carbs)}\t${carbRatio}\t${bolus.dose.toFixed(1)}\t${initialDose.toFixed(1)}\t${delayedDose.toFixed(1)}\tDXC4B2P`);
  }
  
  return lines.join('\n');
}

/**
 * Generate German basal CSV file content
 */
function generateGermanBasalFile(name, basalData, startDate, endDate) {
  const lines = [];
  
  // Add header
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  lines.push('Zeitstempel\tInsulin-Typ\tDauer (Minuten)\tProzentsatz (%)\tRate\tAbgegebenes Insulin (E)\tSeriennummer');
  
  // Add data rows
  for (const basal of basalData) {
    const type = basal.mode === 'exercise' ? 'Temp Basal' : 'Scheduled Basal';
    const duration = 5;
    const percentage = 100;
    const delivered = (basal.basal * duration / 60).toFixed(3);
    lines.push(`${basal.timestamp}\t${type}\t${duration}\t${percentage}\t${basal.basal.toFixed(2)}\t${delivered}\tDXC4B2P`);
  }
  
  return lines.join('\n');
}

/**
 * Generate empty placeholder files for other data types (German)
 */
function generateGermanPlaceholderFile(name, fileType, startDate, endDate) {
  const lines = [];
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  lines.push(`Name:${name}\tDate Range:${startDateStr} - ${endDateStr}`);
  
  switch (fileType) {
    case 'alarms':
      lines.push('Zeitstempel\tAlarm/Ereignis\tSeriennummer');
      break;
    case 'bg':
      lines.push('Zeitstempel\tGlukosewert (mg/dl)\tManuelles Lesen\tSeriennummer');
      break;
    case 'carbs':
      lines.push('Zeitstempel\tKH (g)');
      break;
    case 'exercise':
      lines.push('Zeitstempel\tName\tIntensität\tDauer (Minuten)\tVerbrannte Kalorien');
      break;
    case 'food':
      lines.push('Zeitstempel\tName\tKH (g)\tFett\tEiweiß\tKalorien\tPortionen\tAnzahl der Portionen');
      break;
    case 'insulin':
      lines.push('Zeitstempel\tBolus gesamt (U)\tInsulin gesamt (U)\tBasal gesamt (U)\tSeriennummer');
      break;
    case 'manual_insulin':
      lines.push('Zeitstempel\tName\tWert\tInsulin-Typ');
      break;
    case 'medication':
      lines.push('Zeitstempel\tName\tWert\tMedikamententyp');
      break;
    case 'notes':
      lines.push('Zeitstempel\tWert');
      break;
  }
  
  return lines.join('\n');
}

/**
 * Main function to generate German demo datasets
 */
async function main() {
  console.log('Generating German demo datasets from real CGM Records data...\n');
  
  // Path to the CGM Records.zip file
  const cgmRecordsPath = path.join(__dirname, '..', 'public', 'demo-data', 'CGM Records.zip');
  
  if (!fs.existsSync(cgmRecordsPath)) {
    console.error('Error: CGM Records.zip not found at:', cgmRecordsPath);
    console.error('Please ensure the file is available.');
    process.exit(1);
  }
  
  // Read and extract the ZIP file
  console.log('Reading CGM Records.zip...');
  const zipData = fs.readFileSync(cgmRecordsPath);
  const zip = await JSZip.loadAsync(zipData);
  
  // Define the 2 German demo datasets we want to create
  // Using different subjects than the English datasets to provide variety
  const datasets = [
    { 
      id: 'stefan', 
      name: 'Stefan', 
      subjectId: 10, 
      description: 'Male, 25-45, Active lifestyle',
      rationale: 'Male subject with good glucose control, selected for German demo data'
    },
    { 
      id: 'anja', 
      name: 'Anja', 
      subjectId: 15, 
      description: 'Female, 25-45, Professional',
      rationale: 'Female subject with good glucose control, selected for German demo data'
    }
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
    const cgm1Content = generateGermanCGMFile(dataset.name, cgmData.slice(0, Math.floor(cgmData.length / 3)), firstTimestamp, lastTimestamp);
    const cgm2Content = generateGermanCGMFile(dataset.name, cgmData.slice(Math.floor(cgmData.length / 3), Math.floor(2 * cgmData.length / 3)), firstTimestamp, lastTimestamp);
    const cgm3Content = generateGermanCGMFile(dataset.name, cgmData.slice(Math.floor(2 * cgmData.length / 3)), firstTimestamp, lastTimestamp);
    
    demoZip.file('cgm_data_1.csv', cgm1Content);
    demoZip.file('cgm_data_2.csv', cgm2Content);
    demoZip.file('cgm_data_3.csv', cgm3Content);
    
    // Generate bolus file
    const bolusContent = generateGermanBolusFile(dataset.name, bolusData, firstTimestamp, lastTimestamp);
    demoZip.file('bolus_data_1.csv', bolusContent.length > 100 ? bolusContent : generateGermanPlaceholderFile(dataset.name, 'bolus', firstTimestamp, lastTimestamp) + '\n');
    
    // Generate basal files (2 files as per original format)
    const basalHalfway = Math.floor(basalData.length / 2);
    const basal1Content = generateGermanBasalFile(dataset.name, basalData.slice(0, basalHalfway), firstTimestamp, lastTimestamp);
    const basal2Content = generateGermanBasalFile(dataset.name, basalData.slice(basalHalfway), firstTimestamp, lastTimestamp);
    demoZip.file('basal_data_1.csv', basal1Content);
    demoZip.file('basal_data_2.csv', basal2Content);
    
    // Generate placeholder files for other data types (German headers)
    demoZip.file('alarms_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'alarms', firstTimestamp, lastTimestamp));
    demoZip.file('bg_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'bg', firstTimestamp, lastTimestamp));
    demoZip.file('carbs_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'carbs', firstTimestamp, lastTimestamp));
    demoZip.file('exercise_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'exercise', firstTimestamp, lastTimestamp));
    demoZip.file('food_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'food', firstTimestamp, lastTimestamp));
    demoZip.file('insulin_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'insulin', firstTimestamp, lastTimestamp));
    demoZip.file('manual_insulin_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'manual_insulin', firstTimestamp, lastTimestamp));
    demoZip.file('medication_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'medication', firstTimestamp, lastTimestamp));
    demoZip.file('notes_data_1.csv', generateGermanPlaceholderFile(dataset.name, 'notes', firstTimestamp, lastTimestamp));
    
    // Generate the ZIP file
    const zipContent = await demoZip.generateAsync({ type: 'nodebuffer' });
    const outputPath = path.join(outputDir, `${dataset.id}-demo-data.zip`);
    fs.writeFileSync(outputPath, zipContent);
    
    console.log(`  ✓ Generated: ${dataset.id}-demo-data.zip (German)`);
  }
  
  console.log('\n✓ German demo datasets generated successfully!');
  console.log('\nNote: These datasets use German column headers and mg/dL units.');
  console.log('They are based on real anonymized CGM data from the AZT1D dataset.');
}

main().catch(console.error);
