import { useEffect, useRef } from 'react';
import { 
  makeStyles, 
  Button,
  Text,
  tokens,
  shorthands,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
  Spinner,
} from '@fluentui/react-components';
import { 
  HomeRegular,
  CloudArrowUpRegular,
  ChartMultipleRegular,
  BrainCircuitRegular,
  SettingsRegular,
  NavigationRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../hooks/useAuth';
import { useFirstLoginCheck } from '../../hooks/useFirstLoginCheck';
import { LoginDialog } from './LoginDialog';
import { LogoutDialog } from './LogoutDialog';
import { WelcomeDialog } from './WelcomeDialog';
import { InfrastructureErrorDialog } from './InfrastructureErrorDialog';
import { type ThemeMode, isDarkTheme } from '../../hooks/useTheme';
import type { SyncStatus } from '../../hooks/useUserSettings';

const useStyles = makeStyles({
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow4,
    zIndex: 100,
    position: 'relative',
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '16px'),
    },
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  brandText: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    fontFamily: 'Segoe UI, sans-serif',
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase400,
    },
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  navItems: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  hamburgerMenu: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
});

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  themeMode?: ThemeMode;
  onThemeToggle?: () => void;
  /** Callback when first-time user accepts cloud settings */
  onFirstLoginAccept?: () => void;
  /** Callback when first-time user cancels (doesn't want cloud settings) */
  onFirstLoginCancel?: () => void;
  /** Callback before logout to save settings */
  onBeforeLogout?: () => Promise<void>;
  /** Callback when returning user login check completes (to load settings) */
  onReturningUserLogin?: () => void;
  /** Current sync status for settings */
  syncStatus?: SyncStatus;
}

export function Navigation({ 
  currentPage, 
  onNavigate, 
  themeMode, 
  onThemeToggle,
  onFirstLoginAccept,
  onFirstLoginCancel,
  onBeforeLogout,
  onReturningUserLogin,
  syncStatus = 'idle',
}: NavigationProps) {
  const styles = useStyles();
  const { 
    isLoggedIn, 
    userName, 
    userEmail, 
    userPhoto, 
    idToken, 
    justLoggedIn, 
    login, 
    logout, 
    acknowledgeLogin 
  } = useAuth();
  
  const {
    isFirstLogin,
    hasChecked,
    hasError,
    errorMessage,
    errorType,
    statusCode,
    performCheck,
    resetState,
    clearError,
  } = useFirstLoginCheck();

  // Track if we've already handled the returning user login to prevent duplicate calls
  const hasHandledReturningUserLogin = useRef(false);

  // Reset the handled flag when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      hasHandledReturningUserLogin.current = false;
    }
  }, [isLoggedIn]);

  // Trigger first login check when user just logged in
  // Use idToken instead of accessToken because:
  // - accessToken is for Microsoft Graph API (audience: https://graph.microsoft.com)
  // - idToken is for our own API (audience: our app's client ID)
  useEffect(() => {
    if (justLoggedIn && idToken && !hasChecked) {
      performCheck(idToken);
    }
  }, [justLoggedIn, idToken, hasChecked, performCheck]);

  // When a returning user's login check completes, trigger settings load
  useEffect(() => {
    if (hasChecked && !isFirstLogin && !hasError && justLoggedIn && !hasHandledReturningUserLogin.current) {
      // Returning user - load their settings
      hasHandledReturningUserLogin.current = true;
      onReturningUserLogin?.();
      acknowledgeLogin();
    }
  }, [hasChecked, isFirstLogin, hasError, justLoggedIn, onReturningUserLogin, acknowledgeLogin]);

  // Handle welcome dialog accept - user wants to save settings
  const handleWelcomeAccept = () => {
    resetState();
    acknowledgeLogin();
    onFirstLoginAccept?.();
  };

  // Handle welcome dialog cancel - user doesn't want cloud settings
  const handleWelcomeCancel = async () => {
    resetState();
    acknowledgeLogin();
    onFirstLoginCancel?.();
    // Log out the user since they don't want to use cloud settings
    await logout();
  };

  // Handle error dialog close
  const handleErrorClose = () => {
    clearError();
    acknowledgeLogin();
  };

  // Handle logout: save settings first, then logout
  const handleLogout = async () => {
    // Wait for settings to be saved before logging out
    if (onBeforeLogout) {
      await onBeforeLogout();
    }
    resetState();
    await logout();
  };

  // Determine if we're in dark mode (either explicitly dark or system-dark)
  const isDarkMode = themeMode ? isDarkTheme(themeMode) : false;

  const navItems = [
    { page: 'home', label: 'Home', icon: <HomeRegular /> },
    { page: 'upload', label: 'Data Upload', icon: <CloudArrowUpRegular /> },
    { page: 'reports', label: 'Reports', icon: <ChartMultipleRegular /> },
    { page: 'ai', label: 'AI Analysis', icon: <BrainCircuitRegular /> },
    { page: 'settings', label: 'Settings', icon: <SettingsRegular /> },
  ];

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <Text className={styles.brandText}>Glooko Insights</Text>
        </div>
        
        <div className={styles.centerSection}>
          {/* Desktop Navigation */}
          <div className={styles.navItems}>
            {navItems.map((item) => (
              <Button
                key={item.page}
                appearance={currentPage === item.page ? 'primary' : 'subtle'}
                icon={item.icon}
                onClick={() => onNavigate(item.page)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className={styles.hamburgerMenu}>
            <Menu inline>
              <MenuTrigger disableButtonEnhancement>
                <Button 
                  appearance="subtle" 
                  icon={<NavigationRegular />}
                  aria-label="Navigation menu"
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {navItems.map((item) => (
                    <MenuItem
                      key={item.page}
                      icon={item.icon}
                      onClick={() => onNavigate(item.page)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        {/* Auth Section */}
        <div className={styles.rightSection}>
          {isLoggedIn && userName ? (
            <>
              {onThemeToggle && (
                <Tooltip 
                  content={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} 
                  relationship="label"
                >
                  <Button
                    appearance="subtle"
                    icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
                    onClick={onThemeToggle}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  />
                </Tooltip>
              )}
              <Tooltip content={syncStatus === 'syncing' ? 'Syncing settings...' : 'Settings'} relationship="label">
                <Button
                  appearance="subtle"
                  icon={syncStatus === 'syncing' ? <Spinner size="tiny" /> : <SettingsRegular />}
                  onClick={() => onNavigate('settings')}
                  aria-label={syncStatus === 'syncing' ? 'Syncing settings...' : 'Settings'}
                />
              </Tooltip>
              <LogoutDialog 
                userName={userName} 
                userEmail={userEmail}
                userPhoto={userPhoto}
                onLogout={handleLogout} 
              />
            </>
          ) : (
            <LoginDialog onLogin={login} />
          )}
        </div>
      </nav>

      {/* Welcome dialog for first-time users */}
      <WelcomeDialog
        open={hasChecked && isFirstLogin && !hasError}
        onAccept={handleWelcomeAccept}
        onCancel={handleWelcomeCancel}
        userName={userName}
      />

      {/* Error dialog for infrastructure/access issues */}
      <InfrastructureErrorDialog
        open={hasChecked && hasError}
        onClose={handleErrorClose}
        errorMessage={errorMessage || ''}
        errorType={errorType || 'unknown'}
        statusCode={statusCode}
      />
    </>
  );
}
