/**
 * HyposReport component
 * Displays Hypoglycemia analysis with daily glucose values graph
 * Features color-coded line (green/light red/dark red) based on glucose levels
 * and comprehensive hypo statistics including duration, nadir values, and counts
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
  Tooltip,
} from '@fluentui/react-components';
import {
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  TimerRegular,
  ClockRegular,
} from '@fluentui/react-icons';
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
import type { UploadedFile, GlucoseReading, GlucoseDataSource, GlucoseUnit } from '../types';
import { 
  extractGlucoseReadings, 
  smoothGlucoseValues, 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue, 
  formatGlucoseValue,
  getUniqueDates, 
  filterReadingsByDate,
  calculateHypoStats,
  formatHypoDuration,
} from '../utils/data';
import type { HypoStats } from '../utils/data/hypoDataUtils';
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

/**
 * Colors for hypo chart visualization
 */
const HYPO_CHART_COLORS = {
  normal: '#4CAF50',     // Green for normal glucose
  low: '#FF6B6B',        // Light red for below low threshold
  veryLow: '#8B0000',    // Dark red for below veryLow threshold
  nadirDot: '#8B0000',   // Dark red for nadir dots
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    ...shorthands.gap('16px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  summaryCardSuccess: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
  },
  summaryCardWarning: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteMarigoldBorder1),
  },
  summaryCardDanger: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
  },
  summaryIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  summaryIconSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  summaryIconWarning: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  summaryIconDanger: {
    color: tokens.colorPaletteRedForeground1,
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '4px',
  },
  summaryValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground1,
  },
  summaryValueSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  summaryValueSmiley: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: tokens.fontSizeBase500,
  },
  summaryUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginTop: '8px',
    fontSize: tokens.fontSizeBase200,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendLine: {
    width: '20px',
    height: '3px',
    ...shorthands.borderRadius('2px'),
  },
  legendDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
  },
  legendDashedLine: {
    width: '20px',
    height: '0',
    borderTop: `2px dashed ${tokens.colorNeutralStroke1}`,
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
  
  // Filter readings for current date (sorted by timestamp)
  const currentReadings = useMemo(() => {
    const filtered = currentDate ? filterReadingsByDate(allReadings, currentDate) : [];
    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [allReadings, currentDate]);

  // Calculate hypo statistics for current day
  const hypoStats: HypoStats | null = useMemo(() => {
    if (currentReadings.length === 0) return null;
    return calculateHypoStats(currentReadings, thresholds);
  }, [currentReadings, thresholds]);

  // Apply smoothing to glucose values
  const smoothedReadings = smoothGlucoseValues(currentReadings);

  // Prepare chart data with color information for each segment
  const chartData = useMemo(() => {
    return smoothedReadings
      .map((reading, index) => {
        const time = reading.timestamp;
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Convert to display unit
        const convertedValue = convertGlucoseValue(reading.value, glucoseUnit);
        // Clamp value to maxGlucose (in display unit)
        const clampedValue = Math.min(convertedValue, maxGlucose);
        
        // Determine color based on glucose level (using mmol/L thresholds)
        let color: string;
        if (reading.value < thresholds.veryLow) {
          color = HYPO_CHART_COLORS.veryLow;
        } else if (reading.value < thresholds.low) {
          color = HYPO_CHART_COLORS.low;
        } else {
          color = HYPO_CHART_COLORS.normal;
        }
        
        return {
          time: timeString,
          timeMinutes: hours * 60 + minutes, // For sorting
          timeDecimal: hours + minutes / 60, // For X-axis positioning
          value: clampedValue,
          originalValue: convertedValue, // Keep original (converted) for tooltip
          rawValue: reading.value, // Keep raw mmol/L value
          color,
          index,
        };
      })
      .sort((a, b) => a.timeMinutes - b.timeMinutes);
  }, [smoothedReadings, glucoseUnit, maxGlucose, thresholds]);

  // Create optimized gradient stops for the glucose line
  // Merges consecutive points with the same color to reduce DOM elements
  const gradientStops = useMemo(() => {
    if (chartData.length < 2) return [];
    
    const stops: Array<{ offset: string; color: string }> = [];
    let prevColor = chartData[0].color;
    
    // Always add first point
    stops.push({
      offset: `${(chartData[0].timeDecimal / 24) * 100}%`,
      color: chartData[0].color,
    });
    
    // Add stops only when color changes
    for (let i = 1; i < chartData.length; i++) {
      const point = chartData[i];
      if (point.color !== prevColor) {
        // Add a stop at the previous point with the old color (to ensure clean transition)
        const prevPoint = chartData[i - 1];
        const prevOffset = `${(prevPoint.timeDecimal / 24) * 100}%`;
        if (stops[stops.length - 1].offset !== prevOffset) {
          stops.push({
            offset: prevOffset,
            color: prevColor,
          });
        }
        // Add a stop at the current point with the new color
        stops.push({
          offset: `${(point.timeDecimal / 24) * 100}%`,
          color: point.color,
        });
        prevColor = point.color;
      }
    }
    
    // Always add last point
    const lastPoint = chartData[chartData.length - 1];
    const lastOffset = `${(lastPoint.timeDecimal / 24) * 100}%`;
    if (stops[stops.length - 1].offset !== lastOffset) {
      stops.push({
        offset: lastOffset,
        color: lastPoint.color,
      });
    }
    
    return stops;
  }, [chartData]);

  // Get nadir points from hypo periods for scatter plot
  const nadirPoints = useMemo(() => {
    if (!hypoStats || hypoStats.hypoPeriods.length === 0) return [];
    
    return hypoStats.hypoPeriods.map(period => {
      const convertedNadir = convertGlucoseValue(period.nadir, glucoseUnit);
      return {
        timeDecimal: period.nadirTimeDecimal,
        value: Math.min(convertedNadir, maxGlucose),
        originalValue: convertedNadir,
        nadir: period.nadir,
        isSevere: period.isSevere,
      };
    });
  }, [hypoStats, glucoseUnit, maxGlucose]);

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
  const CustomTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{ 
      payload: { 
        time: string; 
        value: number; 
        originalValue: number;
        rawValue?: number;
        color?: string;
      } 
    }> 
  }) => {
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

  // Time labels for X-axis formatting (show every 6 hours)
  // Using "Noon" instead of "12PM" for clarity
  const TIME_LABELS: Record<number, string> = {
    0: '12AM', 6: '6AM', 12: 'Noon', 18: '6PM', 24: '12AM'
  };

  // Format X-axis labels (show only key times)
  const formatXAxis = (value: number) => {
    const hour = Math.floor(value);
    return TIME_LABELS[hour] || '';
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

      {/* Stats Cards */}
      <div className={styles.summarySection}>
        {/* Show success state when no hypos - use icons instead of smileys for first 4 cards, smiley only for Total Hypo Time */}
        {hypoStats && hypoStats.totalCount === 0 ? (
          <>
            <Tooltip content="No hypoglycemic events detected today" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
                <HeartPulseWarningRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Severe Hypos</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            <Tooltip content="No hypoglycemic events detected today" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
                <WarningRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Non-Severe Hypos</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            <Tooltip content="No hypoglycemic events - great control!" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
                <ArrowTrendingDownRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Lowest Hypo Value</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>N/A</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Longest Hypo Duration - add 5th card */}
            <Tooltip content="No hypoglycemic events - great control!" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
                <TimerRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Longest Hypo</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSuccess)}>0m</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Total Hypo Time - use smiley as the value */}
            <Tooltip content="No time spent in hypoglycemia" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardSuccess)}>
                <ClockRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconSuccess)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Total Hypo Time</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={mergeClasses(styles.summaryValue, styles.summaryValueSmiley)}>😊</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
          </>
        ) : hypoStats ? (
          <>
            {/* Severe Hypos Count */}
            <Tooltip content="Number of hypoglycemic events below very low threshold" relationship="description">
              <Card className={mergeClasses(
                styles.summaryCard, 
                hypoStats.severeCount > 0 ? styles.summaryCardDanger : styles.summaryCardSuccess
              )}>
                <HeartPulseWarningRegular className={mergeClasses(
                  styles.summaryIcon,
                  hypoStats.severeCount > 0 ? styles.summaryIconDanger : styles.summaryIconSuccess
                )} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Severe Hypos</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={styles.summaryValue}>{hypoStats.severeCount}</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Non-Severe Hypos Count */}
            <Tooltip content="Number of hypoglycemic events below low threshold but above very low" relationship="description">
              <Card className={mergeClasses(
                styles.summaryCard,
                hypoStats.nonSevereCount > 0 ? styles.summaryCardWarning : styles.summaryCardSuccess
              )}>
                <WarningRegular className={mergeClasses(
                  styles.summaryIcon,
                  hypoStats.nonSevereCount > 0 ? styles.summaryIconWarning : styles.summaryIconSuccess
                )} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Non-Severe Hypos</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={styles.summaryValue}>{hypoStats.nonSevereCount}</Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Lowest Hypo Value */}
            <Tooltip content="Lowest glucose reading during a hypoglycemic event" relationship="description">
              <Card className={mergeClasses(
                styles.summaryCard,
                hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
                  ? styles.summaryCardDanger 
                  : styles.summaryCardWarning
              )}>
                <ArrowTrendingDownRegular className={mergeClasses(
                  styles.summaryIcon,
                  hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
                    ? styles.summaryIconDanger 
                    : styles.summaryIconWarning
                )} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Lowest Hypo Value</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={styles.summaryValue}>
                      {hypoStats.lowestValue !== null 
                        ? displayGlucoseValue(hypoStats.lowestValue, glucoseUnit)
                        : 'N/A'}
                    </Text>
                    {hypoStats.lowestValue !== null && (
                      <Text className={styles.summaryUnit}>{getUnitLabel(glucoseUnit)}</Text>
                    )}
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Longest Hypo Duration */}
            <Tooltip content="Duration of the longest hypoglycemic event" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardWarning)}>
                <TimerRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconWarning)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Longest Hypo</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={styles.summaryValue}>
                      {formatHypoDuration(hypoStats.longestDurationMinutes)}
                    </Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
            
            {/* Total Hypo Duration */}
            <Tooltip content="Total time spent in hypoglycemia during the day" relationship="description">
              <Card className={mergeClasses(styles.summaryCard, styles.summaryCardWarning)}>
                <ClockRegular className={mergeClasses(styles.summaryIcon, styles.summaryIconWarning)} />
                <div className={styles.summaryContent}>
                  <Text className={styles.summaryLabel}>Total Hypo Time</Text>
                  <div className={styles.summaryValueRow}>
                    <Text className={styles.summaryValue}>
                      {formatHypoDuration(hypoStats.totalDurationMinutes)}
                    </Text>
                  </div>
                </div>
              </Card>
            </Tooltip>
          </>
        ) : null}
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
                    const { cx, cy } = props as { cx: number; cy: number };
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
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
        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.low }} />
            <Text>Hypoglycemia</Text>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.veryLow }} />
            <Text>Severe Hypoglycemia</Text>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: HYPO_CHART_COLORS.nadirDot }} />
            <Text>Nadir (Lowest Point)</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
