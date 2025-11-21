/**
 * UnifiedTimeline component
 * Displays 24-hour timeline combining insulin delivery and CGM glucose data
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Dropdown,
  Option,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { InsulinTotalsBar } from './InsulinTotalsBar';
import type { GlucoseReading, GlucoseUnit } from '../types';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { calculateGlucoseRangeStats, GLUCOSE_RANGE_COLORS, MIN_PERCENTAGE_TO_DISPLAY, convertGlucoseValue, getUnitLabel, formatGlucoseValue } from '../utils/data';
import { COLOR_SCHEME_DESCRIPTORS, getGlucoseColor, isDynamicColorScheme } from '../utils/formatting';
import type { BGColorScheme } from '../hooks/useBGColorScheme';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  maxValueContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  colorSchemeContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  colorSchemeDropdown: {
    minWidth: '200px',
  },
  chartWithBarWrapper: {
    display: 'flex',
    ...shorthands.gap('8px'),
    width: '100%',
    height: '400px',
  },
  glucoseRangeBar: {
    display: 'flex',
    flexDirection: 'column',
    width: '60px',
    height: '400px',
    ...shorthands.gap('4px'),
  },
  rangeBarSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.8,
    },
  },
  chartContainer: {
    flex: 1,
    height: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendLine: {
    width: '20px',
    height: '2px',
  },
  legendBar: {
    width: '12px',
    height: '20px',
    backgroundColor: '#1976D2',
  },
});

interface UnifiedTimelineProps {
  insulinData: Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>;
  glucoseReadings: GlucoseReading[];
  colorScheme: BGColorScheme;
  setColorScheme: (scheme: BGColorScheme) => void;
  maxGlucose: number;
  setMaxGlucose: (value: number) => void;
  glucoseUnit: GlucoseUnit;
}

export function UnifiedTimeline({ insulinData, glucoseReadings, colorScheme, setColorScheme, maxGlucose, setMaxGlucose, glucoseUnit }: UnifiedTimelineProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();

  // Check if there's any insulin data to display
  const hasBasalData = insulinData.some(d => d.basalRate > 0);
  const hasBolusData = insulinData.some(d => d.bolusTotal > 0);
  const hasGlucoseData = glucoseReadings.length > 0;

  // Calculate glucose range statistics for the bar
  const glucoseStats = hasGlucoseData 
    ? calculateGlucoseRangeStats(glucoseReadings, thresholds, 3)
    : { low: 0, inRange: 0, high: 0, total: 0 };

  const belowPercentage = glucoseStats.total > 0 ? ((glucoseStats.low / glucoseStats.total) * 100).toFixed(1) : '0.0';
  const inRangePercentage = glucoseStats.total > 0 ? ((glucoseStats.inRange / glucoseStats.total) * 100).toFixed(1) : '0.0';
  const abovePercentage = glucoseStats.total > 0 ? ((glucoseStats.high / glucoseStats.total) * 100).toFixed(1) : '0.0';

  if (!hasBasalData && !hasBolusData && !hasGlucoseData) {
    return (
      <div className={styles.container}>
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px' }}>
          No data available for this day
        </Text>
      </div>
    );
  }

  // Prepare glucose data at original granularity (every ~5 minutes)
  // Create data points for insulin (hourly) and glucose (at actual reading times)
  const glucoseDataPoints = glucoseReadings.map(reading => {
    const hour = reading.timestamp.getHours();
    const minute = reading.timestamp.getMinutes();
    const timeDecimal = hour + minute / 60; // e.g., 9:30 = 9.5
    
    return {
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      timeDecimal,
      basalRate: 0, // Will be filled from insulin data
      bolusTotal: 0, // Will be filled from insulin data
      glucose: convertGlucoseValue(reading.value, glucoseUnit), // Convert to display unit
      glucoseColor: getGlucoseColor(reading.value, colorScheme), // Use original mmol/L for color
      isGlucosePoint: true,
    };
  });

  // Create insulin-only data points (hourly)
  const insulinDataPoints = insulinData.map(insulin => ({
    ...insulin,
    timeDecimal: insulin.hour,
    glucose: null,
    glucoseColor: undefined,
    isGlucosePoint: false,
  }));

  // Merge and sort all data points by time
  const allDataPoints = [...insulinDataPoints, ...glucoseDataPoints].sort((a, b) => a.timeDecimal - b.timeDecimal);

  // For glucose points, fill in insulin values from the nearest previous insulin hour
  const mergedData = allDataPoints.map((point) => {
    if (point.isGlucosePoint) {
      // Find the insulin data for this hour
      const hourData = insulinData.find(insulin => insulin.hour === point.hour);
      return {
        ...point,
        basalRate: hourData?.basalRate || 0,
        bolusTotal: 0, // Don't show bolus at glucose points to avoid duplication
      };
    }
    return point;
  });

  // Custom dot renderer for colored glucose values (when using dynamic color schemes)
  const renderColoredDot = (props: { cx?: number; cy?: number; payload?: { glucoseColor?: string } }): React.ReactElement | null => {
    if (props.cx === undefined || props.cy === undefined || !props.payload || !props.payload.glucoseColor) return <></>;
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={3}
        fill={props.payload.glucoseColor}
        stroke={tokens.colorNeutralBackground1}
        strokeWidth={1}
      />
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      dataKey: string;
      color: string;
      payload: { timeLabel: string; basalRate: number; bolusTotal: number; glucose: number | null };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Find the glucose entry in the payload if it exists
      // Use the payload.glucose value (already converted) not entry.value
      const glucoseEntry = payload.find(entry => entry.dataKey === 'glucose');
      const glucoseValue = glucoseEntry ? glucoseEntry.payload.glucose : data.glucose;
      
      return (
        <div style={{
          backgroundColor: tokens.colorNeutralBackground1,
          padding: '12px',
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: tokens.borderRadiusMedium,
          fontSize: tokens.fontSizeBase200,
        }}>
          <div style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: '4px' }}>
            {data.timeLabel}
          </div>
          {glucoseValue !== null && glucoseValue !== undefined && (
            <div style={{ color: '#FF6B35', marginBottom: '4px' }}>
              Glucose: {formatGlucoseValue(glucoseValue, glucoseUnit)} {getUnitLabel(glucoseUnit)}
            </div>
          )}
          {data.basalRate > 0 && (
            <div style={{ color: '#2E7D32' }}>
              Basal Rate: {data.basalRate.toFixed(2)} U
            </div>
          )}
          {data.bolusTotal > 0 && (
            <div style={{ color: '#1976D2' }}>
              Bolus Total: {data.bolusTotal.toFixed(1)} U
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels (show every 3 hours)
  const formatXAxis = (value: number) => {
    const hour = Math.floor(value);
    if (hour === 0) return '12A';
    if (hour === 3) return '3A';
    if (hour === 6) return '6A';
    if (hour === 9) return '9A';
    if (hour === 12) return '12P';
    if (hour === 15) return '3P';
    if (hour === 18) return '6P';
    if (hour === 21) return '9P';
    return '';
  };

  // Calculate daily totals
  const basalTotal = insulinData.reduce((sum, d) => sum + d.basalRate, 0);
  const bolusTotal = insulinData.reduce((sum, d) => sum + d.bolusTotal, 0);

  return (
    <div className={styles.container}>
      {/* Controls Row - Always visible */}
      <div className={styles.controlsRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ 
            fontSize: tokens.fontSizeBase500, 
            fontWeight: tokens.fontWeightSemibold,
            fontFamily: tokens.fontFamilyBase,
            color: tokens.colorNeutralForeground1,
          }}>
            Unified Timeline
          </Text>
        </div>
        {hasGlucoseData && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className={styles.colorSchemeContainer}>
              <Text style={{ 
                fontSize: tokens.fontSizeBase300,
                fontFamily: tokens.fontFamilyBase,
                color: tokens.colorNeutralForeground2,
              }}>
                Color Scheme:
              </Text>
              <Dropdown
                value={COLOR_SCHEME_DESCRIPTORS[colorScheme].name}
                selectedOptions={[colorScheme]}
                onOptionSelect={(_, data) => setColorScheme(data.optionValue as BGColorScheme)}
                className={styles.colorSchemeDropdown}
                size="small"
                positioning="below-start"
                inlinePopup
              >
                <Option value="monochrome">{COLOR_SCHEME_DESCRIPTORS.monochrome.name}</Option>
                <Option value="basic">{COLOR_SCHEME_DESCRIPTORS.basic.name}</Option>
                <Option value="hsv">{COLOR_SCHEME_DESCRIPTORS.hsv.name}</Option>
                <Option value="clinical">{COLOR_SCHEME_DESCRIPTORS.clinical.name}</Option>
              </Dropdown>
            </div>
            <div className={styles.maxValueContainer}>
              <TabList
                selectedValue={
                  glucoseUnit === 'mg/dL'
                    ? (maxGlucose === 288 ? '288' : '396')
                    : (maxGlucose === 16.0 ? '16.0' : '22.0')
                }
                onTabSelect={(_, data) => {
                  if (glucoseUnit === 'mg/dL') {
                    setMaxGlucose(data.value === '288' ? 288 : 396);
                  } else {
                    setMaxGlucose(data.value === '16.0' ? 16.0 : 22.0);
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
        )}
      </div>

      <div className={styles.chartWithBarWrapper}>
        {/* Glucose Range Bar on the LEFT */}
        {hasGlucoseData && (
          <div className={styles.glucoseRangeBar}>
            {/* High segment */}
            {parseFloat(abovePercentage) > 0 && (
              <div
                className={styles.rangeBarSegment}
                style={{
                  height: `${abovePercentage}%`,
                  backgroundColor: GLUCOSE_RANGE_COLORS.high,
                }}
                title={`High: ${abovePercentage}%`}
                aria-label={`High: ${abovePercentage}%`}
                role="img"
              >
                {parseFloat(abovePercentage) >= MIN_PERCENTAGE_TO_DISPLAY && `${abovePercentage}%`}
              </div>
            )}
            
            {/* In Range segment */}
            {parseFloat(inRangePercentage) > 0 && (
              <div
                className={styles.rangeBarSegment}
                style={{
                  height: `${inRangePercentage}%`,
                  backgroundColor: GLUCOSE_RANGE_COLORS.inRange,
                }}
                title={`In Range: ${inRangePercentage}%`}
                aria-label={`In Range: ${inRangePercentage}%`}
                role="img"
              >
                {parseFloat(inRangePercentage) >= MIN_PERCENTAGE_TO_DISPLAY && `${inRangePercentage}%`}
              </div>
            )}
            
            {/* Low segment */}
            {parseFloat(belowPercentage) > 0 && (
              <div
                className={styles.rangeBarSegment}
                style={{
                  height: `${belowPercentage}%`,
                  backgroundColor: GLUCOSE_RANGE_COLORS.low,
                }}
                title={`Low: ${belowPercentage}%`}
                aria-label={`Low: ${belowPercentage}%`}
                role="img"
              >
                {parseFloat(belowPercentage) >= MIN_PERCENTAGE_TO_DISPLAY && `${belowPercentage}%`}
              </div>
            )}
          </div>
        )}

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              
              <XAxis
                dataKey="timeDecimal"
                type="number"
                domain={[0, 24]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                tickFormatter={formatXAxis}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <YAxis
                yAxisId="left"
                label={{ 
                  value: 'Insulin (Units)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ 
                  value: `Glucose (${getUnitLabel(glucoseUnit)})`, 
                  angle: 90, 
                  position: 'insideRight', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
                domain={[0, maxGlucose]}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: tokens.fontSizeBase200 }}
              />
              
              {/* Reference lines for glucose thresholds */}
              {hasGlucoseData && (
                <>
                  <ReferenceLine 
                    yAxisId="right" 
                    y={convertGlucoseValue(thresholds.low, glucoseUnit)} 
                    stroke="#FFA726" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={convertGlucoseValue(thresholds.high, glucoseUnit)} 
                    stroke="#FFA726" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                  />
                </>
              )}
              
              {/* Bolus bars */}
              {hasBolusData && (
                <Bar
                  yAxisId="left"
                  dataKey="bolusTotal"
                  name="Bolus"
                  fill="#1976D2"
                  barSize={20}
                />
              )}
              
              {/* Basal line */}
              {hasBasalData && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="basalRate"
                  name="Basal Rate"
                  stroke="#2E7D32"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              
              {/* Glucose line */}
              {hasGlucoseData && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="glucose"
                  name="Glucose"
                  stroke={isDynamicColorScheme(colorScheme) ? tokens.colorNeutralStroke2 : '#FF6B35'}
                  strokeWidth={isDynamicColorScheme(colorScheme) ? 1 : 2}
                  dot={isDynamicColorScheme(colorScheme) ? (renderColoredDot as unknown as boolean) : false}
                  activeDot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    stroke: tokens.colorNeutralBackground1,
                    fill: isDynamicColorScheme(colorScheme) ? undefined : '#FF6B35',
                  }}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insulin Totals bar on the RIGHT side */}
        <InsulinTotalsBar basalTotal={basalTotal} bolusTotal={bolusTotal} />
      </div>

      {/* Custom legend */}
      <div className={styles.legendContainer}>
        {hasGlucoseData && (
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#FF6B35' }} />
            <Text>Glucose (CGM data)</Text>
          </div>
        )}
        {hasBasalData && (
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#2E7D32' }} />
            <Text>Basal Rate (continuous delivery)</Text>
          </div>
        )}
        {hasBolusData && (
          <div className={styles.legendItem}>
            <div className={styles.legendBar} />
            <Text>Bolus (meal/correction doses)</Text>
          </div>
        )}
      </div>
    </div>
  );
}
