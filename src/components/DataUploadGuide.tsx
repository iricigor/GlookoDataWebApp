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
    // Navigate to Settings page - the AI Settings tab is clearly visible there
    window.location.hash = 'settings';
  };

  const handleNavigateToAbout = () => {
    // Navigate to Settings page - the About tab is clearly visible there
    window.location.hash = 'settings';
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
          aria-label="Show getting started guide"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggle();
            }
          }}
        >
          <Text className={styles.sectionTitle}>📚 Getting Started Guide</Text>
          <Button
            appearance="subtle"
            icon={<ChevronDownRegular />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={styles.toggleButton}
            aria-label="Show guide"
          >
            Show
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
          <Text className={styles.sectionTitle}>📚 Getting Started Guide</Text>
          <Button
            appearance="subtle"
            icon={<ChevronUpRegular />}
            onClick={handleToggle}
            className={styles.toggleButton}
            aria-label="Hide guide"
          >
            Hide
          </Button>
        </div>

        <Accordion collapsible multiple>
          {/* 1. Demo Data */}
          <AccordionItem value="demo-data">
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <span className={styles.numberBadge}>1</span>
                <DatabaseRegular className={styles.headerIcon} />
                <Text className={styles.headerText}>Try Demo Data</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>New here?</strong> Start by exploring the app with our demo datasets. A pre-loaded demo file is already available in the file list below.
                </p>
                <p>
                  You can also load additional demo datasets by clicking the <strong>"Load Demo Data"</strong> button in the file list header. These datasets are inspired by real-world Type 1 Diabetes data patterns.
                </p>
                <p>
                  For attribution and more information about the demo data source, visit the{' '}
                  <Link className={styles.link} onClick={handleNavigateToAbout} tabIndex={0}>
                    Settings → About
                  </Link>{' '}
                  page.
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
                <Text className={styles.headerText}>Your Privacy is Protected</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>Your data never leaves your device.</strong> All graph processing and analysis happens entirely in your browser. We do not upload your files to any server.
                </p>
                <p>
                  Files are maintained only in your browser's memory while you use the app. When you close the browser tab, your data is gone—unless you explicitly save it.
                </p>
                <p>
                  For AI-powered analysis, data handling is different. See the <strong>AI Analysis</strong> section below for details.
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
                <Text className={styles.headerText}>Upload Your Data</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>Drag and drop</strong> your Glooko export ZIP files into the upload zone above, or click to browse and select files from your computer.
                </p>
                <p>
                  Once uploaded, select a file from the list to view it in the <strong>Comprehensive Reports</strong> page—including BG Overview, Daily BG charts, and Hypoglycemia analysis.
                </p>
                <p>
                  You can also export your data to Excel format (XLSX) using the download button next to each file.
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
                <Text className={styles.headerText}>AI Analysis (Data Leaves Your Device)</Text>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <p>
                  <strong>Important:</strong> When you use AI-powered analysis features, your health data is sent to the selected AI provider (Perplexity, Grok, DeepSeek, or Google Gemini).
                </p>
                <p>
                  The data is sent <strong>without personally identifiable information</strong> (such as your name or email), but the AI provider may associate your API key with the health data you send.
                </p>
                <p>
                  For detailed information about AI data handling, security best practices, and privacy policies, visit the{' '}
                  <Link className={styles.link} onClick={handleNavigateToAI} tabIndex={0}>
                    Settings → AI Settings
                  </Link>{' '}
                  page.
                </p>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
