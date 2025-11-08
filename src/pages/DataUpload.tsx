import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { CloudArrowUpRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('40px', '24px'),
    minHeight: 'calc(100vh - 60px)',
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    fontFamily: 'Segoe UI, sans-serif',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
    fontFamily: 'Segoe UI, sans-serif',
  },
});

export function DataUpload() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <CloudArrowUpRegular />
      </div>
      <Text className={styles.title}>Data Upload</Text>
      <Text className={styles.description}>
        Upload and manage your Glooko export files with drag-and-drop support
      </Text>
    </div>
  );
}
