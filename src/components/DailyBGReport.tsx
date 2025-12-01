/**
 * DailyBGReport component
 * Combines daily glucose, insulin, and IOB data into a unified daily view
 * 
 * Features:
 * - Shared date picker for all sections
 * - BG summary cards and glucose graph (from Detailed CGM)
 * - Insulin summary cards and timeline graph (from Detailed Insulin)
 * - IOB graph (from IOB report)
 */

import { useState, useEffect, useRef } from 'react';
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
  Spinner,
} from '@fluentui/react-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { UploadedFile, GlucoseReading, GlucoseDataSource, GlucoseUnit, InsulinReading, HourlyIOBData } from '../types';
import { 
  extractGlucoseReadings, 
  smoothGlucoseValues, 
  displayGlucoseValue, 
  getUnitLabel, 
  convertGlucoseValue, 
  formatGlucoseValue,
  extractInsulinReadings,
  prepareInsulinTimelineData,
  prepareHourlyIOBData,
  getUniqueDates, 
  filterReadingsByDate, 
  calculateGlucoseRangeStats,
  GLUCOSE_RANGE_COLORS,
  MIN_PERCENTAGE_TO_DISPLAY,
} from '../utils/data';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { DayNavigator } from './DayNavigator';
import { useBGColorScheme } from '../hooks/useBGColorScheme';
import { getGlucoseColor, isDynamicColorScheme, COLOR_SCHEME_DESCRIPTORS } from '../utils/formatting';
import type { BGColorScheme } from '../hooks/useBGColorScheme';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { InsulinSummaryCards } from './InsulinSummaryCards';
import { InsulinTimeline } from './InsulinTimeline';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '8px',
    marginTop: '16px',
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
  chartWithBarContainer: {
    display: 'flex',
    ...shorthands.gap('16px'),
    marginTop: '16px',
  },
  chartWrapper: {
    flex: 1,
    height: '400px',
  },
  summaryBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '60px',
    height: '400px',
    ...shorthands.gap('4px'),
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('48px'),
  },
  iobChartContainer: {
    height: '300px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
});

interface DailyBGReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
  insulinDuration?: number;
  showDayNightShading: boolean;
}

export function DailyBGReport({ selectedFile, glucoseUnit, insulinDuration = 5, showDayNightShading: _showDayNightShading }: DailyBGReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const { colorScheme, setColorScheme } = useBGColorScheme();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [dateChanging, setDateChanging] = useState(false);
  
  // Glucose data state
  const [allGlucoseReadings, setAllGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [maxGlucose, setMaxGlucose] = useState<number>(
    glucoseUnit === 'mg/dL' ? 396 : 22.0
  );
  const [dataSource] = useState<GlucoseDataSource>('cgm');
  
  // Insulin data state
  const [insulinReadings, setInsulinReadings] = useState<InsulinReading[]>([]);
  const [timelineData, setTimelineData] = useState<Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>>([]);
  
  // IOB data state
  const [hourlyIOBData, setHourlyIOBData] = useState<HourlyIOBData[]>([]);
  
  // Track the file ID to detect file changes vs date changes
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  const hasAppliedSavedDateRef = useRef<boolean>(false);

  // Reset maxGlucose when glucoseUnit changes to avoid mismatched clamping
  useEffect(() => {
    setMaxGlucose(glucoseUnit === 'mg/dL' ? 396 : 22.0);
  }, [glucoseUnit]);

  // Load all data when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setAllGlucoseReadings([]);
      setInsulinReadings([]);
      setAvailableDates([]);
      setCurrentDateIndex(0);
      setTimelineData([]);
      setHourlyIOBData([]);
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
        // Load glucose readings
        const glucoseReadings = await extractGlucoseReadings(selectedFile, dataSource);
        setAllGlucoseReadings(glucoseReadings);
        
        // Load insulin readings
        const insulinData = await extractInsulinReadings(selectedFile);
        setInsulinReadings(insulinData);
        
        // Get unique dates from glucose data (primary date source)
        const glucoseDates = getUniqueDates(glucoseReadings);
        
        // Get unique dates from insulin data
        const insulinDates = Array.from(
          new Set(
            insulinData.map(r => {
              const date = new Date(r.timestamp);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })
          )
        );
        
        // Merge and sort all available dates
        const allDates = Array.from(new Set([...glucoseDates, ...insulinDates])).sort();
        setAvailableDates(allDates);
        
        // If we have a saved date, try to use it
        if (selectedDate && allDates.includes(selectedDate)) {
          setCurrentDateIndex(allDates.indexOf(selectedDate));
          hasAppliedSavedDateRef.current = true;
        } else {
          // Otherwise, start with the last available date
          if (allDates.length > 0) {
            setCurrentDateIndex(allDates.length - 1);
          }
          hasAppliedSavedDateRef.current = false;
        }
        
        // Mark that we've loaded data for this file
        loadedFileIdRef.current = selectedFile.id;
      } catch (error) {
        console.error('Failed to load data:', error);
        setAllGlucoseReadings([]);
        setInsulinReadings([]);
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

  // Update insulin timeline data when date changes
  useEffect(() => {
    if (availableDates.length > 0 && insulinReadings.length > 0) {
      const data = prepareInsulinTimelineData(insulinReadings, currentDate);
      setTimelineData(data);
    } else {
      setTimelineData([]);
    }
  }, [currentDateIndex, availableDates, insulinReadings, currentDate]);

  // Update IOB data when date or insulin duration changes
  useEffect(() => {
    if (currentDate && insulinReadings.length > 0) {
      const data = prepareHourlyIOBData(insulinReadings, currentDate, insulinDuration);
      setHourlyIOBData(data);
    } else {
      setHourlyIOBData([]);
    }
  }, [currentDate, insulinReadings, insulinDuration]);

  // Filter glucose readings for current date
  const currentGlucoseReadings = currentDate ? filterReadingsByDate(allGlucoseReadings, currentDate) : [];

  // Apply smoothing to glucose values
  const smoothedReadings = smoothGlucoseValues(currentGlucoseReadings);

  // Prepare glucose chart data
  const glucoseChartData = smoothedReadings
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
        timeMinutes: hours * 60 + minutes,
        value: clampedValue,
        originalValue: convertedValue,
        color: getGlucoseColor(reading.value, colorScheme),
      };
    })
    .sort((a, b) => a.timeMinutes - b.timeMinutes);

  // Calculate glucose statistics
  const glucoseStats = currentGlucoseReadings.length > 0 
    ? calculateGlucoseRangeStats(currentGlucoseReadings, thresholds, 3)
    : { low: 0, inRange: 0, high: 0, total: 0 };

  const belowPercentage = glucoseStats.total > 0 ? ((glucoseStats.low / glucoseStats.total) * 100).toFixed(1) : '0.0';
  const inRangePercentage = glucoseStats.total > 0 ? ((glucoseStats.inRange / glucoseStats.total) * 100).toFixed(1) : '0.0';
  const abovePercentage = glucoseStats.total > 0 ? ((glucoseStats.high / glucoseStats.total) * 100).toFixed(1) : '0.0';

  // Calculate insulin summaries
  const getInsulinSummary = () => {
    if (timelineData.length === 0) {
      return { basalTotal: 0, bolusTotal: 0, totalInsulin: 0 };
    }

    const basalTotal = timelineData.reduce((sum, d) => sum + d.basalRate, 0);
    const bolusTotal = timelineData.reduce((sum, d) => sum + d.bolusTotal, 0);
    
    return {
      basalTotal: Math.round(basalTotal * 10) / 10,
      bolusTotal: Math.round(bolusTotal * 10) / 10,
      totalInsulin: Math.round((basalTotal + bolusTotal) * 10) / 10,
    };
  };

  const insulinSummary = getInsulinSummary();

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

  // Custom tooltip for glucose chart
  const GlucoseTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string; value: number; originalValue: number; color: string } }> }) => {
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

  // Custom tooltip for IOB chart
  const IOBTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      dataKey: string;
      color: string;
      payload: HourlyIOBData;
    }>;
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
        }}>
          <div style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: '4px' }}>
            {data.timeLabel}
          </div>
          <div style={{ color: '#1976D2' }}>
            Active IOB: {data.activeIOB.toFixed(2)} U
          </div>
          <div style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
            Basal in hour: {data.basalInPreviousHour.toFixed(1)} U
          </div>
          <div style={{ color: tokens.colorNeutralForeground2 }}>
            Bolus in hour: {data.bolusInPreviousHour.toFixed(1)} U
          </div>
        </div>
      );
    }
    return null;
  };

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

  // Format X-axis labels for IOB (every 3 hours)
  const formatXAxisIOB = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    const timeLabels: Record<number, string> = {
      0: '12A', 3: '3A', 6: '6A', 9: '9A',
      12: '12P', 15: '3P', 18: '6P', 21: '9P'
    };
    return timeLabels[hour] || '';
  };

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please select a file to view the daily BG report
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
        <Text>Loading data...</Text>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          No glucose or insulin data available
        </Text>
      </div>
    );
  }

  const hasGlucoseData = currentGlucoseReadings.length > 0;
  const hasInsulinData = timelineData.length > 0;
  const hasIOBData = hourlyIOBData.length > 0;

  return (
    <div className={styles.container}>
      {/* Date Navigation - shared for all sections */}
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

      {/* ========== BG Section ========== */}
      {hasGlucoseData && (
        <>
          {/* BG Summary Cards */}
          <div className={styles.summarySection}>
            <Card className={styles.summaryCard}>
              <Text className={styles.summaryLabel}>Below Range</Text>
              <div>
                <Text className={`${styles.summaryValue} ${styles.statValueBelow}`}>
                  {belowPercentage}%
                </Text>
              </div>
              <Text className={styles.summarySubtext}>({glucoseStats.low} readings)</Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Text className={styles.summaryLabel}>In Range</Text>
              <div>
                <Text className={`${styles.summaryValue} ${styles.statValueInRange}`}>
                  {inRangePercentage}%
                </Text>
              </div>
              <Text className={styles.summarySubtext}>({glucoseStats.inRange} readings)</Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Text className={styles.summaryLabel}>Above Range</Text>
              <div>
                <Text className={`${styles.summaryValue} ${styles.statValueAbove}`}>
                  {abovePercentage}%
                </Text>
              </div>
              <Text className={styles.summarySubtext}>({glucoseStats.high} readings)</Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Text className={styles.summaryLabel}>Total Readings</Text>
              <div>
                <Text className={styles.summaryValue} style={{ color: tokens.colorNeutralForeground1 }}>
                  {glucoseStats.total}
                </Text>
              </div>
            </Card>
          </div>

          {/* BG Chart */}
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
                    
                    <Tooltip content={<GlucoseTooltip />} />
                    
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
          </Card>
        </>
      )}

      {!hasGlucoseData && (
        <Text className={styles.noDataMessage}>
          No glucose data available for this date
        </Text>
      )}

      {/* ========== Insulin Section ========== */}
      {hasInsulinData && (
        <>
          <Text className={styles.sectionTitle}>Insulin Delivery</Text>
          
          {/* Insulin Summary Cards */}
          <InsulinSummaryCards
            basalTotal={insulinSummary.basalTotal}
            bolusTotal={insulinSummary.bolusTotal}
            totalInsulin={insulinSummary.totalInsulin}
          />

          {/* Insulin Timeline Chart */}
          <InsulinTimeline data={timelineData} />
        </>
      )}

      {!hasInsulinData && (
        <Text className={styles.noDataMessage}>
          No insulin data available for this date
        </Text>
      )}

      {/* ========== IOB Section ========== */}
      {hasIOBData && (
        <>
          <Text className={styles.sectionTitle}>Insulin on Board (IOB)</Text>
          
          <div className={styles.iobChartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyIOBData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                
                <XAxis
                  dataKey="timeLabel"
                  tickFormatter={formatXAxisIOB}
                  stroke={tokens.colorNeutralForeground2}
                  style={{ fontSize: tokens.fontSizeBase200 }}
                />
                
                <YAxis
                  label={{ 
                    value: 'Active IOB (Units)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fontSize: tokens.fontSizeBase200 } 
                  }}
                  stroke={tokens.colorNeutralForeground2}
                  style={{ fontSize: tokens.fontSizeBase200 }}
                />
                
                <Tooltip content={<IOBTooltip />} />
                
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="line"
                  wrapperStyle={{ fontSize: tokens.fontSizeBase200 }}
                />
                
                <Line
                  type="monotone"
                  dataKey="activeIOB"
                  name="Active IOB"
                  stroke="#1976D2"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
