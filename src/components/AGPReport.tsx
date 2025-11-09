/**
 * AGP (Ambulatory Glucose Profile) Report component
 * Placeholder for future AGP visualization
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import type { UploadedFile } from '../types';

const useStyles = makeStyles({
  accordion: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    width: '100%',
  },
  reportTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryLine: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  comingSoon: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
});

interface AGPReportProps {
  selectedFile?: UploadedFile;
}

export function AGPReport({ selectedFile }: AGPReportProps) {
  const styles = useStyles();

  const getSummaryLine = (): string => {
    if (!selectedFile) return 'No data package selected';
    return 'AGP visualization';
  };

  return (
    <Accordion className={styles.accordion} collapsible>
      <AccordionItem value="agp">
        <AccordionHeader>
          <div className={styles.headerContent}>
            <Text className={styles.reportTitle}>AGP Data</Text>
            <Text className={styles.summaryLine}>{getSummaryLine()}</Text>
          </div>
        </AccordionHeader>
        <AccordionPanel>
          <Text className={styles.comingSoon}>Coming soon</Text>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
