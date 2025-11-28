/**
 * File Info Tab - Displays selected file metadata
 */

import { SelectedFileMetadata } from '../../../components/SelectedFileMetadata';
import { useAIAnalysisStyles } from '../styles';
import type { UploadedFile } from '../../../types';

interface FileInfoTabProps {
  selectedFile?: UploadedFile;
}

export function FileInfoTab({ selectedFile }: FileInfoTabProps) {
  const styles = useAIAnalysisStyles();
  
  return (
    <div className={styles.promptContent}>
      <SelectedFileMetadata selectedFile={selectedFile} />
    </div>
  );
}
