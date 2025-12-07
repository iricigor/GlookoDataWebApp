/**
 * Hypos Tab - AI analysis for hypoglycemia patterns and risk assessment
 */

import { useEffect } from 'react';
import {
  Text,
  Link,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Tooltip,
} from '@fluentui/react-components';
import { InfoRegular } from '@fluentui/react-icons';
import { TableContainer } from '../../../components/TableContainer';
import { generateHyposPrompt } from '../../../features/aiAnalysis/prompts';
import { callAIApi, isRequestTooLargeError } from '../../../utils/api';
import { convertHypoEventsToCSV, convertHypoSummariesToCSV, convertHypoEventSummaryToCSV } from '../../../utils/data';
import { base64Encode } from '../../../utils/formatting';
import { formatDateTime, formatTime, formatGlucoseNumber, formatNumber } from '../../../utils/formatting/formatters';
import { useAIAnalysisStyles } from '../styles';
import { useAnalysisState } from '../useAnalysisState';
import {
  AnalysisButton,
  AnalysisHelperText,
  CooldownIndicator,
  AnalysisLoading,
  AnalysisError,
  AnalysisResult,
  RetryNotification,
} from '../AnalysisComponents';
import type { HyposTabProps } from '../types';
import type { DailyHypoSummary, HypoEventData } from '../../../utils/data';

// Helper function to convert hypo events to 2D array for table display
function convertHypoEventsToArray(events: HypoEventData[]): (string | number)[][] {
  const headers = [
    'Event ID',
    'Start Time',
    'Duration (min)',
    'Nadir (mmol/L)',
    'Nadir Time',
    'Is Severe',
    'Last Bolus (2-4h)',
    'Bolus Dose (U)',
  ];

  const rows = events.map(event => {
    const lastBolus = event.lastBolusBeforeHypo;
    return [
      event.eventId,
      formatDateTime(event.hypoPeriod.startTime),
      Math.round(event.hypoPeriod.durationMinutes),
      formatGlucoseNumber(event.hypoPeriod.nadir, 1),
      formatTime(event.hypoPeriod.nadirTime),
      event.hypoPeriod.isSevere ? 'Yes' : 'No',
      lastBolus ? formatTime(lastBolus.timestamp) : '-',
      lastBolus ? formatGlucoseNumber(lastBolus.dose, 1) : '-',
    ];
  });

  return [headers, ...rows];
}

// Helper function to convert daily summaries to 2D array for table display
function convertSummariesToArray(summaries: DailyHypoSummary[]): (string | number)[][] {
  const headers = [
    'Date',
    'Day',
    'Severe',
    'Non-Severe',
    'Total',
    'Lowest (mmol/L)',
    'Longest (min)',
    'Total Time (min)',
    'LBGI',
  ];

  const rows = summaries.map(summary => [
    summary.date,
    summary.dayOfWeek.slice(0, 3), // Abbreviate day name
    summary.severeCount,
    summary.nonSevereCount,
    summary.totalCount,
    summary.lowestValue !== null ? formatGlucoseNumber(summary.lowestValue, 1) : 'N/A',
    Math.round(summary.longestDurationMinutes),
    Math.round(summary.totalDurationMinutes),
    formatNumber(summary.lbgi, 2),
  ]);

  return [headers, ...rows];
}

export function HyposTab({
  loading,
  hasApiKey,
  activeProvider,
  showGeekStats,
  hypoDatasets,
  responseLanguage,
  glucoseUnit,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  deepseekApiKey,
}: HyposTabProps) {
  const styles = useAIAnalysisStyles();
  const hasData = hypoDatasets !== null && hypoDatasets.dailySummaries.length > 0;
  
  const {
    analyzing,
    response,
    error,
    cooldownActive,
    cooldownSeconds,
    ready,
    retryInfo,
    startAnalysis,
    completeAnalysis,
    setAnalysisError,
    triggerCooldown,
    reset,
    setRetryInfo,
  } = useAnalysisState();

  // Reset state when data changes
  useEffect(() => {
    if (!hasData) {
      reset();
    }
  }, [hasData, reset]);

  // Helper function to try analysis with given datasets
  const tryAnalysis = async (
    hypoEventsCSV: string,
    hypoSummariesCSV: string,
    hypoEventSummaryCSV: string = ''
  ) => {
    // Base64 encode the CSV data
    const base64EventsData = base64Encode(hypoEventsCSV);
    const base64SummariesData = base64Encode(hypoSummariesCSV);
    const base64EventSummaryData = hypoEventSummaryCSV ? base64Encode(hypoEventSummaryCSV) : undefined;

    // Generate the prompt with the base64 CSV data
    const prompt = generateHyposPrompt(
      base64EventsData,
      base64SummariesData,
      responseLanguage,
      glucoseUnit,
      activeProvider!,
      base64EventSummaryData
    );

    // Get the appropriate API key for the active provider
    const apiKey = 
      activeProvider === 'perplexity' ? perplexityApiKey :
      activeProvider === 'grok' ? grokApiKey :
      activeProvider === 'deepseek' ? deepseekApiKey :
      geminiApiKey;

    // Call the AI API using the selected provider
    return await callAIApi(activeProvider!, apiKey, prompt);
  };

  const handleAnalyzeClick = async () => {
    if (!activeProvider || !hasApiKey || !hasData || !hypoDatasets) {
      return;
    }

    // If there's already a response, start cooldown before allowing new analysis
    if (response && !cooldownActive && !ready) {
      triggerCooldown();
      return;
    }

    // Don't analyze if cooldown is active
    if (cooldownActive) {
      return;
    }

    startAnalysis();
    const previousResponse = response;

    try {
      // Convert datasets to CSV format
      const hypoEventsCSV = convertHypoEventsToCSV(hypoDatasets.hypoEvents);
      const hypoSummariesCSV = convertHypoSummariesToCSV(hypoDatasets.dailySummaries);
      const hypoEventSummaryCSV = convertHypoEventSummaryToCSV(hypoDatasets.hypoEvents);

      // First attempt: try with full dataset
      let result = await tryAnalysis(hypoEventsCSV, hypoSummariesCSV, hypoEventSummaryCSV);
      let datasetInfo = '';

      // If request was too large, try with limited data
      if (!result.success && isRequestTooLargeError(result.error)) {
        setRetryInfo('Dataset too large. Retrying with summary data only...');
        
        // Second attempt: try with just summaries (no individual events)
        const emptyCsv = '';
        result = await tryAnalysis(emptyCsv, hypoSummariesCSV);
        
        if (result.success && result.content) {
          datasetInfo = '**Note:** Analysis based on daily summaries only due to dataset size constraints. Individual hypo event details were not included.\n\n';
        }
      }

      if (result.success && result.content) {
        completeAnalysis(datasetInfo + result.content);
      } else {
        // On error, keep the previous response if it exists
        setAnalysisError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          completeAnalysis(previousResponse);
        }
      }
    } catch (err) {
      // On error, keep the previous response if it exists
      setAnalysisError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        completeAnalysis(previousResponse);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.promptContent}>
        <Text className={styles.helperText}>Loading data...</Text>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={styles.promptContent}>
        <Text className={styles.helperText}>
          No hypoglycemia data available for analysis. Please ensure your data file contains CGM readings.
        </Text>
      </div>
    );
  }

  // Get stats for display
  const stats = hypoDatasets!.overallStats;
  const hasHypoEvents = hypoDatasets!.hypoEvents.length > 0;
  
  // Count hypos with preceding bolus (2-4h before)
  const hyposWithPrecedingBolus = hypoDatasets!.hypoEvents.filter(e => e.lastBolusBeforeHypo !== null).length;

  return (
    <div className={styles.promptContent}>
      {/* Header with title and subtitle */}
      <div style={{ marginBottom: '16px' }}>
        <Text className={styles.statementText} style={{ display: 'block', marginBottom: '8px' }}>
          Hypoglycemia Analysis
        </Text>
        <Text className={styles.helperText}>
          Hypoglycemia (low blood sugar) occurs when glucose levels fall below target range, 
          typically below 3.9 mmol/L (70 mg/dL). This AI analysis helps identify patterns, 
          timing, and potential causes of low glucose events.
          {' '}
          <Link href="#reports/hypos">View detailed Hypos Report →</Link>
        </Text>
      </div>

      {/* LBGI Explanation */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--colorNeutralBackground3)', borderRadius: '4px', borderLeft: '3px solid var(--colorBrandBackground)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <InfoRegular style={{ fontSize: '16px' }} />
          <Text style={{ fontWeight: 600 }}>What is LBGI?</Text>
        </div>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          <strong>LBGI (Low Blood Glucose Index)</strong> is a validated risk metric that predicts the likelihood 
          of hypoglycemia. Unlike simple glucose averages, LBGI weighs low readings more heavily, providing 
          better insight into hypo risk.{' '}
          <Tooltip 
            content="LBGI <2.5 = Low risk, 2.5-5.0 = Moderate risk, >5.0 = High risk" 
            relationship="description"
          >
            <Text style={{ textDecoration: 'underline', cursor: 'help' }}>Risk thresholds</Text>
          </Tooltip>
        </Text>
      </div>

      {/* Overview stats */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--colorNeutralBackground2)', borderRadius: '4px' }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Data Overview</Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Total days analyzed: {stats.totalDays}
        </Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Days with hypos: {stats.daysWithHypos} ({stats.totalDays > 0 ? Math.round(stats.daysWithHypos / stats.totalDays * 100) : 0}%)
        </Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Total hypo events: {stats.totalHypoEvents} (severe: {stats.totalSevereEvents})
        </Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Hypos with bolus 2-4h before: {hyposWithPrecedingBolus} ({stats.totalHypoEvents > 0 ? Math.round(hyposWithPrecedingBolus / stats.totalHypoEvents * 100) : 0}%)
        </Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Average LBGI: {formatNumber(stats.averageLBGI, 2)}
        </Text>
        <Text className={styles.helperText} style={{ display: 'block' }}>
          • Days with LBGI &gt;2.5: {stats.daysWithLBGIAbove2_5} | Days with LBGI &gt;5.0: {stats.daysWithLBGIAbove5_0}
        </Text>
      </div>

      {/* Button container */}
      <div className={styles.buttonContainer}>
        <AnalysisButton
          disabled={!hasApiKey || analyzing || (cooldownActive && cooldownSeconds > 0)}
          analyzing={analyzing}
          hasResponse={!!response}
          ready={ready}
          onClick={handleAnalyzeClick}
        />
        
        <AnalysisHelperText
          analyzing={analyzing}
          cooldownActive={cooldownActive}
          hasResponse={!!response}
          ready={ready}
          activeProvider={activeProvider}
          description="Click Analyze to get AI-powered hypoglycemia risk assessment with pattern analysis and actionable recommendations"
        />
        
        <CooldownIndicator active={cooldownActive} seconds={cooldownSeconds} />
      </div>

      {/* Retry notification */}
      <RetryNotification info={retryInfo} />

      {/* Accordion to show prompt text */}
      {showGeekStats && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="promptText">
            <AccordionHeader>View AI Prompt</AccordionHeader>
            <AccordionPanel>
              <div className={styles.promptTextContainer}>
                {(() => {
                  const hypoEventsCSV = convertHypoEventsToCSV(hypoDatasets!.hypoEvents);
                  const hypoSummariesCSV = convertHypoSummariesToCSV(hypoDatasets!.dailySummaries);
                  const base64EventsData = base64Encode(hypoEventsCSV);
                  const base64SummariesData = base64Encode(hypoSummariesCSV);
                  return generateHyposPrompt(base64EventsData, base64SummariesData, responseLanguage, glucoseUnit, activeProvider || undefined);
                })()}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* Accordion for daily summaries table */}
      {showGeekStats && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="dailySummaries">
            <AccordionHeader>Daily Hypo Summaries ({hypoDatasets!.dailySummaries.length} days)</AccordionHeader>
          <AccordionPanel>
            <TableContainer
              data={convertSummariesToArray(hypoDatasets!.dailySummaries)}
              exportFormat="csv"
              fileName="hypo-daily-summaries"
              copyAriaLabel="Copy daily hypo summaries as CSV"
              downloadAriaLabel="Download daily hypo summaries as CSV"
              scrollable
            >
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className={styles.emphasizedHeaderCell}>Date</TableHeaderCell>
                    <TableHeaderCell>Day</TableHeaderCell>
                    <TableHeaderCell>Severe</TableHeaderCell>
                    <TableHeaderCell>Non-Severe</TableHeaderCell>
                    <TableHeaderCell className={styles.emphasizedHeaderCell}>Total</TableHeaderCell>
                    <TableHeaderCell className={styles.emphasizedHeaderCell}>Lowest (mmol/L)</TableHeaderCell>
                    <TableHeaderCell>Longest</TableHeaderCell>
                    <TableHeaderCell>Total Time</TableHeaderCell>
                    <TableHeaderCell className={styles.emphasizedHeaderCell}>LBGI</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hypoDatasets!.dailySummaries.map(summary => (
                    <TableRow key={summary.date}>
                      <TableCell className={styles.emphasizedCell}>{summary.date}</TableCell>
                      <TableCell>{summary.dayOfWeek.slice(0, 3)}</TableCell>
                      <TableCell>{summary.severeCount}</TableCell>
                      <TableCell>{summary.nonSevereCount}</TableCell>
                      <TableCell className={styles.emphasizedCell}>{summary.totalCount}</TableCell>
                      <TableCell className={styles.emphasizedCell}>
                        {summary.lowestValue !== null ? formatGlucoseNumber(summary.lowestValue, 1) : 'N/A'}
                      </TableCell>
                      <TableCell>{Math.round(summary.longestDurationMinutes)}</TableCell>
                      <TableCell>{Math.round(summary.totalDurationMinutes)}</TableCell>
                      <TableCell className={styles.emphasizedCell}>{formatNumber(summary.lbgi, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      )}

      {/* Accordion for hypo events table */}
      {hasHypoEvents && showGeekStats && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="hypoEvents">
            <AccordionHeader>Hypo Events ({hypoDatasets!.hypoEvents.length} events)</AccordionHeader>
            <AccordionPanel>
              <TableContainer
                data={convertHypoEventsToArray(hypoDatasets!.hypoEvents)}
                exportFormat="csv"
                fileName="hypo-events"
                copyAriaLabel="Copy hypo events as CSV"
                downloadAriaLabel="Download hypo events as CSV"
                scrollable
              >
                <Table size="small">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Event ID</TableHeaderCell>
                      <TableHeaderCell className={styles.emphasizedHeaderCell}>Start Time</TableHeaderCell>
                      <TableHeaderCell>Duration (min)</TableHeaderCell>
                      <TableHeaderCell className={styles.emphasizedHeaderCell}>Nadir (mmol/L)</TableHeaderCell>
                      <TableHeaderCell>Nadir Time</TableHeaderCell>
                      <TableHeaderCell className={styles.emphasizedHeaderCell}>Severe</TableHeaderCell>
                      <TableHeaderCell>Last Bolus (2-4h)</TableHeaderCell>
                      <TableHeaderCell>Bolus Dose</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hypoDatasets!.hypoEvents.map(event => (
                      <TableRow key={event.eventId}>
                        <TableCell>{event.eventId}</TableCell>
                        <TableCell className={styles.emphasizedCell}>
                          {formatDateTime(event.hypoPeriod.startTime)}
                        </TableCell>
                        <TableCell>{Math.round(event.hypoPeriod.durationMinutes)}</TableCell>
                        <TableCell className={styles.emphasizedCell}>
                          {formatGlucoseNumber(event.hypoPeriod.nadir, 1)}
                        </TableCell>
                        <TableCell>{formatTime(event.hypoPeriod.nadirTime)}</TableCell>
                        <TableCell className={styles.emphasizedCell}>
                          {event.hypoPeriod.isSevere ? 'Yes' : 'No'}
                        </TableCell>
                        <TableCell>
                          {event.lastBolusBeforeHypo ? formatTime(event.lastBolusBeforeHypo.timestamp) : '-'}
                        </TableCell>
                        <TableCell>
                          {event.lastBolusBeforeHypo ? `${formatGlucoseNumber(event.lastBolusBeforeHypo.dose, 1)}U` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      <AnalysisLoading visible={analyzing} />
      <AnalysisError error={error} />
      <AnalysisResult response={response} />
    </div>
  );
}
