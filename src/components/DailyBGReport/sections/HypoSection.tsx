/**
 * Hypoglycemia Section component for DailyBGReport
 * Displays hypoglycemia statistics and chart with nadir markers
 * Enhanced with AI analysis capabilities
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
import type { useStyles } from '../styles';

// LBGI risk level thresholds
const LBGI_THRESHOLDS = {
  low: 2.5,
  moderate: 5.0,
} as const;

type MaxGlucoseOption = '16' | '22';

interface HypoSectionProps {
  styles: ReturnType<typeof useStyles>;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  hypoStats: HypoStats;
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
  hyposGradientStops: Array<{ offset: string; color: string }>;
  nadirPoints: Array<{
    timeDecimal: number;
    value: number;
    originalValue: number;
    nadir: number;
    isSevere: boolean;
  }>;
  maxGlucose?: number; // Optional, not used internally
  showDayNightShading: boolean;
  // Additional props for AI analysis
  currentDate?: string;
  currentGlucoseReadings?: GlucoseReading[];
  hasApiKey?: boolean;
  activeProvider?: AIProvider | null;
  perplexityApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  deepseekApiKey?: string;
  responseLanguage?: ResponseLanguage;
  isProUser?: boolean;
  idToken?: string | null;
  useProKeys?: boolean;
  showGeekStats?: boolean;
}

/**
 * Render the hypoglycemia analysis section with summary statistic cards, chart, and AI analysis.
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
  perplexityApiKey = '',
  geminiApiKey = '',
  grokApiKey = '',
  deepseekApiKey = '',
  responseLanguage = 'english',
  isProUser = false,
  idToken = null,
  useProKeys = false,
  showGeekStats = false,
}: HypoSectionProps) {
  // State for max glucose control (16 or 22 mmol/L)
  const [maxGlucoseOption, setMaxGlucoseOption] = useState<MaxGlucoseOption>('22');
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  
  // Calculate LBGI for current day's readings
  const lbgi = currentGlucoseReadings.length > 0 ? calculateLBGI(currentGlucoseReadings) : null;
  
  // Determine LBGI risk level
  const getLBGIRiskLevel = (value: number | null): 'low' | 'moderate' | 'high' => {
    if (value === null) return 'low';
    if (value < LBGI_THRESHOLDS.low) return 'low';
    if (value < LBGI_THRESHOLDS.moderate) return 'moderate';
    return 'high';
  };
  
  const lbgiRiskLevel = getLBGIRiskLevel(lbgi);
  
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
      
      // Generate the prompt
      const prompt = generateHyposPrompt(
        base64EventsData,
        base64SummariesData,
        responseLanguage,
        glucoseUnit,
        promptProvider
      );
      
      // Get the appropriate API key
      const apiKey = 
        activeProvider === 'perplexity' ? perplexityApiKey :
        activeProvider === 'grok' ? grokApiKey :
        activeProvider === 'deepseek' ? deepseekApiKey :
        geminiApiKey;
      
      // Call the AI API with routing
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
      ? 'Analyzing...'
      : response && !analyzing && ready
      ? 'Analyze Again'
      : 'Analyze with AI';
    
    // Add sparkles indicator when using Pro backend keys
    const sparkles = isProUser && useProKeys ? ' ✨' : '';
    return `${baseText}${sparkles}`;
  };
  
  return (
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>Hypoglycemia Analysis</Text>
      
      {/* Hypo Stats Cards - Now 6 cards */}
      <div className={styles.statsRow}>
        <FluentTooltip content="Severe hypoglycemic events (below very low threshold)" relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.severeCount > 0 ? styles.statCardDanger : styles.statCardSuccess
          )}>
            <HeartPulseWarningRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.severeCount > 0 ? styles.statIconDanger : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Severe</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{hypoStats.severeCount}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content="Non-severe hypoglycemic events (below low threshold)" relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.nonSevereCount > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <WarningRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.nonSevereCount > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Non-Severe</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{hypoStats.nonSevereCount}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content="Lowest glucose value during hypoglycemia" relationship="description">
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
              <Text className={styles.statLabel}>Lowest</Text>
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
        
        {/* NEW: Longest Duration Card */}
        <FluentTooltip content="Duration of longest hypoglycemic event" relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.longestDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <TimerRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.longestDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Longest</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {formatHypoDuration(hypoStats.longestDurationMinutes)}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content="Total time spent in hypoglycemia" relationship="description">
          <Card className={mergeClasses(
            styles.statCard,
            hypoStats.totalDurationMinutes > 0 ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <ClockRegular className={mergeClasses(
              styles.statIcon,
              hypoStats.totalDurationMinutes > 0 ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Total Time</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {hypoStats.totalDurationMinutes > 0 ? formatHypoDuration(hypoStats.totalDurationMinutes) : '😊'}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        {/* NEW: LBGI Card */}
        <FluentTooltip 
          content={`Low Blood Glucose Index (LBGI) - Predicts hypoglycemia risk. <${LBGI_THRESHOLDS.low} low, ${LBGI_THRESHOLDS.low}-${LBGI_THRESHOLDS.moderate} moderate, >${LBGI_THRESHOLDS.moderate} high`}
          relationship="description"
        >
          <Card className={mergeClasses(
            styles.statCard,
            lbgiRiskLevel === 'high' ? styles.statCardDanger :
            lbgiRiskLevel === 'moderate' ? styles.statCardWarning : styles.statCardSuccess
          )}>
            <ShieldRegular className={mergeClasses(
              styles.statIcon,
              lbgiRiskLevel === 'high' ? styles.statIconDanger :
              lbgiRiskLevel === 'moderate' ? styles.statIconWarning : styles.statIconSuccess
            )} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>LBGI</Text>
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
          {/* NEW: Max Glucose Selector */}
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
          
          {/* Hypos Legend */}
          <div className={styles.legendContainer}>
            <div className={styles.legendItem}>
              <div 
                className={styles.legendLine} 
                style={{ 
                  background: `linear-gradient(to right, ${HYPO_CHART_COLORS.normal}, ${HYPO_CHART_COLORS.low}, ${HYPO_CHART_COLORS.veryLow})` 
                }} 
              />
              <Text>Glucose</Text>
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
              <Text>Nadir (Lowest Point)</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDashedLine} style={{ borderColor: HYPO_CHART_COLORS.low }} />
              <Text>Low Threshold ({displayGlucoseValue(thresholds.low, glucoseUnit)} {getUnitLabel(glucoseUnit)})</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDashedLine} style={{ borderColor: HYPO_CHART_COLORS.veryLow }} />
              <Text>Very Low ({displayGlucoseValue(thresholds.veryLow, glucoseUnit)} {getUnitLabel(glucoseUnit)})</Text>
            </div>
          </div>
          
          {/* NEW: AI Analysis Section - Below legend */}
          {(hasApiKey || isProUser) && activeProvider && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: tokens.colorNeutralBackground2,
              borderRadius: '12px',
              border: `1px solid ${tokens.colorNeutralStroke1}`,
            }}>
              {/* General message about hypos */}
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ 
                  display: 'block', 
                  fontSize: tokens.fontSizeBase300,
                  color: tokens.colorNeutralForeground2,
                  marginBottom: '8px'
                }}>
                  {hypoStats.totalCount === 0 
                    ? `🎉 Excellent! No hypoglycemic events detected on ${currentDate || 'this day'}. Keep up the great glucose management!`
                    : `${hypoStats.totalCount} hypoglycemic event${hypoStats.totalCount > 1 ? 's' : ''} detected on ${currentDate || 'this day'}${hypoStats.severeCount > 0 ? ` (${hypoStats.severeCount} severe)` : ''}.`
                  }
                </Text>
              </div>
              
              {/* AI Analysis Button and Response Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Button
                    appearance="primary"
                    disabled={!(hasApiKey || isProUser) || analyzing || (cooldownActive && cooldownSeconds > 0)}
                    onClick={handleAnalyzeClick}
                    icon={analyzing ? <Spinner size="tiny" /> : undefined}
                  >
                    {getButtonText()}
                  </Button>
                  
                  {response && !analyzing && (
                    <ChevronDownRegular 
                      style={{ 
                        cursor: 'pointer', 
                        fontSize: '20px',
                        transform: isResponseExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                      onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                    />
                  )}
                </div>
                
                {/* Cooldown indicator */}
                {cooldownActive && cooldownSeconds > 0 && (
                  <MessageBar intent="info">
                    <MessageBarBody>
                      Please wait {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                    </MessageBarBody>
                  </MessageBar>
                )}
                
                {/* Error message */}
                {error && (
                  <MessageBar intent="error" icon={<ErrorCircleRegular />}>
                    <MessageBarBody>
                      <strong>Error:</strong> {error}
                    </MessageBarBody>
                  </MessageBar>
                )}
                
                {/* AI Response */}
                {response && !analyzing && isResponseExpanded && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: tokens.colorNeutralBackground3,
                    borderRadius: tokens.borderRadiusMedium,
                    marginTop: '8px',
                  }}>
                    <MarkdownRenderer content={response} />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* NEW: Geek Stats - AI Prompt Accordion */}
          {showGeekStats && (hasApiKey || isProUser) && activeProvider && (
            <Accordion collapsible style={{ marginTop: '16px' }}>
              <AccordionItem value="aiPrompt">
                <AccordionHeader>View AI Prompt</AccordionHeader>
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