/**
 * Glucose Settings Tab
 * Contains glucose unit, thresholds, and insulin duration settings
 */

import {
  Text,
  Radio,
  RadioGroup,
  Divider,
  Title3,
  Input,
  Label,
} from '@fluentui/react-components';
import type { GlucoseUnit, GlucoseThresholds } from '../../types';
import { validateGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { GlucoseThresholdsSection } from '../../components/GlucoseThresholdsSection';
import type { GlucoseSettingsTabProps } from './types';

export function GlucoseSettingsTab({
  styles,
  glucoseUnit,
  onGlucoseUnitChange,
  glucoseThresholds,
  onGlucoseThresholdsChange,
  insulinDuration,
  onInsulinDurationChange,
}: GlucoseSettingsTabProps) {
  const validationError = validateGlucoseThresholds(glucoseThresholds);
  const isValid = validationError === null;

  // Helper function to update a single threshold
  const updateThreshold = (key: keyof GlucoseThresholds, value: number) => {
    const newThresholds = { ...glucoseThresholds, [key]: value };
    onGlucoseThresholdsChange(newThresholds);
  };

  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Glucose Unit</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Choose your preferred unit for displaying blood glucose values. This setting affects all glucose readings, charts, and thresholds throughout the app.
        </Text>
        <RadioGroup
          value={glucoseUnit}
          onChange={(_, data) => onGlucoseUnitChange(data.value as GlucoseUnit)}
        >
          <Radio value="mmol/L" label="mmol/L (millimoles per liter)" />
          <Radio value="mg/dL" label="mg/dL (milligrams per deciliter)" />
        </RadioGroup>
      </div>

      <GlucoseThresholdsSection
        thresholds={glucoseThresholds}
        onUpdateThreshold={updateThreshold}
        isValid={isValid}
        validationError={validationError}
        glucoseUnit={glucoseUnit}
      />

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Insulin Duration</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Set the duration of insulin action in hours for IOB (Insulin On Board) calculations. This affects how long insulin is considered active in your system. Typical values range from 3 to 6 hours.
        </Text>
        <Label htmlFor="insulin-duration-input">Duration (hours)</Label>
        <Input
          id="insulin-duration-input"
          type="number"
          value={insulinDuration.toString()}
          onChange={(_, data) => {
            const value = parseFloat(data.value);
            if (!isNaN(value) && value > 0) {
              onInsulinDurationChange(value);
            }
          }}
          min={1}
          max={12}
          step={0.5}
          style={{ maxWidth: '200px' }}
        />
      </div>
    </>
  );
}
