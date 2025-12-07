import { useRef, useState } from 'react';
import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { CloudArrowUpRegular, DocumentRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px', '24px'),
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'all',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  dropzoneActive: {
    backgroundColor: tokens.colorNeutralBackground1Pressed,
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    ...shorthands.borderWidth('2px'),
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
    marginBottom: '16px',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
  },
  hiddenInput: {
    display: 'none',
  },
});

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const styles = useStyles();
  const { t } = useTranslation('dataUpload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.name.endsWith('.zip')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        multiple
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
      <div className={styles.icon}>
        {isDragging ? <DocumentRegular /> : <CloudArrowUpRegular />}
      </div>
      <Text className={styles.title}>
        {t('dataUpload.uploadZone.dropFilesPrompt')}
      </Text>
      <Text className={styles.description}>
        {t('dataUpload.uploadZone.uploadDescription')}
      </Text>
      <Button appearance="primary">{t('dataUpload.uploadZone.selectFilesButton')}</Button>
    </div>
  );
}
