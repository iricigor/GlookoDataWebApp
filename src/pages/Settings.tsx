import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Card,
  Radio,
  RadioGroup,
  Label,
} from '@fluentui/react-components';
import { SettingsRegular } from '@fluentui/react-icons';
import type { ThemeMode } from '../hooks/useTheme';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../components/GlucoseThresholdsSection';

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
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
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
});

interface SettingsProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function Settings({ themeMode, onThemeChange }: SettingsProps) {
  const styles = useStyles();
  const { thresholds, updateThreshold, validateThresholds, isValid } = useGlucoseThresholds();
  const validationError = validateThresholds(thresholds);

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
          <Label className={styles.settingLabel}>Theme</Label>
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
          <Label className={styles.settingLabel}>Data Privacy</Label>
          <Text className={styles.settingDescription}>
            Your data is stored locally with configurable persistence options. All processing happens in your browser.
          </Text>
        </div>
      </Card>
    </div>
  );
}
