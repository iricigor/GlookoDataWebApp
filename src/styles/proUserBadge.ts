/**
 * Shared styles for Pro User badge display
 * 
 * These styles are used across components that display the ✨ pro user badge.
 */

import { makeStyles } from '@fluentui/react-components';

/**
 * Hook that returns shared styles for the pro user badge
 */
export const useProUserBadgeStyles = makeStyles({
  /**
   * Container for username with pro badge
   */
  userNameContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  /**
   * Pro user sparkle badge styling
   */
  proUserBadge: {
    marginLeft: '4px',
    cursor: 'default',
  },
});
