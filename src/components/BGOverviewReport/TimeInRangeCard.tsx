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
import type { RangeCategoryMode, GlucoseUnit, GlucoseThresholds } from '../../types';
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api';
import { calculatePercentage, GLUCOSE_RANGE_COLORS } from '../../utils/data';
import { callAIApi } from '../../utils/api';
import { generateBGOverviewTIRPrompt } from '../../features/aiAnalysis/prompts';
import { useAnalysisState } from '../../pages/AIAnalysis/useAnalysisState';
import { MarkdownRenderer } from '../shared';
import { useBGOverviewStyles } from './styles';
import type { TIRStats } from './types';

interface TimeInRangeCardProps {
  tirStats: TIRStats;
  categoryMode: RangeCategoryMode;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  showGeekStats: boolean;
  // AI Configuration
  hasApiKey: boolean;
  activeProvider: AIProvider | null;
  apiKey: string;
  responseLanguage: ResponseLanguage;
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
  hasApiKey,
  activeProvider,
  apiKey,
  responseLanguage,
}: TimeInRangeCardProps) {
  const styles = useBGOverviewStyles();
  const { t } = useTranslation('reports');
  
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  
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
    if (!activeProvider || !hasApiKey) {
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
      // Generate the prompt
      const prompt = generateBGOverviewTIRPrompt(
        tirStats,
        thresholds,
        categoryMode,
        responseLanguage,
        glucoseUnit,
        activeProvider
      );

      // Call the AI API
      const result = await callAIApi(activeProvider, apiKey, prompt);

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
    if (analyzing) {
      return t('reports.bgOverview.tir.analyzingButton');
    }
    if (response && !ready) {
      return t('reports.bgOverview.tir.reanalyzeButton');
    }
    return t('reports.bgOverview.tir.analyzeButton');
  };

  return (
    <Card className={styles.tirCard}>
      <Text className={styles.cardTitle}>
        <CheckmarkCircleRegular className={styles.cardIcon} />
        Time in Range
      </Text>

      <div className={styles.tirBarContainer}>
        <div className={styles.tirBar}>
          {categoryMode === 5 && (tirStats.veryLow ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryLow'),
              }}
              title={`Very Low: ${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            </div>
          )}
          {tirStats.low > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.low, tirStats.total)}%`,
                backgroundColor: getColorForCategory('low'),
              }}
              title={`Low: ${calculatePercentage(tirStats.low, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.low, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.low, tirStats.total)}%`}
            </div>
          )}
          {tirStats.inRange > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.inRange, tirStats.total)}%`,
                backgroundColor: getColorForCategory('inRange'),
              }}
              title={`In Range: ${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.inRange, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            </div>
          )}
          {tirStats.high > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.high, tirStats.total)}%`,
                backgroundColor: getColorForCategory('high'),
              }}
              title={`High: ${calculatePercentage(tirStats.high, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.high, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.high, tirStats.total)}%`}
            </div>
          )}
          {categoryMode === 5 && (tirStats.veryHigh ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryHigh'),
              }}
              title={`Very High: ${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
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
                {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
        <Tooltip content={`${tirStats.low} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Low</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
              {calculatePercentage(tirStats.low, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.inRange} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>In Range</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
              {calculatePercentage(tirStats.inRange, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.high} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>High</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
              {calculatePercentage(tirStats.high, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryHigh ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very High</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
      </div>

      <div className={styles.targetInfo}>
        <Text className={styles.targetInfoText}>
          <strong>Target:</strong> 70% Time in Range (TIR) is generally considered a good target for glucose management
        </Text>
        
        {hasApiKey && activeProvider && (
          <div className={styles.aiAnalysisContainer}>
            <Button
              appearance="primary"
              disabled={!hasApiKey || analyzing || (cooldownActive && cooldownSeconds > 0)}
              onClick={handleAnalyzeClick}
              className={styles.aiAnalysisButton}
              icon={analyzing ? <Spinner size="tiny" /> : undefined}
            >
              {getButtonText()}
            </Button>
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
      {response && !analyzing && (
        <div className={styles.aiResponseArea}>
          <div 
            className={styles.aiResponseHeader}
            onClick={() => setIsResponseExpanded(!isResponseExpanded)}
          >
            <Text weight="semibold">{t('reports.bgOverview.tir.successMessage')}</Text>
            <ChevronDownRegular 
              className={`${styles.collapseIcon} ${isResponseExpanded ? styles.collapseIconExpanded : ''}`}
            />
          </div>
          {isResponseExpanded && (
            <div className={styles.aiResponseContent}>
              <MarkdownRenderer content={response} />
            </div>
          )}
        </div>
      )}

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
                    activeProvider
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

  return (
    <Card className={styles.tirCard}>
      <Text className={styles.cardTitle}>
        <CheckmarkCircleRegular className={styles.cardIcon} />
        Time in Range
      </Text>

      <div className={styles.tirBarContainer}>
        <div className={styles.tirBar}>
          {categoryMode === 5 && (tirStats.veryLow ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryLow'),
              }}
              title={`Very Low: ${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
            </div>
          )}
          {tirStats.low > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.low, tirStats.total)}%`,
                backgroundColor: getColorForCategory('low'),
              }}
              title={`Low: ${calculatePercentage(tirStats.low, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.low, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.low, tirStats.total)}%`}
            </div>
          )}
          {tirStats.inRange > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.inRange, tirStats.total)}%`,
                backgroundColor: getColorForCategory('inRange'),
              }}
              title={`In Range: ${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.inRange, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
            </div>
          )}
          {tirStats.high > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.high, tirStats.total)}%`,
                backgroundColor: getColorForCategory('high'),
              }}
              title={`High: ${calculatePercentage(tirStats.high, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.high, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.high, tirStats.total)}%`}
            </div>
          )}
          {categoryMode === 5 && (tirStats.veryHigh ?? 0) > 0 && (
            <div
              className={styles.tirSegment}
              style={{
                width: `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`,
                backgroundColor: getColorForCategory('veryHigh'),
              }}
              title={`Very High: ${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
            >
              {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total) >= 5 && 
                `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
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
                {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
        <Tooltip content={`${tirStats.low} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Low</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
              {calculatePercentage(tirStats.low, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.inRange} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>In Range</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
              {calculatePercentage(tirStats.inRange, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        <Tooltip content={`${tirStats.high} readings`} relationship="description" positioning="below">
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>High</Text>
            <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
              {calculatePercentage(tirStats.high, tirStats.total)}%
            </Text>
          </div>
        </Tooltip>
        {categoryMode === 5 && (
          <Tooltip content={`${tirStats.veryHigh ?? 0} readings`} relationship="description" positioning="below">
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Very High</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%
              </Text>
            </div>
          </Tooltip>
        )}
      </div>

      <div className={styles.targetInfo}>
        <strong>Target:</strong> 70% Time in Range (TIR) is generally considered a good target for glucose management
      </div>
    </Card>
  );
}
