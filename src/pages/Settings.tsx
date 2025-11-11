import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Card,
  Radio,
  RadioGroup,
  Divider,
  Title3,
  Input,
  Label,
  Link,
  Button,
} from '@fluentui/react-components';
import { SettingsRegular, BugRegular, LightbulbRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import type { ExportFormat } from '../hooks/useExportFormat';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';
import { getVersionInfo, formatBuildDate } from '../utils/version';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px', '24px'),
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  settingsCard: {
    width: '100%',
    maxWidth: '600px',
    ...shorthands.padding('24px'),
  },
  settingSection: {
    marginBottom: '24px',
    '&:last-child': {
      marginBottom: '0',
    },
  },
  sectionTitle: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero700,
    marginBottom: '8px',
  },
  divider: {
    marginTop: '8px',
    marginBottom: '16px',
  },
  settingLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
    display: 'block',
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '12px',
  },
  apiKeyRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '12px',
  },
  apiKeyLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '150px',
    flexShrink: 0,
  },
  apiKeyInput: {
    flexGrow: 1,
  },
  securityExplanation: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    '& p': {
      margin: '0',
      fontSize: tokens.fontSizeBase300,
    },
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontWeight: tokens.fontWeightSemibold,
    },
    '& a': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  versionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  versionLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  versionValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
  supportButtons: {
    display: 'flex',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
});

interface SettingsProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  perplexityApiKey: string;
  onPerplexityApiKeyChange: (key: string) => void;
}

export function Settings({ themeMode, onThemeChange, exportFormat, onExportFormatChange, perplexityApiKey, onPerplexityApiKeyChange }: SettingsProps) {
  const styles = useStyles();
  const { thresholds, updateThreshold, validateThresholds, isValid } = useGlucoseThresholds();
  const validationError = validateThresholds(thresholds);
  const versionInfo = getVersionInfo();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <SettingsRegular />
        </div>
        <Text className={styles.title}>Settings</Text>
        <Text className={styles.description}>
          Configure your application preferences
        </Text>
      </div>

      <Card className={styles.settingsCard}>
        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Support</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Help us improve the app by reporting bugs or suggesting new features.
          </Text>
          <div className={styles.supportButtons}>
            <Link 
              href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=bug_report.yml"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                appearance="secondary" 
                icon={<BugRegular />}
              >
                Report a Bug
              </Button>
            </Link>
            <Link 
              href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=feature_request.yml"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                appearance="secondary" 
                icon={<LightbulbRegular />}
              >
                Request a Feature
              </Button>
            </Link>
          </div>
        </div>

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Theme</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Choose your preferred color theme. System option follows your operating system settings.
          </Text>
          <RadioGroup
            value={themeMode}
            onChange={(_, data) => onThemeChange(data.value as ThemeMode)}
          >
            <Radio value="light" label="Light" />
            <Radio value="dark" label="Dark" />
            <Radio value="system" label="System (recommended)" />
          </RadioGroup>
        </div>

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Export Format</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Choose the format for exporting table data to clipboard (CSV or TSV).
          </Text>
          <RadioGroup
            value={exportFormat}
            onChange={(_, data) => onExportFormatChange(data.value as ExportFormat)}
          >
            <Radio value="csv" label="CSV (Comma-Separated Values)" />
            <Radio value="tsv" label="TSV (Tab-Separated Values)" />
          </RadioGroup>
        </div>

        <GlucoseThresholdsSection
          thresholds={thresholds}
          onUpdateThreshold={updateThreshold}
          isValid={isValid}
          validationError={validationError}
        />

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>AI</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Configure your AI settings for intelligent analysis.
          </Text>
          <div className={styles.apiKeyRow}>
            <Label htmlFor="perplexity-api-key" className={styles.apiKeyLabel}>
              Perplexity API Key
            </Label>
            <Input
              id="perplexity-api-key"
              type="password"
              value={perplexityApiKey}
              onChange={(_, data) => onPerplexityApiKeyChange(data.value)}
              placeholder="Enter your Perplexity API key"
              contentAfter={perplexityApiKey ? '✓' : undefined}
              className={styles.apiKeyInput}
            />
          </div>
          <div className={styles.securityExplanation}>
            <Text as="p" style={{ marginBottom: '12px' }}>
              <strong>Security & Privacy:</strong> Your API key is stored locally in your browser's cookies (expires after 1 year) 
              and is never transmitted to our servers or any third party. All AI analysis happens directly between your browser 
              and Perplexity's API. This application is fully open source—you can{' '}
              <a href="https://github.com/iricigor/GlookoDataWebApp" target="_blank" rel="noopener noreferrer">
                review the code on GitHub
              </a>{' '}
              or deploy your own instance for complete control.
            </Text>
            <Text as="p" style={{ marginBottom: '12px' }}>
              <strong>Best Practices:</strong> For maximum security, create an API key with minimal permissions at{' '}
              <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                Perplexity Settings
              </a>. 
              Use keys designated for client-side applications and set spending limits to protect against unauthorized usage.
            </Text>
            <Text as="p">
              <strong>Risk Warning:</strong> If someone gains access to your browser session or computer, they could potentially 
              access your stored API key. To mitigate this risk: (1) log out from shared computers, (2) use browser privacy features, 
              (3) regularly rotate your API keys, and (4) monitor your API usage in Perplexity's dashboard.
            </Text>
          </div>
        </div>

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Data Privacy</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Your data is stored locally with configurable persistence options. All processing happens in your browser.
          </Text>
        </div>

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Version Information</Title3>
          <Divider className={styles.divider} />
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Version:</Text>
            <Text className={styles.versionValue}>{versionInfo.version}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Build ID:</Text>
            <Text className={styles.versionValue}>{versionInfo.buildId}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Build Date:</Text>
            <Text className={styles.versionValue}>{formatBuildDate(versionInfo.buildDate)}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Full Version:</Text>
            <Text className={styles.versionValue}>{versionInfo.fullVersion}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
