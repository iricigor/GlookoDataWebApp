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
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { useState } from 'react';
import { BugRegular, LightbulbRegular, CodeRegular, WarningRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import type { ExportFormat } from '../hooks/useExportFormat';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';
import { getVersionInfo, formatBuildDate } from '../utils/version';
import { getProviderDisplayName, determineActiveProvider } from '../utils/aiApi';

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
  apiKeyContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    marginBottom: '16px',
  },
  apiKeyRow: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  apiKeyLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  apiKeyLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  privacyLink: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  apiKeyInput: {
    width: '100%',
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
  versionLink: {
    fontSize: tokens.fontSizeBase300,
    fontFamily: 'monospace',
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  supportButtons: {
    display: 'flex',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  securitySection: {
    marginTop: '16px',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  securitySummary: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    marginBottom: '8px',
    display: 'block',
  },
  securityTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  accordionContent: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    '& p': {
      margin: '0 0 12px 0',
      '&:last-child': {
        marginBottom: '0',
      },
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
    '& ul': {
      margin: '8px 0',
      paddingLeft: '24px',
    },
    '& li': {
      marginBottom: '4px',
    },
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  warningIcon: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorPaletteYellowForeground1,
    flexShrink: 0,
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
  grokApiKey: string;
  onGrokApiKeyChange: (key: string) => void;
  deepseekApiKey: string;
  onDeepSeekApiKeyChange: (key: string) => void;
}

export function Settings({ themeMode, onThemeChange, exportFormat, onExportFormatChange, perplexityApiKey, onPerplexityApiKeyChange, geminiApiKey, onGeminiApiKeyChange, grokApiKey, onGrokApiKeyChange, deepseekApiKey, onDeepSeekApiKeyChange }: SettingsProps) {
  const styles = useStyles();
  const { thresholds, updateThreshold, validateThresholds, isValid } = useGlucoseThresholds();
  const validationError = validateThresholds(thresholds);
  const versionInfo = getVersionInfo();
  const [selectedTab, setSelectedTab] = useState<string>('general');

  // Determine which provider is active based on available keys
  // Priority: Perplexity > Grok > DeepSeek > Gemini
  const activeProvider = determineActiveProvider(perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);

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
                Configure your AI settings for intelligent analysis.
              </Text>
              {activeProvider && (
                <Text className={styles.settingDescription} style={{ color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold }}>
                  Currently using: {getProviderDisplayName(activeProvider)}
                </Text>
              )}
              
              <div className={styles.apiKeyContainer}>
                <div className={styles.apiKeyRow}>
                  <div className={styles.apiKeyLabelRow}>
                    <Label htmlFor="perplexity-api-key" className={styles.apiKeyLabel}>
                      Perplexity API Key
                    </Label>
                    <Link 
                      href="https://www.perplexity.ai/hub/faq/privacy-and-security" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.privacyLink}
                    >
                      Privacy Policy
                    </Link>
                  </div>
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
                  <div className={styles.apiKeyLabelRow}>
                    <Label htmlFor="grok-api-key" className={styles.apiKeyLabel}>
                      Grok AI API Key
                    </Label>
                    <Link 
                      href="https://x.ai/legal/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.privacyLink}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                  <Input
                    id="grok-api-key"
                    type="password"
                    value={grokApiKey}
                    onChange={(_, data) => onGrokApiKeyChange(data.value)}
                    placeholder="Enter your Grok AI API key"
                    contentAfter={grokApiKey ? (activeProvider === 'grok' ? '✓ Selected' : '✓') : undefined}
                    className={styles.apiKeyInput}
                  />
                </div>
                
                <div className={styles.apiKeyRow}>
                  <div className={styles.apiKeyLabelRow}>
                    <Label htmlFor="deepseek-api-key" className={styles.apiKeyLabel}>
                      DeepSeek API Key
                    </Label>
                    <Link 
                      href="https://www.deepseek.com/en/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.privacyLink}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                  <Input
                    id="deepseek-api-key"
                    type="password"
                    value={deepseekApiKey}
                    onChange={(_, data) => onDeepSeekApiKeyChange(data.value)}
                    placeholder="Enter your DeepSeek API key"
                    contentAfter={deepseekApiKey ? (activeProvider === 'deepseek' ? '✓ Selected' : '✓') : undefined}
                    className={styles.apiKeyInput}
                  />
                </div>
                
                <div className={styles.apiKeyRow}>
                  <div className={styles.apiKeyLabelRow}>
                    <Label htmlFor="gemini-api-key" className={styles.apiKeyLabel}>
                      Google Gemini API Key
                    </Label>
                    <Link 
                      href="https://policies.google.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.privacyLink}
                    >
                      Privacy Policy
                    </Link>
                  </div>
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
              </div>
              
              <div className={styles.securitySection}>
                <Text className={styles.securityTitle}>Security & Privacy Information</Text>
                
                <Accordion collapsible multiple>
                  <AccordionItem value="datahandling">
                    <AccordionHeader>
                      <div className={styles.warningHeader}>
                        <WarningRegular className={styles.warningIcon} />
                        <Text className={styles.securitySummary}>
                          <strong>Important: Data Handling & Your Responsibility</strong> — Your health data is sent to AI providers when using analysis features.
                        </Text>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          When you use AI analysis features, your sensitive health data will be sent to the selected AI provider 
                          ({activeProvider ? getProviderDisplayName(activeProvider) : 'the configured AI service'}). 
                          The data is sent <strong>without personally identifiable information</strong> (such as your name or email), 
                          but the AI provider may be able to associate your API key with the health data you send.
                        </p>
                        <p>
                          <strong>Your Responsibility:</strong> You are responsible for the security of this information and its use 
                          in accordance with all applicable data protection rules and regulations. Review the privacy policies of your 
                          chosen AI provider before using these features.
                        </p>
                        <p>
                          <strong>Best Practices:</strong> Monitor your API key usage regularly through your provider's dashboard, 
                          apply least privilege access permissions when creating API keys, and set daily spending limits to prevent 
                          unexpected charges and unauthorized usage.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem value="storage">
                    <AccordionHeader>
                      <Text className={styles.securitySummary}>
                        <strong>API Key Storage:</strong> Your API keys are stored locally in your browser and never sent to our servers.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          Your API keys are stored locally in your browser's local storage (not cookies) and persist until you manually 
                          clear them or clear your browser data. The keys are never transmitted to our servers or any third party.
                        </p>
                        <p>
                          <strong>Technical Details:</strong> We use browser local storage API, which provides persistent storage 
                          that remains available across browser sessions. This data is stored only on your device and is accessible 
                          only by this web application from the same domain.
                        </p>
                        <p>
                          <strong>Open Source:</strong> This application is fully open source—you can{' '}
                          <a href="https://github.com/iricigor/GlookoDataWebApp" target="_blank" rel="noopener noreferrer">
                            review the code on GitHub
                          </a>{' '}
                          or deploy your own instance for complete control.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem value="communication">
                    <AccordionHeader>
                      <Text className={styles.securitySummary}>
                        <strong>AI Communication:</strong> All AI analysis happens directly between your browser and the AI provider—no intermediary servers.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          When you request AI analysis, your browser sends the request directly to the selected AI provider's API. 
                          Our application does not act as an intermediary—the communication goes straight from your browser 
                          to the AI provider.
                        </p>
                        <p>
                          <strong>Provider Priority:</strong> If multiple API keys are configured, they are used in this order: 
                          Perplexity → Grok AI → DeepSeek → Google Gemini. To use a different provider, remove the API keys 
                          with higher priority.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem value="bestpractices">
                    <AccordionHeader>
                      <Text className={styles.securitySummary}>
                        <strong>Security Best Practices:</strong> Follow these recommendations to keep your API keys and data secure.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          <strong>Create Secure API Keys:</strong> Use minimal permissions when creating API keys at:
                        </p>
                        <ul>
                          <li>
                            <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                              Perplexity Settings
                            </a>
                          </li>
                          <li>
                            <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer">
                              xAI Console
                            </a> (for Grok AI)
                          </li>
                          <li>
                            <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                              DeepSeek Platform
                            </a>
                          </li>
                          <li>
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                              Google AI Studio
                            </a>
                          </li>
                        </ul>
                        <p>
                          <strong>Protect Your Keys:</strong> Choose keys designated for client-side applications and set spending 
                          limits to prevent unexpected charges. Monitor your API key usage regularly through your provider's dashboard.
                        </p>
                        <p>
                          <strong>Risk Mitigation:</strong> If someone gains access to your browser session or computer, they could 
                          potentially access your stored API key. To reduce this risk:
                        </p>
                        <ul>
                          <li>Log out from shared computers</li>
                          <li>Use browser privacy features (private/incognito mode when appropriate)</li>
                          <li>Regularly rotate your API keys</li>
                          <li>Monitor your API usage in your provider's dashboard</li>
                          <li>Clear browser data when using public computers</li>
                        </ul>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
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
                {versionInfo.releaseUrl ? (
                  <Link 
                    href={versionInfo.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.versionLink}
                  >
                    {versionInfo.version}
                  </Link>
                ) : (
                  <Text className={styles.versionValue}>{versionInfo.version}</Text>
                )}
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
                {versionInfo.releaseUrl ? (
                  <Link 
                    href={versionInfo.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.versionLink}
                  >
                    {versionInfo.fullVersion}
                  </Link>
                ) : (
                  <Text className={styles.versionValue}>{versionInfo.fullVersion}</Text>
                )}
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
