/**
 * Time in Range Tab - AI analysis for glucose time in range
 */

import { useState, useEffect } from 'react';
import {
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { generateTimeInRangePrompt } from '../../../features/aiAnalysis/prompts';
import { callAIWithRouting } from '../../../utils/api';
import { useGlucoseThresholds } from '../../../hooks/useGlucoseThresholds';
import { usePromptProvider } from '../../../hooks/usePromptProvider';
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
import type { TimeInRangeTabProps } from '../types';

/**
 * Render the Time in Range analysis tab with controls to run AI-based analysis, show cooldown/status, and display results.
 *
 * @param loading - Whether glucose data is still loading
 * @param hasApiKey - Whether a non-Pro API key is available for AI providers
 * @param activeProvider - Selected AI provider identifier (e.g., "perplexity", "grok", "gemini")
 * @param showGeekStats - Whether to show the collapsible prompt text ("geek" view)
 * @param inRangePercentage - Percentage of time the user's glucose is in range
 * @param glucoseStats - Aggregated glucose statistics used to generate the AI prompt and analysis
 * @param responseLanguage - Language to request the AI response in
 * @param glucoseUnit - Unit used for glucose values (e.g., "mg/dL" or "mmol/L")
 * @param perplexityApiKey - API key for the Perplexity provider (used for non-Pro users)
 * @param geminiApiKey - API key for the Gemini provider (used for non-Pro users)
 * @param grokApiKey - API key for the Grok provider (used for non-Pro users)
 * @param selectedFile - Currently selected CGM data file (used to associate and save analysis results)
 * @param onAnalysisComplete - Callback invoked when an analysis is successfully saved; receives (fileId, response, inRangePercentage)
 * @param existingAnalysis - Previously saved analysis for the selected file; if present it will be loaded into the UI
 * @param isProUser - Whether the current user is a Pro user (routes AI requests through backend instead of client-side API keys)
 * @param idToken - Authentication token forwarded for Pro-user routing of AI requests
 * @returns The JSX element for the Time in Range tab UI including analyze controls, status, prompt viewer, and result display
 */
export function TimeInRangeTab({
  loading,
  hasApiKey,
  activeProvider,
  showGeekStats,
  inRangePercentage,
  glucoseStats,
  responseLanguage,
  glucoseUnit,
  perplexityApiKey,
  geminiApiKey,
  grokApiKey,
  selectedFile,
  onAnalysisComplete,
  existingAnalysis,
  isProUser,
  idToken,
  useProKeys,
}: TimeInRangeTabProps) {
  const styles = useAIAnalysisStyles();
  const { thresholds } = useGlucoseThresholds();
  
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
  
  // Determine the provider to use in prompts based on Pro user settings
  const { promptProvider } = usePromptProvider({ isProUser, useProKeys, activeProvider });
  
  // Track if we've loaded an existing analysis for this session
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);
  
  // Load existing analysis when component mounts or file changes
  useEffect(() => {
    if (existingAnalysis && selectedFile?.id === existingAnalysis.fileId && !hasLoadedExisting) {
      completeAnalysis(existingAnalysis.response);
      setHasLoadedExisting(true);
    }
  }, [existingAnalysis, selectedFile?.id, completeAnalysis, hasLoadedExisting]);

  // Reset state when file changes
  useEffect(() => {
    if (!selectedFile) {
      reset();
      setHasLoadedExisting(false);
    }
  }, [selectedFile, reset]);

  const handleAnalyzeClick = async () => {
    if (!activeProvider || inRangePercentage === null || !glucoseStats) {
      return;
    }

    // Pro users don't need API keys since they use backend, OR they have their own keys
    const hasRequiredAuth = isProUser || hasApiKey;
    if (!hasRequiredAuth) {
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
      // Generate the prompt with the glucose stats and thresholds
      const prompt = generateTimeInRangePrompt(glucoseStats, thresholds, responseLanguage, glucoseUnit, promptProvider);

      // Get the appropriate API key for the active provider
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

      // Call the AI API with routing - the routing logic handles Pro vs client-side API calls
      const result = await callAIWithRouting(activeProvider, prompt, {
        apiKey: apiKey,
        idToken: idToken || undefined,
        isProUser,
        useProKeys,
      });

      if (result.success && result.content) {
        completeAnalysis(result.content);
        // Save the analysis result
        if (selectedFile?.id) {
          onAnalysisComplete(selectedFile.id, result.content, inRangePercentage);
        }
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
        <Text className={styles.helperText}>Loading glucose data...</Text>
      </div>
    );
  }

  if (inRangePercentage === null) {
    return (
      <div className={styles.promptContent}>
        <Text className={styles.helperText}>
          No CGM data available for analysis
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
          description="Click Analyze to get AI-powered insights on your Time in Range percentage. You will receive personalized feedback and recommendations based on your glucose data"
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
                {glucoseStats && generateTimeInRangePrompt(glucoseStats, thresholds, responseLanguage, glucoseUnit, promptProvider)}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      <Text className={styles.statementText} style={{ marginTop: '16px' }}>
        Your glucose is {inRangePercentage}% of time in range.
      </Text>

      <AnalysisLoading visible={analyzing} />
      <AnalysisError error={error} />
      <AnalysisResult response={response} />
    </div>
  );
}