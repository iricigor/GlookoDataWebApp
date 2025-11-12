/**
 * Base64 encoding/decoding utilities
 * 
 * Shared utilities for encoding and decoding base64 strings used in AI prompts.
 */

/**
 * Convert base64 data to string
 * 
 * @param base64Data - Base64 encoded string
 * @returns Decoded string
 */
export function base64Decode(base64Data: string): string {
  return atob(base64Data);
}

/**
 * Convert string to base64
 * 
 * @param data - String to encode
 * @returns Base64 encoded string
 */
export function base64Encode(data: string): string {
  return btoa(data);
}
