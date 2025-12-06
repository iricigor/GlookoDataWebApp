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
  /** HTTP status code when available */
  statusCode?: number | null;
}

/**
 * Renders a modal dialog that presents infrastructure, network, or access error information.
 *
 * @param open - Whether the dialog is visible
 * @param onClose - Callback invoked when the dialog is closed
 * @param errorMessage - Human-readable error message to display in the dialog
 * @param errorType - One of `'infrastructure' | 'network' | 'unauthorized' | 'unknown'`; selects the title and description shown
 * @param statusCode - Optional HTTP status code to include with the error details
 * @returns The rendered dialog element
 */
export function InfrastructureErrorDialog({ 
  open, 
  onClose, 
  errorMessage,
  errorType = 'unknown',
  statusCode
}: InfrastructureErrorDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  // Determine the title and description based on error type
  let title = t('infrastructureErrorDialog.defaultTitle');
  let description = t('infrastructureErrorDialog.defaultDescription');

  switch (errorType) {
    case 'infrastructure':
      title = t('infrastructureErrorDialog.serviceUnavailableTitle');
      description = t('infrastructureErrorDialog.serviceUnavailableDescription');
      break;
    case 'network':
      title = t('infrastructureErrorDialog.networkErrorTitle');
      description = t('infrastructureErrorDialog.networkErrorDescription');
      break;
    case 'unauthorized':
      title = t('infrastructureErrorDialog.accessDeniedTitle');
      description = t('infrastructureErrorDialog.accessDeniedDescription');
      break;
    default:
      break;
  }

  // Format error details with status code if available
  const errorDetails = statusCode 
    ? t('infrastructureErrorDialog.errorWithCode', { statusCode, message: errorMessage })
    : errorMessage;

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
            <Text className={styles.message}>{description}</Text>
            {errorDetails && (
              <Text className={styles.errorDetails}>{errorDetails}</Text>
            )}
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={onClose}>
            {t('infrastructureErrorDialog.ok')}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}