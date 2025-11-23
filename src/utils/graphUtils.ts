/**
 * Microsoft Graph API utilities
 * 
 * Functions to fetch user information from Microsoft Graph API
 */

import type { AccountInfo } from '@azure/msal-browser';

/**
 * User profile data from Microsoft Graph
 */
export interface GraphUserProfile {
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  id: string;
}

/**
 * Fetch user profile information from Microsoft Graph
 * 
 * @param accessToken - Access token for Microsoft Graph API
 * @returns User profile data
 */
export async function fetchUserProfile(accessToken: string): Promise<GraphUserProfile> {
  const graphEndpoint = 'https://graph.microsoft.com/v1.0/me';
  
  try {
    const response = await fetch(graphEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data as GraphUserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Fetch user profile photo from Microsoft Graph
 * 
 * @param accessToken - Access token for Microsoft Graph API
 * @returns Blob URL for the user's photo, or null if not available
 */
export async function fetchUserPhoto(accessToken: string): Promise<string | null> {
  const graphPhotoEndpoint = 'https://graph.microsoft.com/v1.0/me/photo/$value';
  
  try {
    const response = await fetch(graphPhotoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // Photo might not be available (404), which is normal
      if (response.status === 404) {
        console.info('User photo not available');
        return null;
      }
      throw new Error(`Failed to fetch user photo: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching user photo:', error);
    return null;
  }
}

/**
 * Get user display name from account info
 * Falls back to username if display name is not available
 * 
 * @param account - MSAL account info
 * @returns User's display name
 */
export function getUserDisplayName(account: AccountInfo): string {
  return account.name || account.username || 'User';
}

/**
 * Get user email from account info
 * 
 * @param account - MSAL account info
 * @returns User's email address
 */
export function getUserEmail(account: AccountInfo): string {
  return account.username || '';
}
