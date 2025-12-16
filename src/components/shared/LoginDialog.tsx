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
  mergeClasses,
} from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import { useState, useEffect, useRef } from 'react';
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

// Google logo SVG component (following Google brand guidelines)
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    width: '100%',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  baseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('8px'),
    flex: '1',
    minWidth: '0',
    minHeight: '32px',
    maxHeight: '32px',
    ...shorthands.padding('4px', '12px'),
    whiteSpace: 'nowrap',
  },
  googleButton: {
    backgroundColor: '#fff',
    color: '#3c4043',
    ...shorthands.border('1px', 'solid', '#dadce0'),
    ':hover': {
      backgroundColor: '#f8f9fa',
    },
    ':active': {
      backgroundColor: '#f1f3f4',
    },
  },
  loginButtonText: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  comingSoonMessage: {
    ...shorthands.padding('12px'),
    backgroundColor: '#f3f2f1',
    ...shorthands.borderRadius('4px'),
    color: '#605e5c',
    fontSize: '14px',
    textAlign: 'center',
  },
});

interface LoginDialogProps {
  onLogin: () => Promise<void>;
}

/**
 * Renders a login dialog with a trigger button, handling sign-in flow, loading state, and error display.
 *
 * The dialog presents translated UI text with both Microsoft and Google sign-in options. When the Microsoft 
 * sign-in button is pressed, the provided `onLogin` function is invoked; the component shows a loading 
 * indicator while the call is pending, closes the dialog on success, and displays a translated error message 
 * on failure. The Google sign-in button currently shows a "coming soon" message as the functionality is 
 * under development.
 *
 * @param onLogin - Function invoked to perform the Microsoft sign-in action; should return a Promise that resolves on successful login or rejects on failure.
 * @returns The JSX element for the login dialog and its trigger button.
 */
export function LoginDialog({ onLogin }: LoginDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation(['dialogs', 'navigation', 'common']);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleComingSoon, setShowGoogleComingSoon] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const handleGoogleSignIn = () => {
    setShowGoogleComingSoon(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Hide message after 3 seconds
    timeoutRef.current = setTimeout(() => {
      setShowGoogleComingSoon(false);
      timeoutRef.current = null;
    }, 3000);
  };

  const handleCancel = () => {
    setOpen(false);
    setShowGoogleComingSoon(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<PersonRegular />}>
          <span className={styles.loginButtonText}>{t('navigation:navigation.login')}</span>
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t('loginDialog.title')}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {t('loginDialog.description')}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {showGoogleComingSoon && (
              <div className={styles.comingSoonMessage}>
                {t('loginDialog.googleComingSoon')}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <div className={styles.buttonGroup}>
              <Button 
                appearance="secondary" 
                disabled={loading}
                onClick={handleCancel}
                className={styles.baseButton}
              >
                {t('loginDialog.cancel')}
              </Button>
              <Button 
                appearance="primary" 
                onClick={handleLogin}
                disabled={loading}
                className={styles.baseButton}
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
              <Button 
                appearance="secondary"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={mergeClasses(styles.baseButton, styles.googleButton)}
              >
                <GoogleLogo />
                <span>{t('loginDialog.signInWithGoogle')}</span>
              </Button>
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}