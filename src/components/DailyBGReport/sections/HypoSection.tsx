/**
 * Hypoglycemia Section component for DailyBGReport
 * 
 * Displays hypoglycemia statistics and chart with nadir markers.
 * Enhanced with AI analysis capabilities for single-day hypo insights.
 * 
 * Features:
 * - 6 summary stat cards (extracted to HypoStatsCards component)
 * - Interactive glucose chart with configurable max range (16/22 mmol/L)
 * - AI-powered analysis (extracted to HypoAIAnalysis component)
 */

import { useState } from 'react';
import {
  Text,
  tokens,
} from '@fluentui/react-components';
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
  calculateLBGI,
} from '../../../utils/data';
import { SegmentedControl } from '../../shared';
import { HyposTooltip } from '../tooltips';
import { formatXAxis, HYPO_CHART_COLORS } from '../constants';
import { HypoStatsCards } from './HypoStatsCards';
import { HypoAIAnalysis } from './HypoAIAnalysis';
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
 * Renders the hypoglycemia analysis section for a single day.
 *
 * Displays summary statistics, an interactive glucose chart (with day/night shading, thresholds, nadir markers, and max-glucose control), and an optional AI analysis panel when enabled.
 *
 * @param props - Component props (see HypoSectionProps)
 * @returns The rendered hypoglycemia analysis section
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
  
  // Calculate LBGI for current day's readings
  const lbgi = currentGlucoseReadings.length > 0 ? calculateLBGI(currentGlucoseReadings) : null;
  
  // Calculate actual maxGlucose based on selection
  const maxGlucose = glucoseUnit === 'mg/dL' 
    ? (maxGlucoseOption === '16' ? 288 : 396)
    : (maxGlucoseOption === '16' ? 16 : 22);
  
  return (
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>{t('reports.dailyBG.hypoAnalysis.title')}</Text>
      
      {/* Hypo Stats Cards - Extracted component */}
      <HypoStatsCards
        styles={styles}
        glucoseUnit={glucoseUnit}
        thresholds={thresholds}
        hypoStats={hypoStats}
        lbgi={lbgi}
      />
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
        </div>
      )}
      
      {/* AI Analysis Section - Moved outside chart container to be at same level */}
      {hyposChartData.length > 0 && (
        <HypoAIAnalysis
          hypoStats={hypoStats}
          currentDate={currentDate}
          hasApiKey={hasApiKey}
          activeProvider={activeProvider}
          apiKey={apiKey}
          responseLanguage={responseLanguage}
          isProUser={isProUser}
          idToken={idToken}
          useProKeys={useProKeys}
          showGeekStats={showGeekStats}
          glucoseUnit={glucoseUnit}
          glucoseReadings={currentGlucoseReadings}
          thresholds={thresholds}
        />
      )}
    </div>
  );
}