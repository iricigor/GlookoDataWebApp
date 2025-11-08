import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { BrainCircuitRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('40px', '20px'),
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
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
  },
});

export function AIAnalysis() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <BrainCircuitRegular />
      </div>
      <Text className={styles.title}>AI Analysis</Text>
      <Text className={styles.description}>
        Get intelligent insights and recommendations using advanced AI algorithms
      </Text>
    </div>
  );
}
