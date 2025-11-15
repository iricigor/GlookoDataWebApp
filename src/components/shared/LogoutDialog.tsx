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
  Avatar,
  shorthands,
} from '@fluentui/react-components';
import { useState } from 'react';

const useStyles = makeStyles({
  userButton: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
});

interface LogoutDialogProps {
  userName: string;
  onLogout: () => void;
}

export function LogoutDialog({ userName, onLogout }: LogoutDialogProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" className={styles.userButton}>
          <Avatar name={userName} size={28} />
          {userName}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Logout</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            Are you sure you want to logout?
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleLogout}>
              Logout
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
