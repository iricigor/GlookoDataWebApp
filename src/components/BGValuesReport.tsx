/**
 * BG Values Report component
 * Displays daily glucose values graph with navigation
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { UploadedFile, GlucoseReading, GlucoseDataSource } from '../types';
import type { ExportFormat } from '../hooks/useExportFormat';
import { extractGlucoseReadings, smoothGlucoseValues } from '../utils/glucoseDataUtils';
import { 
  getUniqueDates, 
  filterReadingsByDate, 
  calculateGlucoseRangeStats,
} from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { DayNavigator } from './DayNavigator';
import { useBGColorScheme } from '../hooks/useBGColorScheme';
import { getGlucoseColor, isDynamicColorScheme, COLOR_SCHEME_DESCRIPTORS } from '../utils/bgColorUtils';
import type { BGColorScheme } from '../hooks/useBGColorScheme';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
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
  chartCard: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
  },
  chartContainer: {
    width: '100%',
    height: '400px',
    marginTop: '16px',
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
  statsCard: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    ...shorthands.gap('16px'),
    marginTop: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
  },
  statValue: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
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

interface BGValuesReportProps {
  selectedFile?: UploadedFile;
  exportFormat: ExportFormat;
}

export function BGValuesReport({ selectedFile }: BGValuesReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const { colorScheme, setColorScheme } = useBGColorScheme();
  
  const [loading, setLoading] = useState(false);
  const [dateChanging, setDateChanging] = useState(false);
  const [allReadings, setAllReadings] = useState<GlucoseReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [maxGlucose, setMaxGlucose] = useState<number>(22.0);
  const [dataSource] = useState<GlucoseDataSource>('cgm');

  // Load glucose readings when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setAllReadings([]);
      setAvailableDates([]);
      setCurrentDateIndex(0);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const readings = await extractGlucoseReadings(selectedFile, dataSource);
        setAllReadings(readings);
        
        const dates = getUniqueDates(readings);
        setAvailableDates(dates);
        
        // Start with the last available date
        if (dates.length > 0) {
          setCurrentDateIndex(dates.length - 1);
        }
      } catch (error) {
        console.error('Failed to load glucose data:', error);
        setAllReadings([]);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource]);

  // Get current date string
  const currentDate = availableDates[currentDateIndex] || '';
  
  // Filter readings for current date
  const currentReadings = currentDate ? filterReadingsByDate(allReadings, currentDate) : [];

  // Apply smoothing to glucose values
  const smoothedReadings = smoothGlucoseValues(currentReadings);

  // Prepare chart data
  const chartData = smoothedReadings
    .map(reading => {
      const time = reading.timestamp;
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Clamp value to maxGlucose
      const clampedValue = Math.min(reading.value, maxGlucose);
      
      return {
        time: timeString,
        timeMinutes: hours * 60 + minutes, // For sorting
        value: clampedValue,
        originalValue: reading.value, // Keep original for tooltip
        color: getGlucoseColor(reading.value, colorScheme), // Calculate color based on scheme
      };
    })
    .sort((a, b) => a.timeMinutes - b.timeMinutes);

  // Calculate daily statistics
  const stats = currentReadings.length > 0 
    ? calculateGlucoseRangeStats(currentReadings, thresholds, 3)
    : { low: 0, inRange: 0, high: 0, total: 0 };

  const belowPercentage = stats.total > 0 ? ((stats.low / stats.total) * 100).toFixed(1) : '0.0';
  const inRangePercentage = stats.total > 0 ? ((stats.inRange / stats.total) * 100).toFixed(1) : '0.0';
  const abovePercentage = stats.total > 0 ? ((stats.high / stats.total) * 100).toFixed(1) : '0.0';

  // Navigation handlers
  const handlePreviousDate = () => {
    if (currentDateIndex > 0) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex - 1);
      // Clear loading state after a brief moment
      setTimeout(() => setDateChanging(false), 100);
    }
  };

  const handleNextDate = () => {
    if (currentDateIndex < availableDates.length - 1) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex + 1);
      // Clear loading state after a brief moment
      setTimeout(() => setDateChanging(false), 100);
    }
  };

  // Custom tooltip with Fluent UI styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string; value: number; originalValue: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayValue = data.originalValue > maxGlucose 
        ? `${data.originalValue.toFixed(1)} (clamped to ${maxGlucose.toFixed(1)})`
        : data.value.toFixed(1);
      
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
            Glucose: {displayValue} mmol/L
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot renderer for colored glucose values
  const renderColoredDot = (props: { cx?: number; cy?: number; payload?: { color: string } }): React.ReactElement | null => {
    if (props.cx === undefined || props.cy === undefined || !props.payload) return <></>;
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

  // Format X-axis labels (show only key times)
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
          Please select a file to view continuous glucose monitoring values
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
          No glucose data available
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

      {/* Daily Statistics - moved above chart, styled like Insulin page */}
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

      {/* Chart */}
      <Card className={styles.chartCard}>
        <div className={styles.controlsRow}>
          <Text style={{ 
            fontSize: tokens.fontSizeBase500, 
            fontWeight: tokens.fontWeightSemibold,
            fontFamily: tokens.fontFamilyBase,
            color: tokens.colorNeutralForeground1,
          }}>
            Glucose Values Throughout the Day
          </Text>
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
        
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {/* No CartesianGrid for clean Fluent UI look */}
              
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
              
              <YAxis
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
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Target range reference lines with Fluent UI semantic colors */}
              <ReferenceLine 
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
              
              {/* Glucose values line with dynamic or monochrome coloring */}
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
      </Card>
    </div>
  );
}
