import { useState, useEffect, useRef } from 'react';
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
  Spinner,
  MessageBar,
  MessageBarBody,
  ProgressBar,
} from '@fluentui/react-components';
import { BrainCircuitRegular, CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import type { UploadedFile } from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { calculateGlucoseRangeStats, calculatePercentage } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { callPerplexityApi, generateTimeInRangePrompt } from '../utils/perplexityApi';

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
  aiResponseContainer: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    marginTop: '16px',
  },
  aiResponseText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('24px'),
  },
  errorContainer: {
    marginTop: '16px',
  },
  successIcon: {
    color: tokens.colorStatusSuccessForeground1,
  },
  errorIcon: {
    color: tokens.colorStatusDangerForeground1,
  },
  countdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  countdownText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
});

interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
}

// Interface for storing AI response data per file
interface FileAIResponse {
  response: string;
  timestamp: number;
}

export function AIAnalysis({ selectedFile, perplexityApiKey }: AIAnalysisProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  
  const [inRangePercentage, setInRangePercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Store AI responses per file ID to persist across navigation
  const [aiResponsesMap, setAiResponsesMap] = useState<Map<string, FileAIResponse>>(new Map());
  
  // Current file's AI response and error
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Button state management
  const [isWaitingForReanalysis, setIsWaitingForReanalysis] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const countdownIntervalRef = useRef<number | null>(null);

  // Calculate in-range percentage when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setInRangePercentage(null);
      setAiResponse(null);
      setError(null);
      return;
    }

    // Load AI response from map if it exists for this file
    const storedResponse = aiResponsesMap.get(selectedFile.id);
    if (storedResponse) {
      setAiResponse(storedResponse.response);
      setError(null);
    } else {
      setAiResponse(null);
      setError(null);
    }

    const calculateInRange = async () => {
      setLoading(true);
      // Don't clear AI response when recalculating
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
  }, [selectedFile, thresholds, aiResponsesMap]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Start countdown timer for re-analysis
  const startCountdown = () => {
    setIsWaitingForReanalysis(true);
    setCountdownSeconds(3);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Countdown finished
          if (countdownIntervalRef.current !== null) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsWaitingForReanalysis(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnalyzeClick = async () => {
    if (!perplexityApiKey || inRangePercentage === null) {
      return;
    }

    setAnalyzing(true);
    setError(null);
    // Clear current response before starting new analysis
    setAiResponse(null);
    
    // Clear stored response for this file since we're getting a new one
    if (selectedFile) {
      setAiResponsesMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(selectedFile.id);
        return newMap;
      });
    }

    try {
      // Generate the prompt with the TIR percentage
      const prompt = generateTimeInRangePrompt(inRangePercentage);

      // Call Perplexity API
      const result = await callPerplexityApi(perplexityApiKey, prompt);

      if (result.success && result.content) {
        setAiResponse(result.content);
        
        // Store the response in the map for persistence
        if (selectedFile) {
          setAiResponsesMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(selectedFile.id, {
              response: result.content!,
              timestamp: Date.now(),
            });
            return newMap;
          });
        }
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEnableReanalysisClick = () => {
    startCountdown();
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
                        {/* Show countdown if waiting for re-analysis */}
                        {isWaitingForReanalysis ? (
                          <div className={styles.countdownContainer}>
                            <Text className={styles.countdownText}>
                              New analysis will be available in {countdownSeconds} second{countdownSeconds !== 1 ? 's' : ''}...
                            </Text>
                            <ProgressBar 
                              value={(3 - countdownSeconds) / 3} 
                              max={1}
                            />
                          </div>
                        ) : aiResponse && !analyzing ? (
                          // Show "Enable new analysis" button after successful analysis
                          <Button
                            appearance="secondary"
                            disabled={!perplexityApiKey}
                            onClick={handleEnableReanalysisClick}
                          >
                            Click to enable new analysis
                          </Button>
                        ) : (
                          // Show regular analyze button
                          <Button
                            appearance="primary"
                            disabled={!perplexityApiKey || analyzing}
                            onClick={handleAnalyzeClick}
                            icon={analyzing ? <Spinner size="tiny" /> : undefined}
                          >
                            {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                          </Button>
                        )}
                        {!analyzing && !aiResponse && !error && !isWaitingForReanalysis && (
                          <Text className={styles.helperText}>
                            Click Analyze to get AI-powered analysis
                          </Text>
                        )}
                      </div>

                      {analyzing && (
                        <div className={styles.loadingContainer}>
                          <Spinner size="medium" />
                          <Text className={styles.helperText}>
                            Getting AI analysis... This may take a few seconds.
                          </Text>
                        </div>
                      )}

                      {error && (
                        <div className={styles.errorContainer}>
                          <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
                            <MessageBarBody>
                              <strong>Error:</strong> {error}
                            </MessageBarBody>
                          </MessageBar>
                        </div>
                      )}

                      {aiResponse && (
                        <>
                          <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
                            <MessageBarBody>
                              AI analysis completed successfully
                            </MessageBarBody>
                          </MessageBar>
                          <div className={styles.aiResponseContainer}>
                            <Text className={styles.aiResponseText}>
                              {aiResponse}
                            </Text>
                          </div>
                        </>
                      )}
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
