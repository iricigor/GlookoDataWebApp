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
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';

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

// Google logo SVG component
const GoogleLogo = () => (
  <svg 
    width="21" 
    height="21" 
    viewBox="0 0 21 21" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <path d="M20.64 10.71c0-.69-.06-1.36-.18-2H10.5v3.78h5.68a4.86 4.86 0 01-2.11 3.19v2.45h3.42c2-1.84 3.15-4.55 3.15-7.42z" fill="#4285F4"/>
    <path d="M10.5 21c2.86 0 5.26-.95 7.01-2.57l-3.42-2.45c-.95.64-2.16 1.02-3.59 1.02-2.76 0-5.1-1.86-5.93-4.37H1.08v2.53A10.49 10.49 0 0010.5 21z" fill="#34A853"/>
    <path d="M4.57 12.63a6.3 6.3 0 010-4.02V6.08H1.08a10.49 10.49 0 000 9.08l3.49-2.53z" fill="#FBBC05"/>
    <path d="M10.5 4.18c1.56 0 2.95.54 4.05 1.59l3.04-3.04A10.1 10.1 0 0010.5 0 10.49 10.49 0 001.08 6.08l3.49 2.53c.83-2.51 3.17-4.37 5.93-4.37z" fill="#EA4335"/>
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
    height: '40px',
    ...shorthands.padding('8px', '16px'),
    whiteSpace: 'nowrap',
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

// Separate component for Google login button to properly handle the useGoogleLogin hook
interface GoogleLoginButtonProps {
  onGoogleLogin: (credential: string) => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOpen: (open: boolean) => void;
  className: string;
}

function GoogleLoginButton({ onGoogleLogin, loading, setLoading, setError, setOpen, className }: GoogleLoginButtonProps) {
  const { t } = useTranslation(['dialogs']);

  const handleGoogleClick = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      
      try {
        // Note: The implicit flow returns an access_token.
        // The backend should validate this token with Google's tokeninfo endpoint
        // to extract user information (email, sub, etc.) for authentication.
        await onGoogleLogin(tokenResponse.access_token);
        setOpen(false);
      } catch (err) {
        console.error('Google login error:', err);
        setError(t('loginDialog.errorMessage'));
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error('Google login failed');
      setError(t('loginDialog.errorMessage'));
    },
    flow: 'implicit', // Returns access_token for validation
  });

  return (
    <Button 
      appearance="secondary" 
      onClick={() => handleGoogleClick()}
      disabled={loading}
      className={className}
    >
      <GoogleLogo />
      <span>{t('loginDialog.signInWithGoogle')}</span>
    </Button>
  );
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
                <GoogleLoginButton 
                  onGoogleLogin={onGoogleLogin}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  setOpen={setOpen}
                  className={styles.baseButton}
                />
              )}
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}