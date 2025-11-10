import { useState, useEffect } from 'react';
import { 
  makeStyles, 
  Text,
  Button,
  tokens,
  shorthands,
  Link,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { BrainCircuitRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import type { UploadedFile } from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { calculateGlucoseRangeStats, calculatePercentage } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    minHeight: 'calc(100vh - 60px)',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  placeholderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('60px', '24px'),
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
    marginBottom: '24px',
  },
  placeholderText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
  },
  warningText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorStatusWarningForeground1,
    maxWidth: '600px',
    marginTop: '16px',
  },
  promptContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  promptContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px'),
  },
  statementText: {
    fontSize: tokens.fontSizeBase500,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  helperText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  comingSoonText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
});

interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
}

export function AIAnalysis({ selectedFile, perplexityApiKey }: AIAnalysisProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  
  const [inRangePercentage, setInRangePercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzeClicked, setAnalyzeClicked] = useState(false);

  // Calculate in-range percentage when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setInRangePercentage(null);
      setAnalyzeClicked(false);
      return;
    }

    const calculateInRange = async () => {
      setLoading(true);
      try {
        // Extract CGM readings (default data source)
        const readings = await extractGlucoseReadings(selectedFile, 'cgm');
        
        if (readings.length > 0) {
          // Calculate stats using 3-category mode (default)
          const stats = calculateGlucoseRangeStats(readings, thresholds, 3);
          const percentage = calculatePercentage(stats.inRange, stats.total);
          setInRangePercentage(percentage);
        } else {
          setInRangePercentage(null);
        }
      } catch (error) {
        console.error('Failed to calculate in-range percentage:', error);
        setInRangePercentage(null);
      } finally {
        setLoading(false);
      }
    };

    calculateInRange();
  }, [selectedFile, thresholds]);

  const handleAnalyzeClick = () => {
    setAnalyzeClicked(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>AI Analysis</Text>
        <Text className={styles.description}>
          Get intelligent insights and recommendations using advanced AI algorithms
        </Text>
      </div>

      <SelectedFileMetadata selectedFile={selectedFile} />

      {!selectedFile ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.icon}>
            <BrainCircuitRegular />
          </div>
          <Text className={styles.placeholderText}>
            Please select a data file from the Data Upload page to begin AI analysis
          </Text>
        </div>
      ) : !perplexityApiKey ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.icon}>
            <BrainCircuitRegular />
          </div>
          <Text className={styles.placeholderText}>
            To use AI-powered analysis, you need to configure your Perplexity API key.
          </Text>
          <Text className={styles.warningText}>
            Please add your API key in the{' '}
            <Link href="#settings">Settings page</Link>.
          </Text>
        </div>
      ) : (
        <div className={styles.promptContainer}>
          <Accordion collapsible>
            {/* First Prompt: Time in Range Analysis */}
            <AccordionItem value="timeInRange">
              <AccordionHeader>Time in Range Analysis</AccordionHeader>
              <AccordionPanel>
                <div className={styles.promptContent}>
                  {loading ? (
                    <Text className={styles.helperText}>Loading glucose data...</Text>
                  ) : inRangePercentage !== null ? (
                    <>
                      <Text className={styles.statementText}>
                        Your glucose is {inRangePercentage}% of time in range.
                      </Text>
                      <div className={styles.buttonContainer}>
                        <Button
                          appearance="primary"
                          disabled={!perplexityApiKey}
                          onClick={handleAnalyzeClick}
                        >
                          Analyze with AI
                        </Button>
                        <Text className={styles.helperText}>
                          {analyzeClicked
                            ? 'AI analysis not implemented yet'
                            : 'Click Analyze to get AI Powered analysis'}
                        </Text>
                      </div>
                    </>
                  ) : (
                    <Text className={styles.helperText}>
                      No CGM data available for analysis
                    </Text>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* Second Prompt: Coming Soon */}
            <AccordionItem value="comingSoon">
              <AccordionHeader>Additional Analysis</AccordionHeader>
              <AccordionPanel>
                <div className={styles.promptContent}>
                  <Text className={styles.comingSoonText}>
                    To be added soon
                  </Text>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
