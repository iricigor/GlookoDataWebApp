/**
 * Glucose & Insulin Tab - AI analysis for glucose and insulin correlation
 */

import { useEffect } from 'react';
import {
  Text,
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
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
} from '@fluentui/react-components';
import { TableContainer } from '../../../components/TableContainer';
import { generateGlucoseInsulinPrompt } from '../../../features/aiAnalysis/prompts';
import { callAIWithRouting } from '../../../utils/api';
import { convertDailyReportsToCSV, calculatePercentage } from '../../../utils/data';
import { base64Encode } from '../../../utils/formatting';
import { useAIAnalysisStyles } from '../styles';
import { useAnalysisState } from '../useAnalysisState';
import {
  AnalysisButton,
  AnalysisHelperText,
  CooldownIndicator,
  AnalysisLoading,
  AnalysisError,
  AnalysisResult,
} from '../AnalysisComponents';
import type { GlucoseInsulinTabProps } from '../types';
import type { DailyReport } from '../../../types';

// Helper function to convert dataset to 2D array for CSV export
function convertDatasetToArray(reports: DailyReport[]): (string | number)[][] {
  const headers = [
    'Date',
    'Day of Week',
    'BG Below (%)',
    'BG In Range (%)',
    'BG Above (%)',
    'Basal Insulin',
    'Bolus Insulin',
    'Total Insulin'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const rows = reports.map(report => {
    const date = new Date(report.date);
    const dayOfWeek = dayNames[date.getDay()];

    return [
      report.date,
      dayOfWeek,
      `${calculatePercentage(report.stats.low, report.stats.total)}%`,
      `${calculatePercentage(report.stats.inRange, report.stats.total)}%`,
      `${calculatePercentage(report.stats.high, report.stats.total)}%`,
      report.basalInsulin !== undefined ? report.basalInsulin : '-',
      report.bolusInsulin !== undefined ? report.bolusInsulin : '-',
      report.totalInsulin !== undefined ? report.totalInsulin : '-'
    ];
  });

  return [headers, ...rows];
}

/**
 * Renders the GlucoseInsulinTab UI for performing AI-driven correlation analysis between glucose ranges and insulin doses, including controls, status, optional prompt and dataset views, and analysis results.
 *
 * @returns A JSX element containing analysis controls (Analyze button, helper text, cooldown indicator), optional "View AI Prompt" and dataset accordions, and components showing analysis loading, errors, and results.
 */
export function GlucoseInsulinTab({
  loading,
  hasApiKey,
  activeProvider,
  showGeekStats,
  combinedDataset,
  responseLanguage,
  glucoseUnit,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  isProUser,
  idToken,
  useProKeys,
}: GlucoseInsulinTabProps) {
  const styles = useAIAnalysisStyles();
  const toasterId = 'app-toaster';
  const { dispatchToast } = useToastController(toasterId);
  
  const {
    analyzing,
    response,
    error,
    cooldownActive,
    cooldownSeconds,
    ready,
    startAnalysis,
    completeAnalysis,
    setAnalysisError,
    triggerCooldown,
    reset,
  } = useAnalysisState();

  // Reset state when data changes
  useEffect(() => {
    if (combinedDataset.length === 0) {
      reset();
    }
  }, [combinedDataset.length, reset]);

  const handleAnalyzeClick = async () => {
    if (!activeProvider || combinedDataset.length === 0) {
      return;
    }

    // Pro users don't need API keys since they use backend
    if (!isProUser && !hasApiKey) {
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
      // Convert combined dataset to CSV
      const csvData = convertDailyReportsToCSV(combinedDataset);
      
      // Base64 encode the CSV data
      const base64CsvData = base64Encode(csvData);

      // Generate the prompt with the base64 CSV data
      const prompt = generateGlucoseInsulinPrompt(base64CsvData, responseLanguage, glucoseUnit, activeProvider);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

      // Call the AI API - only use backend if Pro user with Pro keys enabled AND has idToken
      const result = await callAIWithRouting(activeProvider, prompt, {
        apiKey: (isProUser && useProKeys && idToken) ? undefined : apiKey,
        idToken: idToken || undefined,
        isProUser,
        useProKeys,
      });

      // Check if fallback was used and show toast notification
      if (result.usedFallback && result.backendError) {
        dispatchToast(
          <Toast>
            <ToastTitle>Pro API Failed - Using Your Keys</ToastTitle>
            <ToastBody>
              Pro backend API is temporarily unavailable. 
              Successfully fell back to using your own API keys.
            </ToastBody>
          </Toast>,
          { intent: 'warning' }
        );
      }

      if (result.success && result.content) {
        completeAnalysis(result.content);
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

  if (combinedDataset.length === 0) {
    return (
      <div className={styles.promptContent}>
        <Text className={styles.helperText}>
          No data available for analysis
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.promptContent}>
      {/* Button container */}
      <div className={styles.buttonContainer}>
        <AnalysisButton
          disabled={!(hasApiKey || isProUser) || analyzing || (cooldownActive && cooldownSeconds > 0)}
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
          description="Click Analyze to get AI-powered correlation analysis between glucose ranges and insulin doses. You will see patterns and relationships in your daily data"
        />
        
        <CooldownIndicator active={cooldownActive} seconds={cooldownSeconds} />
      </div>

      {/* Accordion to show prompt text */}
      {showGeekStats && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="promptText">
            <AccordionHeader>View AI Prompt</AccordionHeader>
            <AccordionPanel>
              <div className={styles.promptTextContainer}>
                {(() => {
                  const csvData = convertDailyReportsToCSV(combinedDataset);
                  const base64CsvData = base64Encode(csvData);
                  return generateGlucoseInsulinPrompt(base64CsvData, responseLanguage, glucoseUnit, activeProvider || undefined);
                })()}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* Accordion for dataset table */}
      {showGeekStats && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="datasetTable">
            <AccordionHeader>Dataset showing glucose ranges and insulin doses by date</AccordionHeader>
          <AccordionPanel>
            <TableContainer
              data={convertDatasetToArray(combinedDataset)}
              exportFormat="csv"
              fileName="glucose-insulin-by-date"
              copyAriaLabel="Copy glucose and insulin data by date as CSV"
              downloadAriaLabel="Download glucose and insulin data by date as CSV"
              scrollable
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className={styles.emphasizedHeaderCell}>Date</TableHeaderCell>
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
                        <TableCell className={styles.emphasizedCell}>{report.date}</TableCell>
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