/**
 * WelcomeDialog component
 * 
 * Displays a welcome message for first-time users logging into the app.
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
    maxWidth: '400px',
  },
  sparkle: {
    color: tokens.colorBrandForeground1,
    marginRight: '8px',
  },
});

interface WelcomeDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the user acknowledges the welcome message */
  onClose: () => void;
  /** Optional user name to personalize the message */
  userName?: string | null;
}

/**
 * Dialog component that welcomes first-time users to the app
 */
export function WelcomeDialog({ open, onClose, userName }: WelcomeDialogProps) {
  const styles = useStyles();

  const greeting = userName ? `Welcome, ${userName}!` : 'Welcome to our app!';

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
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
              Explore the app to upload your Glooko data exports, view detailed reports, and get AI-powered insights.
            </Text>
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={onClose}>
            OK
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
