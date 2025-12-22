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
import { GoogleLogin } from '@react-oauth/google';

// Microsoft logo SVG component
const MicrosoftLogo = () => (
  <svg 
    width="21" 
    height="21" 
    viewBox="0 0 21 21" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '670px',
    width: '670px',
  },
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
    minHeight: '40px',
    ...shorthands.padding('8px', '32px'),
    whiteSpace: 'nowrap',
  },
  googleButton: {
    // No custom background - will use the theme's default button color
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
  onGoogleLogin: (credential: string) => Promise<void>;
  isGoogleAuthAvailable?: boolean;
}

/**
 * Renders a login dialog with a trigger button, handling sign-in flow, loading state, and error display.
 *
 * The dialog presents translated UI text with both Microsoft and Google sign-in options. When the Microsoft 
 * sign-in button is pressed, the provided `onLogin` function is invoked; the component shows a loading 
 * indicator while the call is pending, closes the dialog on success, and displays a translated error message 
 * on failure. The Google sign-in button triggers Google OAuth flow and is only shown if Google auth is available.
 *
 * @param onLogin - Function invoked to perform the Microsoft sign-in action; should return a Promise that resolves on successful login or rejects on failure.
 * @param onGoogleLogin - Function invoked to perform the Google sign-in action with credential; should return a Promise that resolves on successful login or rejects on failure.
 * @param isGoogleAuthAvailable - Optional boolean indicating whether Google authentication is available (defaults to false).
 * @returns The JSX element for the login dialog and its trigger button.
 */
export function LoginDialog({ onLogin, onGoogleLogin, isGoogleAuthAvailable = false }: LoginDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation(['dialogs', 'navigation', 'common']);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      console.error('No credential in Google response');
      setError(t('loginDialog.errorMessage'));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onGoogleLogin(credentialResponse.credential);
      setOpen(false);
    } catch (err) {
      console.error('Google login error:', err);
      setError(t('loginDialog.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    setError(t('loginDialog.errorMessage'));
  };

  const handleCancel = () => {
    setOpen(false);
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
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>{t('loginDialog.title')}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {t('loginDialog.description')}
            {error && <div style={{ color: 'red' }}>{error}</div>}
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
                appearance="secondary" 
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
              {isGoogleAuthAvailable && (
                <div className={mergeClasses(styles.baseButton, styles.googleButton)}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    text="signin_with"
                    width="100%"
                  />
                </div>
              )}
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}