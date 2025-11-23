/**
 * Tests for prompt utilities
 */

import { describe, it, expect } from 'vitest';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';

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

  describe('getDisclaimerInstruction', () => {
    it('should return disclaimer with AI when no provider specified', () => {
      const result = getDisclaimerInstruction();
      expect(result).toContain('Data is provided by AI');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should return disclaimer with Perplexity when perplexity provider specified', () => {
      const result = getDisclaimerInstruction('perplexity');
      expect(result).toContain('Data is provided by Perplexity');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should return disclaimer with Google Gemini when gemini provider specified', () => {
      const result = getDisclaimerInstruction('gemini');
      expect(result).toContain('Data is provided by Google Gemini');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should return disclaimer with Grok AI when grok provider specified', () => {
      const result = getDisclaimerInstruction('grok');
      expect(result).toContain('Data is provided by Grok AI');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should return disclaimer with DeepSeek when deepseek provider specified', () => {
      const result = getDisclaimerInstruction('deepseek');
      expect(result).toContain('Data is provided by DeepSeek');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should include medical disclaimer', () => {
      const result = getDisclaimerInstruction('perplexity');
      expect(result).toContain('medical disclaimer');
    });

    it('should include healthcare provider advice', () => {
      const result = getDisclaimerInstruction('gemini');
      expect(result).toContain('healthcare provider');
    });
  });
});
