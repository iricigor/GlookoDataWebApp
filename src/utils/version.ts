/**
 * Version information for the application
 */

export interface VersionInfo {
  version: string;
  buildId: string;
  buildDate: string;
  fullVersion: string;
  releaseUrl: string | null;
}

/**
 * Get the application version information
 * @returns VersionInfo object containing version, build ID, build date, full version, and release URL
 */
export function getVersionInfo(): VersionInfo {
  const version = __APP_VERSION__;
  const buildId = __BUILD_ID__;
  const buildDate = __BUILD_DATE__;
  
  // For production builds, append build ID to version (e.g., 1.0.152)
  // For dev builds, use version as-is
  const fullVersion = buildId === 'dev' ? `${version}-dev` : `${version}.${buildId}`;
  
  // Generate GitHub release URL for production builds
  const releaseUrl = buildId !== 'dev' ? getGitHubReleaseUrl(version) : null;
  
  return {
    version,
    buildId,
    buildDate,
    fullVersion,
    releaseUrl,
  };
}

/**
 * Generate GitHub release URL for a given version
 * @param version - The version number (e.g., "1.2.1")
 * @returns GitHub release URL
 */
export function getGitHubReleaseUrl(version: string): string {
  const owner = 'iricigor';
  const repo = 'GlookoDataWebApp';
  return `https://github.com/${owner}/${repo}/releases/tag/v${version}`;
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
