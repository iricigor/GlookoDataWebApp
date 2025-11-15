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
  onLogin: (userName: string) => void;
}

export function LoginDialog({ onLogin }: LoginDialogProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const handleLogin = () => {
    onLogin('John Doe');
    setOpen(false);
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
          <DialogTitle>Login</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            This is a demonstration login dialog. Click "Login" to sign in as John Doe.
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleLogin}>
              Login
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
