/**
 * Tests for BG color utilities
 */

import { describe, it, expect } from 'vitest';
import { getGlucoseColor, isDynamicColorScheme, COLOR_SCHEME_DESCRIPTORS } from './bgColorUtils';
import { tokens } from '@fluentui/react-components';

describe('bgColorUtils', () => {
  describe('COLOR_SCHEME_DESCRIPTORS', () => {
    it('should have descriptors for all schemes', () => {
      expect(COLOR_SCHEME_DESCRIPTORS.monochrome).toBeDefined();
      expect(COLOR_SCHEME_DESCRIPTORS.basic).toBeDefined();
      expect(COLOR_SCHEME_DESCRIPTORS.hsv).toBeDefined();
      expect(COLOR_SCHEME_DESCRIPTORS.clinical).toBeDefined();
    });

    it('should have name and description for each scheme', () => {
      Object.values(COLOR_SCHEME_DESCRIPTORS).forEach(descriptor => {
        expect(descriptor.name).toBeTruthy();
        expect(descriptor.description).toBeTruthy();
      });
    });
  });

  describe('getGlucoseColor - monochrome', () => {
    it('should return brand color for all values', () => {
      const scheme = 'monochrome';
      expect(getGlucoseColor(2, scheme)).toBe(tokens.colorBrandForeground1);
      expect(getGlucoseColor(5, scheme)).toBe(tokens.colorBrandForeground1);
      expect(getGlucoseColor(15, scheme)).toBe(tokens.colorBrandForeground1);
    });
  });

  describe('getGlucoseColor - basic', () => {
    it('should return red for values below 4', () => {
      const scheme = 'basic';
      expect(getGlucoseColor(2, scheme)).toBe(tokens.colorPaletteRedForeground1);
      expect(getGlucoseColor(3.5, scheme)).toBe(tokens.colorPaletteRedForeground1);
    });

    it('should return green for values between 4 and 10', () => {
      const scheme = 'basic';
      expect(getGlucoseColor(4, scheme)).toBe(tokens.colorPaletteGreenForeground1);
      expect(getGlucoseColor(7, scheme)).toBe(tokens.colorPaletteGreenForeground1);
      expect(getGlucoseColor(10, scheme)).toBe(tokens.colorPaletteGreenForeground1);
    });

    it('should return yellow for values above 10', () => {
      const scheme = 'basic';
      expect(getGlucoseColor(11, scheme)).toBe(tokens.colorPaletteMarigoldForeground1);
      expect(getGlucoseColor(15, scheme)).toBe(tokens.colorPaletteMarigoldForeground1);
    });
  });

  describe('getGlucoseColor - hsv', () => {
    it('should return red RGB for values at or below 2', () => {
      const scheme = 'hsv';
      const color = getGlucoseColor(2, scheme);
      expect(color).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
      // Red should have high R component
      const [r] = color.match(/\d+/g)!.map(Number);
      expect(r).toBeGreaterThan(200);
    });

    it('should return magenta RGB for values at or above 15', () => {
      const scheme = 'hsv';
      const color = getGlucoseColor(15, scheme);
      expect(color).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    });

    it('should return yellow RGB for value around 4', () => {
      const scheme = 'hsv';
      const color = getGlucoseColor(4, scheme);
      expect(color).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    });

    it('should interpolate colors between key values', () => {
      const scheme = 'hsv';
      const color1 = getGlucoseColor(3, scheme);
      const color2 = getGlucoseColor(4, scheme);
      const color3 = getGlucoseColor(5, scheme);
      
      // All should be different colors
      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
    });
  });

  describe('getGlucoseColor - clinical', () => {
    it('should return dark red for severe hypoglycemia (<3)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(2, scheme)).toBe(tokens.colorPaletteDarkRedForeground2);
      expect(getGlucoseColor(2.5, scheme)).toBe(tokens.colorPaletteDarkRedForeground2);
    });

    it('should return red for hypoglycemia (3-4)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(3, scheme)).toBe(tokens.colorPaletteRedForeground1);
      expect(getGlucoseColor(3.8, scheme)).toBe(tokens.colorPaletteRedForeground1);
    });

    it('should return light green for low normal (4-5.5)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(4, scheme)).toBe(tokens.colorPaletteLightGreenForeground1);
      expect(getGlucoseColor(5, scheme)).toBe(tokens.colorPaletteLightGreenForeground1);
    });

    it('should return green for target range (5.5-10)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(6, scheme)).toBe(tokens.colorPaletteGreenForeground1);
      expect(getGlucoseColor(8, scheme)).toBe(tokens.colorPaletteGreenForeground1);
      expect(getGlucoseColor(10, scheme)).toBe(tokens.colorPaletteGreenForeground1);
    });

    it('should return yellow for high normal (10-14)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(11, scheme)).toBe(tokens.colorPaletteMarigoldForeground1);
      expect(getGlucoseColor(13, scheme)).toBe(tokens.colorPaletteMarigoldForeground1);
    });

    it('should return dark orange for hyperglycemia (>=14)', () => {
      const scheme = 'clinical';
      expect(getGlucoseColor(14, scheme)).toBe(tokens.colorPaletteDarkOrangeForeground1);
      expect(getGlucoseColor(20, scheme)).toBe(tokens.colorPaletteDarkOrangeForeground1);
    });
  });

  describe('isDynamicColorScheme', () => {
    it('should return false for monochrome', () => {
      expect(isDynamicColorScheme('monochrome')).toBe(false);
    });

    it('should return true for basic', () => {
      expect(isDynamicColorScheme('basic')).toBe(true);
    });

    it('should return true for hsv', () => {
      expect(isDynamicColorScheme('hsv')).toBe(true);
    });

    it('should return true for clinical', () => {
      expect(isDynamicColorScheme('clinical')).toBe(true);
    });
  });
});
