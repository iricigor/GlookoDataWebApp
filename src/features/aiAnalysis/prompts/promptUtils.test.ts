/**
 * Tests for prompt utilities
 */

import { describe, it, expect } from 'vitest';
import { getLanguageInstruction, getDisclaimerInstruction, resolveResponseLanguage } from './promptUtils';

describe('promptUtils', () => {
  describe('getLanguageInstruction', () => {
    it('should return English instruction for english language', () => {
      const result = getLanguageInstruction('english');
      expect(result).toBe('Respond in English.');
    });

    it('should return Czech instruction for czech language with formal mode', () => {
      const result = getLanguageInstruction('czech');
      expect(result).toContain('Respond in Czech language (česky)');
      expect(result).toContain('formal mode');
      expect(result).toContain('vykání');
      expect(result).toContain('Vy/Váš');
    });

    it('should return German instruction for german language with formal mode', () => {
      const result = getLanguageInstruction('german');
      expect(result).toContain('Respond in German language (auf Deutsch)');
      expect(result).toContain('formal mode');
      expect(result).toContain('Siezen');
      expect(result).toContain('Sie/Ihr');
    });

    it('should return Serbian instruction for serbian language with formal mode', () => {
      const result = getLanguageInstruction('serbian');
      expect(result).toContain('Respond in Serbian language');
      expect(result).toContain('Latin script');
      expect(result).toContain('latiničnim pismom');
      expect(result).toContain('formal mode');
      expect(result).toContain('persiranje');
      expect(result).toContain('Vi/Vaš');
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

    it('should return disclaimer with Perplexity AI when perplexity provider specified', () => {
      const result = getDisclaimerInstruction('perplexity');
      expect(result).toContain('Data is provided by Perplexity AI');
      expect(result).toContain('it might not be correct');
      expect(result).toContain('Always consult with your doctor');
      expect(result).toContain('--- CONCLUSIO DATAE ---');
    });

    it('should return disclaimer with Google Gemini AI when gemini provider specified', () => {
      const result = getDisclaimerInstruction('gemini');
      expect(result).toContain('Data is provided by Google Gemini AI');
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

    it('should return disclaimer with DeepSeek AI when deepseek provider specified', () => {
      const result = getDisclaimerInstruction('deepseek');
      expect(result).toContain('Data is provided by DeepSeek AI');
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

    describe('language support', () => {
      it('should return English disclaimer by default', () => {
        const result = getDisclaimerInstruction('perplexity', 'english');
        expect(result).toContain('Data is provided by Perplexity AI');
        expect(result).toContain('it might not be correct');
        expect(result).toContain('Always consult with your doctor');
      });

      it('should return Czech disclaimer when czech language specified', () => {
        const result = getDisclaimerInstruction('perplexity', 'czech');
        expect(result).toContain('Data poskytuje Perplexity AI');
        expect(result).toContain('nemusí být správná');
        expect(result).toContain('Vždy se poraďte se svým lékařem');
      });

      it('should return German disclaimer when german language specified', () => {
        const result = getDisclaimerInstruction('gemini', 'german');
        expect(result).toContain('Daten werden von Google Gemini AI bereitgestellt');
        expect(result).toContain('möglicherweise nicht korrekt');
        expect(result).toContain('Konsultieren Sie immer Ihren Arzt');
      });

      it('should return Serbian disclaimer when serbian language specified', () => {
        const result = getDisclaimerInstruction('grok', 'serbian');
        expect(result).toContain('Podatke pruža Grok AI');
        expect(result).toContain('mogu biti netačni');
        expect(result).toContain('Uvek se konsultujte sa svojim lekarom');
      });

      it('should include CONCLUSIO DATAE marker in all languages', () => {
        expect(getDisclaimerInstruction('perplexity', 'english')).toContain('--- CONCLUSIO DATAE ---');
        expect(getDisclaimerInstruction('perplexity', 'czech')).toContain('--- CONCLUSIO DATAE ---');
        expect(getDisclaimerInstruction('perplexity', 'german')).toContain('--- CONCLUSIO DATAE ---');
        expect(getDisclaimerInstruction('perplexity', 'serbian')).toContain('--- CONCLUSIO DATAE ---');
      });

      it('should include AI provider name in translated disclaimers', () => {
        const czechResult = getDisclaimerInstruction('gemini', 'czech');
        expect(czechResult).toContain('Google Gemini AI');
        
        const germanResult = getDisclaimerInstruction('deepseek', 'german');
        expect(germanResult).toContain('DeepSeek AI');
        
        const serbianResult = getDisclaimerInstruction(undefined, 'serbian');
        expect(serbianResult).toContain('AI');
      });
    });
  });

  describe('resolveResponseLanguage', () => {
    it('should return english when auto is selected and UI language is en', () => {
      const result = resolveResponseLanguage('auto', 'en');
      expect(result).toBe('english');
    });

    it('should return german when auto is selected and UI language is de', () => {
      const result = resolveResponseLanguage('auto', 'de');
      expect(result).toBe('german');
    });

    it('should return the selected language when not auto - english', () => {
      const result = resolveResponseLanguage('english', 'de');
      expect(result).toBe('english');
    });

    it('should return the selected language when not auto - czech', () => {
      const result = resolveResponseLanguage('czech', 'en');
      expect(result).toBe('czech');
    });

    it('should return the selected language when not auto - german', () => {
      const result = resolveResponseLanguage('german', 'en');
      expect(result).toBe('german');
    });

    it('should return the selected language when not auto - serbian', () => {
      const result = resolveResponseLanguage('serbian', 'de');
      expect(result).toBe('serbian');
    });
  });
});
