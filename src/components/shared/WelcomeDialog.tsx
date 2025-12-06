/**
 * WelcomeDialog component
 * 
 * Displays a welcome message for first-time users logging into the app.
 * Explains cloud settings storage and gets consent before proceeding.
 */

import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { 
  PersonRegular,
  SparkleRegular,
  CloudRegular,
  ShieldCheckmarkRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: '32px',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  message: {
    color: tokens.colorNeutralForeground2,
    maxWidth: '450px',
    lineHeight: '1.5',
  },
  sparkle: {
    color: tokens.colorBrandForeground1,
    marginRight: '8px',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '8px',
    textAlign: 'left',
    width: '100%',
    maxWidth: '450px',
  },
  settingsItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
  },
  settingsIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px',
  },
  settingsText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: '1.4',
  },
  privacyNote: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: 'italic',
    marginTop: '8px',
    textAlign: 'center',
  },
});

interface WelcomeDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the user accepts and wants to save settings */
  onAccept: () => void;
  /** Callback when the user cancels (doesn't want to save settings) */
  onCancel: () => void;
  /** Optional user name to personalize the message */
  userName?: string | null;
}

/**
 * Display a welcome dialog that explains cloud settings storage and prompts the user to save or cancel.
 *
 * @param open - Whether the dialog is visible.
 * @param onAccept - Callback invoked when the user accepts and chooses to save settings.
 * @param onCancel - Callback invoked when the user cancels the dialog.
 * @param userName - Optional user name to personalize the greeting; if not provided a default greeting is used.
 * @returns The React element for the welcome dialog.
 */
export function WelcomeDialog({ open, onAccept, onCancel, userName }: WelcomeDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const greeting = userName 
    ? t('welcomeDialog.greeting', { userName }) 
    : t('welcomeDialog.greetingDefault');

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface>
        <DialogTitle>
          <SparkleRegular className={styles.sparkle} />
          {t('welcomeDialog.title')}
        </DialogTitle>
        <DialogBody>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.iconContainer}>
              <PersonRegular />
            </div>
            <Text className={styles.title}>{greeting}</Text>
            <Text className={styles.message}>
              {t('welcomeDialog.thankYou')}
            </Text>
            
            <div className={styles.settingsSection}>
              <div className={styles.settingsItem}>
                <CloudRegular className={styles.settingsIcon} />
                <Text className={styles.settingsText}>
                  <strong>{t('welcomeDialog.cloudSettingsSync')}</strong> {t('welcomeDialog.cloudSettingsSyncDescription')}
                </Text>
              </div>
              <div className={styles.settingsItem}>
                <ShieldCheckmarkRegular className={styles.settingsIcon} />
                <Text className={styles.settingsText}>
                  <strong>{t('welcomeDialog.privacyFirst')}</strong> {t('welcomeDialog.privacyFirstDescription')}
                </Text>
              </div>
            </div>
            
            <Text className={styles.privacyNote}>
              {t('welcomeDialog.privacyNote')}
            </Text>
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={onCancel}>
            {t('welcomeDialog.cancel')}
          </Button>
          <Button appearance="primary" onClick={onAccept}>
            {t('welcomeDialog.saveSettings')}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}