import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { FileUploadZone, FileList, extractZipMetadata } from '../features/dataUpload';
import { DataUploadGuide } from '../components/DataUploadGuide';
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
    marginBottom: '32px',
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
  uploadSection: {
    marginBottom: '24px',
  },
});

interface DataUploadProps {
  uploadedFiles: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onUpdateFile: (file: UploadedFile) => void;
  selectedFileId: string | null;
  onSelectFile: (id: string | null) => void;
  exportFormat: ExportFormat;
  isLoadingDemoData?: boolean;
}

export function DataUpload({ uploadedFiles, onAddFiles, onRemoveFile, onClearAll, onUpdateFile, selectedFileId, onSelectFile, exportFormat, isLoadingDemoData }: DataUploadProps) {
  const styles = useStyles();
  const { t } = useTranslation('dataUpload');

  const handleFilesSelected = async (files: File[]) => {
    // Process files and extract ZIP metadata
    const newFilesPromises = files.map(async (file) => {
      const zipMetadata = await extractZipMetadata(file);
      
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        uploadTime: new Date(),
        file: file,
        zipMetadata,
      };
    });

    const newFiles = await Promise.all(newFilesPromises);
    onAddFiles(newFiles);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('dataUpload.title')}</Text>
        <Text className={styles.description}>
          {t('dataUpload.description')}
        </Text>
      </div>

      <div className={styles.uploadSection}>
        <FileUploadZone onFilesSelected={handleFilesSelected} />
      </div>

      <DataUploadGuide />

      <FileList
        files={uploadedFiles}
        onRemoveFile={onRemoveFile}
        onClearAll={onClearAll}
        onAddFiles={onAddFiles}
        onUpdateFile={onUpdateFile}
        selectedFileId={selectedFileId}
        onSelectFile={onSelectFile}
        exportFormat={exportFormat}
        isLoadingDemoData={isLoadingDemoData}
      />
    </div>
  );
}
