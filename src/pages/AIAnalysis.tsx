import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Link,
} from '@fluentui/react-components';
import { BrainCircuitRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
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
  placeholderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('60px', '24px'),
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
    marginBottom: '24px',
  },
  placeholderText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
  },
  warningText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorStatusWarningForeground1,
    maxWidth: '600px',
    marginTop: '16px',
  },
});

interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
}

export function AIAnalysis({ selectedFile, perplexityApiKey }: AIAnalysisProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>AI Analysis</Text>
        <Text className={styles.description}>
          Get intelligent insights and recommendations using advanced AI algorithms
        </Text>
      </div>

      <SelectedFileMetadata selectedFile={selectedFile} />

      <div className={styles.placeholderContainer}>
        <div className={styles.icon}>
          <BrainCircuitRegular />
        </div>
        {!perplexityApiKey ? (
          <>
            <Text className={styles.placeholderText}>
              To use AI-powered analysis, you need to configure your Perplexity API key.
            </Text>
            <Text className={styles.warningText}>
              Please add your API key in the{' '}
              <Link href="#settings">Settings page</Link>.
            </Text>
          </>
        ) : (
          <Text className={styles.placeholderText}>
            AI-powered analysis and insights will be displayed here once implemented
          </Text>
        )}
      </div>
    </div>
  );
}
