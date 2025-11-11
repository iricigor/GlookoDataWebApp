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
  Spinner,
  MessageBar,
  MessageBarBody,
  ProgressBar,
} from '@fluentui/react-components';
import { BrainCircuitRegular, CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { UploadedFile, AIAnalysisResult } from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { calculateGlucoseRangeStats, calculatePercentage } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { generateTimeInRangePrompt } from '../utils/perplexityApi';
import { callAIApi, determineActiveProvider, getProviderDisplayName } from '../utils/aiApi';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
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
  cooldownContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground3,
    marginTop: '8px',
  },
  cooldownText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
});

interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
  geminiApiKey: string;
  existingAnalysis?: AIAnalysisResult;
  onAnalysisComplete: (fileId: string, response: string, inRangePercentage: number) => void;
}

export function AIAnalysis({ selectedFile, perplexityApiKey, geminiApiKey, existingAnalysis, onAnalysisComplete }: AIAnalysisProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  
  const [inRangePercentage, setInRangePercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [readyForNewAnalysis, setReadyForNewAnalysis] = useState(false);

  // Determine which AI provider to use
  const activeProvider = determineActiveProvider(perplexityApiKey, geminiApiKey);
  const hasApiKey = activeProvider !== null;

  // Load existing analysis when component mounts or file changes
  useEffect(() => {
    if (existingAnalysis && selectedFile?.id === existingAnalysis.fileId) {
      setAiResponse(existingAnalysis.response);
      setInRangePercentage(existingAnalysis.inRangePercentage);
    }
  }, [existingAnalysis, selectedFile?.id]);

  // Calculate in-range percentage when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setInRangePercentage(null);
      setAiResponse(null);
      setError(null);
      setReadyForNewAnalysis(false);
      return;
    }

    // If we have existing analysis for this file, don't recalculate
    if (existingAnalysis && selectedFile.id === existingAnalysis.fileId) {
      return;
    }

    const calculateInRange = async () => {
      setLoading(true);
      setAiResponse(null);
      setError(null);
      setReadyForNewAnalysis(false);
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
  }, [selectedFile, thresholds, existingAnalysis]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownActive && cooldownSeconds === 0) {
      setCooldownActive(false);
      setReadyForNewAnalysis(true);
    }
  }, [cooldownSeconds, cooldownActive]);

  const handleAnalyzeClick = async () => {
    if (!activeProvider || !hasApiKey || inRangePercentage === null) {
      return;
    }

    // If there's already a response, start cooldown before allowing new analysis
    if (aiResponse && !cooldownActive && !readyForNewAnalysis) {
      setCooldownActive(true);
      setCooldownSeconds(3);
      return;
    }

    // Don't analyze if cooldown is active
    if (cooldownActive) {
      return;
    }

    setAnalyzing(true);
    setError(null);
    setReadyForNewAnalysis(false); // Reset the flag when starting new analysis
    const previousResponse = aiResponse; // Keep previous response in case of error

    try {
      // Generate the prompt with the TIR percentage
      const prompt = generateTimeInRangePrompt(inRangePercentage);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : geminiApiKey;

      // Call the AI API using the selected provider
      const result = await callAIApi(activeProvider, apiKey, prompt);

      if (result.success && result.content) {
        setAiResponse(result.content);
        // Save the analysis result
        if (selectedFile?.id) {
          onAnalysisComplete(selectedFile.id, result.content, inRangePercentage);
        }
      } else {
        // On error, keep the previous response if it exists
        setError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          setAiResponse(previousResponse);
        }
      }
    } catch (err) {
      // On error, keep the previous response if it exists
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        setAiResponse(previousResponse);
      }
    } finally {
      setAnalyzing(false);
    }
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
      ) : !hasApiKey ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.icon}>
            <BrainCircuitRegular />
          </div>
          <Text className={styles.placeholderText}>
            To use AI-powered analysis, you need to configure an API key (Perplexity or Google Gemini).
          </Text>
          <Text className={styles.warningText}>
            Please add your API key in the{' '}
            <Link href="#settings">Settings page</Link>.
          </Text>
        </div>
      ) : (
        <div className={styles.promptContainer}>
          <Accordion collapsible defaultOpenItems={["timeInRange"]}>
            {/* First Prompt: Time in Range Analysis */}
            <AccordionItem value="timeInRange">
              <AccordionHeader>Time in Range Analysis{activeProvider ? ` (Using ${getProviderDisplayName(activeProvider)})` : ''}</AccordionHeader>
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
                          disabled={!hasApiKey || analyzing || (cooldownActive && cooldownSeconds > 0)}
                          onClick={handleAnalyzeClick}
                          icon={analyzing ? <Spinner size="tiny" /> : undefined}
                        >
                          {analyzing 
                            ? 'Analyzing...' 
                            : aiResponse && !readyForNewAnalysis
                            ? 'Click to enable new analysis'
                            : 'Analyze with AI'}
                        </Button>
                        {cooldownActive && cooldownSeconds > 0 && (
                          <div className={styles.cooldownContainer}>
                            <Text className={styles.cooldownText}>
                              Please wait {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                            </Text>
                            <ProgressBar 
                              value={(3 - cooldownSeconds) / 3} 
                              thickness="large"
                            />
                          </div>
                        )}
                        {!analyzing && !aiResponse && !error && !cooldownActive && (
                          <Text className={styles.helperText}>
                            Click Analyze to get AI-powered analysis using {activeProvider ? getProviderDisplayName(activeProvider) : 'AI'}
                          </Text>
                        )}
                        {aiResponse && !readyForNewAnalysis && !cooldownActive && !analyzing && (
                          <Text className={styles.helperText}>
                            Click the button above to request a new analysis
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
                            <MarkdownRenderer content={aiResponse} />
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
