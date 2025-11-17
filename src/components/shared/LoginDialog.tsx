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
} from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import { useState } from 'react';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
              icon={loading ? <Spinner size="tiny" /> : undefined}
            >
              {loading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
