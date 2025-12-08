/**
 * HyposChart component
 * Displays the glucose chart with color-coded line based on hypo thresholds
 */

import { useMemo, useCallback } from 'react';
import {
  Text,
  Card,
  TabList,
  Tab,
  tokens,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Scatter,
  ComposedChart,
} from 'recharts';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue, 
  formatGlucoseValue,
} from '../../utils/data';
import { useHyposStyles } from './styles';
import { HyposChartLegend } from './HyposChartLegend';
import { 
  MAX_GLUCOSE_VALUES, 
  HYPO_CHART_COLORS, 
  TIME_LABELS,
  type HyposChartProps,
  type ScatterShapeProps,
  type ChartTooltipProps,
} from './types';

export function HyposChart({
  chartData,
  nadirPoints,
  gradientStops,
  maxGlucose,
  setMaxGlucose,
  glucoseUnit,
  thresholds,
  windowWidth,
}: HyposChartProps) {
  const styles = useHyposStyles();

  // Calculate responsive margins based on window width
  const chartMargins = useMemo(() => {
    if (windowWidth >= 1200) {
      return { top: 10, right: 50, left: 10, bottom: 0 };
    } else if (windowWidth >= 768) {
      const factor = (windowWidth - 768) / (1200 - 768);
      return {
        top: 10,
        right: Math.round(15 + 35 * factor),
        left: Math.round(0 + 10 * factor),
        bottom: 0,
      };
    } else {
      return { top: 10, right: 15, left: 0, bottom: 0 };
    }
  }, [windowWidth]);

  // Format X-axis labels (show only key times)
  const formatXAxis = useCallback((value: number) => {
    const hour = Math.floor(value);
    return TIME_LABELS[hour] || '';
  }, []);

  // Custom tooltip with Fluent UI styling
  const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayValue = data.originalValue > maxGlucose 
        ? `${formatGlucoseValue(data.originalValue, glucoseUnit)} (clamped to ${formatGlucoseValue(maxGlucose, glucoseUnit)})`
        : formatGlucoseValue(data.value, glucoseUnit);
      
      // Determine status text
      let statusText = '';
      let statusColor: string = HYPO_CHART_COLORS.normal;
      if (data.rawValue !== undefined) {
        if (data.rawValue < thresholds.veryLow) {
          statusText = 'Severe Hypo';
          statusColor = HYPO_CHART_COLORS.veryLow;
        } else if (data.rawValue < thresholds.low) {
          statusText = 'Hypoglycemia';
          statusColor = HYPO_CHART_COLORS.low;
        } else {
          statusText = 'In Range';
        }
      }
      
      return (
        <div style={{
          backgroundColor: tokens.colorNeutralBackground1,
          padding: '12px',
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: tokens.borderRadiusMedium,
          fontSize: tokens.fontSizeBase300,
          fontFamily: tokens.fontFamilyBase,
          boxShadow: tokens.shadow8,
        }}>
          <div style={{ 
            fontWeight: tokens.fontWeightSemibold,
            marginBottom: '4px',
            color: tokens.colorNeutralForeground1,
          }}>
            {data.time}
          </div>
          <div style={{ color: tokens.colorNeutralForeground2 }}>
            Glucose: {displayValue} {getUnitLabel(glucoseUnit)}
          </div>
          {statusText && (
            <div style={{ 
              color: statusColor, 
              fontStyle: 'italic',
              marginTop: '4px',
            }}>
              {statusText}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={styles.chartCard}>
      <div className={styles.controlsRow}>
        <div className={styles.maxValueContainer}>
          <Text style={{ 
            fontSize: tokens.fontSizeBase300,
            fontFamily: tokens.fontFamilyBase,
            color: tokens.colorNeutralForeground2,
          }}>
            Max BG:
          </Text>
          <TabList
            selectedValue={
              glucoseUnit === 'mg/dL'
                ? (maxGlucose === MAX_GLUCOSE_VALUES.mgdl.low ? String(MAX_GLUCOSE_VALUES.mgdl.low) : String(MAX_GLUCOSE_VALUES.mgdl.high))
                : (maxGlucose === MAX_GLUCOSE_VALUES.mmol.low ? String(MAX_GLUCOSE_VALUES.mmol.low) : String(MAX_GLUCOSE_VALUES.mmol.high))
            }
            onTabSelect={(_, data) => {
              if (glucoseUnit === 'mg/dL') {
                setMaxGlucose(data.value === String(MAX_GLUCOSE_VALUES.mgdl.low) ? MAX_GLUCOSE_VALUES.mgdl.low : MAX_GLUCOSE_VALUES.mgdl.high);
              } else {
                setMaxGlucose(data.value === String(MAX_GLUCOSE_VALUES.mmol.low) ? MAX_GLUCOSE_VALUES.mmol.low : MAX_GLUCOSE_VALUES.mmol.high);
              }
            }}
            size="small"
          >
            {glucoseUnit === 'mg/dL' ? (
              <>
                <Tab value={String(MAX_GLUCOSE_VALUES.mgdl.low)}>{MAX_GLUCOSE_VALUES.mgdl.low}</Tab>
                <Tab value={String(MAX_GLUCOSE_VALUES.mgdl.high)}>{MAX_GLUCOSE_VALUES.mgdl.high}</Tab>
              </>
            ) : (
              <>
                <Tab value={String(MAX_GLUCOSE_VALUES.mmol.low)}>{MAX_GLUCOSE_VALUES.mmol.low}</Tab>
                <Tab value={String(MAX_GLUCOSE_VALUES.mmol.high)}>{MAX_GLUCOSE_VALUES.mmol.high}</Tab>
              </>
            )}
          </TabList>
        </div>
      </div>
      
      <div className={mergeClasses(
        styles.chartContainer,
        windowWidth < 768 && styles.chartContainerMobile
      )}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={chartMargins}>
            <defs>
              {/* Gradual night shading gradients - more intensive than RoC report */}
              <linearGradient id="hyposNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1a237e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="hyposNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                <stop offset="100%" stopColor="#1a237e" stopOpacity="0.35" />
              </linearGradient>
              {/* Glucose line gradient based on hypo status */}
              <linearGradient id="glucoseLineGradient" x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, index) => (
                  <stop key={index} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            
            {/* Gradual night hours shading - midnight to 8AM (darkest at midnight) */}
            <ReferenceArea
              x1={0}
              x2={8}
              fill="url(#hyposNightGradientLeft)"
            />
            {/* Gradual night hours shading - 8PM to midnight (darkest at midnight) */}
            <ReferenceArea
              x1={20}
              x2={24}
              fill="url(#hyposNightGradientRight)"
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
            
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Very low threshold reference line */}
            <ReferenceLine 
              y={convertGlucoseValue(thresholds.veryLow, glucoseUnit)} 
              stroke={HYPO_CHART_COLORS.veryLow}
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ 
                value: `V.Low (${displayGlucoseValue(thresholds.veryLow, glucoseUnit)})`, 
                position: 'insideBottomLeft', 
                style: { 
                  fontSize: tokens.fontSizeBase200,
                  fontFamily: tokens.fontFamilyBase,
                  fill: HYPO_CHART_COLORS.veryLow,
                } 
              }}
            />
            
            {/* Low threshold reference line */}
            <ReferenceLine 
              y={convertGlucoseValue(thresholds.low, glucoseUnit)} 
              stroke={HYPO_CHART_COLORS.low}
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ 
                value: `Low (${displayGlucoseValue(thresholds.low, glucoseUnit)})`, 
                position: 'insideTopLeft', 
                style: { 
                  fontSize: tokens.fontSizeBase200,
                  fontFamily: tokens.fontFamilyBase,
                  fill: HYPO_CHART_COLORS.low,
                } 
              }}
            />
            
            {/* High threshold reference line */}
            <ReferenceLine 
              y={convertGlucoseValue(thresholds.high, glucoseUnit)} 
              stroke={tokens.colorPaletteMarigoldBorder1}
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ 
                value: `High (${displayGlucoseValue(thresholds.high, glucoseUnit)})`, 
                position: 'insideTopLeft', 
                style: { 
                  fontSize: tokens.fontSizeBase200,
                  fontFamily: tokens.fontFamilyBase,
                  fill: tokens.colorPaletteMarigoldForeground1,
                } 
              }}
            />
            
            {/* Nadir dots for each hypo period - rendered BEFORE the line so they appear behind it */}
            {nadirPoints.length > 0 && (
              <Scatter
                data={nadirPoints}
                dataKey="value"
                fill={HYPO_CHART_COLORS.nadirDot}
                shape={(props: unknown) => {
                  // Recharts passes unknown props, safely extract position coordinates
                  const shapeProps = props as ScatterShapeProps;
                  return (
                    <circle
                      cx={shapeProps.cx}
                      cy={shapeProps.cy}
                      r={6}
                      fill={HYPO_CHART_COLORS.nadirDot}
                      stroke={tokens.colorNeutralBackground1}
                      strokeWidth={2}
                    />
                  );
                }}
              />
            )}
            
            {/* Glucose values line with gradient coloring based on hypo state */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#glucoseLineGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ 
                r: 5, 
                strokeWidth: 2,
                stroke: tokens.colorNeutralBackground1,
                fill: tokens.colorBrandForeground1,
              }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart Legend */}
      <HyposChartLegend />
    </Card>
  );
}
