/**
 * Tests for AI Prompts Constants
 */

import { describe, it, expect } from 'vitest';
import { AI_SYSTEM_PROMPT } from './aiPrompts';

describe('aiPrompts', () => {
  describe('AI_SYSTEM_PROMPT', () => {
    it('should be defined', () => {
      expect(AI_SYSTEM_PROMPT).toBeDefined();
      expect(AI_SYSTEM_PROMPT).toBeTruthy();
    });

    it('should be a non-empty string', () => {
      expect(typeof AI_SYSTEM_PROMPT).toBe('string');
      expect(AI_SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    it('should specify expert endocrinologist role', () => {
      expect(AI_SYSTEM_PROMPT).toContain('expert endocrinologist');
    });

    it('should mention type-1 diabetes specialization', () => {
      expect(AI_SYSTEM_PROMPT).toContain('type-1 diabetes');
    });

    it('should mention CGM and insulin pump data analysis', () => {
      expect(AI_SYSTEM_PROMPT).toContain('CGM/insulin pump data analysis');
    });

    it('should instruct not to guess or invent missing data', () => {
      expect(AI_SYSTEM_PROMPT).toContain('never guess or invent missing raw data points');
    });

    it('should specify data is aggregated and anonymized', () => {
      expect(AI_SYSTEM_PROMPT).toContain('aggregated and anonymized data only');
    });
  });
});
