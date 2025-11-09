import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Card,
  Radio,
  RadioGroup,
  Divider,
  Title3,
} from '@fluentui/react-components';
import { SettingsRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';
import { getVersionInfo, formatBuildDate } from '../utils/version';

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
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  settingsCard: {
    width: '100%',
    maxWidth: '600px',
    ...shorthands.padding('24px'),
  },
  settingSection: {
    marginBottom: '24px',
    '&:last-child': {
      marginBottom: '0',
    },
  },
  sectionTitle: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero700,
    marginBottom: '8px',
  },
  divider: {
    marginTop: '8px',
    marginBottom: '16px',
  },
  settingLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
    display: 'block',
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '12px',
  },
  versionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  versionLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  versionValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
});

interface SettingsProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function Settings({ themeMode, onThemeChange }: SettingsProps) {
  const styles = useStyles();
  const { thresholds, updateThreshold, validateThresholds, isValid } = useGlucoseThresholds();
  const validationError = validateThresholds(thresholds);
  const versionInfo = getVersionInfo();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <SettingsRegular />
        </div>
        <Text className={styles.title}>Settings</Text>
        <Text className={styles.description}>
          Configure your application preferences
        </Text>
      </div>

      <Card className={styles.settingsCard}>
        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Theme</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Choose your preferred color theme. System option follows your operating system settings.
          </Text>
          <RadioGroup
            value={themeMode}
            onChange={(_, data) => onThemeChange(data.value as ThemeMode)}
          >
            <Radio value="light" label="Light" />
            <Radio value="dark" label="Dark" />
            <Radio value="system" label="System (recommended)" />
          </RadioGroup>
        </div>

        <GlucoseThresholdsSection
          thresholds={thresholds}
          onUpdateThreshold={updateThreshold}
          isValid={isValid}
          validationError={validationError}
        />

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Data Privacy</Title3>
          <Divider className={styles.divider} />
          <Text className={styles.settingDescription}>
            Your data is stored locally with configurable persistence options. All processing happens in your browser.
          </Text>
        </div>

        <div className={styles.settingSection}>
          <Title3 className={styles.sectionTitle}>Version Information</Title3>
          <Divider className={styles.divider} />
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Version:</Text>
            <Text className={styles.versionValue}>{versionInfo.version}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Build ID:</Text>
            <Text className={styles.versionValue}>{versionInfo.buildId}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Build Date:</Text>
            <Text className={styles.versionValue}>{formatBuildDate(versionInfo.buildDate)}</Text>
          </div>
          <div className={styles.versionItem}>
            <Text className={styles.versionLabel}>Full Version:</Text>
            <Text className={styles.versionValue}>{versionInfo.fullVersion}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
