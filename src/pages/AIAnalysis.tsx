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
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import { BrainCircuitRegular, CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { UploadedFile, AIAnalysisResult, DailyReport } from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { extractInsulinReadings, aggregateInsulinByDate } from '../utils/insulinDataUtils';
import { calculateGlucoseRangeStats, calculatePercentage, groupByDate } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { generateTimeInRangePrompt, generateGlucoseInsulinPrompt, base64Encode } from '../utils/perplexityApi';
import { callAIApi, determineActiveProvider } from '../utils/aiApi';
import { convertDailyReportsToCSV } from '../utils/csvUtils';

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
  const [combinedDataset, setCombinedDataset] = useState<DailyReport[]>([]);
  
  // Second prompt state
  const [analyzingSecondPrompt, setAnalyzingSecondPrompt] = useState(false);
  const [secondPromptResponse, setSecondPromptResponse] = useState<string | null>(null);
  const [secondPromptError, setSecondPromptError] = useState<string | null>(null);
  const [secondPromptCooldownActive, setSecondPromptCooldownActive] = useState(false);
  const [secondPromptCooldownSeconds, setSecondPromptCooldownSeconds] = useState(0);
  const [secondPromptReady, setSecondPromptReady] = useState(false);

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

  // Calculate in-range percentage and combined dataset when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setInRangePercentage(null);
      setAiResponse(null);
      setError(null);
      setReadyForNewAnalysis(false);
      setCombinedDataset([]);
      setSecondPromptResponse(null);
      setSecondPromptError(null);
      setSecondPromptReady(false);
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
      setSecondPromptResponse(null);
      setSecondPromptError(null);
      setSecondPromptReady(false);
      try {
        // Extract CGM readings (default data source)
        const readings = await extractGlucoseReadings(selectedFile, 'cgm');
        
        if (readings.length > 0) {
          // Calculate stats using 3-category mode (default)
          const stats = calculateGlucoseRangeStats(readings, thresholds, 3);
          const percentage = calculatePercentage(stats.inRange, stats.total);
          setInRangePercentage(percentage);

          // Generate combined dataset for second prompt
          const dailyGlucoseReports = groupByDate(readings, thresholds, 3);
          
          // Extract and aggregate insulin data
          try {
            const insulinReadings = await extractInsulinReadings(selectedFile);
            const insulinData = aggregateInsulinByDate(insulinReadings);
            
            // Merge insulin data with daily glucose reports
            const mergedData = dailyGlucoseReports.map(report => {
              const insulinForDate = insulinData.find(ins => ins.date === report.date);
              return {
                ...report,
                basalInsulin: insulinForDate?.basalTotal,
                bolusInsulin: insulinForDate?.bolusTotal,
                totalInsulin: insulinForDate?.totalInsulin,
              };
            });
            setCombinedDataset(mergedData);
          } catch (insulinErr) {
            // If insulin extraction fails, just use glucose reports without insulin data
            console.warn('Failed to extract insulin data:', insulinErr);
            setCombinedDataset(dailyGlucoseReports);
          }
        } else {
          setInRangePercentage(null);
          setCombinedDataset([]);
        }
      } catch (error) {
        console.error('Failed to calculate in-range percentage:', error);
        setInRangePercentage(null);
        setCombinedDataset([]);
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

  // Handle cooldown timer for second prompt
  useEffect(() => {
    if (secondPromptCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setSecondPromptCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (secondPromptCooldownActive && secondPromptCooldownSeconds === 0) {
      setSecondPromptCooldownActive(false);
      setSecondPromptReady(true);
    }
  }, [secondPromptCooldownSeconds, secondPromptCooldownActive]);

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

  const handleSecondPromptClick = async () => {
    if (!activeProvider || !hasApiKey || combinedDataset.length === 0) {
      return;
    }

    // If there's already a response, start cooldown before allowing new analysis
    if (secondPromptResponse && !secondPromptCooldownActive && !secondPromptReady) {
      setSecondPromptCooldownActive(true);
      setSecondPromptCooldownSeconds(3);
      return;
    }

    // Don't analyze if cooldown is active
    if (secondPromptCooldownActive) {
      return;
    }

    setAnalyzingSecondPrompt(true);
    setSecondPromptError(null);
    setSecondPromptReady(false); // Reset the flag when starting new analysis
    const previousResponse = secondPromptResponse; // Keep previous response in case of error

    try {
      // Convert combined dataset to CSV
      const csvData = convertDailyReportsToCSV(combinedDataset);
      
      // Base64 encode the CSV data
      const base64CsvData = base64Encode(csvData);

      // Generate the prompt with the base64 CSV data
      const prompt = generateGlucoseInsulinPrompt(base64CsvData);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : geminiApiKey;

      // Call the AI API using the selected provider
      const result = await callAIApi(activeProvider, apiKey, prompt);

      if (result.success && result.content) {
        setSecondPromptResponse(result.content);
      } else {
        // On error, keep the previous response if it exists
        setSecondPromptError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          setSecondPromptResponse(previousResponse);
        }
      }
    } catch (err) {
      // On error, keep the previous response if it exists
      setSecondPromptError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        setSecondPromptResponse(previousResponse);
      }
    } finally {
      setAnalyzingSecondPrompt(false);
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
                            Click Analyze to get AI-powered analysis
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

            {/* Second Prompt: Glucose and Insulin Analysis */}
            <AccordionItem value="glucoseInsulin">
              <AccordionHeader>Glucose and Insulin Analysis</AccordionHeader>
              <AccordionPanel>
                <div className={styles.promptContent}>
                  {loading ? (
                    <Text className={styles.helperText}>Loading data...</Text>
                  ) : combinedDataset.length > 0 ? (
                    <>
                      <Text className={styles.statementText}>
                        Dataset showing glucose ranges and insulin doses by date:
                      </Text>
                      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHeaderCell>Date</TableHeaderCell>
                              <TableHeaderCell>Day of Week</TableHeaderCell>
                              <TableHeaderCell>BG Below (%)</TableHeaderCell>
                              <TableHeaderCell>BG In Range (%)</TableHeaderCell>
                              <TableHeaderCell>BG Above (%)</TableHeaderCell>
                              <TableHeaderCell>Basal Insulin (Units)</TableHeaderCell>
                              <TableHeaderCell>Bolus Insulin (Units)</TableHeaderCell>
                              <TableHeaderCell>Total Insulin (Units)</TableHeaderCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {combinedDataset.map(report => {
                              const date = new Date(report.date);
                              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const dayOfWeek = dayNames[date.getDay()];
                              
                              return (
                                <TableRow key={report.date}>
                                  <TableCell>{report.date}</TableCell>
                                  <TableCell>{dayOfWeek}</TableCell>
                                  <TableCell>{calculatePercentage(report.stats.low, report.stats.total)}%</TableCell>
                                  <TableCell>{calculatePercentage(report.stats.inRange, report.stats.total)}%</TableCell>
                                  <TableCell>{calculatePercentage(report.stats.high, report.stats.total)}%</TableCell>
                                  <TableCell>{report.basalInsulin !== undefined ? report.basalInsulin : '-'}</TableCell>
                                  <TableCell>{report.bolusInsulin !== undefined ? report.bolusInsulin : '-'}</TableCell>
                                  <TableCell>{report.totalInsulin !== undefined ? report.totalInsulin : '-'}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className={styles.buttonContainer} style={{ marginTop: '16px' }}>
                        <Button
                          appearance="primary"
                          disabled={!hasApiKey || analyzingSecondPrompt || (secondPromptCooldownActive && secondPromptCooldownSeconds > 0)}
                          onClick={handleSecondPromptClick}
                          icon={analyzingSecondPrompt ? <Spinner size="tiny" /> : undefined}
                        >
                          {analyzingSecondPrompt
                            ? 'Analyzing...'
                            : secondPromptResponse && !secondPromptReady
                            ? 'Click to enable new analysis'
                            : 'Analyze with AI'}
                        </Button>
                        {secondPromptCooldownActive && secondPromptCooldownSeconds > 0 && (
                          <div className={styles.cooldownContainer}>
                            <Text className={styles.cooldownText}>
                              Please wait {secondPromptCooldownSeconds} second{secondPromptCooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                            </Text>
                            <ProgressBar 
                              value={(3 - secondPromptCooldownSeconds) / 3} 
                              thickness="large"
                            />
                          </div>
                        )}
                        {!analyzingSecondPrompt && !secondPromptResponse && !secondPromptError && !secondPromptCooldownActive && (
                          <Text className={styles.helperText}>
                            Click Analyze to get AI-powered correlation analysis
                          </Text>
                        )}
                        {secondPromptResponse && !secondPromptReady && !secondPromptCooldownActive && !analyzingSecondPrompt && (
                          <Text className={styles.helperText}>
                            Click the button above to request a new analysis
                          </Text>
                        )}
                      </div>

                      {analyzingSecondPrompt && (
                        <div className={styles.loadingContainer}>
                          <Spinner size="medium" />
                          <Text className={styles.helperText}>
                            Getting AI analysis... This may take a few seconds.
                          </Text>
                        </div>
                      )}

                      {secondPromptError && (
                        <div className={styles.errorContainer}>
                          <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
                            <MessageBarBody>
                              <strong>Error:</strong> {secondPromptError}
                            </MessageBarBody>
                          </MessageBar>
                        </div>
                      )}

                      {secondPromptResponse && (
                        <>
                          <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
                            <MessageBarBody>
                              AI analysis completed successfully
                            </MessageBarBody>
                          </MessageBar>
                          <div className={styles.aiResponseContainer}>
                            <MarkdownRenderer content={secondPromptResponse} />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <Text className={styles.helperText}>
                      No data available for analysis
                    </Text>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
