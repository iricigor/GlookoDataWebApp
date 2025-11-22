import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  makeStyles,
  tokens,
  shorthands,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { useState, useEffect, useCallback } from 'react';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  countdownText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
});

interface WelcomeDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** User's email address */
  userEmail: string;
  /** Called when the dialog is closed */
  onClose: () => void;
  /** Called to create user settings in Azure */
  onCreateSettings: () => Promise<boolean>;
}

export function WelcomeDialog({ open, userEmail, onClose, onCreateSettings }: WelcomeDialogProps) {
  const styles = useStyles();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleCreateSettings = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const success = await onCreateSettings();
      
      if (success) {
        setIsSuccess(true);
        setCountdown(10); // Start 10-second countdown
      } else {
        setError('Failed to create settings storage. You can try again by logging out and back in.');
      }
    } catch (err) {
      console.error('Error creating settings:', err);
      setError('An unexpected error occurred. You can try again by logging out and back in.');
    } finally {
      setIsCreating(false);
    }
  }, [onCreateSettings]);

  // Start the setup process when dialog opens
  useEffect(() => {
    if (open && !isCreating && !isSuccess && !error) {
      handleCreateSettings();
    }
  }, [open, isCreating, isSuccess, error, handleCreateSettings]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onClose();
    }
  }, [countdown, onClose]);

  const handleManualClose = () => {
    setCountdown(null);
    onClose();
  };

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Welcome to Glooko Data Web App!</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.messageContainer}>
              <Text>
                This is your first time using our application with your Microsoft account.
              </Text>
              
              {isCreating && (
                <>
                  <Text>
                    We are setting up your personal cloud storage for application settings.
                  </Text>
                  <div className={styles.loadingContainer}>
                    <Spinner size="small" />
                    <Text>Creating your settings storage...</Text>
                  </div>
                  <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                    Your email address ({userEmail}) will be stored to associate your settings with your account.
                  </Text>
                </>
              )}

              {isSuccess && (
                <>
                  <MessageBar intent="success" icon={<CheckmarkCircleRegular />}>
                    <MessageBarBody>
                      <strong>Success!</strong> Your settings storage has been created successfully.
                    </MessageBarBody>
                  </MessageBar>
                  <Text>
                    Your preferences will now be synchronized across devices when you sign in.
                  </Text>
                  {countdown !== null && countdown > 0 && (
                    <Text className={styles.countdownText}>
                      This dialog will close automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </Text>
                  )}
                </>
              )}

              {error && (
                <MessageBar intent="error" icon={<ErrorCircleRegular />}>
                  <MessageBarBody>
                    <strong>Error:</strong> {error}
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            {(isSuccess || error) && (
              <Button appearance="primary" onClick={handleManualClose}>
                Close
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
