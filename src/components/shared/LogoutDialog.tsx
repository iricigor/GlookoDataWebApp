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
  Text,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import { useState } from 'react';
import { useProUserBadgeStyles } from '../../styles/proUserBadge';

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
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
});

interface LogoutDialogProps {
  userName: string;
  userEmail?: string | null;
  userPhoto?: string | null;
  isProUser?: boolean;
  onLogout: () => Promise<void>;
}

export function LogoutDialog({ userName, userEmail, userPhoto, isProUser, onLogout }: LogoutDialogProps) {
  const styles = useStyles();
  const proBadgeStyles = useProUserBadgeStyles();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onLogout();
      setOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" className={styles.userButton}>
          <Avatar 
            name={userName} 
            size={28}
            image={userPhoto ? { src: userPhoto } : undefined}
          />
          {userName}
          {isProUser && (
            <Tooltip content="Pro user" relationship="label">
              <span className={proBadgeStyles.proUserBadge} aria-label="Pro user">✨</span>
            </Tooltip>
          )}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Logout</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <div className={styles.userInfo}>
              <Avatar 
                name={userName} 
                size={48}
                image={userPhoto ? { src: userPhoto } : undefined}
              />
              <div className={styles.userDetails}>
                <div className={proBadgeStyles.userNameContainer}>
                  <Text className={styles.userName}>{userName}</Text>
                  {isProUser && (
                    <Tooltip content="Pro user" relationship="label">
                      <span className={proBadgeStyles.proUserBadge} aria-label="Pro user">✨</span>
                    </Tooltip>
                  )}
                </div>
                {userEmail && (
                  <Text className={styles.userEmail}>{userEmail}</Text>
                )}
              </div>
            </div>
            <Text>Are you sure you want to logout?</Text>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={loading}>Cancel</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
