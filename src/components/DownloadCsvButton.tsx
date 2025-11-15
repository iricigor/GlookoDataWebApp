/**
 * DownloadCsvButton component
 * A button that downloads table data as a CSV/TSV file
 */

import { useState } from 'react';
import {
  makeStyles,
  Button,
  Tooltip,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { ArrowDownloadRegular, CheckmarkRegular } from '@fluentui/react-icons';
import { convertToDelimitedFormat } from '../utils/data';
import type { ExportFormat } from '../utils/data';

const useStyles = makeStyles({
  button: {
    minWidth: 'auto',
    ...shorthands.padding('4px'),
  },
  downloadedButton: {
    minWidth: 'auto',
    ...shorthands.padding('4px'),
    color: tokens.colorPaletteGreenForeground1,
  },
});

interface DownloadCsvButtonProps {
  /** 2D array of data where first row is headers */
  data: (string | number)[][];
  /** Export format (CSV or TSV) */
  format?: ExportFormat;
  /** Optional file name (without extension) */
  fileName?: string;
  /** Optional aria label for accessibility */
  ariaLabel?: string;
}

export function DownloadCsvButton({ data, format = 'csv', fileName = 'export', ariaLabel }: DownloadCsvButtonProps) {
  const styles = useStyles();
  const [downloaded, setDownloaded] = useState(false);
  
  const formatLabel = format.toUpperCase();
  const defaultAriaLabel = `Download as ${formatLabel}`;

  const handleDownload = () => {
    try {
      const output = convertToDelimitedFormat(data, format);
      const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.${format}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloaded(true);
      
      // Reset downloaded state after 2 seconds
      setTimeout(() => {
        setDownloaded(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to download file:', error);
      // Optionally show error notification to user
    }
  };

  return (
    <Tooltip
      content={downloaded ? 'Downloaded!' : `Download As ${formatLabel}`}
      relationship="label"
      positioning="below"
    >
      <Button
        appearance="subtle"
        icon={downloaded ? <CheckmarkRegular /> : <ArrowDownloadRegular />}
        onClick={handleDownload}
        className={downloaded ? styles.downloadedButton : styles.button}
        aria-label={ariaLabel || defaultAriaLabel}
      />
    </Tooltip>
  );
}
