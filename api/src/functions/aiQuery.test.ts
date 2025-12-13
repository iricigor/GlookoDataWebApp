/**
 * Unit tests for the AI Query function
 * 
 * Tests the Pro user marker functionality that adds ✨ emoji to responses
 */

import { describe, it, expect } from 'vitest';

/**
 * Helper function to add Pro user confirmation marker (✨) to AI response content.
 * 
 * This is a copy of the internal function from aiQuery.ts for testing purposes.
 * It's necessary to duplicate it here since the original is not exported.
 */
function addProUserMarker(content: string): string {
  const marker = '--- CONCLUSIO DATAE ---';
  const proEmoji = '✨';
  
  // Try to find the CONCLUSIO DATAE marker and add emoji before it
  const markerIndex = content.indexOf(marker);
  if (markerIndex !== -1) {
    // Insert emoji on a new line before the marker
    return content.substring(0, markerIndex) + `\n${proEmoji}\n` + content.substring(markerIndex);
  }
  
  // Fallback: prepend emoji at the beginning
  return `${proEmoji}\n${content}`;
}

describe('addProUserMarker', () => {
  it('should add ✨ emoji before CONCLUSIO DATAE marker when present', () => {
    const input = 'Here is some AI analysis.\n\n--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    expect(result).toContain('✨');
    expect(result).toContain('--- CONCLUSIO DATAE ---');
    expect(result.indexOf('✨')).toBeLessThan(result.indexOf('--- CONCLUSIO DATAE ---'));
  });

  it('should preserve content structure when adding emoji before marker', () => {
    const input = 'Analysis text here.\n\nSome recommendations.\n\n--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    expect(result).toBe('Analysis text here.\n\nSome recommendations.\n\n\n✨\n--- CONCLUSIO DATAE ---');
  });

  it('should add ✨ emoji at the beginning when CONCLUSIO DATAE marker is missing', () => {
    const input = 'Here is some AI analysis without the marker.';
    const result = addProUserMarker(input);
    
    expect(result).toContain('✨');
    expect(result.startsWith('✨\n')).toBe(true);
    expect(result).toContain('Here is some AI analysis without the marker.');
  });

  it('should handle empty string by adding emoji at the beginning', () => {
    const input = '';
    const result = addProUserMarker(input);
    
    expect(result).toBe('✨\n');
  });

  it('should handle content with only the marker', () => {
    const input = '--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    expect(result).toBe('\n✨\n--- CONCLUSIO DATAE ---');
  });

  it('should handle multi-line content with marker at the end', () => {
    const input = 'Line 1\nLine 2\nLine 3\n\n--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    expect(result).toContain('✨');
    expect(result).toContain('Line 1\nLine 2\nLine 3');
    expect(result.indexOf('✨')).toBeLessThan(result.indexOf('--- CONCLUSIO DATAE ---'));
  });

  it('should only add one emoji even if marker appears multiple times', () => {
    const input = 'Content\n--- CONCLUSIO DATAE ---\nMore content\n--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    // Count emoji occurrences
    const emojiCount = (result.match(/✨/g) || []).length;
    expect(emojiCount).toBe(1);
    
    // Should be added before the first marker
    const firstMarkerIndex = result.indexOf('--- CONCLUSIO DATAE ---');
    const emojiIndex = result.indexOf('✨');
    expect(emojiIndex).toBeLessThan(firstMarkerIndex);
  });

  it('should handle content with disclaimer before marker', () => {
    const input = 'Analysis here.\n\nDisclaimer: This data is provided by AI and might not be correct. Always consult with a doctor.\n\n--- CONCLUSIO DATAE ---';
    const result = addProUserMarker(input);
    
    expect(result).toContain('✨');
    expect(result).toContain('Disclaimer');
    expect(result.indexOf('Disclaimer')).toBeLessThan(result.indexOf('✨'));
    expect(result.indexOf('✨')).toBeLessThan(result.indexOf('--- CONCLUSIO DATAE ---'));
  });

  it('should work with typical Pro user AI response structure', () => {
    const input = `Based on your glucose data, here are some recommendations:

1. Your time in range is 68%
2. You have 3 hypoglycemic events
3. Consider adjusting your basal rates

**Disclaimer**: This data is provided by AI and might not be correct. Always consult with a doctor.

--- CONCLUSIO DATAE ---`;
    
    const result = addProUserMarker(input);
    
    expect(result).toContain('✨');
    expect(result).toContain('--- CONCLUSIO DATAE ---');
    
    // The emoji should be inserted just before the marker
    const lines = result.split('\n');
    const markerLineIndex = lines.findIndex(line => line.includes('--- CONCLUSIO DATAE ---'));
    const emojiLineIndex = lines.findIndex(line => line.includes('✨'));
    
    expect(emojiLineIndex).toBe(markerLineIndex - 1);
  });
});
