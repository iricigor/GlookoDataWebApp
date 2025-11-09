import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { FileUploadZone } from '../components/FileUploadZone';
import { FileList } from '../components/FileList';
import type { UploadedFile } from '../types';
import { extractZipMetadata } from '../utils/zipUtils';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    minHeight: 'calc(100vh - 60px)',
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
}

export function DataUpload({ uploadedFiles, onAddFiles, onRemoveFile, onClearAll }: DataUploadProps) {
  const styles = useStyles();

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
        <Text className={styles.title}>Data Upload</Text>
        <Text className={styles.description}>
          Upload and manage your Glooko export files with drag-and-drop support
        </Text>
      </div>

      <div className={styles.uploadSection}>
        <FileUploadZone onFilesSelected={handleFilesSelected} />
      </div>

      <FileList
        files={uploadedFiles}
        onRemoveFile={onRemoveFile}
        onClearAll={onClearAll}
      />
    </div>
  );
}
