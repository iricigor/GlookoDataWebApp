import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  makeStyles,
  Avatar,
  shorthands,
  Text,
  tokens,
  Tooltip,
  Spinner,
} from '@fluentui/react-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProUserBadgeStyles } from '../../styles/proUserBadge';

const useStyles = makeStyles({
  userButton: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  secretContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    ...shorthands.padding('12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  secretLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  secretValue: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
    wordBreak: 'break-all',
  },
  secretLoading: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    color: tokens.colorNeutralForeground2,
  },
  secretNotAvailable: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
  },
});

interface LogoutDialogProps {
  userName: string;
  userEmail?: string | null;
  userPhoto?: string | null;
  isProUser?: boolean;
  /** Secret value from Key Vault (only for pro users) */
  secretValue?: string | null;
  /** Whether the secret is currently being fetched */
  isSecretLoading?: boolean;
  onLogout: () => Promise<void>;
}

/**
 * Render a logout dialog that displays the user's avatar, name, optional email and pro-user badge,
 * conditionally shows a Key Vault secret for pro users, and provides Cancel and Logout actions.
 *
 * @param userName - The display name shown in the trigger and dialog
 * @param userEmail - Optional email displayed in the dialog when provided
 * @param userPhoto - Optional avatar image URL
 * @param isProUser - Whether to show the pro-user badge and the secret section
 * @param secretValue - Optional Key Vault secret to display for pro users; if absent, "Not available" is shown
 * @param isSecretLoading - When true, displays a loading indicator instead of the secret value
 * @param onLogout - Async handler invoked when the user confirms logout; the dialog closes on successful completion
 * @returns The dialog element containing the user trigger and logout confirmation UI
 */
export function LogoutDialog({ 
  userName, 
  userEmail, 
  userPhoto, 
  isProUser, 
  secretValue,
  isSecretLoading,
  onLogout,
}: LogoutDialogProps) {
  const styles = useStyles();
  const proBadgeStyles = useProUserBadgeStyles();
  const { t } = useTranslation('dialogs');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onLogout();
      setOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" className={styles.userButton}>
          <Avatar 
            name={userName} 
            size={28}
            image={userPhoto ? { src: userPhoto } : undefined}
          />
          {userName}
          {isProUser && (
            <Tooltip content={t('logoutDialog.proUser')} relationship="label">
              <span className={proBadgeStyles.proUserBadge} aria-label={t('logoutDialog.proUser')}>✨</span>
            </Tooltip>
          )}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t('logoutDialog.title')}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.userInfo}>
              <Avatar 
                name={userName} 
                size={48}
                image={userPhoto ? { src: userPhoto } : undefined}
              />
              <div className={styles.userDetails}>
                <div className={proBadgeStyles.userNameContainer}>
                  <Text className={styles.userName}>{userName}</Text>
                  {isProUser && (
                    <Tooltip content={t('logoutDialog.proUser')} relationship="label">
                      <span className={proBadgeStyles.proUserBadge} aria-label={t('logoutDialog.proUser')}>✨</span>
                    </Tooltip>
                  )}
                </div>
                {userEmail && (
                  <Text className={styles.userEmail}>{userEmail}</Text>
                )}
              </div>
            </div>
            {isProUser && (
              <div className={styles.secretContainer}>
                <Text className={styles.secretLabel}>{t('logoutDialog.keyVaultSecret')}</Text>
                {isSecretLoading ? (
                  <div className={styles.secretLoading}>
                    <Spinner size="tiny" />
                    <Text>{t('logoutDialog.loadingSecret')}</Text>
                  </div>
                ) : secretValue ? (
                  <Text className={styles.secretValue}>{secretValue}</Text>
                ) : (
                  <Text className={styles.secretNotAvailable}>{t('logoutDialog.secretNotAvailable')}</Text>
                )}
              </div>
            )}
            <Text>{t('logoutDialog.confirmMessage')}</Text>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={loading}>{t('logoutDialog.cancel')}</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? t('logoutDialog.loggingOut') : t('navigation.logout')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}