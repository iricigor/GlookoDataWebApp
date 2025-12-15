import { 
  makeStyles, 
  Card,
  Text,
  tokens,
  shorthands,
  Button,
  Link,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { PersonRegular, ShieldCheckmarkRegular, DataUsageRegular, PlayRegular } from '@fluentui/react-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProUserCheck } from '../hooks/useProUserCheck';
import { useAdminStats } from '../hooks/useAdminStats';
import { testProAIKey, type TestAIType } from '../utils/api/adminTestAIApi';

/**
 * Default AI API Key secret name in Key Vault
 */
const DEFAULT_AI_API_KEY_SECRET = 'AI-API-Key';

/**
 * Test result type for display
 */
interface TestResultDisplay {
  success: boolean;
  message: string;
  testType?: TestAIType;
  provider?: string;
  keyVaultName?: string;
  secretName?: string;
  secretExists?: boolean;
}

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
  link: {
    color: tokens.colorBrandForeground1,
  },
  aiTestSection: {
    width: '100%',
    maxWidth: '900px',
    marginTop: '24px',
  },
  aiTestCard: {
    ...shorthands.padding('24px'),
  },
  aiTestTitle: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '12px',
    fontFamily: 'Segoe UI, sans-serif',
  },
  aiTestDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
    fontFamily: 'Segoe UI, sans-serif',
  },
  aiTestControls: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
    marginBottom: '16px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  aiTestDropdown: {
    minWidth: '200px',
    '@media (max-width: 768px)': {
      width: '100%',
    },
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
  const { isLoggedIn, idToken } = useAuth();
  const { isProUser, hasChecked } = useProUserCheck(isLoggedIn ? idToken : null);
  
  // Fetch admin statistics only if user is a Pro user
  const { loggedInUsersCount, proUsersCount, isLoading: isLoadingStats } = useAdminStats(
    isLoggedIn && isProUser ? idToken : null,
    isLoggedIn && isProUser
  );

  // AI test state
  const [isTestingInfra, setIsTestingInfra] = useState(false);
  const [isTestingFull, setIsTestingFull] = useState(false);
  const [testResult, setTestResult] = useState<TestResultDisplay | null>(null);

  /**
   * Handle AI test button click
   */
  const handleTestAI = async (testType: TestAIType) => {
    if (!idToken) return;
    
    if (testType === 'infra') {
      setIsTestingInfra(true);
    } else {
      setIsTestingFull(true);
    }
    setTestResult(null);
    
    try {
      const result = await testProAIKey(idToken, testType);
      
      if (result.success) {
        const successMessage = result.testType === 'infra' 
          ? t('admin.aiTest.infraSuccess', { 
              provider: result.provider,
              keyVaultName: result.keyVaultName,
              secretName: result.secretName
            })
          : t('admin.aiTest.fullSuccess', { 
              provider: result.provider
            });
        
        setTestResult({
          success: true,
          testType: result.testType,
          provider: result.provider,
          keyVaultName: result.keyVaultName,
          secretName: result.secretName,
          secretExists: result.secretExists,
          message: result.message || successMessage
        });
      } else {
        const errorMessage = result.testType === 'infra'
          ? t('admin.aiTest.infraError', { error: result.error || 'Unknown error' })
          : t('admin.aiTest.fullError', { error: result.error || 'Unknown error' });
        
        setTestResult({
          success: false,
          testType: result.testType,
          provider: result.provider,
          keyVaultName: result.keyVaultName,
          secretName: result.secretName,
          secretExists: result.secretExists,
          message: errorMessage
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: t('admin.aiTest.testError', { error: error instanceof Error ? error.message : 'Unknown error' })
      });
    } finally {
      if (testType === 'infra') {
        setIsTestingInfra(false);
      } else {
        setIsTestingFull(false);
      }
    }
  };

  /**
   * Format the stat value (count or loading indicator)
   */
  const formatStatValue = (count: number | null, loading: boolean): string => {
    if (loading) return t('common.loading');
    if (count !== null) return count.toString();
    return '-';
  };

  // Show loading state while checking Pro status
  const isCheckingProStatus = isLoggedIn && !hasChecked;

  // Render content based on auth and Pro status
  const renderContent = () => {
    // Not logged in - show login prompt (without button - use navigation bar)
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
            <Text className={styles.statValue}>
              {formatStatValue(loggedInUsersCount, isLoadingStats)}
            </Text>
            <Text className={styles.statLabel}>
              {t('admin.statistics.loggedInUsers')}
            </Text>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon}>
              <ShieldCheckmarkRegular />
            </div>
            <Text className={styles.statValue}>
              {formatStatValue(proUsersCount, isLoadingStats)}
            </Text>
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

        {/* AI Test Section */}
        <div className={styles.aiTestSection}>
          <Card className={styles.aiTestCard}>
            <Text className={styles.aiTestTitle}>{t('admin.aiTest.title')}</Text>
            <Text className={styles.aiTestDescription}>
              {t('admin.aiTest.description')}
            </Text>
            
            {/* Display Key Vault Configuration - always show if we have test result data */}
            {testResult && (testResult.provider || testResult.keyVaultName || testResult.secretName) && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: tokens.colorNeutralBackground3,
                borderRadius: '4px'
              }}>
                <Text style={{ 
                  fontSize: tokens.fontSizeBase300,
                  color: tokens.colorNeutralForeground2,
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: tokens.fontWeightSemibold
                }}>
                  {t('admin.aiTest.configurationTitle')}
                </Text>
                <Text style={{ 
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2,
                  display: 'block'
                }}>
                  <strong>{t('admin.aiTest.provider')}:</strong> {testResult.provider || t('admin.aiTest.notAvailable')}
                </Text>
                <Text style={{ 
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2,
                  display: 'block'
                }}>
                  <strong>{t('admin.aiTest.keyVaultName')}:</strong> {testResult.keyVaultName || t('admin.aiTest.notConfigured')}
                </Text>
                <Text style={{ 
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2,
                  display: 'block'
                }}>
                  <strong>{t('admin.aiTest.secretName')}:</strong> {testResult.secretName || DEFAULT_AI_API_KEY_SECRET}
                </Text>
                {testResult.secretExists !== undefined && (
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase200,
                    color: tokens.colorNeutralForeground2,
                    display: 'block'
                  }}>
                    <strong>{t('admin.aiTest.secretExists')}:</strong> {testResult.secretExists ? t('admin.aiTest.yes') : t('admin.aiTest.no')}
                  </Text>
                )}
              </div>
            )}
            
            <div className={styles.aiTestControls}>
              <Button
                appearance="secondary"
                icon={<PlayRegular />}
                onClick={() => handleTestAI('infra')}
                disabled={isTestingInfra || isTestingFull}
              >
                {isTestingInfra ? t('admin.aiTest.testing') : t('admin.aiTest.testInfraButton')}
              </Button>
              <Button
                appearance="primary"
                icon={<PlayRegular />}
                onClick={() => handleTestAI('full')}
                disabled={isTestingInfra || isTestingFull}
              >
                {isTestingFull ? t('admin.aiTest.testing') : t('admin.aiTest.testFullButton')}
              </Button>
            </div>

            {testResult && (
              <MessageBar intent={testResult.success ? 'success' : 'error'}>
                <MessageBarBody>
                  {testResult.message}
                </MessageBarBody>
              </MessageBar>
            )}
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('admin.title')}</Text>
        <Text className={styles.subtitle}>
          {t('admin.subtitle')} | <a href="#api-docs" className={styles.link}>{t('admin.apiDocsPageLink')}</a>
        </Text>
      </div>

      {renderContent()}
    </div>
  );
}
