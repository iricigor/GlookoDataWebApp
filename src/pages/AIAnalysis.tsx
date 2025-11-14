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
  TabList,
  Tab,
} from '@fluentui/react-components';
import { BrainCircuitRegular, CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { SelectedFileMetadata } from '../components/SelectedFileMetadata';
import { MarkdownRenderer } from '../components/shared';
import type { UploadedFile, AIAnalysisResult, DailyReport, GlucoseReading, InsulinReading } from '../types';
import { extractGlucoseReadings } from '../utils/data';
import { extractDailyInsulinSummaries, extractInsulinReadings } from '../utils/data';
import { calculateGlucoseRangeStats, calculatePercentage, groupByDate } from '../utils/data';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { generateTimeInRangePrompt, generateGlucoseInsulinPrompt, generateMealTimingPrompt, generatePumpSettingsPrompt } from '../features/aiAnalysis/prompts';
import { base64Encode } from '../utils/formatting';
import { callAIApi, getActiveProvider, getProviderDisplayName, type AIProvider } from '../utils/api';
import { convertDailyReportsToCSV, convertGlucoseReadingsToCSV, convertBolusReadingsToCSV, convertBasalReadingsToCSV, filterGlucoseReadingsToLastDays, filterInsulinReadingsToLastDays } from '../utils/data';

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
  fileMetadata: {
    marginBottom: '24px',
  },
  contentWrapper: {
    display: 'flex',
    ...shorthands.gap('24px'),
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  tabList: {
    flexShrink: 0,
    width: '200px',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  contentArea: {
    flex: 1,
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
  scrollableTableContainer: {
    marginTop: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('4px'),
    position: 'relative',
  },
  scrollableTable: {
    width: '100%',
    '& thead': {
      position: 'sticky',
      top: 0,
      backgroundColor: tokens.colorNeutralBackground1,
      zIndex: 1,
    },
  },
  promptTextContainer: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground3,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'pre-wrap',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  emphasizedHeaderCell: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  emphasizedCell: {
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface AIAnalysisProps {
  selectedFile?: UploadedFile;
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepseekApiKey: string;
  selectedProvider: AIProvider | null;
  existingAnalysis?: AIAnalysisResult;
  onAnalysisComplete: (fileId: string, response: string, inRangePercentage: number) => void;
}

export function AIAnalysis({ 
  selectedFile, 
  perplexityApiKey, 
  geminiApiKey, 
  grokApiKey, 
  deepseekApiKey, 
  selectedProvider,
  existingAnalysis, 
  onAnalysisComplete 
}: AIAnalysisProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const [selectedTab, setSelectedTab] = useState<string>('fileInfo');
  
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

  // Meal timing prompt state
  const [analyzingMealTiming, setAnalyzingMealTiming] = useState(false);
  const [mealTimingResponse, setMealTimingResponse] = useState<string | null>(null);
  const [mealTimingError, setMealTimingError] = useState<string | null>(null);
  const [mealTimingCooldownActive, setMealTimingCooldownActive] = useState(false);
  const [mealTimingCooldownSeconds, setMealTimingCooldownSeconds] = useState(0);
  const [mealTimingReady, setMealTimingReady] = useState(false);
  const [mealTimingDatasets, setMealTimingDatasets] = useState<{
    cgmReadings: GlucoseReading[];
    bolusReadings: InsulinReading[];
    basalReadings: InsulinReading[];
  }>({ cgmReadings: [], bolusReadings: [], basalReadings: [] });

  // Pump settings prompt state
  const [analyzingPumpSettings, setAnalyzingPumpSettings] = useState(false);
  const [pumpSettingsResponse, setPumpSettingsResponse] = useState<string | null>(null);
  const [pumpSettingsError, setPumpSettingsError] = useState<string | null>(null);
  const [pumpSettingsCooldownActive, setPumpSettingsCooldownActive] = useState(false);
  const [pumpSettingsCooldownSeconds, setPumpSettingsCooldownSeconds] = useState(0);
  const [pumpSettingsReady, setPumpSettingsReady] = useState(false);

  // Determine which AI provider to use (respecting manual selection)
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);
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
      setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
      setMealTimingResponse(null);
      setMealTimingError(null);
      setMealTimingReady(false);
      setPumpSettingsResponse(null);
      setPumpSettingsError(null);
      setPumpSettingsReady(false);
      return;
    }

    // If we have existing analysis for this file, don't recalculate
    if (existingAnalysis && selectedFile.id === existingAnalysis.fileId) {
      return;
    }

    const calculateInRange = async () => {
      setLoading(true);
      // Only clear responses when new file is selected, not during recalculation
      setAiResponse(null);
      setError(null);
      setReadyForNewAnalysis(false);
      setSecondPromptResponse(null);
      setSecondPromptError(null);
      setSecondPromptReady(false);
      setMealTimingResponse(null);
      setMealTimingError(null);
      setMealTimingReady(false);
      setPumpSettingsResponse(null);
      setPumpSettingsError(null);
      setPumpSettingsReady(false);
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
            const insulinData = await extractDailyInsulinSummaries(selectedFile);
            
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

          // Extract detailed insulin readings for meal timing analysis
          try {
            const insulinReadings = await extractInsulinReadings(selectedFile);
            const bolusReadings = insulinReadings.filter(r => r.insulinType === 'bolus');
            const basalReadings = insulinReadings.filter(r => r.insulinType === 'basal');
            setMealTimingDatasets({
              cgmReadings: readings,
              bolusReadings,
              basalReadings,
            });
          } catch (mealTimingErr) {
            console.warn('Failed to extract meal timing data:', mealTimingErr);
            setMealTimingDatasets({ cgmReadings: readings, bolusReadings: [], basalReadings: [] });
          }
        } else {
          setInRangePercentage(null);
          setCombinedDataset([]);
          setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
        }
      } catch (error) {
        console.error('Failed to calculate in-range percentage:', error);
        setInRangePercentage(null);
        setCombinedDataset([]);
        setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
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

  // Handle cooldown timer for meal timing prompt
  useEffect(() => {
    if (mealTimingCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setMealTimingCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (mealTimingCooldownActive && mealTimingCooldownSeconds === 0) {
      setMealTimingCooldownActive(false);
      setMealTimingReady(true);
    }
  }, [mealTimingCooldownSeconds, mealTimingCooldownActive]);

  // Handle cooldown timer for pump settings prompt
  useEffect(() => {
    if (pumpSettingsCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setPumpSettingsCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (pumpSettingsCooldownActive && pumpSettingsCooldownSeconds === 0) {
      setPumpSettingsCooldownActive(false);
      setPumpSettingsReady(true);
    }
  }, [pumpSettingsCooldownSeconds, pumpSettingsCooldownActive]);

  /**
   * Helper function to detect if an error is related to request size being too large
   * @param errorMessage - The error message from the API
   * @returns true if the error is related to request size
   */
  const isRequestTooLargeError = (errorMessage: string | undefined): boolean => {
    if (!errorMessage) return false;
    
    const lowerMessage = errorMessage.toLowerCase();
    return (
      lowerMessage.includes('too large') ||
      lowerMessage.includes('too long') ||
      lowerMessage.includes('exceeds') ||
      lowerMessage.includes('maximum') ||
      lowerMessage.includes('limit') ||
      lowerMessage.includes('token') && (lowerMessage.includes('limit') || lowerMessage.includes('exceed')) ||
      lowerMessage.includes('payload') && lowerMessage.includes('large') ||
      lowerMessage.includes('request') && lowerMessage.includes('size')
    );
  };

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
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

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
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

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

  const handleMealTimingClick = async () => {
    const { cgmReadings, bolusReadings, basalReadings } = mealTimingDatasets;
    if (!activeProvider || !hasApiKey || cgmReadings.length === 0 || bolusReadings.length === 0) {
      return;
    }

    // If there's already a response, start cooldown before allowing new analysis
    if (mealTimingResponse && !mealTimingCooldownActive && !mealTimingReady) {
      setMealTimingCooldownActive(true);
      setMealTimingCooldownSeconds(3);
      return;
    }

    // Don't analyze if cooldown is active
    if (mealTimingCooldownActive) {
      return;
    }

    setAnalyzingMealTiming(true);
    setMealTimingError(null);
    setMealTimingReady(false); // Reset the flag when starting new analysis
    const previousResponse = mealTimingResponse; // Keep previous response in case of error

    // Helper function to try analysis with given datasets
    const tryAnalysis = async (
      cgm: typeof cgmReadings,
      bolus: typeof bolusReadings,
      basal: typeof basalReadings
    ) => {
      // Convert datasets to CSV format
      const cgmCsv = convertGlucoseReadingsToCSV(cgm);
      const bolusCsv = convertBolusReadingsToCSV(bolus);
      const basalCsv = convertBasalReadingsToCSV(basal);
      
      // Base64 encode the CSV data
      const base64CgmData = base64Encode(cgmCsv);
      const base64BolusData = base64Encode(bolusCsv);
      const base64BasalData = base64Encode(basalCsv);

      // Generate the prompt with the base64 CSV data
      const prompt = generateMealTimingPrompt(base64CgmData, base64BolusData, base64BasalData);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

      // Call the AI API using the selected provider
      return await callAIApi(activeProvider, apiKey, prompt);
    };

    try {
      // First attempt: try with full dataset
      let result = await tryAnalysis(cgmReadings, bolusReadings, basalReadings);

      // If request was too large, try with smaller dataset (last 28 days)
      if (!result.success && isRequestTooLargeError(result.error)) {
        // Filter datasets to last 28 days
        const filteredCgm = filterGlucoseReadingsToLastDays(cgmReadings, 28);
        const filteredBolus = filterInsulinReadingsToLastDays(bolusReadings, 28);
        const filteredBasal = filterInsulinReadingsToLastDays(basalReadings, 28);

        // Verify we still have data after filtering
        if (filteredCgm.length > 0 && filteredBolus.length > 0) {
          // Second attempt: try with filtered dataset
          result = await tryAnalysis(filteredCgm, filteredBolus, filteredBasal);
          
          // If successful with smaller dataset, add a note to the response
          if (result.success && result.content) {
            result.content = `**Note:** Analysis based on the last 28 days of data due to dataset size constraints.\n\n${result.content}`;
          }
        }
      }

      if (result.success && result.content) {
        setMealTimingResponse(result.content);
      } else {
        // On error, keep the previous response if it exists
        setMealTimingError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          setMealTimingResponse(previousResponse);
        }
      }
    } catch (err) {
      // On error, keep the previous response if it exists
      setMealTimingError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        setMealTimingResponse(previousResponse);
      }
    } finally {
      setAnalyzingMealTiming(false);
    }
  };

  const handlePumpSettingsClick = async () => {
    const { cgmReadings, bolusReadings, basalReadings } = mealTimingDatasets;
    if (!activeProvider || !hasApiKey || cgmReadings.length === 0 || bolusReadings.length === 0) {
      return;
    }

    // If there's already a response, start cooldown before allowing new analysis
    if (pumpSettingsResponse && !pumpSettingsCooldownActive && !pumpSettingsReady) {
      setPumpSettingsCooldownActive(true);
      setPumpSettingsCooldownSeconds(3);
      return;
    }

    // Don't analyze if cooldown is active
    if (pumpSettingsCooldownActive) {
      return;
    }

    setAnalyzingPumpSettings(true);
    setPumpSettingsError(null);
    setPumpSettingsReady(false); // Reset the flag when starting new analysis
    const previousResponse = pumpSettingsResponse; // Keep previous response in case of error

    // Helper function to try analysis with given datasets
    const tryAnalysis = async (
      cgm: typeof cgmReadings,
      bolus: typeof bolusReadings,
      basal: typeof basalReadings
    ) => {
      // Convert datasets to CSV format
      const cgmCsv = convertGlucoseReadingsToCSV(cgm);
      const bolusCsv = convertBolusReadingsToCSV(bolus);
      const basalCsv = convertBasalReadingsToCSV(basal);
      
      // Base64 encode the CSV data
      const base64CgmData = base64Encode(cgmCsv);
      const base64BolusData = base64Encode(bolusCsv);
      const base64BasalData = base64Encode(basalCsv);

      // Generate the prompt with the base64 CSV data
      const prompt = generatePumpSettingsPrompt(base64CgmData, base64BolusData, base64BasalData);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey
                    : activeProvider === 'grok' ? grokApiKey
                    : activeProvider === 'deepseek' ? deepseekApiKey
                    : geminiApiKey;

      // Call the AI API using the selected provider
      return await callAIApi(activeProvider, apiKey, prompt);
    };

    try {
      // First attempt: try with full dataset
      let result = await tryAnalysis(cgmReadings, bolusReadings, basalReadings);

      // If request was too large, try with smaller dataset (last 28 days)
      if (!result.success && isRequestTooLargeError(result.error)) {
        // Filter datasets to last 28 days
        const filteredCgm = filterGlucoseReadingsToLastDays(cgmReadings, 28);
        const filteredBolus = filterInsulinReadingsToLastDays(bolusReadings, 28);
        const filteredBasal = filterInsulinReadingsToLastDays(basalReadings, 28);

        // Verify we still have data after filtering
        if (filteredCgm.length > 0 && filteredBolus.length > 0) {
          // Second attempt: try with filtered dataset
          result = await tryAnalysis(filteredCgm, filteredBolus, filteredBasal);
          
          // If successful with smaller dataset, add a note to the response
          if (result.success && result.content) {
            result.content = `**Note:** Analysis based on the last 28 days of data due to dataset size constraints.\n\n${result.content}`;
          }
        }
      }

      if (result.success && result.content) {
        setPumpSettingsResponse(result.content);
      } else {
        // On error, keep the previous response if it exists
        setPumpSettingsError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          setPumpSettingsResponse(previousResponse);
        }
      }
    } catch (err) {
      // On error, keep the previous response if it exists
      setPumpSettingsError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        setPumpSettingsResponse(previousResponse);
      }
    } finally {
      setAnalyzingPumpSettings(false);
    }
  };


  const renderTabContent = () => {
    if (selectedTab === 'fileInfo') {
      return (
        <div className={styles.promptContent}>
          <SelectedFileMetadata selectedFile={selectedFile} />
        </div>
      );
    } else if (selectedTab === 'timeInRange') {
      return (
        <div className={styles.promptContent}>
          {loading ? (
            <Text className={styles.helperText}>Loading glucose data...</Text>
          ) : inRangePercentage !== null ? (
            <>
              {/* Button container */}
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
                
                {!analyzing && !cooldownActive && (
                  <>
                    {(!aiResponse || readyForNewAnalysis) && (
                      <Text className={styles.helperText}>
                        Click Analyze to get AI-powered insights on your Time in Range percentage. You will receive personalized feedback and recommendations based on your glucose data{activeProvider ? ` (using ${getProviderDisplayName(activeProvider)})` : ''}.
                      </Text>
                    )}
                    {aiResponse && !readyForNewAnalysis && (
                      <Text className={styles.helperText}>
                        Click the button above to request a new analysis
                      </Text>
                    )}
                  </>
                )}
                
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
              </div>

              {/* Accordion to show prompt text */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="promptText">
                  <AccordionHeader>View AI Prompt</AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.promptTextContainer}>
                      {generateTimeInRangePrompt(inRangePercentage)}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <Text className={styles.statementText} style={{ marginTop: '16px' }}>
                Your glucose is {inRangePercentage}% of time in range.
              </Text>

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
      );
    } else if (selectedTab === 'glucoseInsulin') {
      return (
        <div className={styles.promptContent}>
          {loading ? (
            <Text className={styles.helperText}>Loading data...</Text>
          ) : combinedDataset.length > 0 ? (
            <>
              {/* Button container */}
              <div className={styles.buttonContainer}>
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
                
                {!analyzingSecondPrompt && !secondPromptCooldownActive && (
                  <>
                    {(!secondPromptResponse || secondPromptReady) && (
                      <Text className={styles.helperText}>
                        Click Analyze to get AI-powered correlation analysis between glucose ranges and insulin doses. You will see patterns and relationships in your daily data{activeProvider ? ` (using ${getProviderDisplayName(activeProvider)})` : ''}.
                      </Text>
                    )}
                    {secondPromptResponse && !secondPromptReady && (
                      <Text className={styles.helperText}>
                        Click the button above to request a new analysis
                      </Text>
                    )}
                  </>
                )}
                
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
              </div>

              {/* Accordion to show prompt text */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="promptText">
                  <AccordionHeader>View AI Prompt</AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.promptTextContainer}>
                      {(() => {
                        const csvData = convertDailyReportsToCSV(combinedDataset);
                        const base64CsvData = base64Encode(csvData);
                        return generateGlucoseInsulinPrompt(base64CsvData);
                      })()}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {/* Accordion for dataset table */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="datasetTable">
                  <AccordionHeader>Dataset showing glucose ranges and insulin doses by date</AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.scrollableTableContainer}>
                      <Table className={styles.scrollableTable}>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Date</TableHeaderCell>
                            <TableHeaderCell className={styles.emphasizedHeaderCell}>Day of Week</TableHeaderCell>
                            <TableHeaderCell>BG Below (%)</TableHeaderCell>
                            <TableHeaderCell className={styles.emphasizedHeaderCell}>BG In Range (%)</TableHeaderCell>
                            <TableHeaderCell>BG Above (%)</TableHeaderCell>
                            <TableHeaderCell className={styles.emphasizedHeaderCell}>Basal Insulin</TableHeaderCell>
                            <TableHeaderCell>Bolus Insulin</TableHeaderCell>
                            <TableHeaderCell className={styles.emphasizedHeaderCell}>Total Insulin</TableHeaderCell>
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
                                <TableCell className={styles.emphasizedCell}>{dayOfWeek}</TableCell>
                                <TableCell>{calculatePercentage(report.stats.low, report.stats.total)}%</TableCell>
                                <TableCell className={styles.emphasizedCell}>{calculatePercentage(report.stats.inRange, report.stats.total)}%</TableCell>
                                <TableCell>{calculatePercentage(report.stats.high, report.stats.total)}%</TableCell>
                                <TableCell className={styles.emphasizedCell}>{report.basalInsulin !== undefined ? report.basalInsulin : '-'}</TableCell>
                                <TableCell>{report.bolusInsulin !== undefined ? report.bolusInsulin : '-'}</TableCell>
                                <TableCell className={styles.emphasizedCell}>{report.totalInsulin !== undefined ? report.totalInsulin : '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

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
      );
    } else if (selectedTab === 'mealTiming') {
      const { cgmReadings, bolusReadings, basalReadings } = mealTimingDatasets;
      const hasData = cgmReadings.length > 0 && bolusReadings.length > 0;
      
      return (
        <div className={styles.promptContent}>
          {loading ? (
            <Text className={styles.helperText}>Loading data...</Text>
          ) : hasData ? (
            <>
              {/* Button container */}
              <div className={styles.buttonContainer}>
                <Button
                  appearance="primary"
                  disabled={!hasApiKey || analyzingMealTiming || (mealTimingCooldownActive && mealTimingCooldownSeconds > 0)}
                  onClick={handleMealTimingClick}
                  icon={analyzingMealTiming ? <Spinner size="tiny" /> : undefined}
                >
                  {analyzingMealTiming
                    ? 'Analyzing...'
                    : mealTimingResponse && !mealTimingReady
                    ? 'Click to enable new analysis'
                    : 'Analyze with AI'}
                </Button>
                
                {!analyzingMealTiming && !mealTimingCooldownActive && (
                  <>
                    {(!mealTimingResponse || mealTimingReady) && (
                      <Text className={styles.helperText}>
                        Click Analyze to get AI-powered meal timing analysis with day-of-week patterns. You will receive meal-specific recommendations based on your glucose and insulin data{activeProvider ? ` (using ${getProviderDisplayName(activeProvider)})` : ''}.
                      </Text>
                    )}
                    {mealTimingResponse && !mealTimingReady && (
                      <Text className={styles.helperText}>
                        Click the button above to request a new analysis
                      </Text>
                    )}
                  </>
                )}
                
                {mealTimingCooldownActive && mealTimingCooldownSeconds > 0 && (
                  <div className={styles.cooldownContainer}>
                    <Text className={styles.cooldownText}>
                      Please wait {mealTimingCooldownSeconds} second{mealTimingCooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                    </Text>
                    <ProgressBar 
                      value={(3 - mealTimingCooldownSeconds) / 3} 
                      thickness="large"
                    />
                  </div>
                )}
              </div>

              {/* Accordion to show prompt text */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="promptText">
                  <AccordionHeader>View AI Prompt</AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.promptTextContainer}>
                      {(() => {
                        const cgmCsv = convertGlucoseReadingsToCSV(cgmReadings);
                        const bolusCsv = convertBolusReadingsToCSV(bolusReadings);
                        const basalCsv = convertBasalReadingsToCSV(basalReadings);
                        const base64CgmData = base64Encode(cgmCsv);
                        const base64BolusData = base64Encode(bolusCsv);
                        const base64BasalData = base64Encode(basalCsv);
                        return generateMealTimingPrompt(base64CgmData, base64BolusData, base64BasalData);
                      })()}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {/* Accordion for dataset summaries */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="datasetSummary">
                  <AccordionHeader>Dataset Summary</AccordionHeader>
                  <AccordionPanel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Text>
                        <strong>CGM Readings:</strong> {cgmReadings.length} readings
                      </Text>
                      <Text>
                        <strong>Bolus Events:</strong> {bolusReadings.length} injections
                      </Text>
                      <Text>
                        <strong>Basal Events:</strong> {basalReadings.length} entries
                      </Text>
                      {cgmReadings.length > 0 && (
                        <>
                          <Text>
                            <strong>Date Range:</strong> {cgmReadings[0].timestamp.toLocaleDateString()} - {cgmReadings[cgmReadings.length - 1].timestamp.toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {analyzingMealTiming && (
                <div className={styles.loadingContainer}>
                  <Spinner size="medium" />
                  <Text className={styles.helperText}>
                    Getting AI analysis... This may take a few seconds.
                  </Text>
                </div>
              )}

              {mealTimingError && (
                <div className={styles.errorContainer}>
                  <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
                    <MessageBarBody>
                      <strong>Error:</strong> {mealTimingError}
                    </MessageBarBody>
                  </MessageBar>
                </div>
              )}

              {mealTimingResponse && (
                <>
                  <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
                    <MessageBarBody>
                      AI analysis completed successfully
                    </MessageBarBody>
                  </MessageBar>
                  <div className={styles.aiResponseContainer}>
                    <MarkdownRenderer content={mealTimingResponse} />
                  </div>
                </>
              )}
            </>
          ) : (
            <Text className={styles.helperText}>
              No CGM or bolus data available for meal timing analysis. Please ensure your data file contains both CGM readings and bolus insulin data.
            </Text>
          )}
        </div>
      );
    } else if (selectedTab === 'pumpSettings') {
      const { cgmReadings, bolusReadings, basalReadings } = mealTimingDatasets;
      const hasData = cgmReadings.length > 0 && bolusReadings.length > 0;
      
      return (
        <div className={styles.promptContent}>
          {loading ? (
            <Text className={styles.helperText}>Loading data...</Text>
          ) : hasData ? (
            <>
              {/* Button container */}
              <div className={styles.buttonContainer}>
                <Button
                  appearance="primary"
                  disabled={!hasApiKey || analyzingPumpSettings || (pumpSettingsCooldownActive && pumpSettingsCooldownSeconds > 0)}
                  onClick={handlePumpSettingsClick}
                  icon={analyzingPumpSettings ? <Spinner size="tiny" /> : undefined}
                >
                  {analyzingPumpSettings
                    ? 'Analyzing...'
                    : pumpSettingsResponse && !pumpSettingsReady
                    ? 'Click to enable new analysis'
                    : 'Analyze with AI'}
                </Button>
                
                {!analyzingPumpSettings && !pumpSettingsCooldownActive && (
                  <>
                    {(!pumpSettingsResponse || pumpSettingsReady) && (
                      <Text className={styles.helperText}>
                        Click Analyze to get AI-powered pump settings verification. The AI will infer your current pump settings, validate them, and provide specific recommendations for basal rates, insulin sensitivity factor (ISF), and carb ratios across different time segments{activeProvider ? ` (using ${getProviderDisplayName(activeProvider)})` : ''}.
                      </Text>
                    )}
                    {pumpSettingsResponse && !pumpSettingsReady && (
                      <Text className={styles.helperText}>
                        Click the button above to request a new analysis
                      </Text>
                    )}
                  </>
                )}
                
                {pumpSettingsCooldownActive && pumpSettingsCooldownSeconds > 0 && (
                  <div className={styles.cooldownContainer}>
                    <Text className={styles.cooldownText}>
                      Please wait {pumpSettingsCooldownSeconds} second{pumpSettingsCooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                    </Text>
                    <ProgressBar 
                      value={(3 - pumpSettingsCooldownSeconds) / 3} 
                      thickness="large"
                    />
                  </div>
                )}
              </div>

              {/* Accordion to show prompt text */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="promptText">
                  <AccordionHeader>View AI Prompt</AccordionHeader>
                  <AccordionPanel>
                    <div className={styles.promptTextContainer}>
                      {(() => {
                        const cgmCsv = convertGlucoseReadingsToCSV(cgmReadings);
                        const bolusCsv = convertBolusReadingsToCSV(bolusReadings);
                        const basalCsv = convertBasalReadingsToCSV(basalReadings);
                        const base64CgmData = base64Encode(cgmCsv);
                        const base64BolusData = base64Encode(bolusCsv);
                        const base64BasalData = base64Encode(basalCsv);
                        return generatePumpSettingsPrompt(base64CgmData, base64BolusData, base64BasalData);
                      })()}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {/* Accordion for dataset summaries */}
              <Accordion collapsible style={{ marginTop: '16px' }}>
                <AccordionItem value="datasetSummary">
                  <AccordionHeader>Dataset Summary</AccordionHeader>
                  <AccordionPanel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Text>
                        <strong>CGM Readings:</strong> {cgmReadings.length} readings
                      </Text>
                      <Text>
                        <strong>Bolus Events:</strong> {bolusReadings.length} injections
                      </Text>
                      <Text>
                        <strong>Basal Events:</strong> {basalReadings.length} entries
                      </Text>
                      {cgmReadings.length > 0 && (
                        <>
                          <Text>
                            <strong>Date Range:</strong> {cgmReadings[0].timestamp.toLocaleDateString()} - {cgmReadings[cgmReadings.length - 1].timestamp.toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {analyzingPumpSettings && (
                <div className={styles.loadingContainer}>
                  <Spinner size="medium" />
                  <Text className={styles.helperText}>
                    Getting AI analysis... This may take a few seconds.
                  </Text>
                </div>
              )}

              {pumpSettingsError && (
                <div className={styles.errorContainer}>
                  <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
                    <MessageBarBody>
                      <strong>Error:</strong> {pumpSettingsError}
                    </MessageBarBody>
                  </MessageBar>
                </div>
              )}

              {pumpSettingsResponse && (
                <>
                  <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
                    <MessageBarBody>
                      AI analysis completed successfully
                    </MessageBarBody>
                  </MessageBar>
                  <div className={styles.aiResponseContainer}>
                    <MarkdownRenderer content={pumpSettingsResponse} />
                  </div>
                </>
              )}
            </>
          ) : (
            <Text className={styles.helperText}>
              No CGM or bolus data available for pump settings analysis. Please ensure your data file contains both CGM readings and bolus insulin data.
            </Text>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>AI Analysis</Text>
        <Text className={styles.description}>
          Get intelligent insights and recommendations using advanced AI algorithms
        </Text>
      </div>

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
        <div className={styles.contentWrapper}>
          <TabList
            vertical
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
            className={styles.tabList}
            appearance="subtle"
          >
            <Tab value="fileInfo">File Info</Tab>
            <Tab value="timeInRange">Time in Range</Tab>
            <Tab value="glucoseInsulin">Glucose & Insulin</Tab>
            <Tab value="mealTiming">Meal Timing</Tab>
            <Tab value="pumpSettings">Pump Settings</Tab>
          </TabList>

          <div className={styles.contentArea}>
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
}
