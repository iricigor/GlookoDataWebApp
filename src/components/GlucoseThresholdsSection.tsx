import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Label,
  SpinButton,
  MessageBar,
  MessageBarBody,
  Divider,
  Title3,
} from '@fluentui/react-components';
import type { GlucoseThresholds, GlucoseUnit } from '../types';
import { convertGlucoseValue, mgdlToMmol, getUnitLabel } from '../utils/data';

const useStyles = makeStyles({
  settingSection: {
    marginBottom: '24px',
    '&:last-child': {
      marginBottom: '0',
    },
  },
  sectionHeader: {
    marginBottom: '8px',
  },
  sectionTitle: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero700,
  },
  divider: {
    marginTop: '8px',
    marginBottom: '16px',
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
    fontFamily: 'Segoe UI, sans-serif',
  },
  thresholdContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  thresholdRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...shorthands.gap('4px'),
    },
  },
  thresholdLabel: {
    minWidth: '80px',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Segoe UI, sans-serif',
  },
  spinButton: {
    width: '120px',
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  rangeText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Segoe UI, sans-serif',
    marginTop: '12px',
    paddingTop: '12px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
  },
  rangeValue: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  errorMessage: {
    marginTop: '16px',
  },
});

interface GlucoseThresholdsSectionProps {
  thresholds: GlucoseThresholds;
  onUpdateThreshold: (key: keyof GlucoseThresholds, value: number) => void;
  isValid: boolean;
  validationError: string | null;
  glucoseUnit: GlucoseUnit;
}

export function GlucoseThresholdsSection({
  thresholds,
  onUpdateThreshold,
  isValid,
  validationError,
  glucoseUnit,
}: GlucoseThresholdsSectionProps) {
  const styles = useStyles();

  // Get conversion parameters based on unit
  const min = glucoseUnit === 'mg/dL' ? 1 : 0.1;
  const max = glucoseUnit === 'mg/dL' ? 540 : 30;
  const step = glucoseUnit === 'mg/dL' ? 1 : 0.1;
  const precision = glucoseUnit === 'mg/dL' ? 0 : 1;

  const handleSpinButtonChange = (key: keyof GlucoseThresholds, value: number | null | undefined) => {
    if (value !== null && value !== undefined) {
      // Convert mg/dL to mmol/L for internal storage
      const mmolValue = glucoseUnit === 'mg/dL' ? mgdlToMmol(value) : value;
      onUpdateThreshold(key, mmolValue);
    }
  };

  return (
    <div className={styles.settingSection}>
      <div className={styles.sectionHeader}>
        <Title3 className={styles.sectionTitle}>Blood Glucose Thresholds</Title3>
      </div>
      <Divider className={styles.divider} />
      
      <Text className={styles.settingDescription}>
        Configure your blood glucose threshold values in {getUnitLabel(glucoseUnit)}. Values must be in ascending order.
      </Text>

      <div className={styles.thresholdContainer}>
        <div className={styles.thresholdRow}>
          <Label className={styles.thresholdLabel}>Very High</Label>
          <SpinButton
            value={convertGlucoseValue(thresholds.veryHigh, glucoseUnit)}
            onChange={(_, data) => handleSpinButtonChange('veryHigh', data.value)}
            min={min}
            max={max}
            step={step}
            precision={precision}
            className={styles.spinButton}
            aria-label="Very high threshold"
          />
        </div>

        <div className={styles.thresholdRow}>
          <Label className={styles.thresholdLabel}>High</Label>
          <SpinButton
            value={convertGlucoseValue(thresholds.high, glucoseUnit)}
            onChange={(_, data) => handleSpinButtonChange('high', data.value)}
            min={min}
            max={max}
            step={step}
            precision={precision}
            className={styles.spinButton}
            aria-label="High threshold"
          />
        </div>

        <div className={styles.thresholdRow}>
          <Label className={styles.thresholdLabel}>Low</Label>
          <SpinButton
            value={convertGlucoseValue(thresholds.low, glucoseUnit)}
            onChange={(_, data) => handleSpinButtonChange('low', data.value)}
            min={min}
            max={max}
            step={step}
            precision={precision}
            className={styles.spinButton}
            aria-label="Low threshold"
          />
        </div>

        <div className={styles.thresholdRow}>
          <Label className={styles.thresholdLabel}>Very Low</Label>
          <SpinButton
            value={convertGlucoseValue(thresholds.veryLow, glucoseUnit)}
            onChange={(_, data) => handleSpinButtonChange('veryLow', data.value)}
            min={min}
            max={max}
            step={step}
            precision={precision}
            className={styles.spinButton}
            aria-label="Very low threshold"
          />
        </div>

        {isValid && (
          <Text className={styles.rangeText}>
            In Range: <span className={styles.rangeValue}>
              {convertGlucoseValue(thresholds.low, glucoseUnit).toFixed(precision)}-{convertGlucoseValue(thresholds.high, glucoseUnit).toFixed(precision)} {getUnitLabel(glucoseUnit)}
            </span>
          </Text>
        )}
      </div>

      {!isValid && validationError && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{validationError}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
