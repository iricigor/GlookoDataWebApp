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
} from '@fluentui/react-components';
import type { ThemeMode } from '../../hooks/useTheme';
import type { ExportFormat } from '../../hooks/useExportFormat';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { GeneralSettingsTabProps } from './types';

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
        <RadioGroup
          value={responseLanguage}
          onChange={(_, data) => onResponseLanguageChange(data.value as ResponseLanguage)}
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
