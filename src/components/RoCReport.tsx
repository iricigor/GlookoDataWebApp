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
} from '@fluentui/react-components';
import {
  TopSpeedRegular,
  DataHistogramRegular,
  TimerRegular,
} from '@fluentui/react-icons';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import type { UploadedFile, GlucoseReading, RoCDataPoint, RoCStats, GlucoseUnit, GlucoseThresholds } from '../types';
import {
  extractGlucoseReadings,
  calculateRoC,
  filterRoCByDate,
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
  getRoCBackgroundColor,
} from '../utils/data';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';

// Time labels for X-axis formatting (show every 3 hours)
const TIME_LABELS: Record<number, string> = {
  0: '12A', 3: '3A', 6: '6A', 9: '9A',
  12: '12P', 15: '3P', 18: '6P', 21: '9P', 24: '12A'
};

/**
 * Glucose thresholds for the RoC chart Y-axis scaling.
 * These are intentionally different from the configurable thresholds used
 * for time-in-range calculations. The RoC chart uses fixed values to ensure
 * consistent visualization:
 * - veryHigh/high: 22/16 mmol/L for the Y-axis maximum
 * - low/veryLow: 3.9/3.0 mmol/L for the dashed reference line
 */
const CHART_GLUCOSE_THRESHOLDS: GlucoseThresholds = {
  veryHigh: 22,
  high: 16,
  low: 3.9,
  veryLow: 3.0,
};

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

// Format X-axis labels (show every 3 hours)
const formatXAxis = (value: number) => {
  const hour = Math.floor(value);
  return TIME_LABELS[hour] || '';
};

export function RoCReport({ selectedFile, glucoseUnit }: RoCReportProps) {
  const styles = useStyles();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  const [loading, setLoading] = useState(false);
  const [allReadings, setAllReadings] = useState<GlucoseReading[]>([]);
  const [allRoCData, setAllRoCData] = useState<RoCDataPoint[]>([]);
  const [dayRoCData, setDayRoCData] = useState<RoCDataPoint[]>([]);
  const [dayGlucoseReadings, setDayGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [rocStats, setRocStats] = useState<RoCStats | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [longestStablePeriod, setLongestStablePeriod] = useState(0);
  
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  const hasAppliedSavedDateRef = useRef<boolean>(false);

  // Extract glucose data and calculate RoC when file changes
  useEffect(() => {
    if (!selectedFile) {
      setAvailableDates([]);
      setCurrentDateIndex(0);
      setAllReadings([]);
      setAllRoCData([]);
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
          
          // Calculate RoC for all readings
          const rocData = calculateRoC(readings);
          setAllRoCData(rocData);
          
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
          setAllRoCData([]);
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

  // Filter RoC data for the selected date and calculate stats
  useEffect(() => {
    if (availableDates.length > 0 && allRoCData.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      const filteredRoC = filterRoCByDate(allRoCData, currentDate);
      const filteredGlucose = filterReadingsByDate(allReadings, currentDate);
      
      // Apply 15-minute moving average smoothing to RoC data
      const smoothedRoC = smoothRoCData(filteredRoC);
      
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
  }, [currentDateIndex, availableDates, allRoCData, allReadings]);

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

  // Calculate thresholds in the display unit
  const glucoseHighThreshold = convertGlucoseValue(CHART_GLUCOSE_THRESHOLDS.high, glucoseUnit);
  const glucoseLowThreshold = convertGlucoseValue(CHART_GLUCOSE_THRESHOLDS.low, glucoseUnit);
  const glucoseMaxThreshold = convertGlucoseValue(CHART_GLUCOSE_THRESHOLDS.veryHigh, glucoseUnit);

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
        // Store background color for each data point
        backgroundColor: getRoCBackgroundColor(point.roc),
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

  // Generate gradient stops for the background shading (slightly darker)
  const rocBackgroundGradientStops = useMemo(() => {
    if (chartData.length === 0) return [];
    
    return chartData.map(point => ({
      offset: `${(point.timeDecimal / 24) * 100}%`,
      color: point.backgroundColor,
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

  // Fixed Y-axis max based on unit (16/22 mmol/L or equivalent)
  const maxGlucoseValue = glucoseMaxThreshold;

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

      {/* RoC Graph */}
      {dayRoCData.length > 0 && (
        <>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 10, right: 50, left: 10, bottom: 0 }} data={chartData}>
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
                  {/* RoC background gradient - same colors but darker for background shading */}
                  <linearGradient id="rocBackgroundGradient" x1="0" y1="0" x2="1" y2="0">
                    {rocBackgroundGradientStops.map((stop, index) => (
                      <stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="0.3" />
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
                {/* Background shading based on RoC values - follows HSV color scale */}
                <ReferenceArea
                  x1={0}
                  x2={24}
                  yAxisId="roc"
                  fill="url(#rocBackgroundGradient)"
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
                  ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
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
                  domain={[0, maxGlucoseValue]}
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
