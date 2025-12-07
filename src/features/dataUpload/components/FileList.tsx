import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
  tokens,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Radio,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { DeleteRegular, ChevronRightRegular, ChevronDownRegular, ArrowDownloadRegular, DatabaseRegular } from '@fluentui/react-icons';
import type { UploadedFile } from '../../../types';
import type { ExportFormat } from '../../../hooks/useExportFormat';
import { convertZipToXlsx, downloadXlsx } from '../../export/utils';
import { TableContainer } from '../../../components/TableContainer';
import { DEMO_DATASETS, loadDemoDataset, getDemoDataAttribution } from '../../../utils/demoData';

const useStyles = makeStyles({
  container: {
    marginTop: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    ...shorthands.gap('12px'),
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  buttonGroup: {
    display: 'flex',
    ...shorthands.gap('8px'),
    marginLeft: 'auto',
  },
  clearButton: {
    marginLeft: '0',
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
  exportButton: {
    minWidth: 'auto',
    marginRight: '8px',
  },
  expandButton: {
    minWidth: 'auto',
    marginRight: '8px',
  },
  fileNameCell: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '@media (max-width: 768px)': {
      maxWidth: '150px',
    },
  },
  hideOnMobile: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  selectCell: {
    width: '45px',
    ...shorthands.padding('8px', '12px'),
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
  onAddFiles: (files: UploadedFile[]) => void;
  selectedFileId?: string | null;
  onSelectFile?: (id: string | null) => void;
  exportFormat: ExportFormat;
  isLoadingDemoData?: boolean;
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

export function FileList({ files, onRemoveFile, onClearAll, onAddFiles, selectedFileId, onSelectFile, exportFormat, isLoadingDemoData }: FileListProps) {
  const styles = useStyles();
  const { t } = useTranslation('dataUpload');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [exportingFiles, setExportingFiles] = useState<Set<string>>(new Set());
  const [loadingDemo, setLoadingDemo] = useState(false);

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

  const handleLoadDemoData = async (datasetId: string) => {
    const dataset = DEMO_DATASETS.find(d => d.id === datasetId);
    if (!dataset) {
      return;
    }

    setLoadingDemo(true);
    try {
      const demoFile = await loadDemoDataset(dataset);
      onAddFiles([demoFile]);
    } catch (error) {
      console.error('Failed to load demo data:', error);
      alert(`Failed to load demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleExportToXlsx = async (file: UploadedFile) => {
    if (!file.zipMetadata?.isValid) {
      return;
    }

    setExportingFiles((prev) => new Set(prev).add(file.id));

    try {
      const xlsxBlob = await convertZipToXlsx(file);
      const fileName = file.name.replace(/\.zip$/i, '');
      downloadXlsx(xlsxBlob, fileName);
    } catch (error) {
      console.error('Failed to export to XLSX:', error);
      alert(`Failed to export file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
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

  // Extract CSV data from the files list for export
  const getFilesListAsCSV = (): (string | number)[][] => {
    const headers = onSelectFile 
      ? ['Select', 'File Name', 'Upload Time', 'File Size', 'Status']
      : ['File Name', 'Upload Time', 'File Size', 'Status'];
    
    const rows = files.map(file => {
      const row = [
        file.name,
        formatTime(file.uploadTime),
        formatFileSize(file.size),
        file.zipMetadata?.isValid ? 'Valid' : 'Invalid',
      ];
      
      if (onSelectFile) {
        row.unshift(selectedFileId === file.id ? 'Selected' : '');
      }
      
      return row;
    });
    
    return [headers, ...rows];
  };

  // Show loading state while demo data is being loaded
  if (isLoadingDemoData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text className={styles.title}>{t('dataUpload.fileList.title')}</Text>
        </div>
        <div className={styles.emptyState}>
          <Text>{t('dataUpload.fileList.loadingDemoData')}</Text>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text className={styles.title}>{t('dataUpload.fileList.title')}</Text>
        </div>
        <div className={styles.emptyState}>
          <Text>{t('dataUpload.fileList.noFiles')}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          {t('dataUpload.fileList.titleWithCount', { count: files.length })}
        </Text>
        <div className={styles.buttonGroup}>
          <Tooltip 
            content={getDemoDataAttribution()}
            relationship="description"
          >
            <Menu positioning="below-end">
              <MenuTrigger disableButtonEnhancement>
                <Button
                    appearance="secondary"
                    icon={<DatabaseRegular />}
                    disabled={loadingDemo}
                  >
                    {loadingDemo ? t('dataUpload.fileList.loadingButton') : t('dataUpload.fileList.loadDemoDataButton')}
                  </Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    {DEMO_DATASETS.map((dataset) => (
                      <MenuItem
                        key={dataset.id}
                        onClick={() => handleLoadDemoData(dataset.id)}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{dataset.name}</div>
                          <div style={{ fontSize: '0.85em', color: tokens.colorNeutralForeground2 }}>
                            {dataset.description}
                          </div>
                        </div>
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuPopover>
              </Menu>
            </Tooltip>
          <Button
            appearance="secondary"
            onClick={onClearAll}
            className={styles.clearButton}
          >
            {t('dataUpload.fileList.clearAllButton')}
          </Button>
        </div>
      </div>
      <TableContainer
        data={getFilesListAsCSV()}
        exportFormat={exportFormat}
        fileName="uploaded-files"
        copyAriaLabel={t('dataUpload.fileList.export.copyAriaLabel', { format: exportFormat.toUpperCase() })}
        downloadAriaLabel={t('dataUpload.fileList.export.downloadAriaLabel', { format: exportFormat.toUpperCase() })}
      >
        <Table className={styles.table}>
        <TableHeader>
          <TableRow>
            {onSelectFile && <TableHeaderCell className={styles.selectCell}>{t('dataUpload.fileList.table.selectColumn')}</TableHeaderCell>}
            <TableHeaderCell>{t('dataUpload.fileList.table.fileNameColumn')}</TableHeaderCell>
            <TableHeaderCell className={styles.hideOnMobile}>{t('dataUpload.fileList.table.uploadTimeColumn')}</TableHeaderCell>
            <TableHeaderCell className={styles.hideOnMobile}>{t('dataUpload.fileList.table.fileSizeColumn')}</TableHeaderCell>
            <TableHeaderCell>{t('dataUpload.fileList.table.actionsColumn')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const isExpanded = expandedFiles.has(file.id);
            const hasMetadata = file.zipMetadata && file.zipMetadata.csvFiles.length > 0;
            const isValidFile = file.zipMetadata?.isValid ?? false;
            
            return (
              <React.Fragment key={file.id}>
                <TableRow>
                  {onSelectFile && (
                    <TableCell className={styles.selectCell}>
                      <Radio 
                        value={file.id}
                        checked={selectedFileId === file.id}
                        onChange={() => onSelectFile(file.id)}
                        disabled={!isValidFile}
                        aria-label={t('dataUpload.fileList.table.selectFileAriaLabel', { fileName: file.name })}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className={styles.fileNameCell}>
                      {hasMetadata && (
                        <Button
                          appearance="subtle"
                          icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                          onClick={() => toggleExpand(file.id)}
                          className={styles.expandButton}
                          aria-label={isExpanded ? t('dataUpload.fileList.table.collapseDetailsAriaLabel') : t('dataUpload.fileList.table.expandDetailsAriaLabel')}
                        />
                      )}
                      <span className={styles.fileName} title={file.name}>{file.name}</span>
                      {file.zipMetadata && (
                        <span className={`${styles.validationBadge} ${file.zipMetadata.isValid ? styles.validBadge : styles.invalidBadge}`}>
                          {file.zipMetadata.isValid ? t('dataUpload.fileList.table.validBadge') : t('dataUpload.fileList.table.invalidBadge')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={styles.hideOnMobile}>{formatTime(file.uploadTime)}</TableCell>
                  <TableCell className={styles.hideOnMobile}>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    {file.zipMetadata?.isValid && (
                      <Button
                        appearance="subtle"
                        icon={<ArrowDownloadRegular />}
                        onClick={() => handleExportToXlsx(file)}
                        className={styles.exportButton}
                        disabled={exportingFiles.has(file.id)}
                        aria-label={t('dataUpload.fileList.table.exportToXlsxAriaLabel', { fileName: file.name })}
                        title={t('dataUpload.fileList.table.exportToXlsxTitle')}
                      />
                    )}
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      onClick={() => onRemoveFile(file.id)}
                      className={styles.deleteButton}
                      aria-label={t('dataUpload.fileList.table.removeFileAriaLabel', { fileName: file.name })}
                    />
                  </TableCell>
                </TableRow>
                {isExpanded && file.zipMetadata && (
                  <TableRow key={`${file.id}-details`} className={styles.detailsRow}>
                    <TableCell colSpan={onSelectFile ? 5 : 4} className={styles.detailsCell}>
                      <div className={styles.metadataContainer}>
                        {file.zipMetadata.isValid ? (
                          <>
                            {file.zipMetadata.metadataLine && (
                              <>
                                <Text className={styles.metadataHeader}>
                                  {t('dataUpload.fileList.details.metadataHeader')}
                                </Text>
                                <div className={styles.zipMetadataLine}>
                                  {file.zipMetadata.metadataLine}
                                </div>
                              </>
                            )}
                            <Text className={styles.metadataHeader}>
                              {t('dataUpload.fileList.details.dataSetsHeader', { count: file.zipMetadata.csvFiles.length })}
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
                                        ({t('dataUpload.fileList.details.mergedFromFiles', { count: csvFile.fileCount })})
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
                                  {csvFile.rowCount} {csvFile.rowCount === 1 ? t('dataUpload.fileList.details.row') : t('dataUpload.fileList.details.rows')}
                                </span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <Text className={styles.errorText}>
                            {t('dataUpload.fileList.details.errorPrefix', { error: file.zipMetadata.error || t('dataUpload.fileList.details.invalidZipFile') })}
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
      </TableContainer>
    </div>
  );
}
