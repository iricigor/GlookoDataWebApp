/**
 * Utility for mapping column names between English and German in Glooko export files
 */

export type SupportedLanguage = 'en' | 'de';

/**
 * Column name mappings from English to German
 * Based on Glooko export file column headers
 */
const COLUMN_MAPPINGS: Record<string, { en: string[]; de: string[] }> = {
  // Common columns
  timestamp: {
    en: ['timestamp'],
    de: ['zeitstempel']
  },
  
  // Glucose columns
  glucoseValue: {
    en: ['glucose value', 'glucose'],
    de: ['glukosewert', 'cgm-glukosewert']
  },
  
  // Insulin columns
  insulinType: {
    en: ['insulin type'],
    de: ['insulin-typ']
  },
  dose: {
    en: ['dose', 'delivered'],
    de: ['abgegebenes insulin', 'anfängliche abgabe', 'verzögerte abgabe', 'rate']
  },
  basalRate: {
    en: ['basal rate'],
    de: ['rate', 'prozentsatz']
  },
  duration: {
    en: ['duration'],
    de: ['dauer']
  },
  
  // Insulin totals (for combined insulin file)
  totalBolus: {
    en: ['total bolus'],
    de: ['bolus gesamt']
  },
  totalBasal: {
    en: ['total basal'],
    de: ['basal gesamt']
  },
  totalInsulin: {
    en: ['total insulin'],
    de: ['insulin gesamt']
  },
  
  // Bolus columns
  bolusType: {
    en: ['bolus type'],
    de: ['insulin-typ']
  },
  carbs: {
    en: ['carbs'],
    de: ['kh', 'kohlenhydrataufnahme']
  },
  
  // Food/carbs columns
  foodDescription: {
    en: ['food description'],
    de: ['name']
  },
  protein: {
    en: ['protein'],
    de: ['eiweiß']
  },
  fat: {
    en: ['fat'],
    de: ['fett']
  },
  
  // Exercise columns
  activityType: {
    en: ['activity type'],
    de: ['name']
  },
  intensity: {
    en: ['intensity'],
    de: ['intensität']
  },
  
  // Medication columns
  medicationName: {
    en: ['medication name'],
    de: ['name']
  },
  dosage: {
    en: ['dosage'],
    de: ['wert']
  },
  
  // Alarm columns
  alarmEvent: {
    en: ['alarm/event'],
    de: ['alarm/ereignis']
  },
  serialNumber: {
    en: ['serial number'],
    de: ['seriennummer']
  },
  
  // BG (blood glucose) columns
  device: {
    en: ['device'],
    de: ['manuelles lesen', 'seriennummer']
  },
  notes: {
    en: ['notes'],
    de: ['seriennummer', 'wert']
  }
};

/**
 * Detect the language of column headers based on known patterns
 * 
 * @param columnHeaders - Array of column header names from CSV
 * @returns Detected language ('en' or 'de'), defaults to 'en' if uncertain
 */
export function detectLanguage(columnHeaders: string[]): SupportedLanguage {
  if (!columnHeaders || columnHeaders.length === 0) {
    return 'en';
  }

  // Convert all headers to lowercase for comparison
  const lowerHeaders = columnHeaders.map(h => h.toLowerCase());

  // Count German-specific column names
  let germanCount = 0;
  let englishCount = 0;

  // Check for key indicator columns
  const germanIndicators = [
    'zeitstempel',
    'glukosewert',
    'insulin-typ',
    'dauer (minuten)',
    'abgegebenes insulin',
    'kohlenhydrataufnahme',
    'seriennummer',
    'alarm/ereignis'
  ];

  const englishIndicators = [
    'timestamp',
    'glucose value',
    'insulin type',
    'duration (min)',
    'dose (units)',
    'carbs (g)',
    'serial number',
    'alarm/event'
  ];

  // Check for German indicators
  for (const indicator of germanIndicators) {
    if (lowerHeaders.some(h => h.includes(indicator))) {
      germanCount++;
    }
  }

  // Check for English indicators
  for (const indicator of englishIndicators) {
    if (lowerHeaders.some(h => h.includes(indicator))) {
      englishCount++;
    }
  }

  // If we found more German indicators, it's German
  if (germanCount > englishCount) {
    return 'de';
  }

  // Default to English
  return 'en';
}

/**
 * Normalize a column name to a standard English key
 * This allows code to work with a consistent set of column names regardless of input language
 * 
 * @param columnName - The column name to normalize
 * @param language - The source language ('en' or 'de')
 * @returns Normalized column name in English, or the original if no mapping found
 */
export function normalizeColumnName(columnName: string, language: SupportedLanguage = 'en'): string {
  const lowerColumn = columnName.toLowerCase().trim();

  // If already English, return as-is
  if (language === 'en') {
    return columnName;
  }

  // Search for matching German column in mappings
  for (const [, mapping] of Object.entries(COLUMN_MAPPINGS)) {
    if (mapping.de.some(de => lowerColumn.includes(de))) {
      // Return the first English variant for this key
      return mapping.en[0];
    }
  }

  // No mapping found, return original
  return columnName;
}

/**
 * Find column index by searching for multiple possible names (supports both languages)
 * 
 * @param headers - Array of column header names
 * @param searchTerms - Array of possible column names to search for (in lowercase)
 * @returns Index of the found column, or -1 if not found
 */
export function findColumnIndex(headers: string[], searchTerms: string[]): number {
  return headers.findIndex(h => {
    const lowerHeader = h.toLowerCase().trim();
    return searchTerms.some(term => lowerHeader.includes(term));
  });
}

/**
 * Get all possible column name variants for a given column type
 * Returns both English and German variants
 * 
 * @param columnType - The type of column (e.g., 'timestamp', 'glucoseValue')
 * @returns Array of possible column names (both languages)
 */
export function getColumnVariants(columnType: keyof typeof COLUMN_MAPPINGS): string[] {
  const mapping = COLUMN_MAPPINGS[columnType];
  if (!mapping) {
    return [];
  }
  return [...mapping.en, ...mapping.de];
}
