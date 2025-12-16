/**
 * FileInfoButton Component
 * A shared button that displays file information in a popover
 */

import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  makeStyles,
  shorthands,
  tokens,
  Text,
} from '@fluentui/react-components';
import { ChevronDownRegular, InfoRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { SelectedFileMetadata } from './SelectedFileMetadata';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  buttonIcon: {
    marginLeft: '4px',
  },
  popoverSurface: {
    maxWidth: '500px',
    minWidth: '400px',
    ...shorthands.padding('16px'),
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'block',
  },
});

interface FileInfoButtonProps {
  selectedFile?: UploadedFile;
}

/**
 * Renders a button that opens a popover displaying file information.
 * 
 * The button shows "File Info" with a dropdown icon. When clicked, it opens
 * a popover below the button containing file metadata information.
 *
 * @param selectedFile - The uploaded file whose metadata will be displayed
 * @returns The FileInfoButton component with popover
 */
export function FileInfoButton({ selectedFile }: FileInfoButtonProps) {
  const styles = useStyles();
  const { t } = useTranslation(['common', 'reports', 'aiAnalysis']);

  return (
    <Popover positioning={{ align: 'end', position: 'below' }}>
      <PopoverTrigger disableButtonEnhancement>
        <Button 
          appearance="subtle" 
          icon={<InfoRegular />}
        >
          {t('common:common.fileInfo')}
          <ChevronDownRegular className={styles.buttonIcon} />
        </Button>
      </PopoverTrigger>
      <PopoverSurface className={styles.popoverSurface}>
        <Text className={styles.title}>{t('common:common.fileInfo')}</Text>
        <SelectedFileMetadata selectedFile={selectedFile} />
      </PopoverSurface>
    </Popover>
  );
}
