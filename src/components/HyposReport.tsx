/**
 * HyposReport component
 * Displays Hypoglycemia analysis with daily glucose values graph
 * Placeholder component with graph displaying monochrome coloring and day/night shading
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Card,
  TabList,
  Tab,
  mergeClasses,
} from '@fluentui/react-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { UploadedFile, GlucoseReading, GlucoseDataSource, GlucoseUnit } from '../types';
import { extractGlucoseReadings, smoothGlucoseValues, displayGlucoseValue, getUnitLabel, convertGlucoseValue, formatGlucoseValue } from '../utils/data';
import { 
  getUniqueDates, 
  filterReadingsByDate, 
} from '../utils/data';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';

/**
 * Max glucose values for Y-axis toggle
 */
const MAX_GLUCOSE_VALUES = {
  mmol: { low: 16.0, high: 22.0 },
  mgdl: { low: 288, high: 396 },
} as const;

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  reportSubtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'dashed', tokens.colorNeutralStroke1),
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground3,
  },
  summarySubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    marginTop: '4px',
    fontStyle: 'italic',
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
  chartContainerMobile: {
    ...shorthands.padding('4px', '0px'),
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
  noDataMessage: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase400,
  },
});

interface HyposReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
}

export function HyposReport({ selectedFile, glucoseUnit }: HyposReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  
  const [loading, setLoading] = useState(false);
  const [dateChanging, setDateChanging] = useState(false);
  const [allReadings, setAllReadings] = useState<GlucoseReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [maxGlucose, setMaxGlucose] = useState<number>(
    glucoseUnit === 'mg/dL' ? MAX_GLUCOSE_VALUES.mgdl.high : MAX_GLUCOSE_VALUES.mmol.high
  );
  const [dataSource] = useState<GlucoseDataSource>('cgm');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Track the file ID to detect file changes vs date changes
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  // Track whether we've already applied the saved date from cookie
  const hasAppliedSavedDateRef = useRef<boolean>(false);

  // Track window width for responsive margins
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive margins based on window width
  const getChartMargins = useCallback(() => {
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

  const chartMargins = useMemo(() => getChartMargins(), [getChartMargins]);

  // Load glucose readings when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setAllReadings([]);
      setAvailableDates([]);
      setCurrentDateIndex(0);
      loadedFileIdRef.current = undefined;
      hasAppliedSavedDateRef.current = false;
      return;
    }

    // Check if this is a file change
    const isFileChange = selectedFile.id !== loadedFileIdRef.current;
    
    // Check if we need to apply the saved date that just loaded from cookie
    const shouldApplySavedDate = !hasAppliedSavedDateRef.current && selectedDate && availableDates.includes(selectedDate);
    
    // If not a file change and we don't need to apply saved date, skip
    if (!isFileChange && !shouldApplySavedDate) {
      return;
    }

    // If we're just applying the saved date (not loading new data)
    if (!isFileChange && shouldApplySavedDate) {
      setCurrentDateIndex(availableDates.indexOf(selectedDate));
      hasAppliedSavedDateRef.current = true;
      return;
    }

    // Otherwise, load data for the new file
    const loadData = async () => {
      setLoading(true);
      try {
        const readings = await extractGlucoseReadings(selectedFile, dataSource);
        setAllReadings(readings);
        
        const dates = getUniqueDates(readings);
        setAvailableDates(dates);
        
        // If we have a saved date, try to use it
        if (selectedDate && dates.includes(selectedDate)) {
          setCurrentDateIndex(dates.indexOf(selectedDate));
          hasAppliedSavedDateRef.current = true;
        } else {
          // Otherwise, start with the last available date
          if (dates.length > 0) {
            setCurrentDateIndex(dates.length - 1);
          }
          hasAppliedSavedDateRef.current = false; // Will apply when cookie loads
        }
        
        // Mark that we've loaded data for this file
        loadedFileIdRef.current = selectedFile.id;
      } catch (error) {
        console.error('Failed to load glucose data:', error);
        setAllReadings([]);
        setAvailableDates([]);
        loadedFileIdRef.current = undefined;
        hasAppliedSavedDateRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, dataSource, selectedDate]);

  // Get current date string
  const currentDate = availableDates[currentDateIndex] || '';
  
  // Save current date to shared state when it changes
  useEffect(() => {
    if (currentDate && currentDate !== selectedDate) {
      setSelectedDate(currentDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);
  
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
      
      // Convert to display unit
      const convertedValue = convertGlucoseValue(reading.value, glucoseUnit);
      // Clamp value to maxGlucose (in display unit)
      const clampedValue = Math.min(convertedValue, maxGlucose);
      
      return {
        time: timeString,
        timeMinutes: hours * 60 + minutes, // For sorting
        timeDecimal: hours + minutes / 60, // For X-axis positioning
        value: clampedValue,
        originalValue: convertedValue, // Keep original (converted) for tooltip
      };
    })
    .sort((a, b) => a.timeMinutes - b.timeMinutes);

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

  // Handle date selection from date picker
  const handleDateSelect = (date: string) => {
    const newIndex = availableDates.indexOf(date);
    if (newIndex !== -1) {
      setDateChanging(true);
      setCurrentDateIndex(newIndex);
      setTimeout(() => setDateChanging(false), 100);
    }
  };

  // Get min and max dates for date picker
  const minDate = availableDates.length > 0 ? availableDates[0] : undefined;
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;

  // Custom tooltip with Fluent UI styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string; value: number; originalValue: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayValue = data.originalValue > maxGlucose 
        ? `${formatGlucoseValue(data.originalValue, glucoseUnit)} (clamped to ${formatGlucoseValue(maxGlucose, glucoseUnit)})`
        : formatGlucoseValue(data.value, glucoseUnit);
      
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
        </div>
      );
    }
    return null;
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
          Please select a file to view hypoglycemia analysis
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
      {/* Header with title and subtitle */}
      <div className={styles.header}>
        <Text className={styles.reportTitle}>Hypoglycemia Analysis</Text>
        <Text className={styles.reportSubtitle}>
          Hypoglycemia (low blood sugar) occurs when glucose levels fall below target range, 
          typically below 3.9 mmol/L (70 mg/dL). This report helps identify patterns and timing of low glucose events.
        </Text>
      </div>

      {/* Date Navigation */}
      <DayNavigator
        currentDate={currentDate}
        onPreviousDay={handlePreviousDate}
        onNextDay={handleNextDate}
        canGoPrevious={currentDateIndex > 0}
        canGoNext={currentDateIndex < availableDates.length - 1}
        loading={dateChanging}
        onDateSelect={handleDateSelect}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* Empty Stats Cards - Placeholder for future implementation */}
      <div className={styles.summarySection}>
        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Hypo Events</Text>
          <div>
            <Text className={styles.summaryValue}>—</Text>
          </div>
          <Text className={styles.summarySubtext}>Coming soon</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Time Below Range</Text>
          <div>
            <Text className={styles.summaryValue}>—</Text>
          </div>
          <Text className={styles.summarySubtext}>Coming soon</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Lowest Reading</Text>
          <div>
            <Text className={styles.summaryValue}>—</Text>
          </div>
          <Text className={styles.summarySubtext}>Coming soon</Text>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Average Duration</Text>
          <div>
            <Text className={styles.summaryValue}>—</Text>
          </div>
          <Text className={styles.summarySubtext}>Coming soon</Text>
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
            <LineChart data={chartData} margin={chartMargins}>
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
              </defs>
              
              {/* Gradual night hours shading - midnight to 8AM (darkest at midnight) */}
              <ReferenceArea
                x1="00:00"
                x2="08:00"
                fill="url(#hyposNightGradientLeft)"
              />
              {/* Gradual night hours shading - 8PM to midnight (darkest at midnight) */}
              <ReferenceArea
                x1="20:00"
                x2="23:59"
                fill="url(#hyposNightGradientRight)"
              />
              
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
              
              <Tooltip content={<CustomTooltip />} />
              
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
              
              {/* Glucose values line - monochrome coloring */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={tokens.colorBrandForeground1}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  strokeWidth: 2,
                  stroke: tokens.colorNeutralBackground1,
                  fill: tokens.colorBrandForeground1,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
