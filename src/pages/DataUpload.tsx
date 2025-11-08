import { useState } from 'react';
import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { FileUploadZone } from '../components/FileUploadZone';
import { FileList } from '../components/FileList';
import type { UploadedFile } from '../types';

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
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
  },
  uploadSection: {
    marginBottom: '24px',
  },
});

export function DataUpload() {
  const styles = useStyles();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFilesSelected = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      uploadTime: new Date(),
      file: file,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
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
        onRemoveFile={handleRemoveFile}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
