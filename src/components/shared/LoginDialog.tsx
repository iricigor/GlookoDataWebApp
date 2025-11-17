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
});

interface LoginDialogProps {
  onLogin: () => Promise<void>;
}

export function LoginDialog({ onLogin }: LoginDialogProps) {
  const styles = useStyles();
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
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<PersonRegular />}>
          Login
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Login with Microsoft</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            Sign in with your personal Microsoft account to access all features.
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={loading}>Cancel</Button>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <MicrosoftLogo />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
