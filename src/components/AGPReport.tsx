/**
 * AGP (Ambulatory Glucose Profile) Report component
 * Placeholder for future AGP data visualization
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

const useStyles = makeStyles({
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  placeholder: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
});

export function AGPReport() {
  const styles = useStyles();

  return (
    <div className={styles.reportContainer}>
      <Accordion collapsible>
        <AccordionItem value="agp">
          <AccordionHeader>
            <Text className={styles.reportTitle}>AGP Data</Text>
          </AccordionHeader>
          <AccordionPanel>
            <Text className={styles.placeholder}>
              Coming soon
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
