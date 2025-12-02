import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { BGOverviewReport } from '../components/BGOverviewReport';
import { DailyBGReport } from '../components/DailyBGReport';
import { HyposReport } from '../components/HyposReport';
import { BGValuesReport } from '../components/BGValuesReport';
import { InsulinDailyReport } from '../components/InsulinDailyReport';
import { UnifiedDailyReport } from '../components/UnifiedDailyReport';
import { IOBReport } from '../components/IOBReport';
import { RoCReport } from '../components/RoCReport';
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
  // AI configuration props for HyposReport
  perplexityApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  deepseekApiKey?: string;
  selectedProvider?: AIProvider | null;
  responseLanguage?: ResponseLanguage;
}

const VALID_TABS = ['fileInfo', 'bgOverview', 'dailyBG', 'hypos', 'detailedCgm', 'detailedInsulin', 'unifiedView', 'iob', 'roc'];

export function Reports({ 
  selectedFile, 
  exportFormat,
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
        return <BGOverviewReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} />;
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
      case 'detailedCgm':
        return <BGValuesReport selectedFile={selectedFile} exportFormat={exportFormat} glucoseUnit={glucoseUnit} />;
      case 'detailedInsulin':
        return <InsulinDailyReport selectedFile={selectedFile} />;
      case 'unifiedView':
        return <UnifiedDailyReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} />;
      case 'iob':
        return <IOBReport selectedFile={selectedFile} insulinDuration={insulinDuration} />;
      case 'roc':
        return <RoCReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Comprehensive Reports</Text>
        <Text className={styles.description}>
          View detailed analytics including time-in-range, patterns, and trends
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
        <Tab value="fileInfo">File Info</Tab>
        <Tab value="bgOverview">BG Overview</Tab>
        <Tab value="dailyBG">Daily BG</Tab>
        <Tab value="hypos">Hypos</Tab>
        <Tab value="detailedCgm">Detailed CGM</Tab>
        <Tab value="detailedInsulin">Detailed Insulin</Tab>
        <Tab value="unifiedView">Unified View</Tab>
        <Tab value="iob">IOB</Tab>
        <Tab value="roc">RoC</Tab>
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
          <Tab value="fileInfo">File Info</Tab>
          <Tab value="bgOverview">BG Overview</Tab>
          <Tab value="dailyBG">Daily BG</Tab>
          <Tab value="hypos">Hypos</Tab>
          <Tab value="detailedCgm">Detailed CGM</Tab>
          <Tab value="detailedInsulin">Detailed Insulin</Tab>
          <Tab value="unifiedView">Unified View</Tab>
          <Tab value="iob">IOB</Tab>
          <Tab value="roc">RoC</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
