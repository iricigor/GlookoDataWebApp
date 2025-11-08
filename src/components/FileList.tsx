import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import { DeleteRegular } from '@fluentui/react-icons';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  container: {
    marginTop: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  clearButton: {
    marginLeft: 'auto',
  },
  table: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding('32px'),
    color: tokens.colorNeutralForeground2,
  },
  deleteButton: {
    minWidth: 'auto',
  },
});

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

export function FileList({ files, onRemoveFile, onClearAll }: FileListProps) {
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

  if (files.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text className={styles.title}>Uploaded Files</Text>
        </div>
        <div className={styles.emptyState}>
          <Text>No files uploaded yet. Upload ZIP files to get started.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Uploaded Files ({files.length})
        </Text>
        <Button
          appearance="secondary"
          onClick={onClearAll}
          className={styles.clearButton}
        >
          Clear All
        </Button>
      </div>
      <Table className={styles.table}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>File Name</TableHeaderCell>
            <TableHeaderCell>Upload Time</TableHeaderCell>
            <TableHeaderCell>File Size</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.name}</TableCell>
              <TableCell>{formatTime(file.uploadTime)}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                <Button
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  onClick={() => onRemoveFile(file.id)}
                  className={styles.deleteButton}
                  aria-label={`Remove ${file.name}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
