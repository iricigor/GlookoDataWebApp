import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Radio,
  RadioGroup,
  Divider,
  Title3,
  Input,
  Label,
  Link,
  Button,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useState } from 'react';
import { BugRegular, LightbulbRegular, CodeRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import type { ExportFormat } from '../hooks/useExportFormat';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';
import { getVersionInfo, formatBuildDate } from '../utils/version';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  contentWrapper: {
    display: 'flex',
    ...shorthands.gap('24px'),
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  tabList: {
    flexShrink: 0,
    width: '200px',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  contentArea: {
    flex: 1,
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
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
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
}

export function Settings({ themeMode, onThemeChange, exportFormat, onExportFormatChange, perplexityApiKey, onPerplexityApiKeyChange, geminiApiKey, onGeminiApiKeyChange }: SettingsProps) {
  const styles = useStyles();
  const { thresholds, updateThreshold, validateThresholds, isValid } = useGlucoseThresholds();
  const validationError = validateThresholds(thresholds);
  const versionInfo = getVersionInfo();
  const [selectedTab, setSelectedTab] = useState<string>('general');

  // Determine which provider is active based on available keys
  // Priority: Perplexity > Gemini
  const activeProvider = perplexityApiKey ? 'perplexity' : (geminiApiKey ? 'gemini' : null);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'general':
        return (
          <>
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
          </>
        );
      
      case 'data':
        return (
          <>
            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>AI Configuration</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Configure your AI settings for intelligent analysis. {activeProvider && (
                  <strong style={{ color: tokens.colorBrandForeground1 }}>
                    Currently using: {activeProvider === 'perplexity' ? 'Perplexity' : 'Google Gemini'}
                  </strong>
                )}
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
                  contentAfter={perplexityApiKey ? (activeProvider === 'perplexity' ? '✓ Selected' : '✓') : undefined}
                  className={styles.apiKeyInput}
                />
              </div>
              <div className={styles.apiKeyRow}>
                <Label htmlFor="gemini-api-key" className={styles.apiKeyLabel}>
                  Google Gemini API Key
                </Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={geminiApiKey}
                  onChange={(_, data) => onGeminiApiKeyChange(data.value)}
                  placeholder="Enter your Google Gemini API key"
                  contentAfter={geminiApiKey ? (activeProvider === 'gemini' ? '✓ Selected' : '✓') : undefined}
                  className={styles.apiKeyInput}
                />
              </div>
              <div className={styles.securityExplanation}>
                <Text as="p" style={{ marginBottom: '12px' }}>
                  <strong>Security & Privacy:</strong> Your API keys are stored locally in your browser's cookies (expires after 1 year) 
                  and are never transmitted to our servers or any third party. All AI analysis happens directly between your browser 
                  and the selected AI provider's API. This application is fully open source—you can{' '}
                  <a href="https://github.com/iricigor/GlookoDataWebApp" target="_blank" rel="noopener noreferrer">
                    review the code on GitHub
                  </a>{' '}
                  or deploy your own instance for complete control.
                </Text>
                <Text as="p" style={{ marginBottom: '12px' }}>
                  <strong>Best Practices:</strong> For maximum security, create API keys with minimal permissions at{' '}
                  <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                    Perplexity Settings
                  </a> or{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                    Google AI Studio
                  </a>. 
                  Use keys designated for client-side applications and set spending limits to protect against unauthorized usage.
                </Text>
                <Text as="p" style={{ marginBottom: '12px' }}>
                  <strong>Provider Selection:</strong> If both API keys are configured, Perplexity will be used by default. 
                  To use Google Gemini, remove the Perplexity API key.
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
          </>
        );
      
      case 'about':
        return (
          <>
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
                <Link 
                  href="https://github.com/iricigor/GlookoDataWebApp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    appearance="secondary" 
                    icon={<CodeRegular />}
                  >
                    View on GitHub
                  </Button>
                </Link>
              </div>
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
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Settings</Text>
        <Text className={styles.description}>
          Configure your application preferences
        </Text>
      </div>

      <div className={styles.contentWrapper}>
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          className={styles.tabList}
          appearance="subtle"
        >
          <Tab value="general">General</Tab>
          <Tab value="data">Data & AI</Tab>
          <Tab value="about">About</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
