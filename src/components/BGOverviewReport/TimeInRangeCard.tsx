/**
 * Time in Range Card Component
 * Displays the TIR bar chart and statistics with inline AI analysis
 */

import { useState, useEffect } from 'react';
import { 
  Text,
  Card,
  Tooltip,
  Button,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { 
  CheckmarkCircleRegular, 
  ChevronDownRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import type { RangeCategoryMode, GlucoseUnit, GlucoseThresholds, AGPDayOfWeekFilter } from '../../types';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api';
import { calculatePercentage, convertPercentageToTime, GLUCOSE_RANGE_COLORS } from '../../utils/data';
import { callAIWithRouting } from '../../utils/api';
import { generateBGOverviewTIRPrompt } from '../../features/aiAnalysis/prompts';
import { useAnalysisState } from '../../pages/AIAnalysis/useAnalysisState';
import { MarkdownRenderer, SegmentedControl } from '../shared';
import { useBGOverviewStyles } from './styles';
import type { TIRStats } from './types';

type TIRDisplayUnit = '100%' | '24h';

interface TimeInRangeCardProps {
  tirStats: TIRStats;
  categoryMode: RangeCategoryMode;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  showGeekStats: boolean;
  dayFilter: AGPDayOfWeekFilter;
  // AI Configuration
  hasApiKey: boolean;
  activeProvider: AIProvider | null;
  apiKey: string;
  responseLanguage: ResponseLanguage;
  // Pro user props for backend AI routing
  isProUser?: boolean;
  idToken?: string | null;
  useProKeys?: boolean;
}

/** Get color for a glucose range category */
function getColorForCategory(category: string): string {
  switch (category) {
    case 'veryLow': return GLUCOSE_RANGE_COLORS.veryLow;
    case 'low': return GLUCOSE_RANGE_COLORS.low;
    case 'inRange': return GLUCOSE_RANGE_COLORS.inRange;
    case 'high': return GLUCOSE_RANGE_COLORS.high;
    case 'veryHigh': return GLUCOSE_RANGE_COLORS.veryHigh;
    default: return '#000';
  }
}

export function TimeInRangeCard({ 
  tirStats, 
  categoryMode, 
  glucoseUnit, 
  thresholds,
  showGeekStats,
  dayFilter,
  hasApiKey,
  activeProvider,
  apiKey,
  responseLanguage,
  isProUser = false,
  idToken = null,
  useProKeys = false,
}: TimeInRangeCardProps) {
  const styles = useBGOverviewStyles();
  const { t } = useTranslation('reports');
  
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  const [displayUnit, setDisplayUnit] = useState<TIRDisplayUnit>('100%');
  
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

  // Auto-expand response when new analysis completes
  useEffect(() => {
    if (response && !analyzing) {
      setIsResponseExpanded(true);
    }
  }, [response, analyzing]);

  const handleAnalyzeClick = async () => {
    if (!activeProvider) {
      return;
    }

    // Pro users don't need API keys if they're using Pro keys
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
      // Generate the prompt
      const prompt = generateBGOverviewTIRPrompt(
        tirStats,
        thresholds,
        categoryMode,
        responseLanguage,
        glucoseUnit,
        activeProvider,
        dayFilter
      );

      // Call the AI API with routing - handles Pro backend or client-side API
      const result = await callAIWithRouting(activeProvider, prompt, {
        apiKey,
        idToken: idToken ?? undefined,
        isProUser,
        useProKeys,
      });

      if (result.success && result.content) {
        completeAnalysis(result.content);
      } else {
        setAnalysisError(result.error || 'Failed to get AI response');
        if (previousResponse) {
          completeAnalysis(previousResponse);
        }
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (previousResponse) {
        completeAnalysis(previousResponse);
      }
    }
  };

  const getButtonText = () => {
    const baseText = analyzing
      ? t('reports.bgOverview.tir.analyzingButton')
      : response && !analyzing && ready
      ? t('reports.bgOverview.tir.reanalyzeButton')
      : t('reports.bgOverview.tir.analyzeButton');
    
    // Add sparkles indicator when using Pro backend keys
    const sparkles = isProUser && useProKeys ? ' ✨' : '';
    return `${baseText}${sparkles}`;
  };

  // Helper function to format display value based on selected unit
  const formatDisplayValue = (count: number): string => {
    if (displayUnit === '100%') {
      return `${calculatePercentage(count, tirStats.total)}%`;
    } else {
      return convertPercentageToTime(tirStats.total, count);
    }
  };

  return (
    <Card className={styles.tirCard}>
      <div className={styles.tirCardHeader}>
        <Text className={styles.cardTitle}>
          <CheckmarkCircleRegular className={styles.cardIcon} />
          Time in Range
        </Text>
        <SegmentedControl<TIRDisplayUnit>
          options={['100%', '24h']}
          value={displayUnit}
          onChange={setDisplayUnit}
          ariaLabel={t('reports.bgOverview.tir.unitSelector.ariaLabel')}
        />
      </div>

      <div className={styles.tirBarContainer}>
        <div className={styles.tirBar}>
          {categoryMode === 5 && (tirStats.veryLow ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryLow'),
              }}
              title={`Very Low: ${formatDisplayValue(tirStats.veryLow ?? 0)}`}
            >
              {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total) >= 5 && 
                formatDisplayValue(tirStats.veryLow ?? 0)}
            </div>
          )}
          {tirStats.low > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.low, tirStats.total)}%`,
                backgroundColor: getColorForCategory('low'),
              }}
              title={`Low: ${formatDisplayValue(tirStats.low)}`}
            >
              {calculatePercentage(tirStats.low, tirStats.total) >= 5 && 
                formatDisplayValue(tirStats.low)}
            </div>
          )}
          {tirStats.inRange > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.inRange, tirStats.total)}%`,
                backgroundColor: getColorForCategory('inRange'),
              }}
              title={`In Range: ${formatDisplayValue(tirStats.inRange)}`}
            >
              {calculatePercentage(tirStats.inRange, tirStats.total) >= 5 && 
                formatDisplayValue(tirStats.inRange)}
            </div>
          )}
          {tirStats.high > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.high, tirStats.total)}%`,
                backgroundColor: getColorForCategory('high'),
              }}
              title={`High: ${formatDisplayValue(tirStats.high)}`}
            >
              {calculatePercentage(tirStats.high, tirStats.total) >= 5 && 
                formatDisplayValue(tirStats.high)}
            </div>
          )}
          {categoryMode === 5 && (tirStats.veryHigh ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryHigh'),
              }}
              title={`Very High: ${formatDisplayValue(tirStats.veryHigh ?? 0)}`}
            >
              {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total) >= 5 && 
                formatDisplayValue(tirStats.veryHigh ?? 0)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryLow ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very Low</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryLow') }}>
                {formatDisplayValue(tirStats.veryLow ?? 0)}
              </Text>
            </div>
          </Tooltip>
        )}
        <Tooltip content={`${tirStats.low} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Low</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
              {formatDisplayValue(tirStats.low)}
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.inRange} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>In Range</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
              {formatDisplayValue(tirStats.inRange)}
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.high} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>High</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
              {formatDisplayValue(tirStats.high)}
            </Text>
          </div>
        </Tooltip>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryHigh ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very High</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                {formatDisplayValue(tirStats.veryHigh ?? 0)}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>

      <div className={styles.targetInfoContainer}>
        <div className={styles.targetInfo}>
          <Text className={styles.targetInfoText}>
            <strong>Target:</strong> 70% Time in Range (TIR) is generally considered a good target for glucose management
          </Text>
          
          {(hasApiKey || isProUser) && activeProvider && (
            <div className={styles.aiAnalysisContainer}>
              <Button
                appearance="primary"
                disabled={!(hasApiKey || isProUser) || analyzing || (cooldownActive && cooldownSeconds > 0)}
                onClick={handleAnalyzeClick}
                className={styles.aiAnalysisButton}
                icon={analyzing ? <Spinner size="tiny" /> : undefined}
              >
                {getButtonText()}
              </Button>
              {response && !analyzing && (
                <ChevronDownRegular 
                  className={`${styles.collapseIcon} ${isResponseExpanded ? styles.collapseIconExpanded : ''}`}
                  onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                  style={{ cursor: 'pointer', fontSize: '20px' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Cooldown indicator */}
        {cooldownActive && cooldownSeconds > 0 && (
          <MessageBar intent="info">
            <MessageBarBody>
              {t('reports.bgOverview.tir.waitMessage', { seconds: cooldownSeconds })}
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Error message */}
        {error && (
          <MessageBar intent="error" icon={<ErrorCircleRegular />}>
            <MessageBarBody>
              <strong>{t('reports.bgOverview.tir.errorPrefix')}</strong> {error}
            </MessageBarBody>
          </MessageBar>
        )}

        {/* AI Response */}
        {response && !analyzing && isResponseExpanded && (
          <div className={styles.aiResponseArea}>
            <div className={styles.aiResponseContent}>
              <MarkdownRenderer content={response} />
            </div>
          </div>
        )}
      </div>

      {/* Prompt accordion for geek stats */}
      {showGeekStats && hasApiKey && activeProvider && (
        <Accordion collapsible className={styles.aiAccordion}>
          <AccordionItem value="promptText">
            <AccordionHeader>{t('reports.bgOverview.tir.accordionTitle')}</AccordionHeader>
            <AccordionPanel>
              <div className={styles.promptTextContainer}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', fontFamily: 'monospace' }}>
                  {generateBGOverviewTIRPrompt(
                    tirStats,
                    thresholds,
                    categoryMode,
                    responseLanguage,
                    glucoseUnit,
                    activeProvider,
                    dayFilter
                  )}
                </pre>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
}
