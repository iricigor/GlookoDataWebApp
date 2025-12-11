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
      // Generate the prompt with the glucose stats and thresholds
      const prompt = generateTimeInRangePrompt(glucoseStats, thresholds, responseLanguage, glucoseUnit, activeProvider);

      // Get the appropriate API key for the active provider (only needed for non-Pro users)
      const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                      activeProvider === 'grok' ? grokApiKey : geminiApiKey;

      // Call the AI API - it will automatically route to backend for Pro users
      const result = await callAIWithRouting(activeProvider, prompt, {
        apiKey: isProUser ? undefined : apiKey,
        idToken: idToken || undefined,
        isProUser,
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
                {glucoseStats && generateTimeInRangePrompt(glucoseStats, thresholds, responseLanguage, glucoseUnit, activeProvider || undefined)}
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
