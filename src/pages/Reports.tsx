import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { InRangeReport } from '../components/InRangeReport';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    minHeight: 'calc(100vh - 60px)',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
});

interface ReportsProps {
  selectedFile?: UploadedFile;
}

export function Reports({ selectedFile }: ReportsProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Comprehensive Reports</Text>
        <Text className={styles.description}>
          View detailed analytics including time-in-range, patterns, and trends
        </Text>
      </div>

      <SelectedFileMetadata selectedFile={selectedFile} />

      <div className={styles.content}>
        <InRangeReport selectedFile={selectedFile} />
      </div>
    </div>
  );
}
