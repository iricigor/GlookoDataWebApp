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
  const versionInfo = getVersionInfo();

  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Support</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Help us improve the app by reporting bugs or suggesting new features.
        </Text>
        <div className={styles.supportButtons}>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=bug_report.yml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="primary" 
              icon={<BugRegular />}
            >
              Report a Bug
            </Button>
          </Link>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=feature_request.yml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="primary" 
              icon={<LightbulbRegular />}
            >
              Request a Feature
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
              View on GitHub
            </Button>
          </Link>
          <Link 
            href="#api-docs"
          >
            <Button 
              appearance="secondary" 
              icon={<DocumentBulletListRegular />}
            >
              API Documentation
            </Button>
          </Link>
        </div>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>Version Information</Title3>
        <Divider className={styles.divider} />
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>Version:</Text>
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
          <Text className={styles.versionLabel}>Build ID:</Text>
          <Text className={styles.versionValue}>{versionInfo.buildId}</Text>
        </div>
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>Build Date:</Text>
          <Text className={styles.versionValue}>{formatBuildDate(versionInfo.buildDate)}</Text>
        </div>
        <div className={styles.versionItem}>
          <Text className={styles.versionLabel}>Full Version:</Text>
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
        <Title3 className={styles.sectionTitle}>Demo Data Attribution</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          The demo datasets included in this application are inspired by real-world Type 1 Diabetes data patterns 
          from the <strong>AZT1D dataset</strong> (Khamesian et al., 2025), which is available under the Creative 
          Commons Attribution 4.0 (CC BY 4.0) license.
        </Text>
        <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
          <strong>Citation:</strong> Khamesian, S., Arefeen, A., Thompson, B. M., Grando, M. A., & Ghasemzadeh, H. (2025). 
          AZT1D: A Real-World Dataset for Type 1 Diabetes. arXiv:2506.14789. DOI:{' '}
          <Link 
            href="https://doi.org/10.17632/gk9m674wcx.1"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.17632/gk9m674wcx.1
          </Link>
        </Text>
        <Text className={styles.settingDescription} style={{ marginTop: '12px' }}>
          For more information about the original dataset, visit:{' '}
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