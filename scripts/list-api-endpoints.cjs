#!/usr/bin/env node

/**
 * List API Endpoints Script
 * 
 * This script extracts and lists all API endpoints from Azure Functions.
 * It parses the function files to find app.http() calls and displays
 * the routes and HTTP methods for each endpoint.
 * 
 * Usage: node scripts/list-api-endpoints.js
 */

const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(__dirname, '../api/src/functions');
const API_BASE_URL = 'https://glookodatawebapp-func.azurewebsites.net/api';

/**
 * Extract endpoint information from a function file
 * @param {string} filePath - Path to the function file
 * @returns {Object|null} Endpoint info or null if not found
 */
function extractEndpointInfo(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find app.http() call
    const appHttpMatch = content.match(/app\.http\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{([^}]+)\}/s);
    if (!appHttpMatch) {
      return null;
    }
    
    const functionName = appHttpMatch[1];
    const config = appHttpMatch[2];
    
    // Extract methods
    const methodsMatch = config.match(/methods\s*:\s*\[([^\]]+)\]/);
    const methods = methodsMatch 
      ? methodsMatch[1].split(',').map(m => m.trim().replace(/['"]/g, ''))
      : ['GET'];
    
    // Extract route
    const routeMatch = config.match(/route\s*:\s*['"]([^'"]+)['"]/);
    const route = routeMatch ? routeMatch[1] : functionName;
    
    return {
      functionName,
      methods,
      route,
      file: path.basename(filePath)
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main function to list all API endpoints
 */
function listApiEndpoints() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                   API ENDPOINTS DEPLOYMENT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const files = fs.readdirSync(FUNCTIONS_DIR)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'));
  
  const endpoints = [];
  
  for (const file of files) {
    const filePath = path.join(FUNCTIONS_DIR, file);
    const endpointInfo = extractEndpointInfo(filePath);
    
    if (endpointInfo) {
      endpoints.push(endpointInfo);
    }
  }
  
  if (endpoints.length === 0) {
    console.log('⚠️  No API endpoints found\n');
    return;
  }
  
  // Sort endpoints by route for consistent output
  endpoints.sort((a, b) => a.route.localeCompare(b.route));
  
  console.log(`Found ${endpoints.length} API endpoint(s):\n`);
  
  // Display in a formatted table
  endpoints.forEach((endpoint, index) => {
    const methodsStr = endpoint.methods.join(', ');
    const url = `${API_BASE_URL}/${endpoint.route}`;
    
    console.log(`${index + 1}. ${endpoint.functionName}`);
    console.log(`   Route:   /${endpoint.route}`);
    console.log(`   Methods: ${methodsStr}`);
    console.log(`   URL:     ${url}`);
    console.log(`   Source:  ${endpoint.file}`);
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total: ${endpoints.length} endpoint(s) ready for deployment`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the script
listApiEndpoints();
