/**
 * InfrastructureErrorDialog component
 * 
 * Displays an error message when the API infrastructure is not available
 * or there are access issues.
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
  ErrorCircleRegular,
  WarningRegular,
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
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
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
  errorDetails: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('4px'),
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  warningIcon: {
    color: tokens.colorStatusWarningForeground1,
    marginRight: '8px',
  },
});

interface InfrastructureErrorDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the user closes the dialog */
  onClose: () => void;
  /** Error message to display */
  errorMessage: string;
  /** Type of error for appropriate messaging */
  errorType?: 'infrastructure' | 'network' | 'unauthorized' | 'unknown';
}

/**
 * Dialog component that displays infrastructure or access error messages
 */
export function InfrastructureErrorDialog({ 
  open, 
  onClose, 
  errorMessage,
  errorType = 'unknown' 
}: InfrastructureErrorDialogProps) {
  const styles = useStyles();

  // Determine the title and description based on error type
  let title = 'Something went wrong';
  let description = 'An error occurred while connecting to our services.';

  switch (errorType) {
    case 'infrastructure':
      title = 'Service Unavailable';
      description = 'Our services are currently unavailable. This could mean the infrastructure is being set up or there are temporary access issues.';
      break;
    case 'network':
      title = 'Network Error';
      description = 'Unable to connect to our services. Please check your internet connection and try again.';
      break;
    case 'unauthorized':
      title = 'Access Denied';
      description = 'Your session may have expired. Please try logging in again.';
      break;
    default:
      break;
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle>
          <WarningRegular className={styles.warningIcon} />
          {title}
        </DialogTitle>
        <DialogBody>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.iconContainer}>
              <ErrorCircleRegular />
            </div>
            <Text className={styles.title}>{title}</Text>
            <Text className={styles.message}>{description}</Text>
            {errorMessage && (
              <Text className={styles.errorDetails}>{errorMessage}</Text>
            )}
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
