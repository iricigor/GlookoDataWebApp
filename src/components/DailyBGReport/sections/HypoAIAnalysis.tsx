/**
 * Hypoglycemia AI Analysis Component
 * Displays AI analysis section with button, response, and geek stats accordion
 */

import { useState, useEffect } from 'react';
import {
  Text,
  tokens,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import {
  ChevronDownRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import type { GlucoseUnit } from '../../../types';
import type { HypoStats } from '../../../utils/data/hypoDataUtils';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { AIProvider } from '../../../utils/api';
import { callAIWithRouting } from '../../../utils/api';
import { generateHyposPrompt } from '../../../features/aiAnalysis/prompts';
import { convertHypoEventsToCSV, convertHypoSummariesToCSV } from '../../../utils/data';
import { base64Encode } from '../../../utils/formatting';
import { useAnalysisState } from '../../../pages/AIAnalysis/useAnalysisState';
import { usePromptProvider } from '../../../hooks/usePromptProvider';
import { MarkdownRenderer } from '../../shared';

interface HypoAIAnalysisProps {
  hypoStats: HypoStats;
  currentDate?: string;
  hasApiKey?: boolean;
  activeProvider?: AIProvider | null;
  apiKey?: string;
  responseLanguage?: ResponseLanguage;
  isProUser?: boolean;
  idToken?: string | null;
  useProKeys?: boolean;
  showGeekStats?: boolean;
  glucoseUnit: GlucoseUnit;
}

/**
 * Renders AI analysis section for hypoglycemia
 */
export function HypoAIAnalysis({
  hypoStats,
  currentDate,
  hasApiKey = false,
  activeProvider = null,
  apiKey = '',
  responseLanguage = 'english',
  isProUser = false,
  idToken = null,
  useProKeys = false,
  showGeekStats = false,
  glucoseUnit,
}: HypoAIAnalysisProps) {
  const { t } = useTranslation('reports');
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  
  // AI analysis state
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
  } = useAnalysisState();
  
  // Determine the provider to use in prompts
  const { promptProvider } = usePromptProvider({ isProUser, useProKeys, activeProvider });
  
  // Auto-expand response when new analysis completes
  useEffect(() => {
    if (response && !analyzing) {
      setIsResponseExpanded(true);
    }
  }, [response, analyzing]);
  
  /**
   * Get button text based on current state
   * Adds sparkles (✨) for Pro users using backend keys
   */
  const getButtonText = (): string => {
    const baseText = analyzing
      ? t('reports.dailyBG.hypoAnalysis.analyzingButton')
      : response && !analyzing && ready
      ? t('reports.dailyBG.hypoAnalysis.reanalyzeButton')
      : t('reports.dailyBG.hypoAnalysis.analyzeButton');
    
    // Add sparkles indicator when using Pro backend keys
    const sparkles = isProUser && useProKeys ? ' ✨' : '';
    return `${baseText}${sparkles}`;
  };
  
  /**
   * Handle AI analysis button click
   */
  const handleAnalyzeClick = async () => {
    if (!activeProvider || !currentDate) {
      return;
    }
    
    const hasRequiredAuth = isProUser || hasApiKey;
    if (!hasRequiredAuth) {
      return;
    }
    
    // If there's already a response and cooldown hasn't been triggered yet, start cooldown
    if (response && !analyzing && !cooldownActive) {
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
      // For single-day analysis, convert hypo periods to CSV format
      const hypoEventsCSV = convertHypoEventsToCSV([]);
      const hypoSummariesCSV = convertHypoSummariesToCSV([]);
      
      // Base64 encode the CSV data
      const base64EventsData = base64Encode(hypoEventsCSV);
      const base64SummariesData = base64Encode(hypoSummariesCSV);
      
      // Generate the prompt using shared prompt generator
      const prompt = generateHyposPrompt(
        base64EventsData,
        base64SummariesData,
        responseLanguage,
        glucoseUnit,
        promptProvider
      );
      
      // Call the AI API with routing (handles Pro vs client-side) - use apiKey prop directly
      const result = await callAIWithRouting(activeProvider, prompt, {
        apiKey,
        idToken: idToken ?? undefined,
        isProUser,
        useProKeys,
      });
      
      if (result.success && result.content) {
        completeAnalysis(result.content);
      } else {
        setAnalysisError(result.error || t('reports.dailyBG.hypoAnalysis.errorFailed'));
        if (previousResponse) {
          completeAnalysis(previousResponse);
        }
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : t('reports.dailyBG.hypoAnalysis.errorUnexpected'));
      if (previousResponse) {
        completeAnalysis(previousResponse);
      }
    }
  };
  
  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      backgroundColor: tokens.colorNeutralBackground2,
      borderRadius: '12px',
      border: `1px solid ${tokens.colorNeutralStroke1}`,
    }}>
      {/* General message and button in same row, button right-aligned */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px',
        gap: '16px'
      }}>
        <Text style={{ 
          flex: 1,
          fontSize: tokens.fontSizeBase300,
          color: tokens.colorNeutralForeground2,
        }}>
          {hypoStats.totalCount === 0 
            ? t('reports.dailyBG.hypoAnalysis.aiAnalysis.noHypos', { date: currentDate || 'this day' })
            : t('reports.dailyBG.hypoAnalysis.aiAnalysis.hyposDetected', { 
                count: hypoStats.totalCount, 
                date: currentDate || 'this day',
                severe: hypoStats.severeCount > 0 
                  ? t('reports.dailyBG.hypoAnalysis.aiAnalysis.hyposDetectedSevere', { severeCount: hypoStats.severeCount })
                  : ''
              })
          }
        </Text>
        
        {/* AI Analysis Button - Right aligned, always visible */}
        <Button
          appearance="primary"
          disabled={(!hasApiKey && !isProUser) || analyzing || (cooldownActive && cooldownSeconds > 0)}
          onClick={handleAnalyzeClick}
          icon={analyzing ? <Spinner size="tiny" /> : undefined}
        >
          {getButtonText()}
        </Button>
      </div>
      
      {/* Dropdown icon - shown after response is received */}
      {response && !analyzing && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <ChevronDownRegular 
            style={{ 
              cursor: 'pointer', 
              fontSize: '20px',
              transform: isResponseExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
            onClick={() => setIsResponseExpanded(!isResponseExpanded)}
          />
        </div>
      )}
      
      {/* Cooldown indicator - Localized */}
      {cooldownActive && cooldownSeconds > 0 && (
        <MessageBar intent="info">
          <MessageBarBody>
            {t('reports.dailyBG.hypoAnalysis.waitMessage', { seconds: cooldownSeconds })}
          </MessageBarBody>
        </MessageBar>
      )}
      
      {/* Error message - Localized */}
      {error && (
        <MessageBar intent="error" icon={<ErrorCircleRegular />}>
          <MessageBarBody>
            <strong>{t('reports.dailyBG.hypoAnalysis.errorPrefix')}</strong> {error}
          </MessageBarBody>
        </MessageBar>
      )}
      
      {/* AI Response */}
      {response && !analyzing && isResponseExpanded && (
        <div style={{
          padding: '16px',
          backgroundColor: tokens.colorNeutralBackground3,
          borderRadius: tokens.borderRadiusMedium,
          marginTop: '12px',
        }}>
          <MarkdownRenderer content={response} />
        </div>
      )}
      
      {/* Geek Stats - AI Prompt Accordion (only when enabled) */}
      {showGeekStats && activeProvider && (
        <Accordion collapsible style={{ marginTop: '16px' }}>
          <AccordionItem value="aiPrompt">
            <AccordionHeader>{t('reports.dailyBG.hypoAnalysis.accordionTitle')}</AccordionHeader>
            <AccordionPanel>
              <div style={{
                padding: '12px',
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusMedium,
                fontFamily: 'monospace',
                fontSize: tokens.fontSizeBase200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {(() => {
                  const hypoEventsCSV = convertHypoEventsToCSV([]);
                  const hypoSummariesCSV = convertHypoSummariesToCSV([]);
                  const base64EventsData = base64Encode(hypoEventsCSV);
                  const base64SummariesData = base64Encode(hypoSummariesCSV);
                  return generateHyposPrompt(
                    base64EventsData,
                    base64SummariesData,
                    responseLanguage,
                    glucoseUnit,
                    promptProvider
                  );
                })()}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
