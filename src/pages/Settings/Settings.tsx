/**
 * Settings page component
 * Provides UI for configuring theme, glucose settings, AI providers, and viewing app information
 */

import { useState, useEffect } from 'react';
import {
  Text,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import type { ThemeMode } from '../../hooks/useTheme';
import type { ExportFormat } from '../../hooks/useExportFormat';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { UILanguage } from '../../hooks/useUILanguage';
import type { GlucoseUnit, GlucoseThresholds } from '../../types';
import type { AIProvider } from '../../utils/api';

// Import styles and tab components
import { useStyles } from './styles';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { GlucoseSettingsTab } from './GlucoseSettingsTab';
import { AISettingsTab } from './AISettingsTab';
import { AboutTab } from './AboutTab';

// Valid tab values for deep linking
const VALID_TABS = ['general', 'glucose', 'ai', 'about'];

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
  /** Current UI language (English or German) */
  uiLanguage: UILanguage;
  /** Callback invoked when UI language changes */
  onUILanguageChange: (language: UILanguage) => void;
  /** Current language for AI response output */
  responseLanguage: ResponseLanguage;
  /** Callback invoked when AI response language changes */
  onResponseLanguageChange: (language: ResponseLanguage) => void;
  /** Whether to sync AI language with UI language */
  syncWithUILanguage: boolean;
  /** Callback invoked when sync preference changes */
  onSyncWithUILanguageChange: (sync: boolean) => void;
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
 * Render the Settings page UI for configuring theme, export format, glucose settings, AI providers, and application information.
 *
 * @param selectedProvider - The currently selected AI provider, or `null` to allow automatic provider selection
 * @param onProviderAutoSwitch - Optional callback invoked when the app automatically switches AI providers; called with `(fromProvider, toProvider)`
 * @returns The Settings page element
 */
export function Settings({ 
  themeMode, 
  onThemeChange, 
  showDayNightShading,
  onShowDayNightShadingChange,
  exportFormat, 
  onExportFormatChange,
  uiLanguage,
  onUILanguageChange,
  responseLanguage,
  onResponseLanguageChange,
  syncWithUILanguage,
  onSyncWithUILanguageChange,
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
  const { t } = useTranslation('settings');
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    // Check URL hash for deep linking first (e.g., #settings/ai)
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    if (parts.length > 1 && parts[0] === 'settings' && VALID_TABS.includes(parts[1])) {
      return parts[1];
    }
    return 'general';
  });

  // Sync URL hash with selected tab (update URL when tab changes)
  useEffect(() => {
    const currentHash = window.location.hash.slice(1);
    const expectedHash = `settings/${selectedTab}`;
    if (currentHash !== expectedHash) {
      window.history.replaceState(null, '', `#${expectedHash}`);
    }
  }, [selectedTab]);

  // Listen for hash changes to sync URL → tab state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const parts = hash.split('/');
      if (parts.length > 1 && parts[0] === 'settings' && VALID_TABS.includes(parts[1])) {
        setSelectedTab(parts[1]);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'general':
        return (
          <GeneralSettingsTab
            styles={styles}
            themeMode={themeMode}
            onThemeChange={onThemeChange}
            showDayNightShading={showDayNightShading}
            onShowDayNightShadingChange={onShowDayNightShadingChange}
            exportFormat={exportFormat}
            onExportFormatChange={onExportFormatChange}
            uiLanguage={uiLanguage}
            onUILanguageChange={onUILanguageChange}
            responseLanguage={responseLanguage}
            onResponseLanguageChange={onResponseLanguageChange}
            syncWithUILanguage={syncWithUILanguage}
            onSyncWithUILanguageChange={onSyncWithUILanguageChange}
          />
        );
      
      case 'glucose':
        return (
          <GlucoseSettingsTab
            styles={styles}
            glucoseUnit={glucoseUnit}
            onGlucoseUnitChange={onGlucoseUnitChange}
            glucoseThresholds={glucoseThresholds}
            onGlucoseThresholdsChange={onGlucoseThresholdsChange}
            insulinDuration={insulinDuration}
            onInsulinDurationChange={onInsulinDurationChange}
          />
        );
      
      case 'ai':
        return (
          <AISettingsTab
            styles={styles}
            perplexityApiKey={perplexityApiKey}
            onPerplexityApiKeyChange={onPerplexityApiKeyChange}
            geminiApiKey={geminiApiKey}
            onGeminiApiKeyChange={onGeminiApiKeyChange}
            grokApiKey={grokApiKey}
            onGrokApiKeyChange={onGrokApiKeyChange}
            deepseekApiKey={deepseekApiKey}
            onDeepSeekApiKeyChange={onDeepSeekApiKeyChange}
            selectedProvider={selectedProvider}
            onSelectedProviderChange={onSelectedProviderChange}
            onProviderAutoSwitch={onProviderAutoSwitch}
          />
        );
      
      case 'about':
        return <AboutTab styles={styles} />;
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('settings.title')}</Text>
        <Text className={styles.description}>
          {t('settings.description')}
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
          <Tab value="general">{t('settings.tabs.general')}</Tab>
          <Tab value="glucose">{t('settings.tabs.glucose')}</Tab>
          <Tab value="ai">{t('settings.tabs.ai')}</Tab>
          <Tab value="about">{t('settings.tabs.about')}</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}