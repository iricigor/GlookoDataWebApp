/**
 * Hypoglycemia AI Analysis Component
 * Displays AI analysis section with button, response, and geek stats accordion
 */

import { useState, useEffect, useMemo } from 'react';
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
  InfoRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import type { GlucoseUnit, GlucoseReading, InsulinReading, GlucoseThresholds } from '../../../types';
import type { HypoStats } from '../../../utils/data/hypoDataUtils';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { AIProvider } from '../../../utils/api';
import { callAIWithRouting } from '../../../utils/api';
import { generateHyposReportPrompt } from '../../../features/aiAnalysis/prompts';
import { extractDetailedHypoEvents, convertDetailedHypoEventsToCSV, parseHypoAIResponseByEventId, type DetailedHypoEvent, type EventAnalysis } from '../../../utils/data/hyposReportAIDataUtils';
import { base64Encode } from '../../../utils/formatting';
import { useAnalysisState } from '../../../pages/AIAnalysis/useAnalysisState';
import { usePromptProvider } from '../../../hooks/usePromptProvider';

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
  // New props for detailed analysis
  glucoseReadings?: GlucoseReading[];
  thresholds?: GlucoseThresholds;
  bolusReadings?: InsulinReading[];
  basalReadings?: InsulinReading[];
}

/**
 * Helper function to build the hypos prompt for daily analysis
 * @param responseLanguage - Language for the AI response
 * @param glucoseUnit - Unit for glucose values (mg/dL or mmol/L)
 * @param promptProvider - Provider name to use in prompt
 * @param detailedEvents - Detailed hypo events for the day
 * @returns Generated prompt string
 */
function buildHyposPrompt(
  responseLanguage: ResponseLanguage,
  glucoseUnit: GlucoseUnit,
  promptProvider: AIProvider | undefined,
  detailedEvents: DetailedHypoEvent[]
): string {
  if (detailedEvents.length === 0) {
    return 'No hypoglycemia events found for this day.';
  }
  
  // Convert detailed events to CSV
  const eventsCSV = convertDetailedHypoEventsToCSV(detailedEvents);
  const base64Data = base64Encode(eventsCSV);
  
  // Generate and return the prompt using the detailed prompt generator
  return generateHyposReportPrompt(
    base64Data,
    detailedEvents.length,
    responseLanguage,
    glucoseUnit,
    promptProvider ?? 'gemini' // Fallback to gemini if undefined
  );
}

/**
 * Render the AI-driven hypoglycemia analysis UI, including the analysis control, response display, cooldown and error messages, and an optional "geek stats" prompt inspector.
 *
 * The component shows a summary of detected hypos for the provided date, a primary button to start or re-run analysis (with Pro-key indicator when applicable), an expandable AI response rendered as Markdown, localized cooldown and error messages, and—when enabled—an accordion containing the generated AI prompt for debugging.
 *
 * @returns The component's UI as a React element.
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
  glucoseReadings = [],
  thresholds,
  bolusReadings = [],
  basalReadings = [],
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
  
  // Extract detailed hypo events for the current day
  const detailedEvents = useMemo(() => {
    if (!currentDate || !thresholds || glucoseReadings.length === 0) {
      return [];
    }
    return extractDetailedHypoEvents(
      glucoseReadings,
      thresholds,
      bolusReadings,
      basalReadings,
      currentDate
    );
  }, [currentDate, thresholds, glucoseReadings, bolusReadings, basalReadings]);
  
  // Parse AI response to extract individual event analyses
  const parsedEvents = useMemo(() => {
    if (!response) return new Map<string, EventAnalysis>();
    return parseHypoAIResponseByEventId(response);
  }, [response]);
  
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
      // Generate the prompt using detailed events
      const prompt = buildHyposPrompt(responseLanguage, glucoseUnit, promptProvider, detailedEvents);
      
      // Call the AI API with routing (handles Pro vs client-side)
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
  
  /**
   * Render individual event analysis card
   */
  const renderEventCard = (analysis: EventAnalysis, event: DetailedHypoEvent | undefined, index: number) => {
    const eventTime = event ? event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : analysis.eventTime || 'Unknown';
    
    // Format nadir value with correct unit
    const nadirValue = event 
      ? `${glucoseUnit === 'mg/dL' ? event.nadirValueMgdl : (event.nadirValueMgdl / 18).toFixed(1)} ${glucoseUnit}`
      : analysis.nadirValue || 'Unknown';
    
    return (
      <div key={index} style={{
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        marginBottom: tokens.spacingVerticalS,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: tokens.spacingVerticalXS,
        }}>
          <Text style={{
            fontWeight: tokens.fontWeightSemibold,
            fontSize: tokens.fontSizeBase400,
          }}>
            {analysis.eventId} - Event at {eventTime}
          </Text>
          <span style={{
            padding: '2px 8px',
            backgroundColor: tokens.colorPaletteRedBackground2,
            color: tokens.colorPaletteRedForeground2,
            borderRadius: tokens.borderRadiusSmall,
            fontSize: tokens.fontSizeBase200,
          }}>
            Nadir: {nadirValue}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacingHorizontalXS,
          marginBottom: tokens.spacingVerticalXS,
        }}>
          <InfoRegular />
          <Text>Primary Suspect:</Text>
          <span style={{
            padding: '4px 10px',
            backgroundColor: tokens.colorBrandBackground2,
            color: tokens.colorBrandForeground2,
            borderRadius: tokens.borderRadiusSmall,
            fontSize: tokens.fontSizeBase200,
            fontWeight: tokens.fontWeightSemibold,
          }}>
            {analysis.primarySuspect}
          </span>
        </div>
        
        <Text style={{
          fontSize: tokens.fontSizeBase300,
          color: tokens.colorNeutralForeground1,
          lineHeight: '1.5',
        }}>
          <strong>Recommendation:</strong> {analysis.actionableInsight}
        </Text>
        
        {analysis.mealTime && (
          <Text style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground3,
            marginTop: tokens.spacingVerticalXS,
          }}>
            Estimated meal time: {analysis.mealTime}
          </Text>
        )}
      </div>
    );
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
          {(() => {
            if (hypoStats.totalCount === 0) {
              return t('reports.dailyBG.hypoAnalysis.aiAnalysis.noHypos', { 
                date: currentDate || 'this day' 
              });
            }
            
            // Compute the severe text first (so interpolation happens)
            const severeText = hypoStats.severeCount > 0 
              ? t('reports.dailyBG.hypoAnalysis.aiAnalysis.hyposDetectedSevere', { 
                  severeCount: hypoStats.severeCount 
                })
              : '';
            
            // Then pass it as a simple string to the parent translation
            return t('reports.dailyBG.hypoAnalysis.aiAnalysis.hyposDetected', { 
              count: hypoStats.totalCount, 
              date: currentDate || 'this day',
              severe: severeText
            });
          })()}
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
      
      {/* AI Response - Parsed event cards */}
      {response && !analyzing && isResponseExpanded && parsedEvents.size > 0 && (
        <div style={{
          marginTop: tokens.spacingVerticalS,
        }}>
          <Text style={{
            display: 'block',
            fontWeight: tokens.fontWeightSemibold,
            fontSize: tokens.fontSizeBase400,
            marginBottom: tokens.spacingVerticalS,
          }}>
            Event Analysis
          </Text>
          {detailedEvents.map((event, index) => {
            const analysis = parsedEvents.get(event.eventId);
            if (!analysis) return null;
            return renderEventCard(analysis, event, index);
          })}
        </div>
      )}
      
      {/* Geek Stats - AI Prompt and Full Response Accordions */}
      {showGeekStats && activeProvider && (
        <Accordion collapsible multiple style={{ marginTop: tokens.spacingVerticalM }}>
          {/* AI Prompt Accordion */}
          <AccordionItem value="aiPrompt">
            <AccordionHeader>{t('reports.dailyBG.hypoAnalysis.accordionPromptTitle')}</AccordionHeader>
            <AccordionPanel>
              <div style={{
                padding: tokens.spacingVerticalS,
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusMedium,
                fontFamily: 'monospace',
                fontSize: tokens.fontSizeBase200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {buildHyposPrompt(responseLanguage, glucoseUnit, promptProvider, detailedEvents)}
              </div>
            </AccordionPanel>
          </AccordionItem>
          
          {/* Full AI Response Accordion */}
          {response && (
            <AccordionItem value="fullResponse">
              <AccordionHeader>{t('reports.dailyBG.hypoAnalysis.accordionResponseTitle')}</AccordionHeader>
              <AccordionPanel>
                <div style={{
                  padding: tokens.spacingVerticalS,
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusMedium,
                  fontFamily: 'monospace',
                  fontSize: tokens.fontSizeBase200,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}>
                  {response}
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
}