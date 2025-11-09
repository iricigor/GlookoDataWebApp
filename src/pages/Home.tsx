import { 
  makeStyles, 
  Card,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { 
  CloudArrowUpRegular,
  ChartMultipleRegular,
  BrainCircuitRegular,
  SettingsRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px', '24px'),
    minHeight: 'calc(100vh - 60px)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '16px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase400,
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    maxWidth: '1000px',
    width: '100%',
    ...shorthands.padding('0', '24px'),
  },
  navigationCard: {
    minHeight: '200px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.shadow16,
    },
  },
  cardContent: {
    ...shorthands.padding('32px', '24px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
    height: '100%',
  },
  iconContainer: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Segoe UI, sans-serif',
  },
  cardDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
    fontFamily: 'Segoe UI, sans-serif',
  },
});

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  onClick: () => void;
}

function NavigationCard({ title, description, icon, onClick }: NavigationCardProps) {
  const styles = useStyles();

  return (
    <Card className={styles.navigationCard} onClick={onClick}>
      <div className={styles.cardContent}>
        <div className={styles.iconContainer}>{icon}</div>
        <Text className={styles.cardTitle}>{title}</Text>
        <Text className={styles.cardDescription}>{description}</Text>
      </div>
    </Card>
  );
}

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const styles = useStyles();

  const navigationItems = [
    {
      title: 'Data Upload',
      description: 'Upload and manage your Glooko export files with drag-and-drop support',
      icon: <CloudArrowUpRegular />,
      page: 'upload',
    },
    {
      title: 'Comprehensive Reports',
      description: 'View detailed analytics including time-in-range, patterns, and trends',
      icon: <ChartMultipleRegular />,
      page: 'reports',
    },
    {
      title: 'AI Analysis',
      description: 'Get intelligent insights and recommendations using advanced AI algorithms',
      icon: <BrainCircuitRegular />,
      page: 'ai',
    },
    {
      title: 'Settings',
      description: 'Your data is stored locally with configurable persistence options',
      icon: <SettingsRegular />,
      page: 'settings',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Glooko Insights</Text>
        <Text className={styles.subtitle}>
          A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform
        </Text>
      </div>

      <div className={styles.cardsGrid}>
        {navigationItems.map((item) => (
          <NavigationCard
            key={item.page}
            title={item.title}
            description={item.description}
            icon={item.icon}
            onClick={() => onNavigate(item.page)}
          />
        ))}
      </div>
    </div>
  );
}
