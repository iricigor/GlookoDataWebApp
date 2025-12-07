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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('settings');
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
        <Title3 className={styles.sectionTitle}>{t('settings.glucose.unit.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.glucose.unit.description')}
        </Text>
        <RadioGroup
          value={glucoseUnit}
          onChange={(_, data) => onGlucoseUnitChange(data.value as GlucoseUnit)}
        >
          <Radio value="mmol/L" label={t('settings.glucose.unit.mmol')} />
          <Radio value="mg/dL" label={t('settings.glucose.unit.mgdl')} />
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
        <Title3 className={styles.sectionTitle}>{t('settings.glucose.insulinDuration.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.glucose.insulinDuration.description')}
        </Text>
        <div className={styles.insulinDurationRow}>
          <Label htmlFor="insulin-duration-input">{t('settings.glucose.insulinDuration.label')}</Label>
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