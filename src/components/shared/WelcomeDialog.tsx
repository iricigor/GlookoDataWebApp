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
 * Dialog component that welcomes first-time users to the app
 * and explains cloud settings storage
 */
export function WelcomeDialog({ open, onAccept, onCancel, userName }: WelcomeDialogProps) {
  const styles = useStyles();

  const greeting = userName ? `Welcome, ${userName}!` : 'Welcome to our app!';

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface>
        <DialogTitle>
          <SparkleRegular className={styles.sparkle} />
          Welcome!
        </DialogTitle>
        <DialogBody>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.iconContainer}>
              <PersonRegular />
            </div>
            <Text className={styles.title}>{greeting}</Text>
            <Text className={styles.message}>
              Thank you for joining us! We're excited to help you manage and analyze your diabetes data.
            </Text>
            
            <div className={styles.settingsSection}>
              <div className={styles.settingsItem}>
                <CloudRegular className={styles.settingsIcon} />
                <Text className={styles.settingsText}>
                  <strong>Cloud Settings Sync:</strong> Your app preferences (theme, glucose unit, thresholds, etc.) 
                  will be saved to the cloud so they sync across all your devices.
                </Text>
              </div>
              <div className={styles.settingsItem}>
                <ShieldCheckmarkRegular className={styles.settingsIcon} />
                <Text className={styles.settingsText}>
                  <strong>Privacy First:</strong> We only store your email address for account identification 
                  and your app preferences. No personal health data, glucose readings, or medical information 
                  is ever stored in our cloud.
                </Text>
              </div>
            </div>
            
            <Text className={styles.privacyNote}>
              If you prefer not to save settings to the cloud, click "Cancel" to log out. 
              You can still use the app without logging in.
            </Text>
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button appearance="primary" onClick={onAccept}>
            Save Settings
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
