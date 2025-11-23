import { 
  makeStyles, 
  Button,
  Text,
  tokens,
  shorthands,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import { 
  HomeRegular,
  CloudArrowUpRegular,
  ChartMultipleRegular,
  BrainCircuitRegular,
  SettingsRegular,
  NavigationRegular,
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
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '16px'),
    },
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
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase400,
    },
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  navItems: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  hamburgerMenu: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
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
        <Text className={styles.brandText}>Glooko Insights</Text>
      </div>
      
      <div className={styles.centerSection}>
        {/* Desktop Navigation */}
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

        {/* Mobile Hamburger Menu */}
        <div className={styles.hamburgerMenu}>
          <Menu inline>
            <MenuTrigger disableButtonEnhancement>
              <Button 
                appearance="subtle" 
                icon={<NavigationRegular />}
                aria-label="Navigation menu"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {navItems.map((item) => (
                  <MenuItem
                    key={item.page}
                    icon={item.icon}
                    onClick={() => onNavigate(item.page)}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
