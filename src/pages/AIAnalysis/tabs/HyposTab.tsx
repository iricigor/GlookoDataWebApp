/**
 * Hypos Tab - Placeholder for hypoglycemia analysis (to be implemented)
 */

import {
  Text,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { useAIAnalysisStyles } from '../styles';

export function HyposTab() {
  const styles = useAIAnalysisStyles();

  return (
    <div className={styles.promptContent}>
      {/* Header with title and subtitle */}
      <div style={{ marginBottom: '16px' }}>
        <Text className={styles.statementText} style={{ display: 'block', marginBottom: '8px' }}>
          Hypoglycemia Analysis
        </Text>
        <Text className={styles.helperText}>
          Hypoglycemia (low blood sugar) occurs when glucose levels fall below target range, 
          typically below 3.9 mmol/L (70 mg/dL). This AI analysis will help identify patterns, 
          timing, and potential causes of low glucose events.
        </Text>
      </div>

      {/* Button container */}
      <div className={styles.buttonContainer}>
        <Button
          appearance="primary"
          disabled={true}
        >
          Analyze with AI
        </Button>
        
        <Text className={styles.helperText} style={{ fontStyle: 'italic', marginTop: '8px' }}>
          To be implemented soon: AI-powered hypoglycemia pattern analysis with personalized recommendations 
          for preventing and managing low glucose episodes.
        </Text>
      </div>

      {/* Accordion for dataset - empty placeholder */}
      <Accordion collapsible style={{ marginTop: '16px' }}>
        <AccordionItem value="datasetPlaceholder">
          <AccordionHeader>Dataset (to be implemented)</AccordionHeader>
          <AccordionPanel>
            <Text className={styles.helperText}>
              Hypoglycemia event data will be displayed here once the feature is implemented.
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
