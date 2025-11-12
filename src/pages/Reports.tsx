import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useState } from 'react';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { InRangeReport } from '../components/InRangeReport';
import { AGPReport } from '../components/AGPReport';
import { BGValuesReport } from '../components/BGValuesReport';
import type { UploadedFile } from '../types';
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
  },
});

interface ReportsProps {
  selectedFile?: UploadedFile;
  exportFormat: ExportFormat;
}

export function Reports({ selectedFile, exportFormat }: ReportsProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('inRange');

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'fileInfo':
        return (
          <div>
            <SelectedFileMetadata selectedFile={selectedFile} />
          </div>
        );
      case 'inRange':
        return <InRangeReport selectedFile={selectedFile} exportFormat={exportFormat} />;
      case 'agp':
        return <AGPReport selectedFile={selectedFile} exportFormat={exportFormat} />;
      case 'bgValues':
        return <BGValuesReport selectedFile={selectedFile} exportFormat={exportFormat} />;
      case 'detailedCgm':
        return (
          <div style={{ padding: '24px' }}>
            <Text style={{ fontSize: tokens.fontSizeBase400, color: tokens.colorNeutralForeground2 }}>
              Detailed CGM analysis - To be implemented
            </Text>
          </div>
        );
      case 'detailedInsulin':
        return (
          <div style={{ padding: '24px' }}>
            <Text style={{ fontSize: tokens.fontSizeBase400, color: tokens.colorNeutralForeground2 }}>
              Detailed Insulin analysis - To be implemented
            </Text>
          </div>
        );
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

      <div className={styles.contentWrapper}>
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          className={styles.tabList}
          appearance="subtle"
        >
          <Tab value="fileInfo">File Info</Tab>
          <Tab value="inRange">Time in Range</Tab>
          <Tab value="agp">AGP Data</Tab>
          <Tab value="bgValues">BG Values</Tab>
          <Tab value="detailedCgm">Detailed CGM</Tab>
          <Tab value="detailedInsulin">Detailed Insulin</Tab>
        </TabList>

        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
