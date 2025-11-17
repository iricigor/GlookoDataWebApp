/**
 * UnifiedCGMInsulinReport component
 * Displays combined CGM and Insulin data on a single graph with dual Y-axes
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Card,
  TabList,
  Tab,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { UploadedFile, GlucoseReading, InsulinReading } from '../types';
import { extractGlucoseReadings, smoothGlucoseValues, extractInsulinReadings } from '../utils/data';
import { 
  getUniqueDates, 
  filterReadingsByDate, 
  calculateGlucoseRangeStats,
  GLUCOSE_RANGE_COLORS,
  MIN_PERCENTAGE_TO_DISPLAY,
  prepareInsulinTimelineData,
} from '../utils/data';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { DayNavigator } from './DayNavigator';
import { useBGColorScheme } from '../hooks/useBGColorScheme';
import { getGlucoseColor, isDynamicColorScheme, COLOR_SCHEME_DESCRIPTORS } from '../utils/formatting';
import type { BGColorScheme } from '../hooks/useBGColorScheme';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
  },
  summarySubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginTop: '4px',
  },
  summaryUnit: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    marginLeft: '4px',
  },
  chartCard: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
  },
  chartWithBarsContainer: {
    display: 'flex',
    ...shorthands.gap('16px'),
    marginTop: '16px',
  },
  leftSummaryBar: {
    display: 'flex',
    flexDirection: 'column',
    width: '60px',
    height: '400px',
    ...shorthands.gap('4px'),
  },
  chartWrapper: {
    flex: 1,
    height: '400px',
  },
  rightSummaryBar: {
    display: 'flex',
    flexDirection: 'column',
    width: '100px',
    height: '400px',
    ...shorthands.gap('8px'),
  },
  summaryBarSegment: {
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
  insulinSummaryCard: {
    ...shorthands.padding('8px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    textAlign: 'center',
  },
  insulinLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
  },
  insulinValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  colorSchemeDropdown: {
    minWidth: '200px',
  },
  statValueBelow: {
    color: tokens.colorPaletteRedForeground1,
  },
  statValueInRange: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statValueAbove: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  noDataMessage: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase400,
  },
});

interface UnifiedCGMInsulinReportProps {
  selectedFile?: UploadedFile;
}

export function UnifiedCGMInsulinReport({ selectedFile }: UnifiedCGMInsulinReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const { colorScheme, setColorScheme } = useBGColorScheme();
  
  const [loading, setLoading] = useState(false);
  const [dateChanging, setDateChanging] = useState(false);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [insulinReadings, setInsulinReadings] = useState<InsulinReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [maxGlucose, setMaxGlucose] = useState<number>(22.0);

  // Load glucose and insulin readings when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setGlucoseReadings([]);
      setInsulinReadings([]);
      setAvailableDates([]);
      setCurrentDateIndex(0);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Extract glucose readings
        const cgmReadings = await extractGlucoseReadings(selectedFile, 'cgm');
        setGlucoseReadings(cgmReadings);
        
        // Extract insulin readings
        const allInsulinReadings = await extractInsulinReadings(selectedFile);
        setInsulinReadings(allInsulinReadings);
        
        // Get unique dates from glucose readings
        const dates = getUniqueDates(cgmReadings);
        setAvailableDates(dates);
        
        // Start with the last available date
        if (dates.length > 0) {
          setCurrentDateIndex(dates.length - 1);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setGlucoseReadings([]);
        setInsulinReadings([]);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile]);

  // Get current date string
  const currentDate = availableDates[currentDateIndex] || '';
  
  // Filter glucose readings for current date
  const currentGlucoseReadings = currentDate ? filterReadingsByDate(glucoseReadings, currentDate) : [];

  // Apply smoothing to glucose values
  const smoothedReadings = smoothGlucoseValues(currentGlucoseReadings);

  // Prepare insulin timeline data for current date
  const insulinTimelineData = currentDate ? prepareInsulinTimelineData(insulinReadings, currentDate) : [];

  // Calculate insulin totals
  const basalTotal = insulinTimelineData.reduce((sum, d) => sum + d.basalRate, 0);
  const bolusTotal = insulinTimelineData.reduce((sum, d) => sum + d.bolusTotal, 0);
  const totalInsulin = basalTotal + bolusTotal;

  // Prepare combined chart data
  const chartData = (() => {
    const dataMap = new Map<number, {
      time: string;
      timeMinutes: number;
      glucoseValue: number;
      originalGlucoseValue: number;
      glucoseColor: string;
      basalRate: number;
      bolusTotal: number;
    }>();

    // Add glucose data
    smoothedReadings.forEach(reading => {
      const time = reading.timestamp;
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const timeMinutes = hours * 60 + minutes;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const clampedValue = Math.min(reading.value, maxGlucose);
      
      dataMap.set(timeMinutes, {
        time: timeString,
        timeMinutes,
        glucoseValue: clampedValue,
        originalGlucoseValue: reading.value,
        glucoseColor: getGlucoseColor(reading.value, colorScheme),
        basalRate: 0,
        bolusTotal: 0,
      });
    });

    // Add insulin data
    insulinTimelineData.forEach(insulinData => {
      const existing = dataMap.get(insulinData.hour * 60);
      if (existing) {
        existing.basalRate = insulinData.basalRate;
        existing.bolusTotal = insulinData.bolusTotal;
      } else {
        dataMap.set(insulinData.hour * 60, {
          time: insulinData.timeLabel,
          timeMinutes: insulinData.hour * 60,
          glucoseValue: 0,
          originalGlucoseValue: 0,
          glucoseColor: tokens.colorNeutralForeground2,
          basalRate: insulinData.basalRate,
          bolusTotal: insulinData.bolusTotal,
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timeMinutes - b.timeMinutes);
  })();

  // Calculate daily glucose statistics
  const stats = currentGlucoseReadings.length > 0 
    ? calculateGlucoseRangeStats(currentGlucoseReadings, thresholds, 3)
    : { low: 0, inRange: 0, high: 0, total: 0 };

  const belowPercentage = stats.total > 0 ? ((stats.low / stats.total) * 100).toFixed(1) : '0.0';
  const inRangePercentage = stats.total > 0 ? ((stats.inRange / stats.total) * 100).toFixed(1) : '0.0';
  const abovePercentage = stats.total > 0 ? ((stats.high / stats.total) * 100).toFixed(1) : '0.0';

  // Navigation handlers
  const handlePreviousDate = () => {
    if (currentDateIndex > 0) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex - 1);
      setTimeout(() => setDateChanging(false), 100);
    }
  };

  const handleNextDate = () => {
    if (currentDateIndex < availableDates.length - 1) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex + 1);
      setTimeout(() => setDateChanging(false), 100);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{ 
      payload: {
        time: string;
        glucoseValue: number;
        originalGlucoseValue: number;
        basalRate: number;
        bolusTotal: number;
      }
    }> 
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayGlucose = data.originalGlucoseValue > maxGlucose 
        ? `${data.originalGlucoseValue.toFixed(1)} (clamped to ${maxGlucose.toFixed(1)})`
        : data.glucoseValue > 0 ? data.glucoseValue.toFixed(1) : 'N/A';
      
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
          {data.glucoseValue > 0 && (
            <div style={{ color: tokens.colorNeutralForeground2 }}>
              Glucose: {displayGlucose} mmol/L
            </div>
          )}
          {data.basalRate > 0 && (
            <div style={{ color: '#2E7D32' }}>
              Basal: {data.basalRate.toFixed(2)} U
            </div>
          )}
          {data.bolusTotal > 0 && (
            <div style={{ color: '#1976D2' }}>
              Bolus: {data.bolusTotal.toFixed(1)} U
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom dot renderer for colored glucose values
  const renderColoredDot = (props: { cx?: number; cy?: number; payload?: { glucoseColor: string } }): React.ReactElement | null => {
    if (props.cx === undefined || props.cy === undefined || !props.payload) return <></>;
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

  // Format X-axis labels
  const formatXAxis = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    if (hour === 0) return '00:00';
    if (hour === 6) return '06:00';
    if (hour === 12) return '12:00';
    if (hour === 18) return '18:00';
    if (hour === 23) return '23:59';
    return '';
  };

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please select a file to view unified CGM and insulin data
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Loading data...
        </Text>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          No data available
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Date Navigation */}
      <DayNavigator
        currentDate={currentDate}
        onPreviousDay={handlePreviousDate}
        onNextDay={handleNextDate}
        canGoPrevious={currentDateIndex > 0}
        canGoNext={currentDateIndex < availableDates.length - 1}
        loading={dateChanging}
      />

      {/* CGM Summary Cards */}
      <div className={styles.summarySection}>
        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Below Range</Text>
          <div>
            <Text className={`${styles.summaryValue} ${styles.statValueBelow}`}>
              {belowPercentage}%
            </Text>
          </div>
          <Text className={styles.summarySubtext}>({stats.low} readings)</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>In Range</Text>
          <div>
            <Text className={`${styles.summaryValue} ${styles.statValueInRange}`}>
              {inRangePercentage}%
            </Text>
          </div>
          <Text className={styles.summarySubtext}>({stats.inRange} readings)</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Above Range</Text>
          <div>
            <Text className={`${styles.summaryValue} ${styles.statValueAbove}`}>
              {abovePercentage}%
            </Text>
          </div>
          <Text className={styles.summarySubtext}>({stats.high} readings)</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Readings</Text>
          <div>
            <Text className={styles.summaryValue} style={{ color: tokens.colorNeutralForeground1 }}>
              {stats.total}
            </Text>
          </div>
        </Card>
      </div>

      {/* Insulin Summary Cards */}
      <div className={styles.summarySection}>
        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Basal</Text>
          <div>
            <Text className={styles.summaryValue} style={{ color: '#2E7D32' }}>
              {basalTotal.toFixed(1)}
            </Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Bolus</Text>
          <div>
            <Text className={styles.summaryValue} style={{ color: '#1976D2' }}>
              {bolusTotal.toFixed(1)}
            </Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Insulin</Text>
          <div>
            <Text className={styles.summaryValue} style={{ color: tokens.colorNeutralForeground1 }}>
              {totalInsulin.toFixed(1)}
            </Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>
      </div>

      {/* Combined Chart */}
      <Card className={styles.chartCard}>
        <div className={styles.controlsRow}>
          <Text style={{ 
            fontSize: tokens.fontSizeBase500, 
            fontWeight: tokens.fontWeightSemibold,
            fontFamily: tokens.fontFamilyBase,
            color: tokens.colorNeutralForeground1,
          }}>
            CGM & Insulin Throughout the Day
          </Text>
          <div className={styles.rightControls}>
            <div className={styles.controlGroup}>
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
            <div className={styles.controlGroup}>
              <Text style={{ 
                fontSize: tokens.fontSizeBase300,
                fontFamily: tokens.fontFamilyBase,
                color: tokens.colorNeutralForeground2,
              }}>
                Max: {maxGlucose.toFixed(1)} mmol/L
              </Text>
              <TabList
                selectedValue={maxGlucose === 16.0 ? '16.0' : '22.0'}
                onTabSelect={(_, data) => setMaxGlucose(data.value === '16.0' ? 16.0 : 22.0)}
                size="small"
              >
                <Tab value="16.0">16.0</Tab>
                <Tab value="22.0">22.0</Tab>
              </TabList>
            </div>
          </div>
        </div>
        
        <div className={styles.chartWithBarsContainer}>
          {/* Left summary bar - Glucose ranges */}
          <div className={styles.leftSummaryBar}>
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

          {/* Chart */}
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="time"
                  domain={['00:00', '23:59']}
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
                
                {/* Left Y-axis for glucose */}
                <YAxis
                  yAxisId="glucose"
                  domain={[0, maxGlucose]}
                  label={{ 
                    value: 'Glucose (mmol/L)', 
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
                
                {/* Right Y-axis for insulin */}
                <YAxis
                  yAxisId="insulin"
                  orientation="right"
                  label={{ 
                    value: 'Insulin (Units)', 
                    angle: 90, 
                    position: 'insideRight', 
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
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Target range reference lines */}
                <ReferenceLine 
                  yAxisId="glucose"
                  y={thresholds.low} 
                  stroke={tokens.colorPaletteRedBorder1}
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `Low (${thresholds.low})`, 
                    position: 'insideTopLeft', 
                    style: { 
                      fontSize: tokens.fontSizeBase200,
                      fontFamily: tokens.fontFamilyBase,
                      fill: tokens.colorPaletteRedForeground1,
                    } 
                  }}
                />
                <ReferenceLine 
                  yAxisId="glucose"
                  y={thresholds.high} 
                  stroke={tokens.colorPaletteMarigoldBorder1}
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `High (${thresholds.high})`, 
                    position: 'insideTopLeft', 
                    style: { 
                      fontSize: tokens.fontSizeBase200,
                      fontFamily: tokens.fontFamilyBase,
                      fill: tokens.colorPaletteMarigoldForeground1,
                    } 
                  }}
                />
                
                {/* Glucose line with dynamic coloring */}
                <Line
                  yAxisId="glucose"
                  type="monotone"
                  dataKey="glucoseValue"
                  stroke={isDynamicColorScheme(colorScheme) ? tokens.colorNeutralStroke2 : tokens.colorBrandForeground1}
                  strokeWidth={isDynamicColorScheme(colorScheme) ? 1 : 2}
                  dot={isDynamicColorScheme(colorScheme) ? (renderColoredDot as unknown as boolean) : false}
                  activeDot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    stroke: tokens.colorNeutralBackground1,
                    fill: isDynamicColorScheme(colorScheme) ? undefined : tokens.colorBrandForeground1,
                  }}
                  connectNulls={false}
                />
                
                {/* Bolus bars */}
                <Bar
                  yAxisId="insulin"
                  dataKey="bolusTotal"
                  fill="#1976D2"
                  barSize={15}
                />
                
                {/* Basal line */}
                <Line
                  yAxisId="insulin"
                  type="stepAfter"
                  dataKey="basalRate"
                  stroke="#2E7D32"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Right summary bar - Insulin totals */}
          <div className={styles.rightSummaryBar}>
            <div className={styles.insulinSummaryCard} style={{ backgroundColor: '#2E7D32', color: 'white' }}>
              <Text className={styles.insulinLabel} style={{ color: 'white' }}>Basal</Text>
              <Text className={styles.insulinValue} style={{ color: 'white' }}>{basalTotal.toFixed(1)}U</Text>
            </div>
            
            <div className={styles.insulinSummaryCard} style={{ backgroundColor: '#1976D2', color: 'white' }}>
              <Text className={styles.insulinLabel} style={{ color: 'white' }}>Bolus</Text>
              <Text className={styles.insulinValue} style={{ color: 'white' }}>{bolusTotal.toFixed(1)}U</Text>
            </div>
            
            <div className={styles.insulinSummaryCard} style={{ backgroundColor: tokens.colorNeutralBackground2 }}>
              <Text className={styles.insulinLabel}>Total</Text>
              <Text className={styles.insulinValue}>{totalInsulin.toFixed(1)}U</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
