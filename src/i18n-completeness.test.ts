/**
 * Translation Completeness Tests
 * 
 * Validates that all translation files have the same keys and structure
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const enTranslations = JSON.parse(
  readFileSync(join(process.cwd(), 'public/locales/en/translation.json'), 'utf8')
);
const deTranslations = JSON.parse(
  readFileSync(join(process.cwd(), 'public/locales/de/translation.json'), 'utf8')
);

describe('Translation Completeness', () => {
  /**
   * Recursively gets all translation keys from a nested object
   */
  function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    let keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys = keys.concat(getAllKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  it('should have all English keys present in German translation', () => {
    const enKeys = getAllKeys(enTranslations);
    const deKeys = new Set(getAllKeys(deTranslations));
    
    const missingKeys = enKeys.filter(key => !deKeys.has(key));
    
    expect(missingKeys, `Missing keys in German translation: ${missingKeys.join(', ')}`).toHaveLength(0);
  });

  it('should not have extra keys in German translation', () => {
    const enKeys = new Set(getAllKeys(enTranslations));
    const deKeys = getAllKeys(deTranslations);
    
    const extraKeys = deKeys.filter(key => !enKeys.has(key));
    
    expect(extraKeys, `Extra keys in German translation: ${extraKeys.join(', ')}`).toHaveLength(0);
  });

  it('should have the same number of keys in both languages', () => {
    const enKeys = getAllKeys(enTranslations);
    const deKeys = getAllKeys(deTranslations);
    
    expect(deKeys.length).toBe(enKeys.length);
  });

  it('should not have empty values in German translation', () => {
    const deKeys = getAllKeys(deTranslations);
    
    // Get actual values
    const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
      const keys = path.split('.');
      let value: unknown = obj;
      
      for (const key of keys) {
        if (typeof value === 'object' && value !== null) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      
      return value;
    };
    
    const emptyValues = deKeys.filter(key => {
      const value = getValueByPath(deTranslations as Record<string, unknown>, key);
      return typeof value === 'string' && value.trim() === '';
    });
    
    expect(emptyValues, `Empty values in German translation: ${emptyValues.join(', ')}`).toHaveLength(0);
  });

  it('should preserve interpolation variables in translations', () => {
    const enKeys = getAllKeys(enTranslations);
    
    // Get value by path
    const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
      const keys = path.split('.');
      let value: unknown = obj;
      
      for (const key of keys) {
        if (typeof value === 'object' && value !== null) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      
      return value;
    };
    
    // Check each key
    for (const key of enKeys) {
      const enValue = getValueByPath(enTranslations as Record<string, unknown>, key);
      const deValue = getValueByPath(deTranslations as Record<string, unknown>, key);
      
      if (typeof enValue !== 'string' || typeof deValue !== 'string') {
        continue;
      }
      
      // Extract interpolation variables (e.g., {{variable}})
      const enVars = enValue.match(/\{\{[^}]+\}\}/g) || [];
      const deVars = deValue.match(/\{\{[^}]+\}\}/g) || [];
      
      // Sort for comparison
      enVars.sort();
      deVars.sort();
      
      expect(deVars, `Key "${key}" should have the same interpolation variables`).toEqual(enVars);
    }
  });

  it('should preserve HTML tags in translations', () => {
    const enKeys = getAllKeys(enTranslations);
    
    // Get value by path
    const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
      const keys = path.split('.');
      let value: unknown = obj;
      
      for (const key of keys) {
        if (typeof value === 'object' && value !== null) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      
      return value;
    };
    
    // Check each key
    for (const key of enKeys) {
      const enValue = getValueByPath(enTranslations as Record<string, unknown>, key);
      const deValue = getValueByPath(deTranslations as Record<string, unknown>, key);
      
      if (typeof enValue !== 'string' || typeof deValue !== 'string') {
        continue;
      }
      
      // Extract HTML tags
      const enTags = enValue.match(/<[^>]+>/g) || [];
      const deTags = deValue.match(/<[^>]+>/g) || [];
      
      // Sort for comparison
      enTags.sort();
      deTags.sort();
      
      expect(deTags, `Key "${key}" should have the same HTML tags`).toEqual(enTags);
    }
  });
});
