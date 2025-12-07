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
import { useTranslation } from 'react-i18next';
import type { ThemeMode } from '../../hooks/useTheme';
import type { ExportFormat } from '../../hooks/useExportFormat';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { UILanguage } from '../../hooks/useUILanguage';
import type { GeneralSettingsTabProps } from './types';

/**
 * Renders the General settings tab with controls for theme, day/night shading, geek stats, export format, UI language, and AI response language.
 *
 * @param styles - CSS module classes used to style each settings section and controls.
 * @param themeMode - Currently selected theme mode (`"light" | "dark" | "system"`).
 * @param onThemeChange - Callback invoked with the new `ThemeMode` when the theme selection changes.
 * @param showDayNightShading - Whether day/night background shading is enabled on 24-hour graphs.
 * @param onShowDayNightShadingChange - Callback invoked with the new checked state when the shading switch changes.
 * @param showGeekStats - Whether geek stats (technical details) are enabled.
 * @param onShowGeekStatsChange - Callback invoked with the new checked state when the geek stats switch changes.
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
  showGeekStats,
  onShowGeekStatsChange,
  exportFormat,
  onExportFormatChange,
  uiLanguage,
  onUILanguageChange,
  responseLanguage,
  onResponseLanguageChange,
  syncWithUILanguage,
  onSyncWithUILanguageChange,
}: GeneralSettingsTabProps) {
  const { t } = useTranslation('settings');
  
  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.theme.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.general.theme.description')}
        </Text>
        <RadioGroup
          value={themeMode}
          onChange={(_, data) => onThemeChange(data.value as ThemeMode)}
        >
          <Radio value="light" label={t('settings.general.theme.light')} />
          <Radio value="dark" label={t('settings.general.theme.dark')} />
          <Radio value="system" label={t('settings.general.theme.system')} />
        </RadioGroup>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.dayNightShading.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.general.dayNightShading.description')}
        </Text>
        <Switch
          checked={showDayNightShading}
          onChange={(_, data) => onShowDayNightShadingChange(data.checked)}
          label={showDayNightShading ? t('settings.general.dayNightShading.enabled') : t('settings.general.dayNightShading.disabled')}
        />
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.geekStats.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.general.geekStats.description')}
        </Text>
        <Switch
          checked={showGeekStats}
          onChange={(_, data) => onShowGeekStatsChange(data.checked)}
          label={showGeekStats ? t('settings.general.geekStats.enabled') : t('settings.general.geekStats.disabled')}
        />
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.exportFormat.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.general.exportFormat.description')}
        </Text>
        <RadioGroup
          value={exportFormat}
          onChange={(_, data) => onExportFormatChange(data.value as ExportFormat)}
        >
          <Radio value="csv" label={t('settings.general.exportFormat.csv')} />
          <Radio value="tsv" label={t('settings.general.exportFormat.tsv')} />
        </RadioGroup>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.uiLanguage.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.general.uiLanguage.description')}
        </Text>
        <RadioGroup
          value={uiLanguage}
          onChange={(_, data) => onUILanguageChange(data.value as UILanguage)}
        >
          <Radio value="en" label={t('settings.general.uiLanguage.english')} />
          <Radio value="de" label={t('settings.general.uiLanguage.german')} />
          <Radio value="cs" label={t('settings.general.uiLanguage.czech')} />
          <Radio value="sr" label={t('settings.general.uiLanguage.serbian')} />
        </RadioGroup>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.general.responseLanguage.title')}</Title3>
        <Divider className={styles.divider} />
        
        {/* Sync toggle */}
        <div className={styles.settingControl} style={{ marginBottom: '16px' }}>
          <Switch
            checked={syncWithUILanguage}
            onChange={(_, data) => onSyncWithUILanguageChange(data.checked)}
            label={t('settings.general.responseLanguage.syncLabel')}
          />
          <Text className={styles.settingDescription} style={{ marginTop: '8px' }}>
            {t('settings.general.responseLanguage.syncDescription')}
          </Text>
        </div>

        {/* Language selector - disabled when sync is enabled */}
        <Text className={styles.settingDescription} style={{ marginTop: '16px' }}>
          {t('settings.general.responseLanguage.description')}
        </Text>
        <RadioGroup
          value={responseLanguage}
          onChange={(_, data) => onResponseLanguageChange(data.value as ResponseLanguage)}
          disabled={syncWithUILanguage}
        >
          <Radio value="english" label={t('settings.general.responseLanguage.english')} />
          <Radio value="czech" label={t('settings.general.responseLanguage.czech')} />
          <Radio value="german" label={t('settings.general.responseLanguage.german')} />
          <Radio value="serbian" label={t('settings.general.responseLanguage.serbian')} />
        </RadioGroup>
      </div>
    </>
  );
}