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
  LocalLanguageRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useFirstLoginCheck } from '../../hooks/useFirstLoginCheck';
import { useProUserCheck } from '../../hooks/useProUserCheck';
import { useUILanguage } from '../../hooks/useUILanguage';
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
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  brandIcon: {
    width: '28px',
    height: '28px',
    '@media (max-width: 768px)': {
      width: '24px',
      height: '24px',
    },
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
  hamburgerButton: {
    minWidth: '40px',
    minHeight: '40px',
    fontSize: '20px',
  },
  pulsingIcon: {
    animationName: {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.3 },
      '100%': { opacity: 1 },
    },
    animationDuration: '1.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
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

/**
 * Renders the application's top navigation bar with page navigation, authentication controls, theme toggle, and first-login / error dialogs.
 *
 * @param currentPage - The currently active page id used to highlight the active navigation item.
 * @param onNavigate - Callback invoked with a page id when the user navigates.
 * @param themeMode - Optional theme mode used to determine the current color scheme.
 * @param onThemeToggle - Optional callback to toggle between light and dark theme modes.
 * @param onFirstLoginAccept - Optional callback invoked when a first-time user accepts using cloud settings.
 * @param onFirstLoginCancel - Optional callback invoked when a first-time user declines cloud settings (the component will log the user out after invoking this).
 * @param onBeforeLogout - Optional async callback that, if provided, will be awaited before performing logout (used to persist settings).
 * @param onReturningUserLogin - Optional callback invoked once when a returning user's initial post-login checks complete to trigger loading of user settings.
 * @param syncStatus - Sync status used to indicate and visually mark when settings are syncing; defaults to `'idle'`.
 * @returns The navigation bar React element including navigation buttons, responsive menu, auth dialogs, and related UI.
 */
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
  const { t } = useTranslation(['navigation', 'dialogs', 'common']);
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

  // Check if user is a pro user after login (also fetches secret for pro users)
  const { isProUser, secretValue, isChecking: isSecretLoading, resetState: resetProUserState } = useProUserCheck(isLoggedIn ? idToken : null);

  // UI Language switcher hook
  const { uiLanguage, setUILanguage } = useUILanguage();

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
    resetProUserState();
    await logout();
  };

  // Determine if we're in dark mode (either explicitly dark or system-dark)
  const isDarkMode = themeMode ? isDarkTheme(themeMode) : false;

  // Get the next language in the cycle
  const getNextLanguage = (current: string): string => {
    if (current === 'en') return 'de';
    if (current === 'de') return 'cs';
    return 'en';
  };

  // Get the language name for display
  const getLanguageName = (lang: string): string => {
    if (lang === 'en') return t('common:common.english');
    if (lang === 'de') return t('common:common.german');
    return t('common:common.czech');
  };

  // Toggle UI language between English, German, and Czech
  const handleLanguageToggle = () => {
    const nextLang = getNextLanguage(uiLanguage);
    setUILanguage(nextLang as 'en' | 'de' | 'cs');
  };

  // Compute theme button label and icon class based on sync status and theme mode
  const themeButtonLabel = syncStatus === 'syncing'
    ? t('navigation.syncingSettings')
    : isDarkMode
      ? t('navigation.switchToLightMode')
      : t('navigation.switchToDarkMode');
  const themeIconClass = syncStatus === 'syncing' ? styles.pulsingIcon : undefined;

  const navItems = [
    { page: 'home', label: t('navigation.home'), icon: <HomeRegular /> },
    { page: 'upload', label: t('navigation.dataUpload'), icon: <CloudArrowUpRegular /> },
    { page: 'reports', label: t('navigation.reports'), icon: <ChartMultipleRegular /> },
    { page: 'ai', label: t('navigation.aiAnalysis'), icon: <BrainCircuitRegular /> },
    { page: 'settings', label: t('navigation.settings'), icon: <SettingsRegular /> },
  ];

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.leftSection}>
          {/* Mobile Hamburger Menu - Left side on mobile */}
          <div className={styles.hamburgerMenu}>
            <Menu inline>
              <MenuTrigger disableButtonEnhancement>
                <Button 
                  appearance="primary"
                  icon={<NavigationRegular />}
                  aria-label={t('navigation.navigationMenu')}
                  className={styles.hamburgerButton}
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
          
          <div className={styles.brand}>
            <img 
              src="/favicon/favicon.svg" 
              alt={t('common:brandAltText')}
              className={styles.brandIcon}
            />
            <Text className={styles.brandText}>{t('common:brandName')}</Text>
          </div>
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
        </div>

        {/* Auth Section */}
        <div className={styles.rightSection}>
          {isLoggedIn && userName ? (
            <>
              {onThemeToggle && (
                <Tooltip 
                  content={themeButtonLabel}
                  relationship="label"
                >
                  <Button
                    appearance="subtle"
                    icon={isDarkMode ? <WeatherSunnyRegular className={themeIconClass} /> : <WeatherMoonRegular className={themeIconClass} />}
                    onClick={onThemeToggle}
                    aria-label={themeButtonLabel}
                  />
                </Tooltip>
              )}
              <Tooltip 
                content={t('navigation.switchToLanguage', { language: getLanguageName(getNextLanguage(uiLanguage)) })} 
                relationship="label"
              >
                <Button
                  appearance="subtle"
                  icon={<LocalLanguageRegular />}
                  onClick={handleLanguageToggle}
                  aria-label={t('navigation.currentLanguage', { language: getLanguageName(uiLanguage) })}
                >
                  {uiLanguage.toUpperCase()}
                </Button>
              </Tooltip>

              <LogoutDialog 
                userName={userName} 
                userEmail={userEmail}
                userPhoto={userPhoto}
                isProUser={isProUser}
                secretValue={secretValue}
                isSecretLoading={isSecretLoading}
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