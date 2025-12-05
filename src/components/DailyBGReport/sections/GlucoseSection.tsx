/**
 * Glucose Section component for DailyBGReport
 * Displays glucose statistics cards and the main glucose chart
 */

import {
  Text,
  tokens,
  Card,
  TabList,
  Tab,
  Dropdown,
  Option,
  Tooltip as FluentTooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  TopSpeedRegular,
  DataHistogramRegular,
  ArrowTrendingDownRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { GlucoseUnit, GlucoseThresholds } from '../../../types';
import { 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue,
  GLUCOSE_RANGE_COLORS,
  MIN_PERCENTAGE_TO_DISPLAY,
} from '../../../utils/data';
import { isDynamicColorScheme, COLOR_SCHEME_DESCRIPTORS } from '../../../utils/formatting';
import type { BGColorScheme } from '../../../hooks/useBGColorScheme';
import { GlucoseTooltip } from '../tooltips';
import { formatXAxis } from '../constants';
import type { useStyles } from '../styles';

interface GlucoseSectionProps {
  styles: ReturnType<typeof useStyles>;
  glucoseUnit: GlucoseUnit;
  thresholds: GlucoseThresholds;
  glucoseStats: { low: number; inRange: number; high: number; total: number };
  belowPercentage: string;
  inRangePercentage: string;
  abovePercentage: string;
  maxGlucose: number;
  setMaxGlucose: (value: number) => void;
  colorScheme: BGColorScheme;
  setColorScheme: (scheme: BGColorScheme) => void;
  glucoseChartData: Array<{
    time: string;
    timeMinutes: number;
    timeDecimal: number;
    value: number;
    originalValue: number;
    color: string;
  }>;
  showDayNightShading: boolean;
}

export function GlucoseSection({
  styles,
  glucoseUnit,
  thresholds,
  glucoseStats,
  belowPercentage,
  inRangePercentage,
  abovePercentage,
  maxGlucose,
  setMaxGlucose,
  colorScheme,
  setColorScheme,
  glucoseChartData,
  showDayNightShading,
}: GlucoseSectionProps) {
  // Custom dot renderer for colored glucose values
  const renderColoredDot = (props: { cx?: number; cy?: number; payload?: { color: string } }): React.ReactElement | null => {
    if (props.cx === undefined || props.cy === undefined || !props.payload) return null;
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={3}
        fill={props.payload.color}
        stroke={tokens.colorNeutralBackground1}
        strokeWidth={1}
      />
    );
  };

  return (
    <div className={styles.sectionCard}>
      {/* BG Section Title */}
      <Text className={styles.sectionTitle}>Glucose Values Throughout the Day</Text>

      {/* BG Summary Cards - unified style with icons */}
      <div className={styles.statsRow}>
        <FluentTooltip content="Percentage of readings below target range" relationship="description">
          <Card className={mergeClasses(styles.statCard, styles.statCardDanger)}>
            <ArrowTrendingDownRegular className={mergeClasses(styles.statIcon, styles.statIconDanger)} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Below Range</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{belowPercentage}%</Text>
                <Text className={styles.statUnit}>({glucoseStats.low})</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>

        <FluentTooltip content="Percentage of readings in target range" relationship="description">
          <Card className={mergeClasses(styles.statCard, styles.statCardSuccess)}>
            <DataHistogramRegular className={mergeClasses(styles.statIcon, styles.statIconSuccess)} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>In Range</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{inRangePercentage}%</Text>
                <Text className={styles.statUnit}>({glucoseStats.inRange})</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>

        <FluentTooltip content="Percentage of readings above target range" relationship="description">
          <Card className={mergeClasses(styles.statCard, styles.statCardWarning)}>
            <TopSpeedRegular className={mergeClasses(styles.statIcon, styles.statIconWarning)} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Above Range</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{abovePercentage}%</Text>
                <Text className={styles.statUnit}>({glucoseStats.high})</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>

        <FluentTooltip content="Total number of glucose readings for the day" relationship="description">
          <Card className={styles.statCard}>
            <ClockRegular className={styles.statIcon} />
            <div className={styles.statContent}>
              <Text className={styles.statLabel}>Total Readings</Text>
              <div className={styles.statValueRow}>
                <Text className={styles.statValue}>{glucoseStats.total}</Text>
              </div>
            </div>
          </Card>
        </FluentTooltip>
      </div>

      {/* BG Chart */}
      <div className={styles.chartCardInnerContent}>
        <div className={styles.controlsRow}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
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
        </div>
        
        <div className={styles.chartWithBarContainer}>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucoseChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                {/* Day/night shading gradients */}
                {showDayNightShading && (
                  <defs>
                    <linearGradient id="dailyBGNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="dailyBGNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                      <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                )}
                
                {/* Day/night shading - midnight to 8AM */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={0}
                    x2={8}
                    fill="url(#dailyBGNightGradientLeft)"
                  />
                )}
                {/* Day/night shading - 8PM to midnight */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={20}
                    x2={24}
                    fill="url(#dailyBGNightGradientRight)"
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
                
                <RechartsTooltip content={<GlucoseTooltip glucoseUnit={glucoseUnit} maxGlucose={maxGlucose} />} />
                
                {/* Target range reference lines */}
                <ReferenceLine 
                  y={convertGlucoseValue(thresholds.low, glucoseUnit)} 
                  stroke={tokens.colorPaletteRedBorder1}
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `Low (${displayGlucoseValue(thresholds.low, glucoseUnit)})`, 
                    position: 'insideTopLeft', 
                    style: { 
                      fontSize: tokens.fontSizeBase200,
                      fontFamily: tokens.fontFamilyBase,
                      fill: tokens.colorPaletteRedForeground1,
                    } 
                  }}
                />
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
                
                {/* Glucose values line */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isDynamicColorScheme(colorScheme) ? tokens.colorNeutralStroke2 : tokens.colorBrandForeground1}
                  strokeWidth={isDynamicColorScheme(colorScheme) ? 1 : 2}
                  dot={isDynamicColorScheme(colorScheme) ? (renderColoredDot as unknown as boolean) : false}
                  activeDot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    stroke: tokens.colorNeutralBackground1,
                    fill: isDynamicColorScheme(colorScheme) ? undefined : tokens.colorBrandForeground1,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Vertical summary bar */}
          <div className={styles.summaryBarContainer}>
            {parseFloat(abovePercentage) > 0 && (
              <div
                className={styles.summaryBarSegment}
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
            
            {parseFloat(inRangePercentage) > 0 && (
              <div
                className={styles.summaryBarSegment}
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
            
            {parseFloat(belowPercentage) > 0 && (
              <div
                className={styles.summaryBarSegment}
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
        </div>
        
        {/* BG Legend */}
        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: tokens.colorBrandForeground1 }} />
            <Text>Glucose Values</Text>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDashedLine} style={{ borderColor: tokens.colorPaletteRedBorder1 }} />
            <Text>Low Threshold ({displayGlucoseValue(thresholds.low, glucoseUnit)} {getUnitLabel(glucoseUnit)})</Text>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDashedLine} style={{ borderColor: tokens.colorPaletteMarigoldBorder1 }} />
            <Text>High Threshold ({displayGlucoseValue(thresholds.high, glucoseUnit)} {getUnitLabel(glucoseUnit)})</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
