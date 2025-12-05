/**
 * General Settings Tab
 * Contains theme, day/night shading, export format, and response language settings
 */

import {
  Text,
  Radio,
  RadioGroup,
  Divider,
  Title3,
  Switch,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import type { ThemeMode } from '../../hooks/useTheme';
import type { ExportFormat } from '../../hooks/useExportFormat';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { GeneralSettingsTabProps } from './types';

// Language options with display labels
const LANGUAGE_OPTIONS: { value: ResponseLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'czech', label: 'Czech (Čeština)' },
  { value: 'german', label: 'German (Deutsch)' },
  { value: 'serbian', label: 'Serbian (Srpski - latinica)' },
];

/**
 * Renders the General settings tab with controls for theme, day/night shading, export format, and AI response language.
 *
 * @param styles - CSS module classes used to style each settings section and controls.
 * @param themeMode - Currently selected theme mode (`"light" | "dark" | "system"`).
 * @param onThemeChange - Callback invoked with the new `ThemeMode` when the theme selection changes.
 * @param showDayNightShading - Whether day/night background shading is enabled on 24-hour graphs.
 * @param onShowDayNightShadingChange - Callback invoked with the new checked state when the shading switch changes.
 * @param exportFormat - Currently selected export format (`"csv" | "tsv"`).
 * @param onExportFormatChange - Callback invoked with the new `ExportFormat` when the export format selection changes.
 * @param responseLanguage - Currently selected AI response language (`"english" | "czech" | "german" | "serbian"`).
 * @param onResponseLanguageChange - Callback invoked with the new `ResponseLanguage` when the AI language selection changes.
 * @returns The settings tab UI as a JSX element.
 */
export function GeneralSettingsTab({
  styles,
  themeMode,
  onThemeChange,
  showDayNightShading,
  onShowDayNightShadingChange,
  exportFormat,
  onExportFormatChange,
  responseLanguage,
  onResponseLanguageChange,
}: GeneralSettingsTabProps) {
  return (
    <>
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

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Day/Night Shading</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Show day/night background shading on 24-hour glucose graphs.
        </Text>
        <Switch
          checked={showDayNightShading}
          onChange={(_, data) => onShowDayNightShadingChange(data.checked)}
          label={showDayNightShading ? 'Day/night shading enabled' : 'Day/night shading disabled'}
        />
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Export Format</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Choose the format for exporting table data to clipboard (CSV or TSV).
        </Text>
        <RadioGroup
          value={exportFormat}
          onChange={(_, data) => onExportFormatChange(data.value as ExportFormat)}
        >
          <Radio value="csv" label="CSV (Comma-Separated Values)" />
          <Radio value="tsv" label="TSV (Tab-Separated Values)" />
        </RadioGroup>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>AI Response Language</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Choose the language for AI analysis responses. This affects all AI-generated insights and recommendations. Note: This does not change the application interface, which is only available in English.
        </Text>
        <Dropdown
          placeholder="Select language"
          value={LANGUAGE_OPTIONS.find(opt => opt.value === responseLanguage)?.label || 'English'}
          selectedOptions={[responseLanguage]}
          onOptionSelect={(_, data) => onResponseLanguageChange(data.optionValue as ResponseLanguage)}
          appearance="outline"
          style={{ maxWidth: '280px' }}
        >
          {LANGUAGE_OPTIONS.map(option => (
            <Option key={option.value} value={option.value} text={option.label}>
              {option.label}
            </Option>
          ))}
        </Dropdown>
      </div>
    </>
  );
}