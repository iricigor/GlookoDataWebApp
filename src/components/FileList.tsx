import React, { useState } from 'react';
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
import { DeleteRegular, ChevronRightRegular, ChevronDownRegular } from '@fluentui/react-icons';
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
  expandButton: {
    minWidth: 'auto',
    marginRight: '8px',
  },
  fileNameCell: {
    display: 'flex',
    alignItems: 'center',
  },
  detailsRow: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  detailsCell: {
    ...shorthands.padding('16px', '24px'),
  },
  metadataContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  metadataHeader: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  csvFileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('4px', '8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  csvFileName: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  csvRowCount: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  validationBadge: {
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    marginLeft: '8px',
  },
  validBadge: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  invalidBadge: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  zipMetadataLine: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('8px', '12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    marginBottom: '12px',
    fontFamily: 'Consolas, Monaco, monospace',
  },
  columnNamesList: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('6px'),
    marginTop: '4px',
  },
  columnNameTag: {
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding('2px', '8px'),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
});

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

/**
 * Calculate the color for a data set name based on its row count
 * @param rowCount - Number of rows in the data set
 * @returns CSS color value
 */
function getDataSetColor(rowCount: number): string {
  if (rowCount === 0) {
    // Very pale color for empty data sets
    return tokens.colorNeutralForeground4;
  } else if (rowCount < 10) {
    // Pale color for small data sets (1-9 rows)
    return tokens.colorNeutralForeground3;
  } else {
    // Standard color for data sets with 10+ rows
    return tokens.colorNeutralForeground1;
  }
}

export function FileList({ files, onRemoveFile, onClearAll }: FileListProps) {
  const styles = useStyles();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleExpand = (fileId: string) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

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
          {files.map((file) => {
            const isExpanded = expandedFiles.has(file.id);
            const hasMetadata = file.zipMetadata && file.zipMetadata.csvFiles.length > 0;
            
            return (
              <React.Fragment key={file.id}>
                <TableRow>
                  <TableCell>
                    <div className={styles.fileNameCell}>
                      {hasMetadata && (
                        <Button
                          appearance="subtle"
                          icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                          onClick={() => toggleExpand(file.id)}
                          className={styles.expandButton}
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        />
                      )}
                      <span>{file.name}</span>
                      {file.zipMetadata && (
                        <span className={`${styles.validationBadge} ${file.zipMetadata.isValid ? styles.validBadge : styles.invalidBadge}`}>
                          {file.zipMetadata.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      )}
                    </div>
                  </TableCell>
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
                {isExpanded && file.zipMetadata && (
                  <TableRow key={`${file.id}-details`} className={styles.detailsRow}>
                    <TableCell colSpan={4} className={styles.detailsCell}>
                      <div className={styles.metadataContainer}>
                        {file.zipMetadata.isValid ? (
                          <>
                            {file.zipMetadata.metadataLine && (
                              <>
                                <Text className={styles.metadataHeader}>
                                  Metadata
                                </Text>
                                <div className={styles.zipMetadataLine}>
                                  {file.zipMetadata.metadataLine}
                                </div>
                              </>
                            )}
                            <Text className={styles.metadataHeader}>
                              Data Sets ({file.zipMetadata.csvFiles.length})
                            </Text>
                            {file.zipMetadata.csvFiles.map((csvFile) => (
                              <div key={csvFile.name} className={styles.csvFileItem}>
                                <div style={{ flex: 1 }}>
                                  <div className={styles.csvFileName} style={{ color: getDataSetColor(csvFile.rowCount) }}>
                                    {csvFile.name}
                                    {csvFile.fileCount && csvFile.fileCount > 1 && (
                                      <span style={{ 
                                        marginLeft: '8px', 
                                        fontSize: tokens.fontSizeBase200,
                                        color: tokens.colorNeutralForeground2,
                                      }}>
                                        (merged from {csvFile.fileCount} files)
                                      </span>
                                    )}
                                  </div>
                                  {csvFile.columnNames && csvFile.columnNames.length > 0 && (
                                    <div className={styles.columnNamesList}>
                                      {csvFile.columnNames.map((col, idx) => (
                                        <span key={idx} className={styles.columnNameTag}>
                                          {col}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className={styles.csvRowCount}>
                                  {csvFile.rowCount} {csvFile.rowCount === 1 ? 'row' : 'rows'}
                                </span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <Text className={styles.errorText}>
                            Error: {file.zipMetadata.error || 'Invalid ZIP file'}
                          </Text>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
