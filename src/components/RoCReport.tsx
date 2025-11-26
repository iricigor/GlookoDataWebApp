/**
 * RoCReport component
 * Displays Rate of Change (RoC) report with graph, statistics, and summary bar
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Spinner,
  Card,
  Tooltip,
  TabList,
  Tab,
  Slider,
  mergeClasses,
} from '@fluentui/react-components';
import {
  TopSpeedRegular,
  DataHistogramRegular,
  TimerRegular,
} from '@fluentui/react-icons';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { UploadedFile, GlucoseReading, RoCDataPoint, RoCStats, GlucoseUnit } from '../types';
import {
  extractGlucoseReadings,
  calculateRoC,
  calculateRoCWithInterval,
  calculateRoCStats,
  getUniqueDatesFromRoC,
  ROC_COLORS,
  ROC_THRESHOLDS,
  formatRoCValue,
  getRoCMedicalStandards,
  convertGlucoseValue,
  getUnitLabel,
  filterReadingsByDate,
  smoothRoCData,
  getLongestCategoryPeriod,
  formatDuration,
  getRoCColor,
} from '../utils/data';
import type { RoCIntervalMinutes } from '../utils/data/rocDataUtils';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';

// Time labels for X-axis formatting (show every 6 hours)
const TIME_LABELS: Record<number, string> = {
  0: '12AM', 6: '6AM', 12: '12PM', 18: '6PM', 24: '12AM'
};

/**
 * Glucose thresholds for the RoC chart Y-axis scaling.
 * These are intentionally different from the configurable thresholds used
 * for time-in-range calculations. The RoC chart uses fixed values to ensure
 * consistent visualization:
 * - low/veryLow: 3.9/3.0 mmol/L for the dashed reference line
 */
const CHART_GLUCOSE_THRESHOLDS = {
  low: 3.9,
  veryLow: 3.0,
} as const;

/**
 * Max glucose values for Y-axis toggle (matching other reports)
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('48px'),
  },
  noDataMessage: {
    textAlign: 'center',
    ...shorthands.padding('48px'),
    color: tokens.colorNeutralForeground3,
  },
  chartContainer: {
    height: '400px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  statCard: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  statIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'monospace',
  },
  statUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  summaryCard: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  summaryTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  summaryBar: {
    display: 'flex',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '16px',
  },
  summarySegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase300,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeightSemibold,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.85,
    },
  },
  standardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  standardRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  standardDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
  },
  standardLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    minWidth: '70px',
  },
  standardThreshold: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
  standardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flex: 1,
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
  legendDashedLine: {
    width: '20px',
    height: '0',
    borderTop: `2px dashed ${tokens.colorNeutralStroke1}`,
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: '8px',
    ...shorthands.gap('16px'),
    flexWrap: 'wrap',
  },
  maxValueContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  maxValueLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    minWidth: '180px',
  },
  sliderLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  sliderValue: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '40px',
  },
  // Responsive chart container - minimal margins for mobile
  chartContainerMobile: {
    ...shorthands.padding('4px', '0px'),
  },
});

interface RoCReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
}

// Custom tooltip component for the RoC chart
const CustomTooltip = ({ 
  active, 
  payload,
  glucoseUnit,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: RoCDataPoint & { glucoseDisplay?: number };
  }>;
  glucoseUnit: GlucoseUnit;
}) => {
  // Guard against undefined payload or empty array
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  // Guard against undefined data within payload
  const data = payload[0]?.payload;
  if (!data || !data.timeLabel) {
    return null;
  }
  
  // Format glucose value based on unit
  const glucoseValue = data.glucoseDisplay ?? data.glucoseValue;
  const glucoseDisplay = glucoseUnit === 'mg/dL' 
    ? Math.round(glucoseValue).toString()
    : glucoseValue.toFixed(1);
  
  return (
    <div style={{
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '12px',
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      borderRadius: tokens.borderRadiusMedium,
      fontSize: tokens.fontSizeBase200,
      boxShadow: tokens.shadow8,
    }}>
      <div style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: '4px' }}>
        {data.timeLabel}
      </div>
      <div style={{ color: data.color, fontWeight: tokens.fontWeightSemibold }}>
        RoC: {formatRoCValue(data.roc, glucoseUnit)} {glucoseUnit === 'mg/dL' ? 'mg/dL' : 'mmol/L'}/5 min
      </div>
      <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
        Glucose: {glucoseDisplay} {getUnitLabel(glucoseUnit)}
      </div>
      <div style={{ 
        marginTop: '4px',
        color: data.category === 'good' ? ROC_COLORS.good : 
               data.category === 'medium' ? ROC_COLORS.medium : ROC_COLORS.bad,
        fontStyle: 'italic',
      }}>
        {data.category === 'good' ? 'Stable' : data.category === 'medium' ? 'Moderate' : 'Rapid'}
      </div>
    </div>
  );
};

// Format X-axis labels (show every 6 hours)
const formatXAxis = (value: number) => {
  const hour = Math.floor(value);
  return TIME_LABELS[hour] || '';
};

// RoC interval options mapping slider value to minutes
const ROC_INTERVAL_OPTIONS: { value: number; label: string; minutes: RoCIntervalMinutes }[] = [
  { value: 0, label: '15min', minutes: 15 },
  { value: 1, label: '30min', minutes: 30 },
  { value: 2, label: '1h', minutes: 60 },
  { value: 3, label: '2h', minutes: 120 },
];

export function RoCReport({ selectedFile, glucoseUnit }: RoCReportProps) {
  const styles = useStyles();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  const [loading, setLoading] = useState(false);
  const [allReadings, setAllReadings] = useState<GlucoseReading[]>([]);
  const [dayRoCData, setDayRoCData] = useState<RoCDataPoint[]>([]);
  const [dayGlucoseReadings, setDayGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [rocStats, setRocStats] = useState<RoCStats | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [longestStablePeriod, setLongestStablePeriod] = useState(0);
  const [maxGlucose, setMaxGlucose] = useState<number>(
    glucoseUnit === 'mg/dL' ? MAX_GLUCOSE_VALUES.mgdl.high : MAX_GLUCOSE_VALUES.mmol.high
  );
  const [rocIntervalIndex, setRocIntervalIndex] = useState(0); // 0 = 15min (default)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  const hasAppliedSavedDateRef = useRef<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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
    // Gradually reduce margins as screen gets narrower
    // Full width (>1200px): margins 10 left, 50 right
    // Medium (768-1200px): margins scaled down proportionally
    // Mobile (<768px): minimal margins 0 left, 15 right
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

  // Extract glucose data and calculate RoC when file changes
  useEffect(() => {
    if (!selectedFile) {
      setAvailableDates([]);
      setCurrentDateIndex(0);
      setAllReadings([]);
      setDayRoCData([]);
      setDayGlucoseReadings([]);
      setRocStats(null);
      loadedFileIdRef.current = undefined;
      hasAppliedSavedDateRef.current = false;
      return;
    }
    
    const isFileChange = selectedFile.id !== loadedFileIdRef.current;
    const shouldApplySavedDate = !hasAppliedSavedDateRef.current && selectedDate && availableDates.includes(selectedDate);
    
    if (!isFileChange && !shouldApplySavedDate) {
      return;
    }

    if (!isFileChange && shouldApplySavedDate) {
      setCurrentDateIndex(availableDates.indexOf(selectedDate));
      hasAppliedSavedDateRef.current = true;
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Try CGM data first, fall back to BG data
        let readings: GlucoseReading[] = [];
        try {
          readings = await extractGlucoseReadings(selectedFile, 'cgm');
        } catch {
          try {
            readings = await extractGlucoseReadings(selectedFile, 'bg');
          } catch {
            console.error('No glucose data available');
          }
        }

        if (readings.length > 0) {
          setAllReadings(readings);
          
          // Calculate RoC to get available dates
          const rocData = calculateRoC(readings);
          
          // Extract unique dates from RoC data
          const dates = getUniqueDatesFromRoC(rocData);
          setAvailableDates(dates);
          
          if (selectedDate && dates.includes(selectedDate)) {
            setCurrentDateIndex(dates.indexOf(selectedDate));
            hasAppliedSavedDateRef.current = true;
          } else {
            setCurrentDateIndex(dates.length > 0 ? dates.length - 1 : 0);
            hasAppliedSavedDateRef.current = false;
          }
        } else {
          setAllReadings([]);
          setAvailableDates([]);
        }
        
        loadedFileIdRef.current = selectedFile.id;
      } catch (error) {
        console.error('Failed to extract glucose data:', error);
        setAvailableDates([]);
        loadedFileIdRef.current = undefined;
        hasAppliedSavedDateRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, selectedDate]);

  // Update selected date when date index changes
  useEffect(() => {
    if (availableDates.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      if (currentDate !== selectedDate) {
        setSelectedDate(currentDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateIndex, availableDates]);

  // Get current interval settings
  const currentInterval = ROC_INTERVAL_OPTIONS[rocIntervalIndex];

  // Filter RoC data for the selected date and calculate stats
  // Recalculates when interval changes
  useEffect(() => {
    if (availableDates.length > 0 && allReadings.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      const filteredGlucose = filterReadingsByDate(allReadings, currentDate);
      
      // Calculate RoC based on selected interval
      let rocData: RoCDataPoint[];
      if (currentInterval.minutes === 15) {
        // For 15min interval, use the standard consecutive reading calculation
        // Then apply smoothing for display consistency
        rocData = calculateRoC(filteredGlucose);
      } else {
        // For longer intervals (30min, 1h, 2h), use the interval-based calculation
        rocData = calculateRoCWithInterval(filteredGlucose, currentInterval.minutes);
      }
      
      // Apply smoothing to RoC data
      const smoothedRoC = smoothRoCData(rocData);
      
      setDayRoCData(smoothedRoC);
      setDayGlucoseReadings(filteredGlucose);
      setRocStats(calculateRoCStats(smoothedRoC));
      
      // Calculate longest stable (good) period
      setLongestStablePeriod(getLongestCategoryPeriod(smoothedRoC, 'good'));
    } else {
      setDayRoCData([]);
      setDayGlucoseReadings([]);
      setRocStats(null);
      setLongestStablePeriod(0);
    }
  }, [currentDateIndex, availableDates, allReadings, currentInterval.minutes]);

  const handlePreviousDay = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDateIndex < availableDates.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };

  const handleDateSelect = (date: string) => {
    const newIndex = availableDates.indexOf(date);
    if (newIndex !== -1) {
      setCurrentDateIndex(newIndex);
    }
  };

  const minDate = availableDates.length > 0 ? availableDates[0] : undefined;
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;

  const medicalStandards = getRoCMedicalStandards();

  // Calculate thresholds in the display unit - high threshold for reference line (16 mmol/L / 288 mg/dL)
  const glucoseHighThreshold = glucoseUnit === 'mg/dL' ? MAX_GLUCOSE_VALUES.mgdl.low : MAX_GLUCOSE_VALUES.mmol.low;
  const glucoseLowThreshold = convertGlucoseValue(CHART_GLUCOSE_THRESHOLDS.low, glucoseUnit);

  // Prepare chart data with connected RoC line and per-point coloring
  const chartData = useMemo(() => {
    return dayRoCData.map((point, index) => {
      const glucoseValue = convertGlucoseValue(point.glucoseValue, glucoseUnit);
      const prevPoint = index > 0 ? dayRoCData[index - 1] : null;
      const prevGlucose = prevPoint ? convertGlucoseValue(prevPoint.glucoseValue, glucoseUnit) : null;
      
      return {
        ...point,
        glucoseDisplay: glucoseUnit === 'mg/dL' 
          ? Math.round(glucoseValue)
          : Math.round(glucoseValue * 10) / 10,
        // Store color for each data point for gradient coloring
        pointColor: getRoCColor(point.roc),
        // Previous values for interpolation
        prevRoc: prevPoint?.roc ?? null,
        prevTimeDecimal: prevPoint?.timeDecimal ?? null,
        prevGlucoseDisplay: prevGlucose ? (glucoseUnit === 'mg/dL' 
          ? Math.round(prevGlucose)
          : Math.round(prevGlucose * 10) / 10) : null,
      };
    });
  }, [dayRoCData, glucoseUnit]);

  // Generate gradient stops for the RoC line based on time positions
  const rocGradientStops = useMemo(() => {
    if (chartData.length === 0) return [];
    
    return chartData.map(point => ({
      offset: `${(point.timeDecimal / 24) * 100}%`,
      color: point.pointColor,
    }));
  }, [chartData]);

  // Prepare glucose line data for overlay
  const glucoseLineData = useMemo(() => {
    return dayGlucoseReadings.map(reading => {
      const hour = reading.timestamp.getHours();
      const minute = reading.timestamp.getMinutes();
      const glucoseValue = convertGlucoseValue(reading.value, glucoseUnit);
      return {
        timeDecimal: hour + minute / 60,
        glucoseDisplay: glucoseUnit === 'mg/dL' 
          ? Math.round(glucoseValue)
          : Math.round(glucoseValue * 10) / 10,
      };
    }).sort((a, b) => a.timeDecimal - b.timeDecimal);
  }, [dayGlucoseReadings, glucoseUnit]);

  // RoC unit label
  const rocUnitLabel = glucoseUnit === 'mg/dL' ? 'mg/dL/5 min' : 'mmol/L/5 min';

  // Current date for navigation
  const currentDate = availableDates[currentDateIndex] ?? '';

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please upload and select a file to view RoC reports
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
        <Text>Loading glucose data...</Text>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          No glucose data available in the selected file
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <DayNavigator
        currentDate={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        canGoPrevious={currentDateIndex > 0}
        canGoNext={currentDateIndex < availableDates.length - 1}
        onDateSelect={handleDateSelect}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* Controls Row */}
      <div className={styles.controlsRow}>
        <Tooltip content="Time window for calculating glucose rate of change" relationship="description">
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
        </Tooltip>
        <div className={styles.maxValueContainer}>
          <Text className={styles.maxValueLabel}>Max BG:</Text>
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

      {/* RoC Graph */}
      {dayRoCData.length > 0 && (
        <>
          <div 
            ref={chartContainerRef}
            className={mergeClasses(
              styles.chartContainer,
              windowWidth < 768 && styles.chartContainerMobile
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={chartMargins} data={chartData}>
                <defs>
                  {/* Gradual night shading gradients */}
                  <linearGradient id="nightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="nightGradientRight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                    <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                  </linearGradient>
                  {/* RoC line gradient - follows HSV color scale based on RoC value */}
                  <linearGradient id="rocLineGradient" x1="0" y1="0" x2="1" y2="0">
                    {rocGradientStops.map((stop, index) => (
                      <stop key={index} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                
                {/* Gradual night hours shading - midnight to 8AM (darkest at midnight) */}
                <ReferenceArea
                  x1={0}
                  x2={8}
                  yAxisId="roc"
                  fill="url(#nightGradientLeft)"
                />
                {/* Gradual night hours shading - 8PM to midnight (darkest at midnight) */}
                <ReferenceArea
                  x1={20}
                  x2={24}
                  yAxisId="roc"
                  fill="url(#nightGradientRight)"
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
                  domain={[0, 'auto']}
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
                  domain={[0, maxGlucose]}
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
                  content={<CustomTooltip glucoseUnit={glucoseUnit} />} 
                />
                
                {/* Glucose line overlay (monochrome) */}
                <Line
                  yAxisId="glucose"
                  type="monotone"
                  data={glucoseLineData}
                  dataKey="glucoseDisplay"
                  name="Glucose"
                  stroke={tokens.colorNeutralStroke1}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  legendType="none"
                />
                
                {/* RoC line with gradient color - changes from green to red based on RoC value */}
                <Line
                  yAxisId="roc"
                  type="monotone"
                  dataKey="roc"
                  name="Rate of Change"
                  stroke="url(#rocLineGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 5, stroke: tokens.colorNeutralBackground1, strokeWidth: 2 }}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
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
        </>
      )}

      {/* Statistics Cards */}
      {rocStats && rocStats.totalCount > 0 && (
        <div className={styles.statsRow}>
          <Tooltip content="Longest continuous period with stable glucose (slow rate of change)" relationship="description">
            <Card className={styles.statCard}>
              <TimerRegular className={styles.statIcon} />
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Longest Stable</Text>
                <div className={styles.statValueRow}>
                  <Text className={styles.statValue}>{formatDuration(longestStablePeriod)}</Text>
                </div>
              </div>
            </Card>
          </Tooltip>
          
          <Tooltip content="Maximum absolute rate of glucose change (fastest)" relationship="description">
            <Card className={styles.statCard}>
              <TopSpeedRegular className={styles.statIcon} />
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Max RoC</Text>
                <div className={styles.statValueRow}>
                  <Text className={styles.statValue}>{formatRoCValue(rocStats.maxRoC, glucoseUnit)}</Text>
                  <Text className={styles.statUnit}>{rocUnitLabel}</Text>
                </div>
              </div>
            </Card>
          </Tooltip>
          
          <Tooltip content="Standard Deviation of Rate of Change - measures variability in glucose change speed" relationship="description">
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
          </Tooltip>
        </div>
      )}

      {/* Summary Bar */}
      {rocStats && rocStats.totalCount > 0 && (
        <div className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>
            Time by Rate of Change Category
          </Text>
          
          <div className={styles.summaryBar}>
            {rocStats.goodPercentage > 0 && (
              <div
                className={styles.summarySegment}
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
                className={styles.summarySegment}
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
                className={styles.summarySegment}
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
          <div className={styles.standardsContainer}>
            <div className={styles.standardRow}>
              <div className={styles.standardDot} style={{ backgroundColor: ROC_COLORS.good }} />
              <Text className={styles.standardLabel}>Stable</Text>
              <Text className={styles.standardThreshold}>{medicalStandards.good.threshold}</Text>
              <Text className={styles.standardDescription}>{medicalStandards.good.description}</Text>
            </div>
            <div className={styles.standardRow}>
              <div className={styles.standardDot} style={{ backgroundColor: ROC_COLORS.medium }} />
              <Text className={styles.standardLabel}>Moderate</Text>
              <Text className={styles.standardThreshold}>{medicalStandards.medium.threshold}</Text>
              <Text className={styles.standardDescription}>{medicalStandards.medium.description}</Text>
            </div>
            <div className={styles.standardRow}>
              <div className={styles.standardDot} style={{ backgroundColor: ROC_COLORS.bad }} />
              <Text className={styles.standardLabel}>Rapid</Text>
              <Text className={styles.standardThreshold}>{medicalStandards.bad.threshold}</Text>
              <Text className={styles.standardDescription}>{medicalStandards.bad.description}</Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
