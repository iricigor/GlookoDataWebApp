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
  ArrowTrendingRegular,
  TopSpeedRegular,
  DataHistogramRegular,
} from '@fluentui/react-icons';
import { useState, useEffect, useRef } from 'react';
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
  Cell,
  Scatter,
} from 'recharts';
import type { UploadedFile, GlucoseReading, RoCDataPoint, RoCStats, GlucoseUnit } from '../types';
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
} from '../utils/data';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';

// Time labels for X-axis formatting (show every 3 hours)
const TIME_LABELS: Record<number, string> = {
  0: '12A', 3: '3A', 6: '6A', 9: '9A',
  12: '12P', 15: '3P', 18: '6P', 21: '9P', 24: '12A'
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
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  statIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
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
    payload: RoCDataPoint & { glucoseDisplay?: number };
  }>;
  glucoseUnit: GlucoseUnit;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
          RoC: {formatRoCValue(data.roc)} mmol/L/min
        </div>
        <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
          Glucose: {data.glucoseDisplay?.toFixed(1) || data.glucoseValue.toFixed(1)} {getUnitLabel(glucoseUnit)}
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
  }
  return null;
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
      
      setDayRoCData(filteredRoC);
      setDayGlucoseReadings(filteredGlucose);
      setRocStats(calculateRoCStats(filteredRoC));
    } else {
      setDayRoCData([]);
      setDayGlucoseReadings([]);
      setRocStats(null);
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

  const currentDate = availableDates[currentDateIndex];

  // Prepare chart data with glucose overlay (round to avoid floating point issues)
  const chartData = dayRoCData.map(point => {
    const glucoseValue = convertGlucoseValue(point.glucoseValue, glucoseUnit);
    return {
      ...point,
      glucoseDisplay: Math.round(glucoseValue * 10) / 10,
    };
  });

  // Prepare glucose line data for overlay (round to avoid floating point issues)
  const glucoseLineData = dayGlucoseReadings.map(reading => {
    const hour = reading.timestamp.getHours();
    const minute = reading.timestamp.getMinutes();
    const glucoseValue = convertGlucoseValue(reading.value, glucoseUnit);
    return {
      timeDecimal: hour + minute / 60,
      glucoseDisplay: Math.round(glucoseValue * 10) / 10, // Round to 1 decimal place
    };
  }).sort((a, b) => a.timeDecimal - b.timeDecimal);

  // Calculate max glucose for Y axis (round to avoid floating point precision issues)
  const maxGlucoseValue = glucoseLineData.length > 0 
    ? Math.ceil(Math.max(...glucoseLineData.map(d => d.glucoseDisplay)) * 1.1)
    : glucoseUnit === 'mg/dL' ? 300 : 16;

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
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              
              {/* Night hours shading (22:00-06:00) */}
              <ReferenceArea
                x1={0}
                x2={6}
                fill={tokens.colorNeutralBackground3}
                fillOpacity={0.5}
              />
              <ReferenceArea
                x1={22}
                x2={24}
                fill={tokens.colorNeutralBackground3}
                fillOpacity={0.5}
              />
              
              {/* Reference lines for RoC thresholds */}
              <ReferenceLine
                y={ROC_THRESHOLDS.good}
                yAxisId="roc"
                stroke={ROC_COLORS.good}
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{ value: 'Good', position: 'right', fill: ROC_COLORS.good, fontSize: 10 }}
              />
              <ReferenceLine
                y={ROC_THRESHOLDS.medium}
                yAxisId="roc"
                stroke={ROC_COLORS.medium}
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{ value: 'Medium', position: 'right', fill: ROC_COLORS.medium, fontSize: 10 }}
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
                  value: 'Rate of Change (mmol/L/min)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fontSize: tokens.fontSizeBase200 } 
                }}
                stroke={tokens.colorNeutralForeground2}
                style={{ fontSize: tokens.fontSizeBase200 }}
                domain={[0, 'auto']}
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
                tickFormatter={(value: number) => value.toFixed(1)}
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
              />
              
              {/* RoC scatter plot with colored dots */}
              <Scatter
                yAxisId="roc"
                data={chartData}
                dataKey="roc"
                name="Rate of Change"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Statistics Cards */}
      {rocStats && rocStats.totalCount > 0 && (
        <div className={styles.statsRow}>
          <Tooltip content="Minimum absolute rate of glucose change (slowest)" relationship="description">
            <Card className={styles.statCard}>
              <ArrowTrendingRegular className={styles.statIcon} />
              <Text className={styles.statLabel}>Min RoC</Text>
              <Text className={styles.statValue}>{formatRoCValue(rocStats.minRoC)}</Text>
              <Text className={styles.statUnit}>mmol/L/min</Text>
            </Card>
          </Tooltip>
          
          <Tooltip content="Maximum absolute rate of glucose change (fastest)" relationship="description">
            <Card className={styles.statCard}>
              <TopSpeedRegular className={styles.statIcon} />
              <Text className={styles.statLabel}>Max RoC</Text>
              <Text className={styles.statValue}>{formatRoCValue(rocStats.maxRoC)}</Text>
              <Text className={styles.statUnit}>mmol/L/min</Text>
            </Card>
          </Tooltip>
          
          <Tooltip content="Standard deviation of RoC - measures variability in glucose change speed" relationship="description">
            <Card className={styles.statCard}>
              <DataHistogramRegular className={styles.statIcon} />
              <Text className={styles.statLabel}>SDRoC</Text>
              <Text className={styles.statValue}>{formatRoCValue(rocStats.sdRoC)}</Text>
              <Text className={styles.statUnit}>mmol/L/min</Text>
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
