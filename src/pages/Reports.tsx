import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { BGOverviewReport } from '../components/BGOverviewReport';
import { DailyBGReport } from '../components/DailyBGReport';
import { HyposReport } from '../components/HyposReport';
import type { UploadedFile, GlucoseUnit } from '../types';
import type { ExportFormat } from '../hooks/useExportFormat';
import type { ResponseLanguage } from '../hooks/useResponseLanguage';
import type { AIProvider } from '../utils/api/aiApi';

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
  contentWrapper: {
    display: 'flex',
    ...shorthands.gap('24px'),
    '@media (max-width: 1023px)': {
      flexDirection: 'column',
    },
  },
  tabListVertical: {
    flexShrink: 0,
    width: '200px',
    '@media (min-width: 1024px)': {
      display: 'none',
    },
    '@media (max-width: 1023px)': {
      width: '100%',
    },
  },
  tabListHorizontal: {
    marginBottom: '24px',
    '@media (max-width: 1023px)': {
      display: 'none',
    },
  },
  contentArea: {
    flex: 1,
  },
});

interface ReportsProps {
  selectedFile?: UploadedFile;
  exportFormat: ExportFormat;
  glucoseUnit: GlucoseUnit;
  insulinDuration?: number;
  showDayNightShading: boolean;
  showGeekStats: boolean;
  // AI configuration props for HyposReport
  perplexityApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  deepseekApiKey?: string;
  selectedProvider?: AIProvider | null;
  responseLanguage?: ResponseLanguage;
}

const VALID_TABS = ['fileInfo', 'bgOverview', 'dailyBG', 'hypos'];

/**
 * Render the Comprehensive Reports interface with selectable report tabs.
 *
 * @param selectedFile - Uploaded file whose data will be shown in the reports.
 * @param glucoseUnit - Unit used to display glucose values.
 * @param insulinDuration - Insulin action duration in hours used by daily reports.
 * @param showDayNightShading - When true, daily charts include day/night shading.
 * @param perplexityApiKey - Optional API key for the Perplexity AI provider (used by the Hypos report).
 * @param geminiApiKey - Optional API key for the Gemini AI provider (used by the Hypos report).
 * @param grokApiKey - Optional API key for the Grok AI provider (used by the Hypos report).
 * @param deepseekApiKey - Optional API key for the DeepSeek AI provider (used by the Hypos report).
 * @param selectedProvider - Selected AI provider to use for AI-powered reports.
 * @param responseLanguage - Preferred language for AI-generated responses.
 * @returns The reports UI as a React element.
 */
export function Reports({ 
  selectedFile, 
  // exportFormat is kept in the interface for backward compatibility but no longer used
  // since Detailed CGM, Detailed Insulin, Unified View, IOB, and RoC tabs are hidden
  glucoseUnit, 
  insulinDuration,
  showDayNightShading,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  deepseekApiKey,
  selectedProvider,
  responseLanguage,
}: ReportsProps) {
  const styles = useStyles();
  const { t } = useTranslation('reports');
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    // Check URL hash for deep linking first (e.g., #reports/bgOverview)
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    if (parts.length > 1 && parts[0] === 'reports' && VALID_TABS.includes(parts[1])) {
      return parts[1];
    }
    // Otherwise, load the last selected tab from localStorage
    const savedTab = localStorage.getItem('reports-selected-tab');
    return (savedTab && VALID_TABS.includes(savedTab)) ? savedTab : 'bgOverview';
  });

  // Save the selected tab to localStorage and update URL hash whenever it changes
  useEffect(() => {
    localStorage.setItem('reports-selected-tab', selectedTab);
    // Update URL hash to enable deep linking (e.g., #reports/bgOverview)
    const currentHash = window.location.hash.slice(1);
    const expectedHash = `reports/${selectedTab}`;
    if (currentHash !== expectedHash) {
      window.history.replaceState(null, '', `#${expectedHash}`);
    }
  }, [selectedTab]);

  // Listen for hash changes to sync URL → tab state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const parts = hash.split('/');
      if (parts.length > 1 && parts[0] === 'reports' && VALID_TABS.includes(parts[1])) {
        const newTab = parts[1];
        if (newTab !== selectedTab) {
          setSelectedTab(newTab);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedTab]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'fileInfo':
        return (
          <div>
            <SelectedFileMetadata selectedFile={selectedFile} />
          </div>
        );
      case 'bgOverview':
        return <BGOverviewReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} showGeekStats={showGeekStats} />;
      case 'dailyBG':
        return <DailyBGReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} insulinDuration={insulinDuration} showDayNightShading={showDayNightShading} />;
      case 'hypos':
        return (
          <HyposReport 
            selectedFile={selectedFile} 
            glucoseUnit={glucoseUnit}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
            deepseekApiKey={deepseekApiKey}
            selectedProvider={selectedProvider}
            responseLanguage={responseLanguage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('reports.title')}</Text>
        <Text className={styles.description}>
          {t('reports.description')}
        </Text>
      </div>

      {/* Horizontal TabList for desktop */}
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        className={styles.tabListHorizontal}
        appearance="subtle"
        size="large"
      >
        <Tab value="fileInfo">{t('reports.tabs.fileInfo')}</Tab>
        <Tab value="bgOverview">{t('reports.tabs.bgOverview')}</Tab>
        <Tab value="dailyBG">{t('reports.tabs.dailyBG')}</Tab>
        <Tab value="hypos">{t('reports.tabs.hypos')}</Tab>
      </TabList>

      <div className={styles.contentWrapper}>
        {/* Vertical TabList for mobile */}
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          className={styles.tabListVertical}
          appearance="subtle"
        >
          <Tab value="fileInfo">{t('reports.tabs.fileInfo')}</Tab>
          <Tab value="bgOverview">{t('reports.tabs.bgOverview')}</Tab>
          <Tab value="dailyBG">{t('reports.tabs.dailyBG')}</Tab>
          <Tab value="hypos">{t('reports.tabs.hypos')}</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}