/**
 * CopyToCsvButton component
 * A button that appears on hover and copies table data to clipboard in CSV format
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
import { convertToCSV, copyToClipboard } from '../utils/csvUtils';

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
  /** Optional aria label for accessibility */
  ariaLabel?: string;
}

export function CopyToCsvButton({ data, ariaLabel = 'Copy as CSV' }: CopyToCsvButtonProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const csv = convertToCSV(data);
      await copyToClipboard(csv);
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
      content={copied ? 'Copied!' : 'Copy As CSV'}
      relationship="label"
    >
      <Button
        appearance="subtle"
        icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
        onClick={handleCopy}
        className={copied ? styles.copiedButton : styles.button}
        aria-label={ariaLabel}
      />
    </Tooltip>
  );
}
