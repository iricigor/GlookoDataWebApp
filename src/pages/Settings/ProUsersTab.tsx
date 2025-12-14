/**
 * Pro Users Tab
 * Displays information about Pro Users features and provides a way for users to express interest
 */

import {
  Text,
  Divider,
  Title3,
  Link,
  Button,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { PersonStarRegular } from '@fluentui/react-icons';
import type { ProUsersTabProps } from './types';

/**
 * Render the Pro Users settings tab displaying information about Pro features, benefits, badge details, and a button to express interest.
 *
 * @param styles - CSS class names used to style the sections and elements of the tab
 * @returns The React element for the Pro Users settings tab
 */
export function ProUsersTab({ styles }: ProUsersTabProps) {
  const { t } = useTranslation('settings');

  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.proUsers.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.proUsers.notEnabledMessage')}
        </Text>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.proUsers.benefits.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.proUsers.benefits.description')}
        </Text>
        <ul className={styles.benefitsList}>
          <li>{t('settings.proUsers.benefits.managedApiKeys')}</li>
          <li>{t('settings.proUsers.benefits.noSetupRequired')}</li>
          <li>{t('settings.proUsers.benefits.costEffective')}</li>
          <li>{t('settings.proUsers.benefits.reliableAccess')}</li>
          <li>{t('settings.proUsers.benefits.quickSettings')}</li>
        </ul>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.proUsers.badge.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.proUsers.badge.description')}
        </Text>
      </div>

      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>{t('settings.proUsers.expressInterest.title')}</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          {t('settings.proUsers.expressInterest.description')}
        </Text>
        <div className={styles.expressInterestButton}>
          <Link 
            href="https://github.com/iricigor/GlookoDataWebApp/issues/new?template=pro_user_interest.yml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              appearance="primary" 
              icon={<PersonStarRegular />}
            >
              {t('settings.proUsers.expressInterest.button')}
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}