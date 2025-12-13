import { 
  makeStyles, 
  Card,
  Text,
  tokens,
  shorthands,
  Button,
  Link,
} from '@fluentui/react-components';
import { PersonRegular, ShieldCheckmarkRegular, DataUsageRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProUserCheck } from '../hooks/useProUserCheck';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px', '24px'),
    maxWidth: '100%',
    minHeight: 'calc(100vh - 200px)',
    overflowX: 'hidden',
    '@media (max-width: 768px)': {
      ...shorthands.padding('16px', '16px'),
    },
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '12px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeHero700,
    },
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase400,
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    minHeight: '200px',
  },
  cardContent: {
    ...shorthands.padding('32px', '24px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '24px',
  },
  iconContainer: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
  },
  loginText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
  },
  loginButton: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  statsContainer: {
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    ...shorthands.gap('16px'),
    width: '100%',
  },
  statCard: {
    ...shorthands.padding('24px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap('12px'),
  },
  statIcon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  statValue: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Segoe UI, sans-serif',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
  },
  noteCard: {
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  noteText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
    fontFamily: 'Segoe UI, sans-serif',
  },
});

/**
 * Renders the Admin page with app branding and login option.
 *
 * This page is intentionally not linked from other pages and can only be accessed
 * by typing the URL directly (/admin) or via bookmarks. 
 * 
 * Access control:
 * - Not logged in users: see login prompt
 * - Logged in non-Pro users: see message about Pro access requirement with link to apply
 * - Pro users: see administrative statistics (placeholder data for now)
 *
 * @returns The rendered admin page element
 */
export function Admin() {
  const styles = useStyles();
  const { t } = useTranslation(['admin', 'common']);
  const { isLoggedIn, login, idToken } = useAuth();
  const { isProUser, hasChecked } = useProUserCheck(isLoggedIn ? idToken : null);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Show loading state while checking Pro status
  const isCheckingProStatus = isLoggedIn && !hasChecked;

  // Render content based on auth and Pro status
  const renderContent = () => {
    // Not logged in - show login prompt
    if (!isLoggedIn) {
      return (
        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.iconContainer}>
              <PersonRegular />
            </div>
            <Text className={styles.loginText}>
              {t('admin.loginPrompt')}
            </Text>
            <Button 
              appearance="primary" 
              size="large"
              onClick={handleLogin}
              className={styles.loginButton}
            >
              {t('admin.loginButton')}
            </Button>
          </div>
        </Card>
      );
    }

    // Checking Pro status - show loading
    if (isCheckingProStatus) {
      return (
        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <Text className={styles.loginText}>
              {t('common.loading')}
            </Text>
          </div>
        </Card>
      );
    }

    // Logged in but not Pro - show Pro requirement message
    if (!isProUser) {
      return (
        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.iconContainer}>
              <ShieldCheckmarkRegular />
            </div>
            <Text as="h2" style={{ 
              fontSize: tokens.fontSizeHero800,
              fontWeight: tokens.fontWeightSemibold,
              marginBottom: '8px',
              fontFamily: 'Segoe UI, sans-serif',
            }}>
              {t('admin.proRequired')}
            </Text>
            <Text className={styles.loginText}>
              {t('admin.proRequiredMessage')}
            </Text>
            <Link
              href={t('admin.applyForProLink')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                appearance="primary" 
                size="large"
                className={styles.loginButton}
              >
                {t('admin.applyForProButton')}
              </Button>
            </Link>
          </div>
        </Card>
      );
    }

    // Pro user - show statistics
    return (
      <div className={styles.statsContainer}>
        <Text as="h2" style={{ 
          fontSize: tokens.fontSizeHero800,
          fontWeight: tokens.fontWeightSemibold,
          textAlign: 'center',
          fontFamily: 'Segoe UI, sans-serif',
        }}>
          {t('admin.statistics.title')}
        </Text>

        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <PersonRegular />
            </div>
            <Text className={styles.statValue}>-</Text>
            <Text className={styles.statLabel}>
              {t('admin.statistics.loggedInUsers')}
            </Text>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <ShieldCheckmarkRegular />
            </div>
            <Text className={styles.statValue}>-</Text>
            <Text className={styles.statLabel}>
              {t('admin.statistics.proUsers')}
            </Text>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <DataUsageRegular />
            </div>
            <Text className={styles.statValue}>-</Text>
            <Text className={styles.statLabel}>
              {t('admin.statistics.apiCalls')}
            </Text>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <DataUsageRegular />
            </div>
            <Text className={styles.statValue}>-</Text>
            <Text className={styles.statLabel}>
              {t('admin.statistics.apiErrors')}
            </Text>
          </Card>
        </div>

        <Card className={styles.noteCard}>
          <Text className={styles.noteText}>
            {t('admin.statistics.placeholderNote')}
          </Text>
        </Card>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('admin.title')}</Text>
        <Text className={styles.subtitle}>
          {t('admin.subtitle')} | <a href="#api-docs" style={{ color: tokens.colorBrandForeground1 }}>{t('admin.apiDocsPageLink')}</a>
        </Text>
      </div>

      {renderContent()}
    </div>
  );
}
