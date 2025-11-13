/**
 * CopyAIResponseButton component
 * A button that appears in the top-right corner and copies AI response text to clipboard
 * The button is sticky and remains visible when scrolling long content
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
import { copyToClipboard } from '../utils/csvUtils';

const useStyles = makeStyles({
  buttonContainer: {
    position: 'sticky',
    top: '8px',
    right: '8px',
    float: 'right',
    zIndex: 10,
    marginBottom: '-40px', // Negative margin to prevent affecting layout
  },
  button: {
    minWidth: 'auto',
    ...shorthands.padding('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  copiedButton: {
    minWidth: 'auto',
    ...shorthands.padding('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorPaletteGreenForeground1,
    boxShadow: tokens.shadow4,
  },
});

interface CopyAIResponseButtonProps {
  /** The markdown content to copy */
  content: string;
  /** Optional aria label for accessibility */
  ariaLabel?: string;
}

export function CopyAIResponseButton({ content, ariaLabel = 'Copy AI response' }: CopyAIResponseButtonProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(content);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={styles.buttonContainer}>
      <Tooltip
        content={copied ? 'Copied!' : 'Copy to clipboard'}
        relationship="label"
        positioning="below"
      >
        <Button
          appearance="subtle"
          icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
          onClick={handleCopy}
          className={copied ? styles.copiedButton : styles.button}
          aria-label={ariaLabel}
        />
      </Tooltip>
    </div>
  );
}
