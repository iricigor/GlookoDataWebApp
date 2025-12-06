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

/**
 * Render the Glucose Settings tab UI for configuring glucose unit, thresholds, and insulin duration.
 *
 * @param styles - CSS module or style object applied to sections and controls
 * @param glucoseUnit - Currently selected glucose unit ("mmol/L" or "mg/dL")
 * @param onGlucoseUnitChange - Called when the user selects a different glucose unit; receives the new `GlucoseUnit`
 * @param glucoseThresholds - Current glucose threshold values
 * @param onGlucoseThresholdsChange - Called when any threshold is updated; receives the updated `GlucoseThresholds` object
 * @param insulinDuration - Current insulin duration in hours
 * @param onInsulinDurationChange - Called when a valid positive insulin duration is entered; receives the new duration (hours)
 * @returns The React element tree for the Glucose Settings tab
 */
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
        <div className={styles.insulinDurationRow}>
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
            className={styles.insulinDurationInput}
          />
        </div>
      </div>
    </>
  );
}