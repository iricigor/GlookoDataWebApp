/**
 * Pump Settings Tab - AI analysis for pump settings verification
 */

import { useEffect } from 'react';
import {
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { generatePumpSettingsPrompt } from '../../../features/aiAnalysis/prompts';
import { callAIWithRouting, isRequestTooLargeError } from '../../../utils/api';
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
import type { PumpSettingsTabProps } from '../types';
import type { GlucoseReading, InsulinReading } from '../../../types';

/**
 * Renders the Pump Settings analysis tab UI and coordinates AI-driven verification of pump settings from provided datasets.
 *
 * Displays UI controls to start analysis, handles dataset size fallbacks (full → 28 days → 7 days), routes requests differently for Pro users, and shows analysis status, errors, and results.
 *
 * @param loading - Whether underlying data is still loading
 * @param hasApiKey - Whether a valid local API key is available for non-Pro flows
 * @param activeProvider - Selected AI provider identifier (e.g., 'perplexity', 'grok', 'deepseek', or provider for Gemini)
 * @param showGeekStats - When true, shows developer-facing debug accordions (prompt and dataset summary)
 * @param mealTimingDatasets - Object containing input datasets: `cgmReadings`, `bolusReadings`, and `basalReadings`
 * @param responseLanguage - Target language for the AI response
 * @param glucoseUnit - Glucose unit used for formatting and prompt (e.g., 'mg/dL' or 'mmol/L')
 * @param perplexityApiKey - API key for the Perplexity provider (used for non-Pro users)
 * @param geminiApiKey - API key for Gemini provider (used for non-Pro users)
 * @param grokApiKey - API key for the Grok provider (used for non-Pro users)
 * @param deepseekApiKey - API key for the Deepseek provider (used for non-Pro users)
 * @param isProUser - When true, routes AI requests through the backend and omits a per-call API key
 * @param idToken - Optional identity token forwarded for backend-routed (Pro) requests
 * @returns The rendered Pump Settings tab React element
 */
export function PumpSettingsTab({
  loading,
  hasApiKey,
  activeProvider,
  showGeekStats,
  mealTimingDatasets,
  responseLanguage,
  glucoseUnit,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  deepseekApiKey,
  isProUser,
  idToken,
  useProKeys,
}: PumpSettingsTabProps) {
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
    // When using Pro backend keys, don't specify a provider to avoid mismatch
    const promptProvider = (isProUser && useProKeys) ? undefined : (activeProvider || undefined);
    const prompt = generatePumpSettingsPrompt(base64CgmData, base64BolusData, base64BasalData, responseLanguage, glucoseUnit, promptProvider);

    // Get the appropriate API key for the active provider
    const apiKey = activeProvider === 'perplexity' ? perplexityApiKey
                  : activeProvider === 'grok' ? grokApiKey
                  : activeProvider === 'deepseek' ? deepseekApiKey
                  : geminiApiKey;

    // Call the AI API with routing - the routing logic handles Pro vs client-side API calls
    return await callAIWithRouting(activeProvider!, prompt, {
      apiKey: apiKey,
      idToken: idToken || undefined,
      isProUser,
      useProKeys,
    });
  };

  const handleAnalyzeClick = async () => {
    if (!activeProvider || !hasData) {
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
          No CGM or bolus data available for pump settings analysis. Please ensure your data file contains both CGM readings and bolus insulin data.
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
          description="Click Analyze to get AI-powered pump settings verification. The AI will infer your current pump settings, validate them, and provide specific recommendations for basal rates, insulin sensitivity factor (ISF), and carb ratios across different time segments"
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
                  return generatePumpSettingsPrompt(base64CgmData, base64BolusData, base64BasalData, responseLanguage, glucoseUnit, (isProUser && useProKeys) ? undefined : (activeProvider || undefined));
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