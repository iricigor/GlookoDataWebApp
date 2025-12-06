/**
 * Rate of Change (RoC) Section component for DailyBGReport
 * Displays RoC statistics, chart with gradient coloring, and summary bar
 */

import {
  Text,
  tokens,
  Card,
  TabList,
  Tab,
  Tooltip as FluentTooltip,
  mergeClasses,
  Slider,
} from '@fluentui/react-components';
import {
  TopSpeedRegular,
  DataHistogramRegular,
  TimerRegular,
} from '@fluentui/react-icons';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import type { GlucoseUnit, GlucoseThresholds, RoCDataPoint, RoCStats } from '../../../types';
import { 
  getUnitLabel, 
  convertGlucoseValue,
  ROC_COLORS,
  ROC_THRESHOLDS,
  formatRoCValue,
  getRoCMedicalStandards,
  formatDuration,
} from '../../../utils/data';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { RoCTooltip } from '../tooltips';
import { formatXAxis, ROC_INTERVAL_OPTIONS } from '../constants';
import type { useStyles } from '../styles';

interface RoCSectionProps {
  styles: ReturnType<typeof useStyles>;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  rocStats: RoCStats;
  longestStablePeriod: number;
  rocChartData: Array<RoCDataPoint & { glucoseDisplay: number }>;
  rocGlucoseLineData: Array<{ timeDecimal: number; glucoseDisplay: number }>;
  rocGradientStops: Array<{ offset: string; color: string }>;
  rocYAxisDomain: [number, number];
  rocIntervalIndex: number;
  setRocIntervalIndex: (value: number) => void;
  rocMaxGlucose: number;
  setRocMaxGlucose: (value: number) => void;
  showDayNightShading: boolean;
}

/**
 * Render the Rate of Change (RoC) analysis section used in the DailyBGReport.
 *
 * Renders RoC statistic cards, an optional RoC vs Glucose composed chart with controls
 * (interval slider and max-BG selector), a custom legend, and a summary bar with
 * medical-standard thresholds and descriptions.
 *
 * @param styles - Styling object from useStyles applied to section elements
 * @param glucoseUnit - Display unit for glucose values ('mg/dL' or 'mmol/L')
 * @param thresholds - Patient glucose thresholds (used to compute display low threshold)
 * @param rocStats - Precomputed RoC statistics and category percentages/counts
 * @param longestStablePeriod - Duration of the longest stable-glucose period
 * @param rocChartData - Time-series data for the RoC chart (includes RoC and timeDecimal)
 * @param rocGlucoseLineData - Time-series data for the glucose overlay line on the chart
 * @param rocGradientStops - Gradient stops used to color the RoC line by value
 * @param rocYAxisDomain - [min, max] domain for the RoC (left) Y-axis
 * @param rocIntervalIndex - Selected index for the RoC time-interval option
 * @param setRocIntervalIndex - Setter to update the selected RoC interval index
 * @param rocMaxGlucose - Maximum glucose value used for the glucose (right) Y-axis domain
 * @param setRocMaxGlucose - Setter to update the rocMaxGlucose value
 * @param showDayNightShading - When true, apply shaded areas for nighttime periods on the chart
 * @returns The React element for the RoC analysis section
 */
export function RoCSection({
  styles,
  glucoseUnit,
  thresholds,
  rocStats,
  longestStablePeriod,
  rocChartData,
  rocGlucoseLineData,
  rocGradientStops,
  rocYAxisDomain,
  rocIntervalIndex,
  setRocIntervalIndex,
  rocMaxGlucose,
  setRocMaxGlucose,
  showDayNightShading,
}: RoCSectionProps) {
  const isMobile = useIsMobile();
  const rocUnitLabel = glucoseUnit === 'mg/dL' ? 'mg/dL/5 min' : 'mmol/L/5 min';
  const medicalStandards = getRoCMedicalStandards(glucoseUnit);
  const currentInterval = ROC_INTERVAL_OPTIONS[rocIntervalIndex];
  
  // Adjust chart margins for mobile
  const chartMargin = isMobile 
    ? { top: 10, right: 20, left: 5, bottom: 0 }
    : { top: 10, right: 50, left: 10, bottom: 0 };
  
  // Calculate thresholds in the display unit
  const glucoseHighThreshold = glucoseUnit === 'mg/dL' ? 288 : 16.0;
  const glucoseLowThreshold = convertGlucoseValue(thresholds.low, glucoseUnit);

  return (
    <div className={styles.sectionCard}>
      <Text className={styles.sectionTitle}>Rate of Change Analysis</Text>
      
      {/* RoC Stats Cards */}
      <div className={styles.statsRow}>
        <FluentTooltip content="Longest continuous period with stable glucose (slow rate of change)" relationship="description">
          <Card className={mergeClasses(styles.statCard, styles.statCardSuccess)}>
            <TimerRegular className={mergeClasses(styles.statIcon, styles.statIconSuccess)} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Longest Stable</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{formatDuration(longestStablePeriod)}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content="Maximum absolute rate of glucose change (fastest)" relationship="description">
          <Card className={mergeClasses(styles.statCard, styles.statCardWarning)}>
            <TopSpeedRegular className={mergeClasses(styles.statIcon, styles.statIconWarning)} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Max RoC</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{formatRoCValue(rocStats.maxRoC, glucoseUnit)}</Text>
                <Text className={styles.statUnit}>{rocUnitLabel}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
        
        <FluentTooltip content="Standard Deviation of Rate of Change - measures variability in glucose change speed" relationship="description">
          <Card className={styles.statCard}>
            <DataHistogramRegular className={styles.statIcon} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>StDev RoC</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{formatRoCValue(rocStats.sdRoC, glucoseUnit)}</Text>
                <Text className={styles.statUnit}>{rocUnitLabel}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
      </div>

      {/* RoC Graph */}
      {rocChartData.length > 0 && (
        <div className={styles.rocChartCard}>
          {/* RoC Controls Row - inside the card to align with other graphs */}
          <div className={styles.rocControlsRow}>
            <FluentTooltip content="Time window for calculating glucose rate of change" relationship="description">
              <div className={styles.sliderContainer}>
                <Text className={styles.sliderLabel}>RoC Interval:</Text>
                <Slider
                  min={0}
                  max={3}
                  step={1}
                  value={rocIntervalIndex}
                  onChange={(_, data) => setRocIntervalIndex(data.value)}
                  style={{ minWidth: '80px' }}
                />
                <Text className={styles.sliderValue}>{currentInterval.label}</Text>
              </div>
            </FluentTooltip>
            <div className={styles.maxValueContainer}>
              <Text style={{ 
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2,
              }}>
                Max BG:
              </Text>
              <TabList
                selectedValue={
                  glucoseUnit === 'mg/dL'
                    ? (rocMaxGlucose === 288 ? '288' : '396')
                    : (rocMaxGlucose === 16.0 ? '16.0' : '22.0')
                }
                onTabSelect={(_, data) => {
                  if (glucoseUnit === 'mg/dL') {
                    setRocMaxGlucose(data.value === '288' ? 288 : 396);
                  } else {
                    setRocMaxGlucose(data.value === '16.0' ? 16.0 : 22.0);
                  }
                }}
                size="small"
              >
                {glucoseUnit === 'mg/dL' ? (
                  <>
                    <Tab value="288">288</Tab>
                    <Tab value="396">396</Tab>
                  </>
                ) : (
                  <>
                    <Tab value="16.0">16.0</Tab>
                    <Tab value="22.0">22.0</Tab>
                  </>
                )}
              </TabList>
            </div>
          </div>
          
          <div className={styles.chartCardInner}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={chartMargin} data={rocChartData}>
                <defs>
                  {/* Day/night shading gradients */}
                  {showDayNightShading && (
                    <>
                      <linearGradient id="rocNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="rocNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                        <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                      </linearGradient>
                    </>
                  )}
                  {/* RoC line gradient - follows HSV color scale based on RoC value */}
                  <linearGradient id="rocLineGradientDaily" x1="0" y1="0" x2="1" y2="0">
                    {rocGradientStops.map((stop, index) => (
                      <stop key={index} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                
                {/* Day/night shading - midnight to 8AM */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={0}
                    x2={8}
                    yAxisId="roc"
                    fill="url(#rocNightGradientLeft)"
                  />
                )}
                {/* Day/night shading - 8PM to midnight */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={20}
                    x2={24}
                    yAxisId="roc"
                    fill="url(#rocNightGradientRight)"
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
                
                {/* Reference lines for RoC thresholds - labels on left axis */}
                <ReferenceLine
                  y={ROC_THRESHOLDS.good}
                  yAxisId="roc"
                  stroke={ROC_COLORS.good}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  label={{ value: 'Stable', position: 'left', fill: ROC_COLORS.good, fontSize: 10 }}
                />
                <ReferenceLine
                  y={ROC_THRESHOLDS.medium}
                  yAxisId="roc"
                  stroke={ROC_COLORS.bad}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  label={{ value: 'Rapid', position: 'left', fill: ROC_COLORS.bad, fontSize: 10 }}
                />
                
                <XAxis
                  type="number"
                  dataKey="timeDecimal"
                  domain={[0, 24]}
                  ticks={[0, 6, 12, 18, 24]}
                  tickFormatter={formatXAxis}
                  stroke={tokens.colorNeutralForeground2}
                  style={{ fontSize: tokens.fontSizeBase200 }}
                  allowDuplicatedCategory={false}
                />
                
                <YAxis
                  yAxisId="roc"
                  label={{ 
                    value: `Rate of Change (${rocUnitLabel})`, 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fontSize: tokens.fontSizeBase200 } 
                  }}
                  stroke={tokens.colorNeutralForeground2}
                  style={{ fontSize: tokens.fontSizeBase200 }}
                  domain={rocYAxisDomain}
                  tickFormatter={(value: number) => formatRoCValue(value, glucoseUnit)}
                />
                
                <YAxis
                  yAxisId="glucose"
                  orientation="right"
                  label={{ 
                    value: `Glucose (${getUnitLabel(glucoseUnit)})`, 
                    angle: 90, 
                    position: 'insideRight', 
                    style: { fontSize: tokens.fontSizeBase200 } 
                  }}
                  stroke={tokens.colorNeutralForeground3}
                  style={{ fontSize: tokens.fontSizeBase200 }}
                  domain={[0, rocMaxGlucose]}
                  tickFormatter={(value: number) => glucoseUnit === 'mg/dL' ? Math.round(value).toString() : value.toFixed(1)}
                />
                
                {/* Dashed reference lines for glucose thresholds */}
                <ReferenceLine
                  y={glucoseHighThreshold}
                  yAxisId="glucose"
                  stroke={tokens.colorNeutralStroke1}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={glucoseLowThreshold}
                  yAxisId="glucose"
                  stroke={tokens.colorNeutralStroke1}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
                
                <RechartsTooltip 
                  content={<RoCTooltip glucoseUnit={glucoseUnit} />} 
                />
                
                {/* Glucose line overlay (monochrome) */}
                <Line
                  yAxisId="glucose"
                  type="monotone"
                  data={rocGlucoseLineData}
                  dataKey="glucoseDisplay"
                  name="Glucose"
                  stroke={tokens.colorNeutralStroke1}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  legendType="none"
                />
                
                {/* RoC line with gradient color */}
                <Line
                  yAxisId="roc"
                  type="monotone"
                  dataKey="roc"
                  name="Rate of Change"
                  stroke="url(#rocLineGradientDaily)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 5, stroke: tokens.colorNeutralBackground1, strokeWidth: 2 }}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* RoC Custom Legend */}
          <div className={styles.legendContainer}>
            <div className={styles.legendItem}>
              <div 
                className={styles.legendLine} 
                style={{ 
                  background: `linear-gradient(to right, ${ROC_COLORS.good}, ${ROC_COLORS.medium}, ${ROC_COLORS.bad})` 
                }} 
              />
              <Text>Rate of Change (RoC)</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLine} style={{ backgroundColor: tokens.colorNeutralStroke1 }} />
              <Text>Glucose</Text>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDashedLine} />
              <Text>Target Range ({glucoseUnit === 'mg/dL' ? `${Math.round(glucoseLowThreshold)}-${Math.round(glucoseHighThreshold)}` : `${glucoseLowThreshold.toFixed(1)}-${glucoseHighThreshold.toFixed(1)}`} {getUnitLabel(glucoseUnit)})</Text>
            </div>
          </div>
        </div>
      )}

      {/* RoC Summary Bar */}
      <div className={styles.rocSummaryCard}>
        <Text className={styles.rocSummaryTitle}>
          Time by Rate of Change Category
        </Text>
        
        <div className={styles.rocSummaryBar}>
          {rocStats.goodPercentage > 0 && (
            <div
              className={styles.rocSummarySegment}
              style={{
                width: `${rocStats.goodPercentage}%`,
                backgroundColor: ROC_COLORS.good,
              }}
              title={`Stable: ${rocStats.goodPercentage}% (${rocStats.goodCount} readings)`}
            >
              {rocStats.goodPercentage >= 8 && `${rocStats.goodPercentage}%`}
            </div>
          )}
          {rocStats.mediumPercentage > 0 && (
            <div
              className={styles.rocSummarySegment}
              style={{
                width: `${rocStats.mediumPercentage}%`,
                backgroundColor: ROC_COLORS.medium,
              }}
              title={`Moderate: ${rocStats.mediumPercentage}% (${rocStats.mediumCount} readings)`}
            >
              {rocStats.mediumPercentage >= 8 && `${rocStats.mediumPercentage}%`}
            </div>
          )}
          {rocStats.badPercentage > 0 && (
            <div
              className={styles.rocSummarySegment}
              style={{
                width: `${rocStats.badPercentage}%`,
                backgroundColor: ROC_COLORS.bad,
              }}
              title={`Rapid: ${rocStats.badPercentage}% (${rocStats.badCount} readings)`}
            >
              {rocStats.badPercentage >= 8 && `${rocStats.badPercentage}%`}
            </div>
          )}
        </div>
        
        {/* Medical Standards Legend */}
        <div className={styles.rocStandardsContainer}>
          <div className={styles.rocStandardRow}>
            <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.good }} />
            <Text className={styles.rocStandardLabel}>Stable</Text>
            <Text className={styles.rocStandardThreshold}>{medicalStandards.good.threshold}</Text>
            <Text className={styles.rocStandardDescription}>{medicalStandards.good.description}</Text>
          </div>
          <div className={styles.rocStandardRow}>
            <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.medium }} />
            <Text className={styles.rocStandardLabel}>Moderate</Text>
            <Text className={styles.rocStandardThreshold}>{medicalStandards.medium.threshold}</Text>
            <Text className={styles.rocStandardDescription}>{medicalStandards.medium.description}</Text>
          </div>
          <div className={styles.rocStandardRow}>
            <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.bad }} />
            <Text className={styles.rocStandardLabel}>Rapid</Text>
            <Text className={styles.rocStandardThreshold}>{medicalStandards.bad.threshold}</Text>
            <Text className={styles.rocStandardDescription}>{medicalStandards.bad.description}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}