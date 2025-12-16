/**
 * FileInfoButton Component
 * A shared button that displays file information in a dialog overlay
 */

import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { ChevronDownRegular, InfoRegular } from '@fluentui/react-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectedFileMetadata } from './SelectedFileMetadata';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  buttonIcon: {
    marginLeft: '4px',
  },
  dialogSurface: {
    maxWidth: '500px',
    position: 'fixed',
    top: '80px',
    right: '24px',
  },
});

interface FileInfoButtonProps {
  selectedFile?: UploadedFile;
}

/**
 * Renders a button that opens a dialog displaying file information.
 * 
 * The button shows "File Info" with a dropdown icon. When clicked, it opens
 * a dialog overlay containing the same file metadata information that was
 * previously shown in a dedicated tab.
 *
 * @param selectedFile - The uploaded file whose metadata will be displayed
 * @returns The FileInfoButton component with dialog
 */
export function FileInfoButton({ selectedFile }: FileInfoButtonProps) {
  const styles = useStyles();
  const { t } = useTranslation(['common', 'reports', 'aiAnalysis']);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button 
          appearance="subtle" 
          icon={<InfoRegular />}
        >
          {t('common:common.fileInfo')}
          <ChevronDownRegular className={styles.buttonIcon} />
        </Button>
      </DialogTrigger>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>{t('common:common.fileInfo')}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <SelectedFileMetadata selectedFile={selectedFile} />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
