/**
 * ProUserAvatar component
 * 
 * Wraps Fluent UI Avatar with an optional Pro User badge overlay.
 * The badge appears as a sparkle emoji in the top-right corner of the avatar.
 */

import {
  Avatar,
  makeStyles,
  shorthands,
  tokens,
  Tooltip,
  type AvatarProps,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
    cursor: 'default',
    fontSize: '12px',
    width: '18px',
    height: '18px',
  },
  badgeLarge: {
    top: '-3px',
    right: '-3px',
    fontSize: '16px',
    width: '24px',
    height: '24px',
  },
});

/**
 * Determine if the avatar should use the large badge size based on avatar size.
 * Large badge (24px) for avatars >= 48px, small badge (18px) for smaller avatars.
 * 
 * @param avatarSize - The size prop value from AvatarProps
 * @returns true if the avatar is large enough for the large badge
 */
function getIsLargeAvatar(avatarSize: AvatarProps['size']): boolean {
  if (typeof avatarSize === 'number') {
    return avatarSize >= 48;
  }
  // Handle named sizes from Fluent UI
  const largeNamedSizes = ['large', 'larger', 'largest'];
  return largeNamedSizes.includes(avatarSize || '');
}

interface ProUserAvatarProps extends AvatarProps {
  /** Whether to show the Pro User badge overlay */
  isProUser?: boolean;
}

/**
 * Renders an Avatar with an optional Pro User badge overlay in the top-right corner.
 * 
 * @param isProUser - When true, displays a sparkle badge overlay
 * @param size - Avatar size (inherited from AvatarProps)
 * @param name - User's name for the avatar (inherited from AvatarProps)
 * @param image - Optional avatar image (inherited from AvatarProps)
 * @param ...rest - All other Avatar props are passed through
 * @returns Avatar element with optional Pro badge overlay
 */
export function ProUserAvatar({ 
  isProUser, 
  size = 32,
  ...avatarProps 
}: ProUserAvatarProps) {
  const styles = useStyles();
  const { t } = useTranslation('dialogs');

  const isLargeAvatar = getIsLargeAvatar(size);

  return (
    <div className={styles.container}>
      <Avatar size={size} {...avatarProps} />
      {isProUser && (
        <Tooltip content={t('logoutDialog.proUser')} relationship="label">
          <span 
            className={`${styles.badge} ${isLargeAvatar ? styles.badgeLarge : ''}`}
            aria-label={t('logoutDialog.proUser')}
            role="img"
          >
            ✨
          </span>
        </Tooltip>
      )}
    </div>
  );
}
