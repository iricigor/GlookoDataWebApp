import { 
  makeStyles, 
  Button,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { 
  HomeRegular,
  CloudArrowUpRegular,
  ChartMultipleRegular,
  BrainCircuitRegular,
  SettingsRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow4,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  brandText: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    fontFamily: 'Segoe UI, sans-serif',
  },
  navItems: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
});

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const styles = useStyles();

  const navItems = [
    { page: 'home', label: 'Home', icon: <HomeRegular /> },
    { page: 'upload', label: 'Data Upload', icon: <CloudArrowUpRegular /> },
    { page: 'reports', label: 'Reports', icon: <ChartMultipleRegular /> },
    { page: 'ai', label: 'AI Analysis', icon: <BrainCircuitRegular /> },
    { page: 'settings', label: 'Settings', icon: <SettingsRegular /> },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Text className={styles.brandText}>GlookoDataWebApp</Text>
      </div>
      <div className={styles.navItems}>
        {navItems.map((item) => (
          <Button
            key={item.page}
            appearance={currentPage === item.page ? 'primary' : 'subtle'}
            icon={item.icon}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </nav>
  );
}
