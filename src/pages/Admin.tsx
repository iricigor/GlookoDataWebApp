import { 
  makeStyles, 
  Card,
  Text,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

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
});

/**
 * Renders the Admin page with app branding and login option.
 *
 * This page is intentionally not linked from other pages and can only be accessed
 * by typing the URL directly (/admin) or via bookmarks. It displays the app name,
 * icon, login option, and footer.
 *
 * @returns The rendered admin page element
 */
export function Admin() {
  const styles = useStyles();
  const { t } = useTranslation(['admin', 'common']);
  const { isLoggedIn, login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('admin.title')}</Text>
        <Text className={styles.subtitle}>
          {t('admin.subtitle')}
        </Text>
      </div>

      <Card className={styles.card}>
        <div className={styles.cardContent}>
          <div className={styles.iconContainer}>
            <PersonRegular />
          </div>
          {!isLoggedIn ? (
            <>
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
            </>
          ) : (
            <Text className={styles.loginText}>
              {t('common.loading')}
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}
