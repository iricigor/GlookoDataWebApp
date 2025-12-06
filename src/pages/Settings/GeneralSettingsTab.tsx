/**
 * General Settings Tab
 * Contains theme, day/night shading, export format, UI language, and response language settings
 */

import {
  Text,
  Radio,
  RadioGroup,
  Divider,
  Title3,
  Switch,
} from '@fluentui/react-components';
import type { ThemeMode } from '../../hooks/useTheme';
import type { ExportFormat } from '../../hooks/useExportFormat';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { UILanguage } from '../../hooks/useUILanguage';
import type { GeneralSettingsTabProps } from './types';

/**
 * Renders the General settings tab with controls for theme, day/night shading, export format, UI language, and AI response language.
 *
 * @param styles - CSS module classes used to style each settings section and controls.
 * @param themeMode - Currently selected theme mode (`"light" | "dark" | "system"`).
 * @param onThemeChange - Callback invoked with the new `ThemeMode` when the theme selection changes.
 * @param showDayNightShading - Whether day/night background shading is enabled on 24-hour graphs.
 * @param onShowDayNightShadingChange - Callback invoked with the new checked state when the shading switch changes.
 * @param exportFormat - Currently selected export format (`"csv" | "tsv"`).
 * @param onExportFormatChange - Callback invoked with the new `ExportFormat` when the export format selection changes.
 * @param uiLanguage - Currently selected UI language (`"en" | "de"`).
 * @param onUILanguageChange - Callback invoked with the new `UILanguage` when the UI language selection changes.
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
  uiLanguage,
  onUILanguageChange,
  responseLanguage,
  onResponseLanguageChange,
  syncWithUILanguage,
  onSyncWithUILanguageChange,
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
        <Title3 className={styles.sectionTitle}>UI Language</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Choose the language for the application interface. This affects all menus, labels, and button text throughout the application.
        </Text>
        <RadioGroup
          value={uiLanguage}
          onChange={(_, data) => onUILanguageChange(data.value as UILanguage)}
        >
          <Radio value="en" label="English" />
          <Radio value="de" label="Deutsch (German)" />
        </RadioGroup>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>AI Response Language</Title3>
        <Divider className={styles.divider} />
        
        {/* Sync toggle */}
        <div className={styles.settingControl} style={{ marginBottom: '16px' }}>
          <Switch
            checked={syncWithUILanguage}
            onChange={(_, data) => onSyncWithUILanguageChange(data.checked)}
            label="Automatically sync with UI language"
          />
          <Text className={styles.settingDescription} style={{ marginTop: '8px' }}>
            When enabled, the AI response language will automatically match your UI language. When disabled, you can select a specific language below.
          </Text>
        </div>

        {/* Language selector - disabled when sync is enabled */}
        <Text className={styles.settingDescription} style={{ marginTop: '16px' }}>
          Choose the language for AI analysis responses. This affects all AI-generated insights and recommendations.
        </Text>
        <RadioGroup
          value={responseLanguage}
          onChange={(_, data) => onResponseLanguageChange(data.value as ResponseLanguage)}
          disabled={syncWithUILanguage}
        >
          <Radio value="english" label="English" />
          <Radio value="czech" label="Czech (Čeština)" />
          <Radio value="german" label="German (Deutsch)" />
          <Radio value="serbian" label="Serbian (Srpski - latinica)" />
        </RadioGroup>
      </div>
    </>
  );
}