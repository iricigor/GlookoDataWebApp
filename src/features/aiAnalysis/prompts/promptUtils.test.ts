/**
 * Tests for prompt utilities
 */

import { describe, it, expect } from 'vitest';
import { getLanguageInstruction } from './promptUtils';

describe('promptUtils', () => {
  describe('getLanguageInstruction', () => {
    it('should return English instruction for english language', () => {
      const result = getLanguageInstruction('english');
      expect(result).toBe('Respond in English.');
    });

    it('should return Czech instruction for czech language', () => {
      const result = getLanguageInstruction('czech');
      expect(result).toBe('Respond in Czech language (česky).');
    });

    it('should return German instruction for german language', () => {
      const result = getLanguageInstruction('german');
      expect(result).toBe('Respond in German language (auf Deutsch).');
    });

    it('should return Serbian instruction for serbian language', () => {
      const result = getLanguageInstruction('serbian');
      expect(result).toBe('Respond in Serbian language using Latin script (na srpskom latiničnim pismom).');
    });

    it('should include Latin script specification for serbian', () => {
      const result = getLanguageInstruction('serbian');
      expect(result).toContain('Latin script');
      expect(result).toContain('latiničnim pismom');
    });
  });
});
