/**
 * Meal Timing Tab - AI analysis for meal timing patterns
 */

import { useEffect } from 'react';
import {
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { generateMealTimingPrompt } from '../../../features/aiAnalysis/prompts';
import { callAIApi, isRequestTooLargeError } from '../../../utils/api';
import { 
  convertGlucoseReadingsToCSV, 
  convertBolusReadingsToCSV, 
  convertBasalReadingsToCSV,
  filterGlucoseReadingsToLastDays,
  filterInsulinReadingsToLastDays,
} from '../../../utils/data';
import { base64Encode } from '../../../utils/formatting';
import { formatDate } from '../../../utils/formatting/formatters';
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
import type { MealTimingTabProps } from '../types';
import type { GlucoseReading, InsulinReading } from '../../../types';

export function MealTimingTab({
  loading,
  hasApiKey,
  activeProvider,
  mealTimingDatasets,
  responseLanguage,
  glucoseUnit,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
}: MealTimingTabProps) {
  const styles = useAIAnalysisStyles();
  const { cgmReadings, bolusReadings, basalReadings } = mealTimingDatasets;
  const hasData = cgmReadings.length > 0 && bolusReadings.length > 0;
  
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
    cgm: GlucoseReading[],
    bolus: InsulinReading[],
    basal: InsulinReading[]
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
    const prompt = generateMealTimingPrompt(base64CgmData, base64BolusData, base64BasalData, responseLanguage, glucoseUnit, activeProvider!);

    // Get the appropriate API key for the active provider
    const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                    activeProvider === 'grok' ? grokApiKey : geminiApiKey;

    // Call the AI API using the selected provider
    return await callAIApi(activeProvider!, apiKey, prompt);
  };

  const handleAnalyzeClick = async () => {
    if (!activeProvider || !hasApiKey || !hasData) {
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
      // First attempt: try with full dataset
      let result = await tryAnalysis(cgmReadings, bolusReadings, basalReadings);
      let datasetInfo = '';

      // If request was too large, try with smaller dataset (last 28 days)
      if (!result.success && isRequestTooLargeError(result.error)) {
        setRetryInfo('Dataset too large. Retrying with last 28 days of data...');
        
        // Filter datasets to last 28 days
        const filteredCgm28 = filterGlucoseReadingsToLastDays(cgmReadings, 28);
        const filteredBolus28 = filterInsulinReadingsToLastDays(bolusReadings, 28);
        const filteredBasal28 = filterInsulinReadingsToLastDays(basalReadings, 28);

        // Verify we still have data after filtering
        if (filteredCgm28.length > 0 && filteredBolus28.length > 0) {
          // Second attempt: try with 28-day filtered dataset
          result = await tryAnalysis(filteredCgm28, filteredBolus28, filteredBasal28);
          
          // If still too large, try with 7 days
          if (!result.success && isRequestTooLargeError(result.error)) {
            setRetryInfo('28-day dataset still too large. Retrying with last 7 days of data...');
            
            // Filter datasets to last 7 days
            const filteredCgm7 = filterGlucoseReadingsToLastDays(cgmReadings, 7);
            const filteredBolus7 = filterInsulinReadingsToLastDays(bolusReadings, 7);
            const filteredBasal7 = filterInsulinReadingsToLastDays(basalReadings, 7);

            // Verify we still have data after filtering
            if (filteredCgm7.length > 0 && filteredBolus7.length > 0) {
              // Third attempt: try with 7-day filtered dataset
              result = await tryAnalysis(filteredCgm7, filteredBolus7, filteredBasal7);
              
              if (result.success && result.content) {
                datasetInfo = '**Note:** Analysis based on the last 7 days of data due to dataset size constraints.\n\n';
              }
            }
          } else if (result.success && result.content) {
            datasetInfo = '**Note:** Analysis based on the last 28 days of data due to dataset size constraints.\n\n';
          }
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
          No CGM or bolus data available for meal timing analysis. Please ensure your data file contains both CGM readings and bolus insulin data.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.promptContent}>
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
          description="Click Analyze to get AI-powered meal timing analysis with day-of-week patterns. You will receive meal-specific recommendations based on your glucose and insulin data"
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
                  const cgmCsv = convertGlucoseReadingsToCSV(cgmReadings);
                  const bolusCsv = convertBolusReadingsToCSV(bolusReadings);
                  const basalCsv = convertBasalReadingsToCSV(basalReadings);
                  const base64CgmData = base64Encode(cgmCsv);
                  const base64BolusData = base64Encode(bolusCsv);
                  const base64BasalData = base64Encode(basalCsv);
                  return generateMealTimingPrompt(base64CgmData, base64BolusData, base64BasalData, responseLanguage, glucoseUnit, activeProvider || undefined);
                })()}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* Accordion for dataset summaries */}
      {showGeekStats && (
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
                    <strong>Date Range:</strong> {formatDate(cgmReadings[0].timestamp)} - {formatDate(cgmReadings[cgmReadings.length - 1].timestamp)}
                  </Text>
                </>
              )}
            </div>
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
