/**
 * Utility functions for BG graph coloring schemes
 * 
 * This module provides color calculation functions for different
 * glucose value visualization schemes.
 */

import { tokens } from '@fluentui/react-components';
import type { BGColorScheme } from '../../hooks/useBGColorScheme';

export interface ColorSchemeDescriptor {
  name: string;
  description: string;
}

/**
 * Get descriptive information for each color scheme
 */
export const COLOR_SCHEME_DESCRIPTORS: Record<BGColorScheme, ColorSchemeDescriptor> = {
  monochrome: {
    name: 'Monochrome',
    description: 'Single brand color (current default)',
  },
  basic: {
    name: 'Basic Colors',
    description: 'Red <4, Green 4-10, Yellow >10',
  },
  hsv: {
    name: 'HSV Spectrum',
    description: 'Smooth gradient from red to magenta',
  },
  clinical: {
    name: 'Clinical Zones',
    description: 'Distinct zones with medical significance',
  },
};

/**
 * Convert HSV to RGB color
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param v Value (0-1)
 * @returns RGB color string in format 'rgb(r, g, b)'
 */
function hsvToRgb(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);
  
  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Calculate HSV spectrum color based on glucose value
 * Uses the specified HSV mapping:
 * - ≤2: Red (H=0)
 * - 4: Yellow (H=60)
 * - 10: Cyan-green (H=150)
 * - ≥15: Magenta (H=300)
 * 
 * @param glucoseValue Glucose value in mmol/L
 * @returns RGB color string
 */
function getHSVColor(glucoseValue: number): string {
  let hue: number;
  
  if (glucoseValue <= 2) {
    hue = 0; // Red
  } else if (glucoseValue <= 4) {
    // Interpolate between 0 (red) and 60 (yellow)
    hue = ((glucoseValue - 2) / (4 - 2)) * 60;
  } else if (glucoseValue <= 10) {
    // Interpolate between 60 (yellow) and 150 (cyan-green)
    hue = 60 + ((glucoseValue - 4) / (10 - 4)) * 90;
  } else if (glucoseValue <= 15) {
    // Interpolate between 150 (cyan-green) and 300 (magenta)
    hue = 150 + ((glucoseValue - 10) / (15 - 10)) * 150;
  } else {
    hue = 300; // Magenta
  }
  
  return hsvToRgb(hue, 0.8, 0.9);
}

/**
 * Calculate basic color based on glucose value
 * - <4: Red
 * - 4-10: Green
 * - >10: Yellow/Orange
 * 
 * @param glucoseValue Glucose value in mmol/L
 * @returns Color string using Fluent UI tokens
 */
function getBasicColor(glucoseValue: number): string {
  if (glucoseValue < 4) {
    return tokens.colorPaletteRedForeground1;
  } else if (glucoseValue <= 10) {
    return tokens.colorPaletteGreenForeground1;
  } else {
    return tokens.colorPaletteMarigoldForeground1;
  }
}

/**
 * Calculate clinical zone color based on glucose value
 * More detailed zones with clinical significance:
 * - <3: Severe hypoglycemia (dark red)
 * - 3-4: Hypoglycemia (red)
 * - 4-5.5: Low normal (light green)
 * - 5.5-10: Target range (green)
 * - 10-13.9: High normal (yellow)
 * - ≥14: Hyperglycemia (orange)
 * 
 * @param glucoseValue Glucose value in mmol/L
 * @returns Color string using Fluent UI tokens
 */
function getClinicalColor(glucoseValue: number): string {
  if (glucoseValue < 3) {
    return tokens.colorPaletteDarkRedForeground2;
  } else if (glucoseValue < 4) {
    return tokens.colorPaletteRedForeground1;
  } else if (glucoseValue < 5.5) {
    return tokens.colorPaletteLightGreenForeground1;
  } else if (glucoseValue <= 10) {
    return tokens.colorPaletteGreenForeground1;
  } else if (glucoseValue < 14) {
    return tokens.colorPaletteMarigoldForeground1;
  } else {
    return tokens.colorPaletteDarkOrangeForeground1;
  }
}

/**
 * Get color for a glucose value based on the selected color scheme
 * 
 * @param glucoseValue Glucose value in mmol/L
 * @param scheme Color scheme to use
 * @returns Color string (either Fluent UI token or RGB)
 */
export function getGlucoseColor(glucoseValue: number, scheme: BGColorScheme): string {
  switch (scheme) {
    case 'monochrome':
      return tokens.colorBrandForeground1;
    case 'basic':
      return getBasicColor(glucoseValue);
    case 'hsv':
      return getHSVColor(glucoseValue);
    case 'clinical':
      return getClinicalColor(glucoseValue);
    default:
      return tokens.colorBrandForeground1;
  }
}

/**
 * Check if a color scheme uses dynamic coloring (different colors per data point)
 * 
 * @param scheme Color scheme to check
 * @returns true if the scheme uses dynamic colors
 */
export function isDynamicColorScheme(scheme: BGColorScheme): boolean {
  return scheme !== 'monochrome';
}
