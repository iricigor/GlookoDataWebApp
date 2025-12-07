/**
 * Hypoglycemia Section component for DailyBGReport
 * Displays hypoglycemia statistics and chart with nadir markers
 */

import {
  Text,
  tokens,
  Card,
  Tooltip as FluentTooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  ClockRegular,
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
import type { GlucoseUnit, GlucoseThresholds } from '../../../types';
import type { HypoStats } from '../../../utils/data/hypoDataUtils';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue,
  formatHypoDuration,
} from '../../../utils/data';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { HyposTooltip } from '../tooltips';
import { formatXAxis, HYPO_CHART_COLORS } from '../constants';
import type { useStyles } from '../styles';

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
  maxGlucose: number;
  showDayNightShading: boolean;
}

/**
 * Render the hypoglycemia analysis section with summary statistic cards and an optional hypoglycemia chart.
 *
 * @param styles - Style object returned from useStyles for layout and visual classes
 * @param glucoseUnit - Unit for glucose values (used for display and axis labels)
 * @param thresholds - Threshold values for `veryLow` and `low` hypoglycemia markers
 * @param hypoStats - Aggregate hypoglycemia statistics (e.g., severeCount, nonSevereCount, lowestValue, totalDuration)
 * @param hyposChartData - Time-series data points used to plot the glucose line on the chart
 * @param hyposGradientStops - Gradient stop definitions used to color the glucose line
 * @param nadirPoints - Points marking nadirs (lowest points) on the chart, including severity flags
 * @param maxGlucose - Maximum glucose value used to set the chart's Y-axis domain
 * @param showDayNightShading - When true, render day/night shaded regions on the chart
 * @returns The section's rendered JSX element
 */
export function HypoSection({
  styles,
  glucoseUnit,
  thresholds,
  hypoStats,
  hyposChartData,
  hyposGradientStops,
  nadirPoints,
  maxGlucose,
  showDayNightShading,
}: HypoSectionProps) {
  const isMobile = useIsMobile();
  
  // Adjust chart margins for mobile - minimal margins with negative left
  const chartMargin = isMobile 
    ? { top: 10, right: 1, left: -20, bottom: 0 }
    : { top: 10, right: 30, left: 0, bottom: 0 };
  
  return (
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>Hypoglycemia Analysis</Text>
      
      {/* Hypo Stats Cards */}
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
              <Text className={styles.statLabel}>Total Duration</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>
                  {formatHypoDuration(hypoStats.totalDurationMinutes)}
                </Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
      </div>

      {/* Hypos Chart */}
      {hyposChartData.length > 0 && (
        <div className={styles.hyposChartCard}>
          <div className={styles.chartCardInner}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hyposChartData} margin={chartMargin}>
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
                
                {/* Vertical time reference lines (6AM, noon, 6PM, midnight) */}
                <ReferenceLine 
                  x={0} 
                  stroke={tokens.colorNeutralStroke2}
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  x={6} 
                  stroke={tokens.colorNeutralStroke2}
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  x={12} 
                  stroke={tokens.colorNeutralStroke2}
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  x={18} 
                  stroke={tokens.colorNeutralStroke2}
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                
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
        </div>
      )}
    </div>
  );
}