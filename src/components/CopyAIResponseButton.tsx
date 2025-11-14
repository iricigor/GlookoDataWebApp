/**
 * CopyAIResponseButton component
 * A button that appears in the top-right corner and copies AI response text to clipboard
 * The button is sticky and remains visible when scrolling long content
 */

import { useState } from 'react';
import {
  makeStyles,
  Button,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import { copyToClipboard } from '../utils/data';

const useStyles = makeStyles({
  buttonContainer: {
    // Sticky positioning keeps the button visible in the top-right corner during scroll
    position: 'sticky',
    top: '8px',
    right: '8px',
    zIndex: 10,
    // Removed float and negative margin for more robust layout
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
      <Button
        appearance="subtle"
        icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
        onClick={handleCopy}
        className={copied ? styles.copiedButton : styles.button}
        aria-label={copied ? 'Copied!' : ariaLabel}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      />
    </div>
  );
}
