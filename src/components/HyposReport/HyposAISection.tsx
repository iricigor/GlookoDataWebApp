/**
 * HyposAISection component
 * Displays AI-powered analysis for hypoglycemia events on the current day
 * Integrated into the HyposReport component
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { SparkleRegular, CheckmarkCircleRegular, ErrorCircleRegular, InfoRegular } from '@fluentui/react-icons';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import type { GlucoseReading, GlucoseUnit, GlucoseThresholds, InsulinReading } from '../../types';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api/aiApi';
import { callAIApi, getActiveProvider } from '../../utils/api';
import { generateHyposReportPrompt } from '../../features/aiAnalysis/prompts';
import { 
  extractDetailedHypoEvents, 
  convertDetailedHypoEventsToCSV,
  parseHypoAIResponseByDate,
  type EventAnalysis,
  type DetailedHypoEvent,
} from '../../utils/data/hyposReportAIDataUtils';
import { base64Encode } from '../../utils/formatting';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  headerIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  helperText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  noHyposMessage: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorStatusSuccessBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorStatusSuccessForeground1,
  },
  noHyposIcon: {
    fontSize: '20px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  analysisContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  eventCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  eventTime: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  nadirBadge: {
    ...shorthands.padding('2px', '8px'),
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
  },
  suspectLabel: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    marginBottom: '8px',
  },
  suspectTag: {
    ...shorthands.padding('4px', '10px'),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  insightText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.5',
  },
  mealTimeText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
  },
  errorContainer: {
    marginTop: '16px',
  },
  responseContainer: {
    marginTop: '16px',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  cachedIndicator: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  promptTextContainer: {
    ...shorthands.padding('12px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  dataTableContainer: {
    ...shorthands.padding('12px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    overflowX: 'auto',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  completedMessage: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorNeutralForeground2,
  },
  completedIcon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
  },
});

interface HyposAISectionProps {
  currentDate: string;
  allReadings: GlucoseReading[];
  thresholds: GlucoseThresholds;
  glucoseUnit: GlucoseUnit;
  bolusReadings?: InsulinReading[];
  basalReadings?: InsulinReading[];
  // API configuration
  perplexityApiKey: string;
  geminiApiKey: string;
  grokApiKey: string;
  deepseekApiKey: string;
  selectedProvider: AIProvider | null;
  responseLanguage: ResponseLanguage;
  // File ID for tracking file changes and persisting state
  fileId?: string;
}

// Cache structure for storing AI responses by date
interface AIResponseCache {
  [date: string]: {
    response: string;
    parsedAnalyses: EventAnalysis[];
    timestamp: Date;
  };
}

/**
 * Render UI that provides AI-powered analysis of hypoglycemic events for the specified date.
 *
 * Displays status, analysis controls, cached results, and full AI responses; handles asynchronous
 * preparation of event data and calling the configured AI provider.
 *
 * @param currentDate - ISO date string for which to show per-day analysis and events
 * @param allReadings - All glucose readings used to derive detailed hypo events
 * @param thresholds - Glucose threshold settings used to identify hypo events
 * @param glucoseUnit - Unit used for glucose values (e.g., mg/dL or mmol/L)
 * @param bolusReadings - Optional insulin bolus records used when deriving event context
 * @param basalReadings - Optional basal insulin records used when deriving event context
 * @param perplexityApiKey - Optional API key for the Perplexity provider
 * @param geminiApiKey - Optional API key for the Gemini provider
 * @param grokApiKey - Optional API key for the Grok provider
 * @param deepseekApiKey - Optional API key for the DeepSeek provider
 * @param selectedProvider - Optional selected AI provider; determines which API key is used
 * @param responseLanguage - Target language for AI responses
 * @returns A React element containing controls and views for preparing data, triggering AI analysis, showing progress/errors, and rendering cached or newly generated AI analyses for hypoglycemic events
 */
export function HyposAISection({
  currentDate,
  allReadings,
  thresholds,
  glucoseUnit,
  bolusReadings = [],
  basalReadings = [],
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  deepseekApiKey,
  selectedProvider,
  responseLanguage,
  fileId,
}: HyposAISectionProps) {
  const styles = useStyles();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseCache, setResponseCache] = useState<AIResponseCache>({});
  
  // Track whether the AI analysis has been completed (button clicked and successful)
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);
  
  // Store the full AI response text (for display in accordion)
  const [fullAIResponse, setFullAIResponse] = useState<string | null>(null);
  
  // Track file ID and provider to detect when they change
  const prevFileIdRef = useRef<string | undefined>(undefined);
  const prevProviderRef = useRef<AIProvider | null>(null);
  
  // State for async loading of all events (to avoid blocking page render)
  const [allEvents, setAllEvents] = useState<DetailedHypoEvent[]>([]);
  const [loadingAllEvents, setLoadingAllEvents] = useState(true);
  
  // Ref for tracking if component is mounted
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Get active AI provider
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);
  const hasApiKey = activeProvider !== null;
  
  // Clear AI response when file ID or provider changes
  useEffect(() => {
    const fileChanged = fileId !== prevFileIdRef.current && prevFileIdRef.current !== undefined;
    const providerChanged = activeProvider !== prevProviderRef.current && prevProviderRef.current !== null;
    
    if (fileChanged || providerChanged) {
      // Clear all AI-related state
      setResponseCache({});
      setHasCompletedAnalysis(false);
      setFullAIResponse(null);
      setError(null);
    }
    
    // Update refs for next comparison
    prevFileIdRef.current = fileId;
    prevProviderRef.current = activeProvider;
  }, [fileId, activeProvider]);
  
  // Extract detailed events for the current date
  const currentDateEvents = useMemo(() => {
    return extractDetailedHypoEvents(
      allReadings,
      thresholds,
      bolusReadings,
      basalReadings,
      currentDate
    );
  }, [allReadings, thresholds, bolusReadings, basalReadings, currentDate]);
  
  // Load all events asynchronously to avoid blocking page render
  // This computation is deferred to allow the UI to render immediately
  useEffect(() => {
    // Reset loading state when dependencies change
    setLoadingAllEvents(true);
    setError(null);
    
    // Use setTimeout to defer the heavy computation and allow UI to render first
    const timeoutId = setTimeout(() => {
      try {
        const events = extractDetailedHypoEvents(
          allReadings,
          thresholds,
          bolusReadings,
          basalReadings
        );
        if (isMountedRef.current) {
          setAllEvents(events);
          setLoadingAllEvents(false);
        }
      } catch (err) {
        console.error('Failed to extract hypo events:', err);
        if (isMountedRef.current) {
          setAllEvents([]);
          setLoadingAllEvents(false);
          setError('Failed to prepare AI data. Please try refreshing the page.');
        }
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [allReadings, thresholds, bolusReadings, basalReadings]);
  
  // Check if we have cached analysis for current date
  const cachedAnalysis = responseCache[currentDate];
  const hasCachedAnalysis = !!cachedAnalysis;
  
  // Check if there are hypos for the current date
  const hasHyposToday = currentDateEvents.length > 0;
  
  // Handle AI analysis request
  const handleAnalyze = useCallback(async () => {
    if (!activeProvider || !hasApiKey || loadingAllEvents || allEvents.length === 0) {
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // Convert all events to CSV for the prompt
      const eventsCSV = convertDetailedHypoEventsToCSV(allEvents);
      const base64Data = base64Encode(eventsCSV);
      
      // Generate the prompt
      const prompt = generateHyposReportPrompt(
        base64Data,
        allEvents.length,
        responseLanguage,
        glucoseUnit,
        activeProvider
      );
      
      // Get the appropriate API key
      const apiKey = 
        activeProvider === 'perplexity' ? perplexityApiKey :
        activeProvider === 'grok' ? grokApiKey :
        activeProvider === 'deepseek' ? deepseekApiKey :
        geminiApiKey;
      
      // Call the AI API
      const result = await callAIApi(activeProvider, apiKey, prompt);
      
      if (!isMountedRef.current) return;
      
      if (result.success && result.content) {
        // Parse the response to extract per-date analyses
        const parsedByDate = parseHypoAIResponseByDate(result.content);
        
        // Update cache with parsed results for each date
        const newCache: AIResponseCache = { ...responseCache };
        
        // Store the full response and parse analyses by date
        parsedByDate.forEach((analyses, date) => {
          newCache[date] = {
            response: result.content!,
            parsedAnalyses: analyses,
            timestamp: new Date(),
          };
        });
        
        // Also mark current date as analyzed even if no hypos
        if (!newCache[currentDate]) {
          newCache[currentDate] = {
            response: result.content,
            parsedAnalyses: [],
            timestamp: new Date(),
          };
        }
        
        setResponseCache(newCache);
        setFullAIResponse(result.content);
        setHasCompletedAnalysis(true);
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setAnalyzing(false);
      }
    }
  }, [
    activeProvider,
    hasApiKey,
    loadingAllEvents,
    allEvents,
    responseLanguage,
    glucoseUnit,
    perplexityApiKey,
    geminiApiKey,
    grokApiKey,
    deepseekApiKey,
    responseCache,
    currentDate,
  ]);
  
  // Generate the AI prompt for display in accordion
  const currentPrompt = useMemo(() => {
    if (loadingAllEvents || allEvents.length === 0) return null;
    
    const eventsCSV = convertDetailedHypoEventsToCSV(allEvents);
    const base64Data = base64Encode(eventsCSV);
    
    return generateHyposReportPrompt(
      base64Data,
      allEvents.length,
      responseLanguage,
      glucoseUnit,
      activeProvider ?? 'gemini'
    );
  }, [loadingAllEvents, allEvents, responseLanguage, glucoseUnit, activeProvider]);
  
  // Memoize CSV conversion to avoid recomputation on every render
  const allEventsCSV = useMemo(() => {
    if (allEvents.length === 0) return '';
    return convertDetailedHypoEventsToCSV(allEvents);
  }, [allEvents]);
  
  // Render individual event analysis card
  const renderEventCard = (analysis: EventAnalysis, index: number) => (
    <div key={index} className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <Text className={styles.eventTime}>
          Event at {analysis.eventTime}
        </Text>
        <span className={styles.nadirBadge}>
          Nadir: {analysis.nadirValue}
        </span>
      </div>
      
      <div className={styles.suspectLabel}>
        <InfoRegular />
        <Text>Primary Suspect:</Text>
        <span className={styles.suspectTag}>
          {analysis.primarySuspect}
        </span>
      </div>
      
      <Text className={styles.insightText}>
        <strong>Recommendation:</strong> {analysis.actionableInsight}
      </Text>
      
      {analysis.deductedMealTime && (
        <Text className={styles.mealTimeText}>
          Estimated meal time: {analysis.deductedMealTime}
        </Text>
      )}
    </div>
  );
  
  // If no API key configured
  if (!hasApiKey) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <SparkleRegular className={styles.headerIcon} />
          <Text className={styles.title}>AI Analysis</Text>
        </div>
        <MessageBar intent="warning">
          <MessageBarBody>
            To use AI-powered hypo analysis, please configure an API key in Settings.
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }
  
  // Helper: Render the accordions for AI Prompt and Data (shown in both states)
  const renderDataAccordions = () => (
    <Accordion collapsible>
      {/* AI Prompt Accordion */}
      <AccordionItem value="aiPrompt">
        <AccordionHeader>View AI Prompt</AccordionHeader>
        <AccordionPanel>
          <div className={styles.promptTextContainer}>
            {loadingAllEvents ? (
              <Text className={styles.helperText}>Loading data...</Text>
            ) : currentPrompt ? (
              currentPrompt
            ) : (
              <Text className={styles.helperText}>No data available to generate prompt</Text>
            )}
          </div>
        </AccordionPanel>
      </AccordionItem>
      
      {/* Pre-prepared Data Accordion */}
      <AccordionItem value="hypoData">
        <AccordionHeader>View Hypo Data ({allEvents.length} events)</AccordionHeader>
        <AccordionPanel>
          <div className={styles.dataTableContainer}>
            {loadingAllEvents ? (
              <Text className={styles.helperText}>Loading data...</Text>
            ) : allEventsCSV ? (
              <pre style={{ margin: 0, fontSize: '11px', overflowX: 'auto' }}>
                {allEventsCSV}
              </pre>
            ) : (
              <Text className={styles.helperText}>No hypo events found in the dataset</Text>
            )}
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
  
  // STATE 1: Before AI analysis is performed
  if (!hasCompletedAnalysis) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <SparkleRegular className={styles.headerIcon} />
          <Text className={styles.title}>AI Analysis</Text>
        </div>
        
        {/* Show message about no hypos today but overall status is still "ready to analyze" */}
        {!hasHyposToday && (
          <div className={styles.noHyposMessage}>
            <CheckmarkCircleRegular className={styles.noHyposIcon} />
            <Text>No hypoglycemic events detected on this day - great glucose control!</Text>
          </div>
        )}
        
        {/* Analysis Button - shows count of ALL events */}
        {loadingAllEvents ? (
          <div className={styles.loadingContainer}>
            <Spinner size="small" />
            <Text className={styles.helperText}>
              Preparing AI data...
            </Text>
          </div>
        ) : allEvents.length > 0 ? (
          <div className={styles.buttonContainer}>
            <Button
              appearance="primary"
              icon={analyzing ? <Spinner size="tiny" /> : <SparkleRegular />}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing...' : `Analyze all ${allEvents.length} hypo events`}
            </Button>
            <Text className={styles.helperText}>
              AI will analyze all hypo events in the dataset. Navigate dates after analysis to see per-day insights.
            </Text>
          </div>
        ) : (
          <div className={styles.noHyposMessage}>
            <CheckmarkCircleRegular className={styles.noHyposIcon} />
            <Text>No hypoglycemic events found in the entire dataset.</Text>
          </div>
        )}
        
        {/* Loading State */}
        {analyzing && (
          <div className={styles.loadingContainer}>
            <Spinner size="small" />
            <Text className={styles.helperText}>
              Analyzing all hypoglycemic events... This may take a few seconds.
            </Text>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className={styles.errorContainer}>
            <MessageBar intent="error" icon={<ErrorCircleRegular />}>
              <MessageBarBody>
                <strong>Error:</strong> {error}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}
        
        {/* Accordions for AI prompt and data */}
        {renderDataAccordions()}
      </div>
    );
  }
  
  // STATE 2: After AI analysis is completed
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SparkleRegular className={styles.headerIcon} />
        <Text className={styles.title}>AI Analysis</Text>
        <Text className={styles.cachedIndicator}>
          (analysis complete - navigate dates to see per-day insights)
        </Text>
      </div>
      
      {/* Analysis Complete Status */}
      <div className={styles.completedMessage}>
        <CheckmarkCircleRegular className={styles.completedIcon} />
        <Text>
          Analysis complete! Showing results for {currentDate}. 
          Use the date filter above to view insights for other days.
        </Text>
      </div>
      
      {/* Show message if no hypos on current date */}
      {!hasHyposToday && (
        <div className={styles.noHyposMessage}>
          <CheckmarkCircleRegular className={styles.noHyposIcon} />
          <Text>No hypoglycemic events detected on {currentDate} - great glucose control!</Text>
        </div>
      )}
      
      {/* Display cached analysis for current date if available */}
      {hasCachedAnalysis && cachedAnalysis.parsedAnalyses.length > 0 && (
        <div className={styles.analysisContainer}>
          {cachedAnalysis.parsedAnalyses.map((analysis, index) => 
            renderEventCard(analysis, index)
          )}
        </div>
      )}
      
      {/* If there are hypos but no parsed analyses, show full response in accordion */}
      {hasHyposToday && (!hasCachedAnalysis || cachedAnalysis.parsedAnalyses.length === 0) && fullAIResponse && (
        <MessageBar intent="info">
          <MessageBarBody>
            AI analysis was performed but no specific insights were found for {currentDate}. 
            Expand the "View Full AI Response" accordion to see the complete analysis.
          </MessageBarBody>
        </MessageBar>
      )}
      
      {/* Error State */}
      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error" icon={<ErrorCircleRegular />}>
            <MessageBarBody>
              <strong>Error:</strong> {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}
      
      {/* Accordions - data, prompt, and full response */}
      <Accordion collapsible>
        {/* Full AI Response Accordion */}
        {fullAIResponse && (
          <AccordionItem value="fullResponse">
            <AccordionHeader>View Full AI Response</AccordionHeader>
            <AccordionPanel>
              <div className={styles.responseContainer}>
                <MarkdownRenderer content={fullAIResponse} />
              </div>
            </AccordionPanel>
          </AccordionItem>
        )}
        
        {/* AI Prompt Accordion */}
        <AccordionItem value="aiPrompt">
          <AccordionHeader>View AI Prompt</AccordionHeader>
          <AccordionPanel>
            <div className={styles.promptTextContainer}>
              {currentPrompt ?? <Text className={styles.helperText}>No prompt available</Text>}
            </div>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Pre-prepared Data Accordion */}
        <AccordionItem value="hypoData">
          <AccordionHeader>View Hypo Data ({allEvents.length} events)</AccordionHeader>
          <AccordionPanel>
            <div className={styles.dataTableContainer}>
              {allEventsCSV ? (
                <pre style={{ margin: 0, fontSize: '11px', overflowX: 'auto' }}>
                  {allEventsCSV}
                </pre>
              ) : (
                <Text className={styles.helperText}>No hypo events found in the dataset</Text>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}