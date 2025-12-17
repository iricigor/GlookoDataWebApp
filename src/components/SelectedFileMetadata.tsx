import {
  makeStyles,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  container: {
    marginBottom: '24px',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    ...shorthands.gap('8px', '16px'),
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
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
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
        <Text className={styles.noSelection}>
          No data package selected. Go to Data Upload page to select a valid ZIP file.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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

        {selectedFile.zipMetadata?.metadataLine && (
          <>
            <Text className={styles.label}>Raw Metadata:</Text>
            <Text className={styles.metadataLine}>{selectedFile.zipMetadata.metadataLine}</Text>
          </>
        )}
      </div>
    </div>
  );
}
