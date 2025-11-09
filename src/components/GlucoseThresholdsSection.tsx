import { 
  makeStyles, 
  Text,
  tokens,
  shorthands,
  Label,
  Input,
  Button,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { 
  ChevronUpRegular,
  ChevronDownRegular,
} from '@fluentui/react-icons';
import type { GlucoseThresholds } from '../types';

const useStyles = makeStyles({
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
  thresholdContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  thresholdRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  thresholdLabel: {
    width: '100px',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  thresholdInput: {
    width: '80px',
  },
  controlButton: {
    minWidth: '28px',
    width: '28px',
    height: '28px',
    ...shorthands.padding('0'),
  },
  rangeText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    marginTop: '8px',
  },
  errorMessage: {
    marginTop: '12px',
  },
});

interface GlucoseThresholdsSectionProps {
  thresholds: GlucoseThresholds;
  onUpdateThreshold: (key: keyof GlucoseThresholds, value: number) => void;
  isValid: boolean;
  validationError: string | null;
}

export function GlucoseThresholdsSection({
  thresholds,
  onUpdateThreshold,
  isValid,
  validationError,
}: GlucoseThresholdsSectionProps) {
  const styles = useStyles();

  const handleIncrement = (key: keyof GlucoseThresholds) => {
    const newValue = Math.round((thresholds[key] + 0.1) * 10) / 10;
    onUpdateThreshold(key, newValue);
  };

  const handleDecrement = (key: keyof GlucoseThresholds) => {
    const newValue = Math.round((thresholds[key] - 0.1) * 10) / 10;
    onUpdateThreshold(key, newValue);
  };

  const handleInputChange = (key: keyof GlucoseThresholds, valueStr: string) => {
    // Allow empty string for user to clear and type
    if (valueStr === '') {
      return;
    }

    // Validate format: only allow numbers with optional single decimal digit
    const regex = /^\d{0,2}\.?\d?$/;
    if (!regex.test(valueStr)) {
      return;
    }

    const value = parseFloat(valueStr);
    if (!isNaN(value)) {
      onUpdateThreshold(key, value);
    }
  };

  const formatValue = (value: number): string => {
    return value.toFixed(1);
  };

  return (
    <div className={styles.settingSection}>
      <Label className={styles.settingLabel}>Blood Glucose Thresholds</Label>
      <Text className={styles.settingDescription}>
        Configure your blood glucose threshold values in mmol/L. Values must be in ascending order.
      </Text>

      <div className={styles.thresholdContainer}>
        <div className={styles.thresholdRow}>
          <Text className={styles.thresholdLabel}>Very High:</Text>
          <div className={styles.inputWrapper}>
            <Button
              appearance="subtle"
              icon={<ChevronUpRegular />}
              className={styles.controlButton}
              onClick={() => handleIncrement('veryHigh')}
              title="Increment by 0.1"
            />
            <Input
              type="text"
              value={formatValue(thresholds.veryHigh)}
              onChange={(e) => handleInputChange('veryHigh', e.target.value)}
              className={styles.thresholdInput}
              aria-label="Very high threshold"
            />
            <Button
              appearance="subtle"
              icon={<ChevronDownRegular />}
              className={styles.controlButton}
              onClick={() => handleDecrement('veryHigh')}
              title="Decrement by 0.1"
            />
          </div>
        </div>

        <div className={styles.thresholdRow}>
          <Text className={styles.thresholdLabel}>High:</Text>
          <div className={styles.inputWrapper}>
            <Button
              appearance="subtle"
              icon={<ChevronUpRegular />}
              className={styles.controlButton}
              onClick={() => handleIncrement('high')}
              title="Increment by 0.1"
            />
            <Input
              type="text"
              value={formatValue(thresholds.high)}
              onChange={(e) => handleInputChange('high', e.target.value)}
              className={styles.thresholdInput}
              aria-label="High threshold"
            />
            <Button
              appearance="subtle"
              icon={<ChevronDownRegular />}
              className={styles.controlButton}
              onClick={() => handleDecrement('high')}
              title="Decrement by 0.1"
            />
          </div>
        </div>

        <div className={styles.thresholdRow}>
          <Text className={styles.thresholdLabel}>Low:</Text>
          <div className={styles.inputWrapper}>
            <Button
              appearance="subtle"
              icon={<ChevronUpRegular />}
              className={styles.controlButton}
              onClick={() => handleIncrement('low')}
              title="Increment by 0.1"
            />
            <Input
              type="text"
              value={formatValue(thresholds.low)}
              onChange={(e) => handleInputChange('low', e.target.value)}
              className={styles.thresholdInput}
              aria-label="Low threshold"
            />
            <Button
              appearance="subtle"
              icon={<ChevronDownRegular />}
              className={styles.controlButton}
              onClick={() => handleDecrement('low')}
              title="Decrement by 0.1"
            />
          </div>
        </div>

        <div className={styles.thresholdRow}>
          <Text className={styles.thresholdLabel}>Very Low:</Text>
          <div className={styles.inputWrapper}>
            <Button
              appearance="subtle"
              icon={<ChevronUpRegular />}
              className={styles.controlButton}
              onClick={() => handleIncrement('veryLow')}
              title="Increment by 0.1"
            />
            <Input
              type="text"
              value={formatValue(thresholds.veryLow)}
              onChange={(e) => handleInputChange('veryLow', e.target.value)}
              className={styles.thresholdInput}
              aria-label="Very low threshold"
            />
            <Button
              appearance="subtle"
              icon={<ChevronDownRegular />}
              className={styles.controlButton}
              onClick={() => handleDecrement('veryLow')}
              title="Decrement by 0.1"
            />
          </div>
        </div>
      </div>

      {isValid && (
        <Text className={styles.rangeText}>
          In Range: {formatValue(thresholds.low)}-{formatValue(thresholds.high)} mmol/L
        </Text>
      )}

      {!isValid && validationError && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{validationError}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
