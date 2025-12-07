/**
 * About Tab
 * Contains support links, version information, and demo data attribution
 */

import {
  Text,
  Divider,
  Title3,
  Link,
  Button,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { BugRegular, LightbulbRegular, CodeRegular, DocumentBulletListRegular } from '@fluentui/react-icons';
import { getVersionInfo, formatBuildDate } from '../../utils/version';
import type { SettingsTabProps } from './types';

/**
 * Render the About tab UI that provides support links, version details, and demo data attribution.
 *
 * Renders action buttons for reporting bugs, requesting features, viewing the repository, and opening API docs; displays version, build ID, build date, and full version (the version and full version link to the release URL when available); and shows citation and links for the demo dataset.
 *
 * @param styles - Styles applied to sections and elements of the About tab
 * @returns The About tab React element
 */
export function AboutTab({ styles }: SettingsTabProps) {
  const { t } = useTranslation('settings');
  const versionInfo = getVersionInfo();

  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.about.support.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.about.support.description')}
        </Text>
        <div className={styles.supportButtons}>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=bug_report.yml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="secondary" 
              icon={<BugRegular />}
            >
              {t('settings.about.support.reportBug')}
            </Button>
          </Link>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=feature_request.yml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="secondary" 
              icon={<LightbulbRegular />}
            >
              {t('settings.about.support.requestFeature')}
            </Button>
          </Link>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="secondary" 
              icon={<CodeRegular />}
            >
              {t('settings.about.support.viewGitHub')}
            </Button>
          </Link>
          <Link 
            href="#api-docs"
          >
            <Button 
              appearance="secondary" 
              icon={<DocumentBulletListRegular />}
            >
              {t('settings.about.support.apiDocs')}
            </Button>
          </Link>
        </div>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.about.version.title')}</Title3>
        <Divider className={styles.divider} />
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>{t('settings.about.version.version')}</Text>
          {versionInfo.releaseUrl ? (
            <Link 
              href={versionInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.versionLink}
            >
              {versionInfo.version}
            </Link>
          ) : (
            <Text className={styles.versionValue}>{versionInfo.version}</Text>
          )}
        </div>
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>{t('settings.about.version.buildId')}</Text>
          <Text className={styles.versionValue}>{versionInfo.buildId}</Text>
        </div>
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>{t('settings.about.version.buildDate')}</Text>
          <Text className={styles.versionValue}>{formatBuildDate(versionInfo.buildDate)}</Text>
        </div>
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>{t('settings.about.version.fullVersion')}</Text>
          {versionInfo.releaseUrl ? (
            <Link 
              href={versionInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.versionLink}
            >
              {versionInfo.fullVersion}
            </Link>
          ) : (
            <Text className={styles.versionValue}>{versionInfo.fullVersion}</Text>
          )}
        </div>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.about.demoData.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.about.demoData.description')} <strong>{t('settings.about.demoData.dataset')}</strong> {t('settings.about.demoData.authors')}
        </Text>
        <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
          <strong>{t('settings.about.demoData.citation')}</strong> {t('settings.about.demoData.citationText')}{' '}
          <Link 
            href="https://doi.org/10.17632/gk9m674wcx.1"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.17632/gk9m674wcx.1
          </Link>
        </Text>
        <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
          {t('settings.about.demoData.moreInfo')}{' '}
          <Link 
            href="https://arxiv.org/abs/2506.14789"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://arxiv.org/abs/2506.14789
          </Link>
        </Text>
      </div>
    </>
  );
}