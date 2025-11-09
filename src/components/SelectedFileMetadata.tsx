import {
  makeStyles,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    marginBottom: '24px',
    ...shorthands.gap('8px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  icon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    ...shorthands.gap('8px', '16px'),
    marginTop: '8px',
  },
  label: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  metadataLine: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('8px', '12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontFamily: 'Consolas, Monaco, monospace',
    wordBreak: 'break-all',
  },
  noSelection: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
});

interface SelectedFileMetadataProps {
  selectedFile?: UploadedFile;
}

export function SelectedFileMetadata({ selectedFile }: SelectedFileMetadataProps) {
  const styles = useStyles();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const getTotalRows = (file: UploadedFile): number => {
    if (!file.zipMetadata?.csvFiles) return 0;
    return file.zipMetadata.csvFiles.reduce((sum, csv) => sum + csv.rowCount, 0);
  };

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <DocumentRegular />
          </div>
          <Text className={styles.title}>Selected Data Package</Text>
        </div>
        <Text className={styles.noSelection}>
          No data package selected. Go to Data Upload page to select a valid ZIP file.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <DocumentRegular />
        </div>
        <Text className={styles.title}>Selected Data Package</Text>
      </div>
      
      <div className={styles.metadataGrid}>
        <Text className={styles.label}>File Name:</Text>
        <Text className={styles.value}>{selectedFile.name}</Text>
        
        <Text className={styles.label}>File Size:</Text>
        <Text className={styles.value}>{formatFileSize(selectedFile.size)}</Text>
        
        <Text className={styles.label}>Upload Time:</Text>
        <Text className={styles.value}>{formatTime(selectedFile.uploadTime)}</Text>
        
        {selectedFile.zipMetadata?.isValid && (
          <>
            <Text className={styles.label}>Data Sets:</Text>
            <Text className={styles.value}>{selectedFile.zipMetadata.csvFiles.length}</Text>
            
            <Text className={styles.label}>Total Rows:</Text>
            <Text className={styles.value}>{getTotalRows(selectedFile).toLocaleString()}</Text>
          </>
        )}

        {selectedFile.zipMetadata?.parsedMetadata && (
          <>
            {selectedFile.zipMetadata.parsedMetadata.name && (
              <>
                <Text className={styles.label}>Patient Name:</Text>
                <Text className={styles.value}>{selectedFile.zipMetadata.parsedMetadata.name}</Text>
              </>
            )}
            
            {selectedFile.zipMetadata.parsedMetadata.dateRange && (
              <>
                <Text className={styles.label}>Date Range:</Text>
                <Text className={styles.value}>{selectedFile.zipMetadata.parsedMetadata.dateRange}</Text>
              </>
            )}
          </>
        )}
      </div>

      {selectedFile.zipMetadata?.metadataLine && (
        <div>
          <Text className={styles.label} style={{ marginBottom: '4px', display: 'block' }}>Raw Metadata:</Text>
          <div className={styles.metadataLine}>
            {selectedFile.zipMetadata.metadataLine}
          </div>
        </div>
      )}
    </div>
  );
}
