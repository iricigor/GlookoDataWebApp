/**
 * CopyToCsvButton component
 * A button that appears on hover and copies table data to clipboard in CSV/TSV format
 */

import { useState } from 'react';
import {
  makeStyles,
  Button,
  Tooltip,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import { convertToDelimitedFormat, copyToClipboard } from '../utils/csvUtils';
import type { ExportFormat } from '../utils/csvUtils';

const useStyles = makeStyles({
  button: {
    minWidth: 'auto',
    ...shorthands.padding('4px'),
  },
  copiedButton: {
    minWidth: 'auto',
    ...shorthands.padding('4px'),
    color: tokens.colorPaletteGreenForeground1,
  },
});

interface CopyToCsvButtonProps {
  /** 2D array of data where first row is headers */
  data: (string | number)[][];
  /** Export format (CSV or TSV) */
  format?: ExportFormat;
  /** Optional aria label for accessibility */
  ariaLabel?: string;
}

export function CopyToCsvButton({ data, format = 'csv', ariaLabel }: CopyToCsvButtonProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);
  
  const formatLabel = format.toUpperCase();
  const defaultAriaLabel = `Copy as ${formatLabel}`;

  const handleCopy = async () => {
    try {
      const output = convertToDelimitedFormat(data, format);
      await copyToClipboard(output);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Optionally show error notification to user
    }
  };

  return (
    <Tooltip
      content={copied ? 'Copied!' : `Copy As ${formatLabel}`}
      relationship="label"
      positioning="below"
    >
      <Button
        appearance="subtle"
        icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
        onClick={handleCopy}
        className={copied ? styles.copiedButton : styles.button}
        aria-label={ariaLabel || defaultAriaLabel}
      />
    </Tooltip>
  );
}
