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
import { BGValuesReport } from '../components/BGValuesReport';
import { InsulinDailyReport } from '../components/InsulinDailyReport';
import { UnifiedDailyReport } from '../components/UnifiedDailyReport';
import { IOBReport } from '../components/IOBReport';
import { BGOverviewReport } from '../components/BGOverviewReport';
import type { UploadedFile, GlucoseUnit } from '../types';
import type { ExportFormat } from '../hooks/useExportFormat';

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
}

export function Reports({ selectedFile, exportFormat, glucoseUnit, insulinDuration }: ReportsProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    // Check URL hash for deep linking first (e.g., #reports/bgOverview)
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    if (parts.length > 1 && parts[0] === 'reports') {
      return parts[1];
    }
    // Otherwise, load the last selected tab from localStorage
    const savedTab = localStorage.getItem('reports-selected-tab');
    return savedTab || 'bgOverview';
  });

  // Save the selected tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('reports-selected-tab', selectedTab);
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
      case 'detailedCgm':
        return <BGValuesReport selectedFile={selectedFile} exportFormat={exportFormat} glucoseUnit={glucoseUnit} />;
      case 'detailedInsulin':
        return <InsulinDailyReport selectedFile={selectedFile} />;
      case 'unifiedView':
        return <UnifiedDailyReport selectedFile={selectedFile} glucoseUnit={glucoseUnit} />;
      case 'iob':
        return <IOBReport selectedFile={selectedFile} insulinDuration={insulinDuration} />;
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
        <Tab value="detailedCgm">Detailed CGM</Tab>
        <Tab value="detailedInsulin">Detailed Insulin</Tab>
        <Tab value="unifiedView">Unified View</Tab>
        <Tab value="iob">IOB</Tab>
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
          <Tab value="detailedCgm">Detailed CGM</Tab>
          <Tab value="detailedInsulin">Detailed Insulin</Tab>
          <Tab value="unifiedView">Unified View</Tab>
          <Tab value="iob">IOB</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
