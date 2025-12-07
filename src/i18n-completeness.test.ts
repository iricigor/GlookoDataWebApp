/**
 * Translation Completeness Tests
 * 
 * Validates that all translation files have the same keys and structure across all namespaces
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// All supported namespaces
const namespaces = [
  'common',
  'navigation',
  'home',
  'dataUpload',
  'reports',
  'aiAnalysis',
  'settings',
  'dialogs',
  'notifications',
];

// Helper function to load a namespace translation file
function loadNamespace(lang: string, ns: string): Record<string, unknown> {
  const filePath = join(process.cwd(), `public/locales/${lang}/${ns}.json`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

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

  /**
   * Get value by path in nested object
   */
  function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
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
  }

  // Test each namespace
  namespaces.forEach(ns => {
    describe(`Namespace: ${ns}`, () => {
      const enTranslations = loadNamespace('en', ns);

      it('should have all English keys present in German translation', () => {
        const deTranslations = loadNamespace('de', ns);
        const enKeys = getAllKeys(enTranslations);
        const deKeys = new Set(getAllKeys(deTranslations));
        
        const missingKeys = enKeys.filter(key => !deKeys.has(key));
        
        expect(missingKeys, `Missing keys in German translation for ${ns}: ${missingKeys.join(', ')}`).toHaveLength(0);
      });

      it('should have all English keys present in Czech translation', () => {
        const csTranslations = loadNamespace('cs', ns);
        const enKeys = getAllKeys(enTranslations);
        const csKeys = new Set(getAllKeys(csTranslations));
        
        const missingKeys = enKeys.filter(key => !csKeys.has(key));
        
        expect(missingKeys, `Missing keys in Czech translation for ${ns}: ${missingKeys.join(', ')}`).toHaveLength(0);
      });

      it('should not have extra keys in German translation', () => {
        const deTranslations = loadNamespace('de', ns);
        const enKeys = new Set(getAllKeys(enTranslations));
        const deKeys = getAllKeys(deTranslations);
        
        const extraKeys = deKeys.filter(key => !enKeys.has(key));
        
        expect(extraKeys, `Extra keys in German translation for ${ns}: ${extraKeys.join(', ')}`).toHaveLength(0);
      });

      it('should not have extra keys in Czech translation', () => {
        const csTranslations = loadNamespace('cs', ns);
        const enKeys = new Set(getAllKeys(enTranslations));
        const csKeys = getAllKeys(csTranslations);
        
        const extraKeys = csKeys.filter(key => !enKeys.has(key));
        
        expect(extraKeys, `Extra keys in Czech translation for ${ns}: ${extraKeys.join(', ')}`).toHaveLength(0);
      });

      it('should have the same number of keys in all languages', () => {
        const deTranslations = loadNamespace('de', ns);
        const csTranslations = loadNamespace('cs', ns);
        const enKeys = getAllKeys(enTranslations);
        const deKeys = getAllKeys(deTranslations);
        const csKeys = getAllKeys(csTranslations);
        
        expect(deKeys.length, `German should have same number of keys as English for ${ns}`).toBe(enKeys.length);
        expect(csKeys.length, `Czech should have same number of keys as English for ${ns}`).toBe(enKeys.length);
      });

      it('should not have empty values in German translation', () => {
        const deTranslations = loadNamespace('de', ns);
        const deKeys = getAllKeys(deTranslations);
        
        const emptyValues = deKeys.filter(key => {
          const value = getValueByPath(deTranslations, key);
          return typeof value === 'string' && value.trim() === '';
        });
        
        expect(emptyValues, `Empty values in German translation for ${ns}: ${emptyValues.join(', ')}`).toHaveLength(0);
      });

      it('should not have empty values in Czech translation', () => {
        const csTranslations = loadNamespace('cs', ns);
        const csKeys = getAllKeys(csTranslations);
        
        const emptyValues = csKeys.filter(key => {
          const value = getValueByPath(csTranslations, key);
          return typeof value === 'string' && value.trim() === '';
        });
        
        expect(emptyValues, `Empty values in Czech translation for ${ns}: ${emptyValues.join(', ')}`).toHaveLength(0);
      });

      it('should preserve interpolation variables in German translations', () => {
        const deTranslations = loadNamespace('de', ns);
        const enKeys = getAllKeys(enTranslations);
        
        for (const key of enKeys) {
          const enValue = getValueByPath(enTranslations, key);
          const deValue = getValueByPath(deTranslations, key);
          
          if (typeof enValue !== 'string' || typeof deValue !== 'string') {
            continue;
          }
          
          // Extract interpolation variables (e.g., {{variable}})
          const enVars = enValue.match(/\{\{[^}]+\}\}/g) || [];
          const deVars = deValue.match(/\{\{[^}]+\}\}/g) || [];
          
          // Sort for comparison
          enVars.sort();
          deVars.sort();
          
          expect(deVars, `${ns}.${key} should have the same interpolation variables in German`).toEqual(enVars);
        }
      });

      it('should preserve interpolation variables in Czech translations', () => {
        const csTranslations = loadNamespace('cs', ns);
        const enKeys = getAllKeys(enTranslations);
        
        for (const key of enKeys) {
          const enValue = getValueByPath(enTranslations, key);
          const csValue = getValueByPath(csTranslations, key);
          
          if (typeof enValue !== 'string' || typeof csValue !== 'string') {
            continue;
          }
          
          // Extract interpolation variables (e.g., {{variable}})
          const enVars = enValue.match(/\{\{[^}]+\}\}/g) || [];
          const csVars = csValue.match(/\{\{[^}]+\}\}/g) || [];
          
          // Sort for comparison
          enVars.sort();
          csVars.sort();
          
          expect(csVars, `${ns}.${key} should have the same interpolation variables in Czech`).toEqual(enVars);
        }
      });

      it('should preserve HTML tags in German translations', () => {
        const deTranslations = loadNamespace('de', ns);
        const enKeys = getAllKeys(enTranslations);
        
        for (const key of enKeys) {
          const enValue = getValueByPath(enTranslations, key);
          const deValue = getValueByPath(deTranslations, key);
          
          if (typeof enValue !== 'string' || typeof deValue !== 'string') {
            continue;
          }
          
          // Extract HTML tags
          const enTags = enValue.match(/<[^>]+>/g) || [];
          const deTags = deValue.match(/<[^>]+>/g) || [];
          
          // Sort for comparison
          enTags.sort();
          deTags.sort();
          
          expect(deTags, `${ns}.${key} should have the same HTML tags in German`).toEqual(enTags);
        }
      });

      it('should preserve HTML tags in Czech translations', () => {
        const csTranslations = loadNamespace('cs', ns);
        const enKeys = getAllKeys(enTranslations);
        
        for (const key of enKeys) {
          const enValue = getValueByPath(enTranslations, key);
          const csValue = getValueByPath(csTranslations, key);
          
          if (typeof enValue !== 'string' || typeof csValue !== 'string') {
            continue;
          }
          
          // Extract HTML tags
          const enTags = enValue.match(/<[^>]+>/g) || [];
          const csTags = csValue.match(/<[^>]+>/g) || [];
          
          // Sort for comparison
          enTags.sort();
          csTags.sort();
          
          expect(csTags, `${ns}.${key} should have the same HTML tags in Czech`).toEqual(enTags);
        }
      });
    });
  });
});
