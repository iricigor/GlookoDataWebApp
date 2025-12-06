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
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('24px', '24px'),
    maxWidth: '100%',
    overflowX: 'hidden',
    '@media (max-width: 768px)': {
      ...shorthands.padding('16px', '16px'),
    },
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '12px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeHero700,
    },
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
    gap: '16px',
    maxWidth: '1200px',
    width: '100%',
    ...shorthands.padding('0', '24px'),
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      ...shorthands.padding('0', '16px'),
    },
  },
  navigationCard: {
    minHeight: '190px',
    cursor: 'pointer',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: 'transform, box-shadow',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.shadow16,
    },
    ':active': {
      transform: 'translateY(-2px) scale(1.02)',
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

/**
 * Renders the home page containing a header and a set of navigation cards.
 *
 * @param onNavigate - Callback invoked with the target page identifier when a navigation card is clicked.
 * @returns The rendered home page element
 */
export function Home({ onNavigate }: HomeProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const navigationItems = [
    {
      title: t('home.dataUploadTitle'),
      description: t('home.dataUploadDescription'),
      icon: <CloudArrowUpRegular />,
      page: 'upload',
    },
    {
      title: t('home.comprehensiveReportsTitle'),
      description: t('home.comprehensiveReportsDescription'),
      icon: <ChartMultipleRegular />,
      page: 'reports',
    },
    {
      title: t('home.aiAnalysisTitle'),
      description: t('home.aiAnalysisDescription'),
      icon: <BrainCircuitRegular />,
      page: 'ai',
    },
    {
      title: t('home.settingsTitle'),
      description: t('home.settingsDescription'),
      icon: <SettingsRegular />,
      page: 'settings',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>{t('home.title')}</Text>
        <Text className={styles.subtitle}>
          {t('home.subtitle')}
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