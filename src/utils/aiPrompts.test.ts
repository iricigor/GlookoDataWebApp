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

    it('should mention diabetes care', () => {
      expect(AI_SYSTEM_PROMPT).toContain('diabetes care');
    });

    it('should mention continuous glucose monitoring', () => {
      expect(AI_SYSTEM_PROMPT).toContain('continuous glucose monitoring');
    });

    it('should specify mmol/L units', () => {
      expect(AI_SYSTEM_PROMPT).toContain('mmol/L');
    });

    it('should specify second person communication', () => {
      expect(AI_SYSTEM_PROMPT).toContain('you/your');
    });

    it('should specify not to assume healthcare provider intermediary', () => {
      expect(AI_SYSTEM_PROMPT).toContain('Do not assume there is a healthcare provider intermediary');
    });
  });
});
