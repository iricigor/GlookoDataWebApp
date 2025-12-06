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
  Spinner,
  shorthands,
} from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Microsoft logo SVG component
const MicrosoftLogo = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  microsoftButton: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  loginButtonText: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
});

interface LoginDialogProps {
  onLogin: () => Promise<void>;
}

/**
 * Renders a login dialog with a trigger button, handling sign-in flow, loading state, and error display.
 *
 * The dialog presents translated UI text and a Microsoft-branded sign-in action. When the sign-in button
 * is pressed the provided `onLogin` function is invoked; the component shows a loading indicator while
 * the call is pending, closes the dialog on success, and displays a translated error message on failure.
 *
 * @param onLogin - Function invoked to perform the sign-in action; should return a Promise that resolves on successful login or rejects on failure.
 * @returns The JSX element for the login dialog and its trigger button.
 */
export function LoginDialog({ onLogin }: LoginDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await onLogin();
      setOpen(false);
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginDialog.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<PersonRegular />}>
          <span className={styles.loginButtonText}>{t('navigation.login')}</span>
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t('loginDialog.title')}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {t('loginDialog.description')}
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={loading}>{t('loginDialog.cancel')}</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleLogin}
              disabled={loading}
              className={styles.microsoftButton}
            >
              {loading ? (
                <>
                  <Spinner size="tiny" />
                  <span>{t('loginDialog.signingIn')}</span>
                </>
              ) : (
                <>
                  <MicrosoftLogo />
                  <span>{t('loginDialog.signInButton')}</span>
                </>
              )}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}