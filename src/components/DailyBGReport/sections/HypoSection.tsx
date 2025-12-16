/**
 * Hypoglycemia Section component for DailyBGReport
 * 
 * Displays hypoglycemia statistics and chart with nadir markers.
 * Enhanced with AI analysis capabilities for single-day hypo insights.
 * 
 * Features:
 * - 6 summary stat cards (Severe, Non-Severe, Lowest, Longest, Total Time, LBGI)
 * - Interactive glucose chart with configurable max range (16/22 mmol/L)
 * - AI-powered analysis with Pro user support
 * - Collapsible AI response display
 * - Geek stats accordion for prompt inspection (when enabled)
 */

import { useState, useEffect } from 'react';
import {
  Text,
  tokens,
  Card,
  Tooltip as FluentTooltip,
  mergeClasses,
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
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  ClockRegular,
  TimerRegular,
  ShieldRegular,
  ChevronDownRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { GlucoseUnit, GlucoseThresholds, GlucoseReading } from '../../../types';
import type { HypoStats } from '../../../utils/data/hypoDataUtils';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { AIProvider } from '../../../utils/api';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue,
  formatHypoDuration,
  calculateLBGI,
} from '../../../utils/data';
import { formatNumber } from '../../../utils/formatting/formatters';
import { callAIWithRouting } from '../../../utils/api';
import { generateHyposPrompt } from '../../../features/aiAnalysis/prompts';
import { convertHypoEventsToCSV, convertHypoSummariesToCSV } from '../../../utils/data';
import { base64Encode } from '../../../utils/formatting';
import { useAnalysisState } from '../../../pages/AIAnalysis/useAnalysisState';
import { usePromptProvider } from '../../../hooks/usePromptProvider';
import { MarkdownRenderer, SegmentedControl } from '../../shared';
import { HyposTooltip } from '../tooltips';
import { formatXAxis, HYPO_CHART_COLORS } from '../constants';
import { LBGI_THRESHOLDS, getLBGIInterpretation } from '../../HyposReport/types';
import type { useStyles } from '../styles';

type MaxGlucoseOption = '16' | '22';

/**
 * Props for the HypoSection component
 * Displays hypoglycemia statistics, chart, and optional AI analysis for a single day
 */
interface HypoSectionProps {
  /** Style object from useStyles hook */
  styles: ReturnType<typeof useStyles>;
  /** Unit for glucose display (mg/dL or mmol/L) */
  glucoseUnit: GlucoseUnit;
  /** Glucose thresholds for hypo detection */
  thresholds: GlucoseThresholds;
  /** Hypoglycemia statistics for the current day */
  hypoStats: HypoStats;
  /** Chart data points for visualization */
  hyposChartData: Array<{
    time: string;
    timeMinutes: number;
    timeDecimal: number;
    value: number;
    originalValue: number;
    rawValue?: number;
    color: string;
    index: number;
  }>;
  /** Gradient stops for glucose line coloring */
  hyposGradientStops: Array<{ offset: string; color: string }>;
  /** Nadir (lowest) points to mark on chart */
  nadirPoints: Array<{
    timeDecimal: number;
    value: number;
    originalValue: number;
    nadir: number;
    isSevere: boolean;
  }>;
  /** Optional max glucose (not used internally) */
  maxGlucose?: number;
  /** Whether to show day/night shading on chart */
  showDayNightShading: boolean;
  // AI analysis props (simplified - following TimeInRangeCard pattern)
  /** Current date being displayed (ISO format) */
  currentDate?: string;
  /** Glucose readings for LBGI calculation */
  currentGlucoseReadings?: GlucoseReading[];
  /** Whether an API key is available */
  hasApiKey?: boolean;
  /** Selected AI provider */
  activeProvider?: AIProvider | null;
  /** API key for the active provider */
  apiKey?: string;
  /** Language for AI responses */
  responseLanguage?: ResponseLanguage;
  /** Whether user is a Pro user */
  isProUser?: boolean;
  /** Pro user ID token */
  idToken?: string | null;
  /** Whether to use Pro backend keys */
  useProKeys?: boolean;
  /** Whether to show geek stats accordion */
  showGeekStats?: boolean;
}

/**
 * Render the hypoglycemia analysis section
 * 
 * Shows summary statistics, chart, and AI analysis capabilities for a single day's
 * hypoglycemia events. Reuses existing utilities and follows DRY principles.
 * 
 * @param props - Component props (see HypoSectionProps)
 * @returns Rendered hypoglycemia section
 */
export function HypoSection({
  styles,
  glucoseUnit,
  thresholds,
  hypoStats,
  hyposChartData,
  hyposGradientStops,
  nadirPoints,
  // maxGlucose is optional and not used; we calculate our own based on SegmentedControl
  showDayNightShading,
  currentDate,
  currentGlucoseReadings = [],
  hasApiKey = false,
  activeProvider = null,
  apiKey = '',
  responseLanguage = 'english',
  isProUser = false,
  idToken = null,
  useProKeys = false,
  showGeekStats = false,
}: HypoSectionProps) {
  const { t } = useTranslation('reports');
  
  // State for max glucose control (16 or 22 mmol/L)
  const [maxGlucoseOption, setMaxGlucoseOption] = useState<MaxGlucoseOption>('22');
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  
  // Calculate LBGI for current day's readings using existing utility
  const lbgi = currentGlucoseReadings.length > 0 ? calculateLBGI(currentGlucoseReadings) : null;
  
  // Get LBGI risk interpretation using shared function
  const lbgiInterpretation = lbgi !== null ? getLBGIInterpretation(lbgi) : null;
  
  // Calculate actual maxGlucose based on selection
  const maxGlucose = glucoseUnit === 'mg/dL' 
    ? (maxGlucoseOption === '16' ? 288 : 396)
    : (maxGlucoseOption === '16' ? 16 : 22);
  
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
   * Reuses existing AI infrastructure and data preparation
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
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>{t('reports.dailyBG.hypoAnalysis.title')}</Text>
      
      {/* Hypo Stats Cards - 6 cards with localization */}
      <div className={styles.statsRow}>
        <FluentTooltip content={t('reports.dailyBG.hypoAnalysis.stats.severeTooltip')} relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.severeCount > 0 ? styles.statCardDanger : styles.statCardSuccess
          )}>
            <HeartPulseWarningRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.severeCount > 0 ? styles.statIconDanger : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.severe')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{hypoStats.severeCount}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content={t('reports.dailyBG.hypoAnalysis.stats.nonSevereTooltip')} relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.nonSevereCount > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <WarningRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.nonSevereCount > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.nonSevere')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{hypoStats.nonSevereCount}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content={t('reports.dailyBG.hypoAnalysis.stats.lowestTooltip')} relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
              ? styles.statCardDanger 
              : hypoStats.lowestValue !== null ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <ArrowTrendingDownRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
                ? styles.statIconDanger 
                : hypoStats.lowestValue !== null ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.lowest')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {hypoStats.lowestValue !== null 
                    ? displayGlucoseValue(hypoStats.lowestValue, glucoseUnit)
                    : 'N/A'
                  }
                </Text>
                <Text className={styles.statUnit}>{getUnitLabel(glucoseUnit)}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content={t('reports.dailyBG.hypoAnalysis.stats.longestTooltip')} relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.longestDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <TimerRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.longestDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.longest')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {formatHypoDuration(hypoStats.longestDurationMinutes)}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content={t('reports.dailyBG.hypoAnalysis.stats.totalTimeTooltip')} relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.totalDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <ClockRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.totalDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.totalTime')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {hypoStats.totalDurationMinutes > 0 ? formatHypoDuration(hypoStats.totalDurationMinutes) : '😊'}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip 
          content={t('reports.dailyBG.hypoAnalysis.stats.lbgiTooltip', { 
            low: LBGI_THRESHOLDS.low, 
            moderate: LBGI_THRESHOLDS.moderate 
          })}
          relationship="description"
        >
          <Card className={mergeClasses(
            styles.statCard,
            lbgiInterpretation?.level === 'high' ? styles.statCardDanger :
            lbgiInterpretation?.level === 'moderate' ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <ShieldRegular className={mergeClasses(
              styles.statIcon,
              lbgiInterpretation?.level === 'high' ? styles.statIconDanger :
              lbgiInterpretation?.level === 'moderate' ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>{t('reports.dailyBG.hypoAnalysis.stats.lbgi')}</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {lbgi !== null ? formatNumber(lbgi, 1) : 'N/A'}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
      </div>

      {/* Hypos Chart */}
      {hyposChartData.length > 0 && (
        <div className={styles.hyposChartCard}>
          {/* Max Glucose Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '12px',
            paddingRight: '30px'
          }}>
            <SegmentedControl<MaxGlucoseOption>
              options={['16', '22']}
              value={maxGlucoseOption}
              onChange={setMaxGlucoseOption}
              ariaLabel={`Max glucose display (${glucoseUnit === 'mg/dL' ? 'mg/dL' : 'mmol/L'})`}
            />
          </div>
          <div className={styles.chartCardInner}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hyposChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {/* Day/night shading gradients */}
                  {showDayNightShading && (
                    <>
                      <linearGradient id="hyposNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="hyposNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                        <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                      </linearGradient>
                    </>
                  )}
                  {/* Glucose line gradient */}
                  <linearGradient id="hyposGlucoseLineGradient" x1="0" y1="0" x2="1" y2="0">
                    {hyposGradientStops.map((stop, index) => (
                      <stop key={index} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                </defs>
                
                {/* Day/night shading - midnight to 8AM */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={0}
                    x2={8}
                    fill="url(#hyposNightGradientLeft)"
                  />
                )}
                {/* Day/night shading - 8PM to midnight */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={20}
                    x2={24}
                    fill="url(#hyposNightGradientRight)"
                  />
                )}
                
                <XAxis
                  type="number"
                  dataKey="timeDecimal"
                  domain={[0, 24]}
                  ticks={[0, 6, 12, 18, 24]}
                  tickFormatter={formatXAxis}
                  stroke={tokens.colorNeutralStroke1}
                  tick={{ 
                    fill: tokens.colorNeutralForeground2,
                    fontSize: tokens.fontSizeBase200,
                    fontFamily: tokens.fontFamilyBase,
                  }}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={false}
                />
                
                <YAxis
                  domain={[0, maxGlucose]}
                  label={{ 
                    value: `Glucose (${getUnitLabel(glucoseUnit)})`, 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { 
                      fontSize: tokens.fontSizeBase200,
                      fontFamily: tokens.fontFamilyBase,
                      fill: tokens.colorNeutralForeground2,
                    } 
                  }}
                  stroke={tokens.colorNeutralStroke1}
                  tick={{ 
                    fill: tokens.colorNeutralForeground2,
                    fontSize: tokens.fontSizeBase200,
                    fontFamily: tokens.fontFamilyBase,
                  }}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={false}
                />
                
                <RechartsTooltip content={<HyposTooltip glucoseUnit={glucoseUnit} maxGlucose={maxGlucose} thresholds={thresholds} />} />
                
                {/* Hypoglycemia threshold reference lines */}
                <ReferenceLine 
                  y={convertGlucoseValue(thresholds.veryLow, glucoseUnit)} 
                  stroke={HYPO_CHART_COLORS.veryLow}
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                />
                <ReferenceLine 
                  y={convertGlucoseValue(thresholds.low, glucoseUnit)} 
                  stroke={HYPO_CHART_COLORS.low}
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                />
                
                {/* Glucose values line with gradient color */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#hyposGlucoseLineGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    stroke: tokens.colorNeutralBackground1,
                  }}
                />
                
                {/* Nadir markers - triangles pointing down at lowest points */}
                {nadirPoints.length > 0 && (
                  <Scatter
                    data={nadirPoints}
                    dataKey="value"
                    shape={(props: unknown) => {
                      const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isSevere: boolean } };
                      const color = payload.isSevere ? HYPO_CHART_COLORS.veryLow : HYPO_CHART_COLORS.nadirDot;
                      return (
                        <polygon
                          points={`${cx},${cy + 8} ${cx - 6},${cy - 4} ${cx + 6},${cy - 4}`}
                          fill={color}
                          stroke={tokens.colorNeutralBackground1}
                          strokeWidth={1}
                        />
                      );
                    }}
                    legendType="triangle"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Hypos Legend - Localized */}
          <div className={styles.legendContainer}>
            <div className={styles.legendItem}>
              <div 
                className={styles.legendLine} 
                style={{ 
                  background: `linear-gradient(to right, ${HYPO_CHART_COLORS.normal}, ${HYPO_CHART_COLORS.low}, ${HYPO_CHART_COLORS.veryLow})` 
                }} 
              />
              <Text>{t('reports.dailyBG.hypoAnalysis.chart.legend.glucose')}</Text>
            </div>
            <div className={styles.legendItem}>
              <div 
                style={{ 
                  width: 0, 
                  height: 0, 
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `10px solid ${HYPO_CHART_COLORS.nadirDot}`,
                }} 
              />
              <Text>{t('reports.dailyBG.hypoAnalysis.chart.legend.nadir')}</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDashedLine} style={{ borderColor: HYPO_CHART_COLORS.low }} />
              <Text>{t('reports.dailyBG.hypoAnalysis.chart.legend.lowThreshold', { 
                value: displayGlucoseValue(thresholds.low, glucoseUnit), 
                unit: getUnitLabel(glucoseUnit) 
              })}</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDashedLine} style={{ borderColor: HYPO_CHART_COLORS.veryLow }} />
              <Text>{t('reports.dailyBG.hypoAnalysis.chart.legend.veryLowThreshold', { 
                value: displayGlucoseValue(thresholds.veryLow, glucoseUnit), 
                unit: getUnitLabel(glucoseUnit) 
              })}</Text>
            </div>
          </div>
          
          {/* AI Analysis Section - Always visible, below legend (NEW REQUIREMENT) */}
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
                disabled={!hasApiKey || analyzing || (cooldownActive && cooldownSeconds > 0)}
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
          </div>
          
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
      )}
    </div>
  );
}