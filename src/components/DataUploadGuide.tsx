/**
 * DataUploadGuide component
 * Provides guidelines and explanations for the Data Upload page
 * 
 * Features:
 * - Accordion-based guide items with numbered labels (1-4)
 * - Show/hide toggle with localStorage persistence
 * - Styled similarly to the DailyBG report section cards
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Button,
  Link,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import {
  ChevronDownRegular,
  ChevronUpRegular,
  DatabaseRegular,
  ShieldLockRegular,
  CloudArrowUpRegular,
  BrainCircuitRegular,
} from '@fluentui/react-icons';

const STORAGE_KEY = 'dataUpload-guide-visible';

const useStyles = makeStyles({
  container: {
    marginBottom: '24px',
  },
  sectionCard: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '@media (hover: hover)': {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadow16,
      },
    },
    '@media (max-width: 767px)': {
      ...shorthands.padding('16px'),
      ...shorthands.borderRadius('12px'),
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '0',
    marginTop: '0',
  },
  toggleButton: {
    minWidth: 'auto',
  },
  collapsedCard: {
    ...shorthands.padding('16px', '24px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '@media (hover: hover)': {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadow16,
      },
    },
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  numberBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    flexShrink: 0,
  },
  headerIcon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  headerText: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  accordionContent: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.padding('0', '0', '0', '40px'),
    '& p': {
      margin: '0 0 12px 0',
      '&:last-child': {
        marginBottom: '0',
      },
    },
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  link: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

/**
 * Renders a collapsible guide section for the Data Upload page with numbered accordion items.
 *
 * @returns The DataUploadGuide React element
 */
export function DataUploadGuide() {
  const styles = useStyles();
  const { t } = useTranslation('dataUpload');
  
  // Initialize visibility from localStorage
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Default to visible if no preference is saved
    return saved === null ? true : saved === 'true';
  });

  // Persist visibility to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isVisible));
  }, [isVisible]);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  const handleNavigateToAI = () => {
    // Navigate to Settings page AI tab using deep linking
    window.location.hash = 'settings/ai';
  };

  const handleNavigateToAbout = () => {
    // Navigate to Settings page About tab using deep linking
    window.location.hash = 'settings/about';
  };

  // Collapsed state - show only the toggle button
  if (!isVisible) {
    return (
      <div className={styles.container}>
        <div 
          className={styles.collapsedCard} 
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          aria-label={t('dataUpload.guide.showAriaLabel')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggle();
            }
          }}
        >
          <Text className={styles.sectionTitle}>📚 {t('dataUpload.guide.title')}</Text>
          <Button
            appearance="subtle"
            icon={<ChevronDownRegular />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={styles.toggleButton}
            aria-label={t('dataUpload.guide.showAriaLabel')}
          >
            {t('dataUpload.guide.show')}
          </Button>
        </div>
      </div>
    );
  }

  // Expanded state - show the full guide
  return (
    <div className={styles.container}>
      <div className={styles.sectionCard}>
        <div className={styles.headerRow}>
          <Text className={styles.sectionTitle}>📚 {t('dataUpload.guide.title')}</Text>
          <Button
            appearance="subtle"
            icon={<ChevronUpRegular />}
            onClick={handleToggle}
            className={styles.toggleButton}
            aria-label={t('dataUpload.guide.hideAriaLabel')}
          >
            {t('dataUpload.guide.hide')}
          </Button>
        </div>

        <Accordion collapsible multiple>
          {/* 1. Demo Data */}
          <AccordionItem value="demo-data">
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <span className={styles.numberBadge}>1</span>
                <DatabaseRegular className={styles.headerIcon} />
                <Text className={styles.headerText}>{t('dataUpload.guide.demoData.title')}</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>{t('dataUpload.guide.demoData.newHere')}</strong> {t('dataUpload.guide.demoData.description1')}
                </p>
                <p>
                  {t('dataUpload.guide.demoData.description2')} <strong>"{t('dataUpload.guide.demoData.loadDemoDataButton')}"</strong> {t('dataUpload.guide.demoData.description3')}
                </p>
                <p>
                  {t('dataUpload.guide.demoData.description4')}{' '}
                  <Link className={styles.link} onClick={handleNavigateToAbout} tabIndex={0}>
                    {t('dataUpload.guide.demoData.settingsAboutLink')}
                  </Link>{' '}
                  {t('dataUpload.guide.demoData.description5')}
                </p>
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 2. Privacy */}
          <AccordionItem value="privacy">
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <span className={styles.numberBadge}>2</span>
                <ShieldLockRegular className={styles.headerIcon} />
                <Text className={styles.headerText}>{t('dataUpload.guide.privacy.title')}</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>{t('dataUpload.guide.privacy.dataStaysLocal')}</strong> {t('dataUpload.guide.privacy.description1')}
                </p>
                <p>
                  {t('dataUpload.guide.privacy.description2')}
                </p>
                <p>
                  {t('dataUpload.guide.privacy.description3')}
                </p>
                <p>
                  {t('dataUpload.guide.privacy.description4')} <strong>{t('dataUpload.guide.privacy.aiAnalysisSection')}</strong> {t('dataUpload.guide.privacy.description5')}
                </p>
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 3. Upload Data */}
          <AccordionItem value="upload">
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <span className={styles.numberBadge}>3</span>
                <CloudArrowUpRegular className={styles.headerIcon} />
                <Text className={styles.headerText}>{t('dataUpload.guide.upload.title')}</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>{t('dataUpload.guide.upload.dragAndDrop')}</strong> {t('dataUpload.guide.upload.description1')}
                </p>
                <p>
                  {t('dataUpload.guide.upload.description2')} <strong>{t('dataUpload.guide.upload.comprehensiveReports')}</strong> {t('dataUpload.guide.upload.description3')}
                </p>
                <p>
                  {t('dataUpload.guide.upload.description4')}
                </p>
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 4. AI Analysis */}
          <AccordionItem value="ai-analysis">
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <span className={styles.numberBadge}>4</span>
                <BrainCircuitRegular className={styles.headerIcon} />
                <Text className={styles.headerText}>{t('dataUpload.guide.aiAnalysis.title')}</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>{t('dataUpload.guide.aiAnalysis.important')}</strong> {t('dataUpload.guide.aiAnalysis.description1')}
                </p>
                <p>
                  {t('dataUpload.guide.aiAnalysis.description2')} <strong>{t('dataUpload.guide.aiAnalysis.withoutPII')}</strong> {t('dataUpload.guide.aiAnalysis.description3')}
                </p>
                <p>
                  {t('dataUpload.guide.aiAnalysis.description4')}{' '}
                  <Link className={styles.link} onClick={handleNavigateToAI} tabIndex={0}>
                    {t('dataUpload.guide.aiAnalysis.settingsAILink')}
                  </Link>{' '}
                  {t('dataUpload.guide.aiAnalysis.description5')}
                </p>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
