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
  Switch,
  Spinner,
  Tooltip,
} from '@fluentui/react-components';
import { useState, useEffect, useRef } from 'react';
import { BugRegular, LightbulbRegular, CodeRegular, WarningRegular, DocumentBulletListRegular, InfoRegular, CheckmarkRegular, CheckmarkCircleRegular, DismissCircleRegular, QuestionCircleRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import type { ExportFormat } from '../hooks/useExportFormat';
import type { ResponseLanguage } from '../hooks/useResponseLanguage';
import type { GlucoseUnit, GlucoseThresholds } from '../types';
import { validateGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';
import { getVersionInfo, formatBuildDate } from '../utils/version';
import { getProviderDisplayName, getActiveProvider, getAvailableProviders, verifyApiKey, type AIProvider } from '../utils/api';

/**
 * Verification status for each API key
 * 
 * Represents the current state of API key verification:
 * - 'idle': Key has not been verified yet (or was reset after key change)
 * - 'verifying': Verification request is in progress
 * - 'valid': Key was verified and is working
 * - 'invalid': Key verification failed (invalid key or network error)
 */
type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

/**
 * State object tracking verification status for all AI providers
 * 
 * Each provider maintains its own independent verification state,
 * which is reset when the corresponding API key changes.
 */
interface VerificationState {
  /** Perplexity API key verification status */
  perplexity: VerificationStatus;
  /** Grok (xAI) API key verification status */
  grok: VerificationStatus;
  /** DeepSeek API key verification status */
  deepseek: VerificationStatus;
  /** Google Gemini API key verification status */
  gemini: VerificationStatus;
}

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
    display: 'block',
  },
  apiKeyContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '24px',
    marginBottom: '16px',
  },
  apiKeyRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  apiKeyLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '120px',
    flexShrink: 0,
    textAlign: 'left',
  },
  apiKeyInputGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    height: '32px',
  },
  apiKeyInput: {
    flex: 1,
    '& .fui-Input': {
      ...shorthands.border('0', 'none'),
      ...shorthands.borderRadius('0'),
    },
    '& input': {
      ...shorthands.border('0', 'none'),
    },
  },
  apiKeyInputBorderless: {
    flex: 1,
    '& .fui-Input__root': {
      ...shorthands.border('0', 'none'),
      backgroundColor: 'transparent',
      height: '100%',
    },
    '& input': {
      height: '100%',
    },
  },
  statusButton: {
    ...shorthands.borderRadius('0'),
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke1),
    minWidth: '100px',
    height: '100%',
  },
  statusButtonUnavailable: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    cursor: 'default',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground3,
    },
  },
  statusButtonSelected: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  verifyButton: {
    ...shorthands.borderRadius('0'),
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke1),
    minWidth: '32px',
    width: '32px',
    height: '100%',
    padding: '0',
  },
  verifyButtonValid: {
    color: tokens.colorStatusSuccessForeground1,
  },
  verifyButtonInvalid: {
    color: tokens.colorStatusDangerForeground1,
  },
  privacyInfoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('1px', 'solid', tokens.colorBrandForeground1),
    color: tokens.colorBrandForeground1,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
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
  selectedText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  selectButton: {
    minWidth: 'auto',
  },
  helperText: {
    marginTop: '12px',
    marginBottom: '12px',
  },
  infoSection: {
    marginTop: '24px',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
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
  accordionSummary: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    marginBottom: '0',
    display: 'block',
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

/**
 * Props for the Settings component
 */
interface SettingsProps {
  /** Current theme mode (light, dark, or system) */
  themeMode: ThemeMode;
  /** Callback invoked when theme mode changes */
  onThemeChange: (mode: ThemeMode) => void;
  /** Whether to show day/night shading on glucose graphs */
  showDayNightShading: boolean;
  /** Callback invoked when day/night shading preference changes */
  onShowDayNightShadingChange: (show: boolean) => void;
  /** Current export format for table data (CSV or TSV) */
  exportFormat: ExportFormat;
  /** Callback invoked when export format changes */
  onExportFormatChange: (format: ExportFormat) => void;
  /** Current language for AI response output */
  responseLanguage: ResponseLanguage;
  /** Callback invoked when AI response language changes */
  onResponseLanguageChange: (language: ResponseLanguage) => void;
  /** Current glucose unit (mmol/L or mg/dL) */
  glucoseUnit: GlucoseUnit;
  /** Callback invoked when glucose unit changes */
  onGlucoseUnitChange: (unit: GlucoseUnit) => void;
  /** Current glucose threshold values for time-in-range calculations */
  glucoseThresholds: GlucoseThresholds;
  /** Callback invoked when glucose thresholds change */
  onGlucoseThresholdsChange: (thresholds: GlucoseThresholds) => void;
  /** Duration of insulin action in hours for IOB calculations */
  insulinDuration: number;
  /** Callback invoked when insulin duration changes */
  onInsulinDurationChange: (duration: number) => void;
  /** Perplexity AI API key */
  perplexityApiKey: string;
  /** Callback invoked when Perplexity API key changes */
  onPerplexityApiKeyChange: (key: string) => void;
  /** Google Gemini API key */
  geminiApiKey: string;
  /** Callback invoked when Gemini API key changes */
  onGeminiApiKeyChange: (key: string) => void;
  /** Grok AI API key */
  grokApiKey: string;
  /** Callback invoked when Grok API key changes */
  onGrokApiKeyChange: (key: string) => void;
  /** DeepSeek API key */
  deepseekApiKey: string;
  /** Callback invoked when DeepSeek API key changes */
  onDeepSeekApiKeyChange: (key: string) => void;
  /** Currently selected AI provider, or null for auto-selection */
  selectedProvider: AIProvider | null;
  /** Callback invoked when selected AI provider changes */
  onSelectedProviderChange: (provider: AIProvider | null) => void;
  /** Callback invoked when provider is auto-switched due to failed key verification */
  onProviderAutoSwitch?: (fromProvider: AIProvider, toProvider: AIProvider) => void;
}

/**
 * Renders the Settings UI for configuring theme, export format, glucose units/thresholds, insulin duration, AI provider keys, and application information.
 *
 * @param selectedProvider - Currently selected AI provider identifier or null; used to mark which configured provider is active.
 * @param onSelectedProviderChange - Callback invoked when the user selects a different AI provider or when the component auto-selects one after API key changes.
 * @returns The Settings component UI as JSX elements.
 */
export function Settings({ 
  themeMode, 
  onThemeChange, 
  showDayNightShading,
  onShowDayNightShadingChange,
  exportFormat, 
  onExportFormatChange,
  responseLanguage,
  onResponseLanguageChange,
  glucoseUnit,
  onGlucoseUnitChange,
  glucoseThresholds,
  onGlucoseThresholdsChange,
  insulinDuration,
  onInsulinDurationChange,
  perplexityApiKey, 
  onPerplexityApiKeyChange, 
  geminiApiKey, 
  onGeminiApiKeyChange, 
  grokApiKey, 
  onGrokApiKeyChange, 
  deepseekApiKey, 
  onDeepSeekApiKeyChange,
  selectedProvider,
  onSelectedProviderChange,
  onProviderAutoSwitch,
}: SettingsProps) {
  const styles = useStyles();
  const validationError = validateGlucoseThresholds(glucoseThresholds);
  const isValid = validationError === null;
  const versionInfo = getVersionInfo();
  const [selectedTab, setSelectedTab] = useState<string>('general');
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Verification state for each API key
  const [verificationState, setVerificationState] = useState<VerificationState>({
    perplexity: 'idle',
    grok: 'idle',
    deepseek: 'idle',
    gemini: 'idle',
  });

  // Helper function to update a single threshold
  const updateThreshold = (key: keyof GlucoseThresholds, value: number) => {
    const newThresholds = { ...glucoseThresholds, [key]: value };
    onGlucoseThresholdsChange(newThresholds);
  };

  // Track previous key states for auto-selection logic
  const prevKeysRef = useRef({
    perplexity: perplexityApiKey,
    grok: grokApiKey,
    deepseek: deepseekApiKey,
    gemini: geminiApiKey,
  });

  // Get available providers and determine active one
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);

  // Handle auto-selection when keys change
  useEffect(() => {
    const prevKeys = prevKeysRef.current;
    
    // Check each provider for empty->filled or filled->empty transitions
    const checkProvider = (
      provider: AIProvider,
      currentKey: string,
      prevKey: string,
      otherKeys: { perplexityKey: string; grokKey: string; deepseekKey: string; geminiKey: string }
    ) => {
      const wasEmpty = !prevKey || prevKey.trim() === '';
      const isNowEmpty = !currentKey || currentKey.trim() === '';
      const isNowFilled = currentKey && currentKey.trim() !== '';
      
      // Auto-select when new key is entered
      if (wasEmpty && isNowFilled) {
        onSelectedProviderChange(provider);
      }
      // If the active provider's key was deleted, select first available provider
      else if (!wasEmpty && isNowEmpty && activeProvider === provider) {
        const remaining = getAvailableProviders(
          otherKeys.perplexityKey,
          otherKeys.geminiKey,
          otherKeys.grokKey,
          otherKeys.deepseekKey
        );
        onSelectedProviderChange(remaining[0] || null);
      }
    };

    // Check Perplexity
    if (prevKeys.perplexity !== perplexityApiKey) {
      checkProvider('perplexity', perplexityApiKey, prevKeys.perplexity, {
        perplexityKey: '',
        geminiKey: geminiApiKey,
        grokKey: grokApiKey,
        deepseekKey: deepseekApiKey,
      });
    }

    // Check Grok
    if (prevKeys.grok !== grokApiKey) {
      checkProvider('grok', grokApiKey, prevKeys.grok, {
        perplexityKey: perplexityApiKey,
        geminiKey: geminiApiKey,
        grokKey: '',
        deepseekKey: deepseekApiKey,
      });
    }

    // Check DeepSeek
    if (prevKeys.deepseek !== deepseekApiKey) {
      checkProvider('deepseek', deepseekApiKey, prevKeys.deepseek, {
        perplexityKey: perplexityApiKey,
        geminiKey: geminiApiKey,
        grokKey: grokApiKey,
        deepseekKey: '',
      });
    }

    // Check Gemini
    if (prevKeys.gemini !== geminiApiKey) {
      checkProvider('gemini', geminiApiKey, prevKeys.gemini, {
        perplexityKey: perplexityApiKey,
        geminiKey: '',
        grokKey: grokApiKey,
        deepseekKey: deepseekApiKey,
      });
    }

    // Update ref with current keys
    prevKeysRef.current = {
      perplexity: perplexityApiKey,
      grok: grokApiKey,
      deepseek: deepseekApiKey,
      gemini: geminiApiKey,
    };
  }, [perplexityApiKey, grokApiKey, deepseekApiKey, geminiApiKey, activeProvider, onSelectedProviderChange]);

  // Reset verification state when API key changes
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, perplexity: 'idle' }));
  }, [perplexityApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, grok: 'idle' }));
  }, [grokApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, deepseek: 'idle' }));
  }, [deepseekApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, gemini: 'idle' }));
  }, [geminiApiKey]);

  /**
   * Switch to the next available provider when the current one fails verification
   * 
   * @param failedProvider - The provider whose key verification failed
   */
  const switchToNextAvailableProvider = (failedProvider: AIProvider) => {
    if (activeProvider !== failedProvider) return;
    
    const availableProviders = getAvailableProviders(
      perplexityApiKey,
      geminiApiKey,
      grokApiKey,
      deepseekApiKey
    ).filter(p => p !== failedProvider);
    
    if (availableProviders.length > 0) {
      const newProvider = availableProviders[0];
      onSelectedProviderChange(newProvider);
      // Notify parent about the auto-switch for toast notification
      onProviderAutoSwitch?.(failedProvider, newProvider);
    }
  };

  /**
   * Handle API key verification for a provider
   * 
   * Initiates an async verification request to check if the API key is valid.
   * Updates the verification state to 'verifying' during the request, then
   * sets it to 'valid' or 'invalid' based on the result.
   * 
   * If the key is invalid and this provider is currently selected,
   * automatically switches to the next available provider.
   * 
   * @param provider - The AI provider whose key should be verified
   * @param apiKey - The API key to verify
   */
  const handleVerifyApiKey = async (provider: AIProvider, apiKey: string) => {
    if (!apiKey || apiKey.trim() === '') return;
    
    setVerificationState(prev => ({ ...prev, [provider]: 'verifying' }));
    
    try {
      const result = await verifyApiKey(provider, apiKey);
      const isValid = result.valid;
      setVerificationState(prev => ({ 
        ...prev, 
        [provider]: isValid ? 'valid' : 'invalid' 
      }));
      
      if (!isValid) {
        switchToNextAvailableProvider(provider);
      }
    } catch {
      setVerificationState(prev => ({ ...prev, [provider]: 'invalid' }));
      switchToNextAvailableProvider(provider);
    }
  };

  /**
   * Masks an API key, showing first 4 and last 2 characters with asterisks in between.
   * Uses a fixed number of asterisks (8) to avoid revealing actual key length.
   * For short keys (6 chars or less), shows fixed 8 asterisks for security.
   */
  const maskApiKey = (key: string): string => {
    if (!key) return '';
    const FIXED_MASK_LENGTH = 8;
    if (key.length <= 6) {
      return '*'.repeat(FIXED_MASK_LENGTH);
    }
    const first4 = key.slice(0, 4);
    const last2 = key.slice(-2);
    return `${first4}${'*'.repeat(FIXED_MASK_LENGTH)}${last2}`;
  };

  // Helper function to render the status button for each API key field
  const renderStatusButton = (provider: AIProvider, hasKey: boolean) => {
    const isActive = activeProvider === provider;
    
    if (!hasKey) {
      // Unavailable state - no key present
      return (
        <Button
          appearance="subtle"
          size="small"
          disabled
          className={`${styles.statusButton} ${styles.statusButtonUnavailable}`}
        >
          Unavailable
        </Button>
      );
    }
    
    if (isActive) {
      // Selected state
      return (
        <Button
          appearance="primary"
          size="small"
          icon={<CheckmarkRegular />}
          className={`${styles.statusButton} ${styles.statusButtonSelected}`}
        >
          Selected
        </Button>
      );
    }
    
    // Select state - clickable to switch provider
    return (
      <Button
        appearance="subtle"
        size="small"
        onClick={() => onSelectedProviderChange(provider)}
        className={styles.statusButton}
      >
        Select
      </Button>
    );
  };

  /**
   * Render the verification button for an API key field
   * 
   * The button displays different states based on verification status:
   * - Disabled with question mark: No API key entered
   * - Question mark: Ready to verify (idle state)
   * - Spinner: Verification in progress
   * - Green checkmark: API key is valid
   * - Red X: API key is invalid
   * 
   * @param provider - The AI provider for this API key
   * @param apiKey - The current API key value
   * @returns JSX element for the verify button with tooltip
   */
  const renderVerifyButton = (provider: AIProvider, apiKey: string) => {
    const status = verificationState[provider];
    const hasKey = !!apiKey && apiKey.trim() !== '';
    
    // Get tooltip text based on status
    const getTooltipText = () => {
      switch (status) {
        case 'verifying':
          return 'Verifying API key...';
        case 'valid':
          return 'API key is valid';
        case 'invalid':
          return 'API key is invalid';
        default:
          return hasKey ? 'Click to verify API key' : 'No API key to verify';
      }
    };
    
    // Get icon based on status with appropriate styling
    const getIcon = () => {
      switch (status) {
        case 'verifying':
          return <Spinner size="tiny" />;
        case 'valid':
          return <CheckmarkCircleRegular className={styles.verifyButtonValid} />;
        case 'invalid':
          return <DismissCircleRegular className={styles.verifyButtonInvalid} />;
        default:
          return <QuestionCircleRegular />;
      }
    };
    
    return (
      <Tooltip content={getTooltipText()} relationship="label">
        <Button
          appearance="subtle"
          size="small"
          icon={getIcon()}
          disabled={!hasKey || status === 'verifying'}
          onClick={() => handleVerifyApiKey(provider, apiKey)}
          className={styles.verifyButton}
          aria-label={getTooltipText()}
        />
      </Tooltip>
    );
  };

  // Helper function to render privacy info icon
  const renderPrivacyIcon = (privacyUrl: string) => {
    return (
      <Link
        href={privacyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.privacyInfoButton}
        title="Privacy Policy"
      >
        <InfoRegular />
      </Link>
    );
  };

  // Helper to render a single API key row
  const renderApiKeyRow = (
    provider: AIProvider,
    providerName: string,
    apiKey: string,
    onApiKeyChange: (key: string) => void,
    privacyUrl: string,
    inputId: string
  ) => {
    const isEditing = editingField === inputId;
    const displayValue = isEditing ? apiKey : (apiKey ? maskApiKey(apiKey) : '');
    // Field is read-only when showing masked value (not editing and has key)
    const isReadOnly = !isEditing && !!apiKey;
    
    return (
      <div className={styles.apiKeyRow}>
        <Label htmlFor={inputId} className={styles.apiKeyLabel}>
          {providerName}
        </Label>
        <div className={styles.apiKeyInputGroup}>
          <Input
            id={inputId}
            type={isEditing ? 'password' : 'text'}
            value={displayValue}
            onChange={(_, data) => onApiKeyChange(data.value)}
            onFocus={() => setEditingField(inputId)}
            onBlur={() => setEditingField(null)}
            placeholder="Enter your API key"
            appearance="underline"
            className={styles.apiKeyInputBorderless}
            readOnly={isReadOnly}
          />
          {renderVerifyButton(provider, apiKey)}
          {renderStatusButton(provider, !!apiKey)}
        </div>
        {renderPrivacyIcon(privacyUrl)}
      </div>
    );
  };

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
              <Title3 className={styles.sectionTitle}>Day/Night Shading</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Show day/night background shading on 24-hour glucose graphs.
              </Text>
              <Switch
                checked={showDayNightShading}
                onChange={(_, data) => onShowDayNightShadingChange(data.checked)}
                label={showDayNightShading ? 'Day/night shading enabled' : 'Day/night shading disabled'}
              />
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

            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>AI Response Language</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Choose the language for AI analysis responses. This affects all AI-generated insights and recommendations. Note: This does not change the application interface, which is only available in English.
              </Text>
              <RadioGroup
                value={responseLanguage}
                onChange={(_, data) => onResponseLanguageChange(data.value as ResponseLanguage)}
              >
                <Radio value="english" label="English" />
                <Radio value="czech" label="Czech (Čeština)" />
                <Radio value="german" label="German (Deutsch)" />
                <Radio value="serbian" label="Serbian (Srpski - latinica)" />
              </RadioGroup>
            </div>
          </>
        );
      
      case 'glucose':
        return (
          <>
            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>Glucose Unit</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Choose your preferred unit for displaying blood glucose values. This setting affects all glucose readings, charts, and thresholds throughout the app.
              </Text>
              <RadioGroup
                value={glucoseUnit}
                onChange={(_, data) => onGlucoseUnitChange(data.value as GlucoseUnit)}
              >
                <Radio value="mmol/L" label="mmol/L (millimoles per liter)" />
                <Radio value="mg/dL" label="mg/dL (milligrams per deciliter)" />
              </RadioGroup>
            </div>

            <GlucoseThresholdsSection
              thresholds={glucoseThresholds}
              onUpdateThreshold={updateThreshold}
              isValid={isValid}
              validationError={validationError}
              glucoseUnit={glucoseUnit}
            />

            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>Insulin Duration</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Set the duration of insulin action in hours for IOB (Insulin On Board) calculations. This affects how long insulin is considered active in your system. Typical values range from 3 to 6 hours.
              </Text>
              <Label htmlFor="insulin-duration-input">Duration (hours)</Label>
              <Input
                id="insulin-duration-input"
                type="number"
                value={insulinDuration.toString()}
                onChange={(_, data) => {
                  const value = parseFloat(data.value);
                  if (!isNaN(value) && value > 0) {
                    onInsulinDurationChange(value);
                  }
                }}
                min={1}
                max={12}
                step={0.5}
                style={{ maxWidth: '200px' }}
              />
            </div>
          </>
        );
      
      case 'ai':
        return (
          <>
            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>AI Configuration</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                Configure your AI settings for intelligent analysis. Click "Select" next to any configured API key to switch providers.
              </Text>
              
              <div className={styles.apiKeyContainer}>
                {renderApiKeyRow(
                  'perplexity',
                  'Perplexity',
                  perplexityApiKey,
                  onPerplexityApiKeyChange,
                  'https://www.perplexity.ai/hub/faq/privacy-and-security',
                  'perplexity-api-key'
                )}
                
                {renderApiKeyRow(
                  'grok',
                  'Grok AI',
                  grokApiKey,
                  onGrokApiKeyChange,
                  'https://x.ai/legal/privacy-policy',
                  'grok-api-key'
                )}
                
                {renderApiKeyRow(
                  'deepseek',
                  'DeepSeek',
                  deepseekApiKey,
                  onDeepSeekApiKeyChange,
                  'https://www.deepseek.com/en/privacy',
                  'deepseek-api-key'
                )}
                
                {renderApiKeyRow(
                  'gemini',
                  'Google Gemini',
                  geminiApiKey,
                  onGeminiApiKeyChange,
                  'https://policies.google.com/privacy',
                  'gemini-api-key'
                )}
              </div>
              
              {/* Information Sections - All in one accordion */}
              <div className={styles.infoSection}>
                <Accordion collapsible multiple>
                  {/* Free API Key Availability */}
                  <AccordionItem value="freeapi">
                    <AccordionHeader>
                      <Text className={styles.accordionSummary}>
                        <strong>🎁 Free API Key Availability</strong> — Information about free tier options for each AI provider.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          <strong>Google Gemini:</strong> ✅ Offers a free tier with monthly quota for API calls.{' '}
                          <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                            Get your free API key
                          </Link>
                        </p>
                        <p>
                          <strong>DeepSeek:</strong> ✅ Offers limited free cloud API tier with monthly requests.{' '}
                          <Link href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                            Get your free API key
                          </Link>
                        </p>
                        <p>
                          <strong>Perplexity:</strong> ⚠️ API is primarily paid with limited free tier.{' '}
                          <Link href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                            Check pricing
                          </Link>
                        </p>
                        <p>
                          <strong>Grok AI:</strong> ❌ No free API access. Requires X Premium+ subscription ($30/month).{' '}
                          <Link href="https://console.x.ai/" target="_blank" rel="noopener noreferrer">
                            Learn more
                          </Link>
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  {/* Important: Data Handling & Your Responsibility */}
                  <AccordionItem value="datahandling">
                    <AccordionHeader>
                      <div className={styles.warningHeader}>
                        <WarningRegular className={styles.warningIcon} />
                        <Text className={styles.accordionSummary}>
                          <strong>Important: Data Handling & Your Responsibility</strong> — Your health data is sent to AI providers when using analysis features.
                        </Text>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          When you use AI analysis features, your sensitive health data will be sent to the selected AI provider ({activeProvider ? getProviderDisplayName(activeProvider) : 'the configured AI service'}). The data is sent <strong>without personally identifiable information</strong> (such as your name or email), but the AI provider may be able to associate your API key with the health data you send.
                        </p>
                        <p>
                          <strong>Your Responsibility:</strong> You are responsible for the security of this information and its use in accordance with all applicable data protection rules and regulations. Review the privacy policies of your chosen AI provider before using these features.
                        </p>
                        <p>
                          <strong>Best Practices:</strong> Monitor your API key usage regularly through your provider's dashboard, apply least privilege access permissions when creating API keys, and set daily spending limits to prevent unexpected charges and unauthorized usage.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  {/* API Key Storage */}
                  <AccordionItem value="storage">
                    <AccordionHeader>
                      <Text className={styles.accordionSummary}>
                        <strong>API Key Storage:</strong> Your API keys are stored locally in your browser and never sent to our servers.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          Your API keys are stored locally in your browser's local storage (not cookies) and persist until you manually clear them or clear your browser data. The keys are never transmitted to our servers or any third party.
                        </p>
                        <p>
                          <strong>Technical Details:</strong> We use browser local storage API, which provides persistent storage that remains available across browser sessions. This data is stored only on your device and is accessible only by this web application from the same domain.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  {/* AI Communication */}
                  <AccordionItem value="communication">
                    <AccordionHeader>
                      <Text className={styles.accordionSummary}>
                        <strong>AI Communication:</strong> All AI analysis happens directly between your browser and the AI provider—no intermediary servers.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          When you request AI analysis, your browser sends the request directly to the selected AI provider's API. Our application does not act as an intermediary—the communication goes straight from your browser to the AI provider.
                        </p>
                        <p>
                          <strong>Provider Priority:</strong> If multiple API keys are configured, they are used in this order: Perplexity → Grok AI → DeepSeek → Google Gemini. To use a different provider, remove the API keys with higher priority.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>

                  {/* Security Best Practices */}
                  <AccordionItem value="bestpractices">
                    <AccordionHeader>
                      <Text className={styles.accordionSummary}>
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
                            <Link href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                              Perplexity Settings
                            </Link>
                          </li>
                          <li>
                            <Link href="https://console.x.ai/" target="_blank" rel="noopener noreferrer">
                              xAI Console
                            </Link> (for Grok AI)
                          </li>
                          <li>
                            <Link href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                              DeepSeek Platform
                            </Link>
                          </li>
                          <li>
                            <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                              Google AI Studio
                            </Link>
                          </li>
                        </ul>
                        <p>
                          <strong>Protect Your Keys:</strong> Choose keys designated for client-side applications and set spending limits to prevent unexpected charges. Monitor your API key usage regularly through your provider's dashboard.
                        </p>
                        <p>
                          <strong>Risk Mitigation:</strong> If someone gains access to your browser session or computer, they could potentially access your stored API key. To reduce this risk:
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

                  {/* Data Storage */}
                  <AccordionItem value="datastorage">
                    <AccordionHeader>
                      <Text className={styles.accordionSummary}>
                        <strong>Data Storage:</strong> Your data is stored locally with configurable persistence options.
                      </Text>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.accordionContent}>
                        <p>
                          Your data is stored locally with configurable persistence options. All processing happens in your browser. This application is fully open source—you can{' '}
                          <Link href="https://github.com/iricigor/GlookoDataWebApp" target="_blank" rel="noopener noreferrer">
                            review the code on GitHub
                          </Link>{' '}
                          or deploy your own instance for complete control.
                        </p>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </div>
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
                <Link 
                  href="#api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    appearance="secondary" 
                    icon={<DocumentBulletListRegular />}
                  >
                    API Documentation
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

            <div className={styles.settingSection}>
              <Title3 className={styles.sectionTitle}>Demo Data Attribution</Title3>
              <Divider className={styles.divider} />
              <Text className={styles.settingDescription}>
                The demo datasets included in this application are inspired by real-world Type 1 Diabetes data patterns 
                from the <strong>AZT1D dataset</strong> (Khamesian et al., 2025), which is available under the Creative 
                Commons Attribution 4.0 (CC BY 4.0) license.
              </Text>
              <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
                <strong>Citation:</strong> Khamesian, S., Arefeen, A., Thompson, B. M., Grando, M. A., & Ghasemzadeh, H. (2025). 
                AZT1D: A Real-World Dataset for Type 1 Diabetes. arXiv:2506.14789. DOI:{' '}
                <Link 
                  href="https://doi.org/10.17632/gk9m674wcx.1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  10.17632/gk9m674wcx.1
                </Link>
              </Text>
              <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
                For more information about the original dataset, visit:{' '}
                <Link 
                  href="https://arxiv.org/abs/2506.14789"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://arxiv.org/abs/2506.14789
                </Link>
              </Text>
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
          <Tab value="glucose">Glucose Data</Tab>
          <Tab value="ai">AI Settings</Tab>
          <Tab value="about">About</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}