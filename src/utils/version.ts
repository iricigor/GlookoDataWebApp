/**
 * Version information for the application
 */

export interface VersionInfo {
  version: string;
  buildId: string;
  buildDate: string;
  fullVersion: string;
}

/**
 * Get the application version information
 * @returns VersionInfo object containing version, build ID, build date, and full version
 */
export function getVersionInfo(): VersionInfo {
  const version = __APP_VERSION__;
  const buildId = __BUILD_ID__;
  const buildDate = __BUILD_DATE__;
  
  // For production builds, append build ID to version (e.g., 1.0.152)
  // For dev builds, use version as-is
  const fullVersion = buildId === 'dev' ? `${version}-dev` : `${version}.${buildId}`;
  
  return {
    version,
    buildId,
    buildDate,
    fullVersion,
  };
}

/**
 * Format the build date for display
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
export function formatBuildDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return isoDate;
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoDate;
  }
}
