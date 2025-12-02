/**
 * DailyBGReport component
 * Combines daily glucose, insulin, and IOB data into a unified daily view
 * 
 * Features:
 * - Shared date picker for all sections
 * - BG summary cards and glucose graph (from Detailed CGM)
 * - Insulin summary cards and timeline graph (from Detailed Insulin)
 * - IOB graph (from IOB report)
 * - RoC summary bar and stats (from RoC report)
 * - Hypo stats cards (from Hypos report)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Tooltip as FluentTooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  TopSpeedRegular,
  DataHistogramRegular,
  TimerRegular,
  WarningRegular,
  HeartPulseWarningRegular,
  ArrowTrendingDownRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import {
  LineChart,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { UploadedFile, GlucoseReading, GlucoseDataSource, GlucoseUnit, InsulinReading, HourlyIOBData, RoCStats, RoCDataPoint } from '../types';
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
  calculateRoC,
  calculateRoCStats,
  smoothRoCData,
  ROC_COLORS,
  ROC_THRESHOLDS,
  formatRoCValue,
  getRoCColor,
  getRoCMedicalStandards,
  getLongestCategoryPeriod,
  formatDuration,
  calculateHypoStats,
  formatHypoDuration,
} from '../utils/data';
import type { HypoStats } from '../utils/data/hypoDataUtils';
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
  stickyDatePickerWrapper: {
    position: 'sticky',
    top: '0',
    zIndex: 100,
    marginLeft: '-24px',
    marginRight: '-24px',
    ...shorthands.padding('12px', '24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    '@media (max-width: 767px)': {
      marginLeft: '-16px',
      marginRight: '-16px',
      ...shorthands.padding('8px', '16px'),
    },
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
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
  },
  // Stats cards with icons (RoC and Hypo style)
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
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
  statCardSuccess: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
  },
  statCardWarning: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteMarigoldBorder1),
  },
  statCardDanger: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
  },
  statIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  statIconSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statIconWarning: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  statIconDanger: {
    color: tokens.colorPaletteRedForeground1,
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
  // RoC Summary Bar
  rocSummaryCard: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  rocSummaryTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  rocSummaryBar: {
    display: 'flex',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '16px',
  },
  rocSummarySegment: {
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
  rocStandardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  rocStandardRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  rocStandardDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
  },
  rocStandardLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    minWidth: '70px',
  },
  rocStandardThreshold: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
  rocStandardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flex: 1,
  },
  rocChartContainer: {
    height: '300px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  hyposChartContainer: {
    height: '300px',
    width: '100%',
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
  legendDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
  },
});

// Hypo chart colors (defined at module level for dependency stability)
const HYPO_CHART_COLORS = {
  normal: '#4CAF50',    // Green for normal glucose
  low: '#FFAB91',       // Light red for low
  veryLow: '#EF5350',   // Dark red for very low
  nadirDot: '#B71C1C',  // Darker red for nadir markers
};

interface DailyBGReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
  insulinDuration?: number;
  showDayNightShading: boolean;
}

export function DailyBGReport({ selectedFile, glucoseUnit, insulinDuration = 5, showDayNightShading }: DailyBGReportProps) {
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
      const timeDecimal = hours + minutes / 60;  // For numeric X-axis (needed for ReferenceArea)
      
      // Convert to display unit
      const convertedValue = convertGlucoseValue(reading.value, glucoseUnit);
      // Clamp value to maxGlucose (in display unit)
      const clampedValue = Math.min(convertedValue, maxGlucose);
      
      return {
        time: timeString,
        timeMinutes: hours * 60 + minutes,
        timeDecimal,
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

  // Calculate smoothed RoC data (reused by multiple stats)
  const smoothedRoCValues = useMemo(() => {
    if (currentGlucoseReadings.length === 0) return [];
    const rocData = calculateRoC(currentGlucoseReadings);
    return smoothRoCData(rocData);
  }, [currentGlucoseReadings]);

  // Calculate Rate of Change (RoC) statistics
  const rocStats: RoCStats | null = useMemo(() => {
    if (smoothedRoCValues.length === 0) return null;
    return calculateRoCStats(smoothedRoCValues);
  }, [smoothedRoCValues]);

  // Calculate longest stable period (for RoC)
  const longestStablePeriod = useMemo(() => {
    if (smoothedRoCValues.length === 0) return 0;
    return getLongestCategoryPeriod(smoothedRoCValues, 'good');
  }, [smoothedRoCValues]);

  // Prepare RoC chart data with gradient stops for coloring
  const rocChartData = useMemo(() => {
    return smoothedRoCValues.map(point => ({
      ...point,
      glucoseDisplay: glucoseUnit === 'mg/dL' 
        ? Math.round(convertGlucoseValue(point.glucoseValue, glucoseUnit))
        : Math.round(convertGlucoseValue(point.glucoseValue, glucoseUnit) * 10) / 10,
    }));
  }, [smoothedRoCValues, glucoseUnit]);

  // Generate gradient stops for the RoC line based on time positions
  const rocGradientStops = useMemo(() => {
    if (rocChartData.length === 0) return [];
    return rocChartData.map(point => ({
      offset: `${(point.timeDecimal / 24) * 100}%`,
      color: getRoCColor(point.roc),
    }));
  }, [rocChartData]);

  // Prepare glucose line data for RoC chart overlay
  const rocGlucoseLineData = useMemo(() => {
    return currentGlucoseReadings.map(reading => {
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
  }, [currentGlucoseReadings, glucoseUnit]);

  // Calculate RoC Y-axis domain
  const rocYAxisDomain = useMemo((): [number, number] => {
    const minRocYAxisMax = ROC_THRESHOLDS.medium * 1.2;
    if (rocChartData.length === 0) {
      return [0, minRocYAxisMax];
    }
    const maxDataRoC = Math.max(...rocChartData.map(d => d.roc));
    return [0, Math.max(maxDataRoC, minRocYAxisMax)];
  }, [rocChartData]);

  // Calculate Hypoglycemia statistics
  const hypoStats: HypoStats | null = useMemo(() => {
    if (currentGlucoseReadings.length === 0) return null;
    return calculateHypoStats(currentGlucoseReadings, thresholds);
  }, [currentGlucoseReadings, thresholds]);

  // Prepare Hypos chart data with color information for each segment
  const hyposChartData = useMemo(() => {
    return smoothedReadings
      .map((reading, index) => {
        const time = reading.timestamp;
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        const convertedValue = convertGlucoseValue(reading.value, glucoseUnit);
        const clampedValue = Math.min(convertedValue, maxGlucose);
        
        // Determine color based on glucose level
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
          timeMinutes: hours * 60 + minutes,
          timeDecimal: hours + minutes / 60,
          value: clampedValue,
          originalValue: convertedValue,
          rawValue: reading.value,
          color,
          index,
        };
      })
      .sort((a, b) => a.timeMinutes - b.timeMinutes);
  }, [smoothedReadings, glucoseUnit, maxGlucose, thresholds]);

  // Create gradient stops for hypos chart
  const hyposGradientStops = useMemo(() => {
    if (hyposChartData.length < 2) return [];
    
    const stops: { offset: string; color: string }[] = [];
    let prevColor = hyposChartData[0].color;
    
    stops.push({
      offset: `${(hyposChartData[0].timeDecimal / 24) * 100}%`,
      color: hyposChartData[0].color,
    });
    
    for (let i = 1; i < hyposChartData.length; i++) {
      const point = hyposChartData[i];
      if (point.color !== prevColor) {
        const prevPoint = hyposChartData[i - 1];
        const prevOffset = `${(prevPoint.timeDecimal / 24) * 100}%`;
        if (stops[stops.length - 1].offset !== prevOffset) {
          stops.push({ offset: prevOffset, color: prevColor });
        }
        stops.push({
          offset: `${(point.timeDecimal / 24) * 100}%`,
          color: point.color,
        });
        prevColor = point.color;
      }
    }
    
    const lastPoint = hyposChartData[hyposChartData.length - 1];
    const lastOffset = `${(lastPoint.timeDecimal / 24) * 100}%`;
    if (stops[stops.length - 1].offset !== lastOffset) {
      stops.push({ offset: lastOffset, color: lastPoint.color });
    }
    
    return stops;
  }, [hyposChartData]);

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

  // Get medical standards for RoC
  const medicalStandards = getRoCMedicalStandards(glucoseUnit);

  // RoC unit label
  const rocUnitLabel = glucoseUnit === 'mg/dL' ? 'mg/dL/5 min' : 'mmol/L/5 min';

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

  // Custom tooltip for RoC chart
  const RoCTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      payload: RoCDataPoint & { glucoseDisplay?: number };
    }>;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data || !data.timeLabel) return null;
    
    const glucoseValue = data.glucoseDisplay ?? convertGlucoseValue(data.glucoseValue, glucoseUnit);
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

  // Custom tooltip for Hypos chart
  const HyposTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        time: string;
        value: number;
        originalValue: number;
        rawValue?: number;
        color: string;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayValue = data.originalValue > maxGlucose 
        ? `${formatGlucoseValue(data.originalValue, glucoseUnit)} (clamped to ${formatGlucoseValue(maxGlucose, glucoseUnit)})`
        : formatGlucoseValue(data.value, glucoseUnit);
      
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

  // Format X-axis labels - unified format: 12AM, 6AM, noon, 6PM, 12AM
  // Used with numeric XAxis (dataKey="timeDecimal" and "hour")
  const formatXAxis = (value: number) => {
    const hour = Math.floor(value);
    const unifiedLabels: Record<number, string> = {
      0: '12AM', 6: '6AM', 12: 'noon', 18: '6PM', 24: '12AM'
    };
    return unifiedLabels[hour] || '';
  };

  // Format X-axis labels for IOB - same unified format
  const formatXAxisIOB = formatXAxis;

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
      {/* Date Navigation - shared for all sections - sticky */}
      <div className={styles.stickyDatePickerWrapper}>
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
      </div>

      {/* ========== BG Section ========== */}
      {hasGlucoseData && (
        <>
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
                    
                    <RechartsTooltip content={<GlucoseTooltip />} />
                    
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

          {/* ========== Rate of Change (RoC) Section ========== */}
          {rocStats && rocStats.totalCount > 0 && (
            <>
              <Text className={styles.sectionTitle}>Rate of Change Analysis</Text>
              
              {/* RoC Stats Cards */}
              <div className={styles.statsRow}>
                <FluentTooltip content="Longest continuous period with stable glucose (slow rate of change)" relationship="description">
                  <Card className={styles.statCard}>
                    <TimerRegular className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Longest Stable</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>{formatDuration(longestStablePeriod)}</Text>
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
                
                <FluentTooltip content="Maximum absolute rate of glucose change (fastest)" relationship="description">
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
                </FluentTooltip>
                
                <FluentTooltip content="Standard Deviation of Rate of Change - measures variability in glucose change speed" relationship="description">
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
                </FluentTooltip>
              </div>

              {/* RoC Graph */}
              {rocChartData.length > 0 && (
                <>
                  <div className={styles.rocChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 10, right: 50, left: 10, bottom: 0 }} data={rocChartData}>
                        <defs>
                          {/* Day/night shading gradients */}
                          {showDayNightShading && (
                            <>
                              <linearGradient id="rocNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="rocNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                                <stop offset="100%" stopColor="#1a237e" stopOpacity="0.25" />
                              </linearGradient>
                            </>
                          )}
                          {/* RoC line gradient */}
                          <linearGradient id="dailyBGRocLineGradient" x1="0" y1="0" x2="1" y2="0">
                            {rocGradientStops.map((stop, index) => (
                              <stop key={index} offset={stop.offset} stopColor={stop.color} />
                            ))}
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                        
                        {/* Day/night shading */}
                        {showDayNightShading && (
                          <>
                            <ReferenceArea x1={0} x2={8} yAxisId="roc" fill="url(#rocNightGradientLeft)" />
                            <ReferenceArea x1={20} x2={24} yAxisId="roc" fill="url(#rocNightGradientRight)" />
                          </>
                        )}
                        
                        {/* Reference lines for RoC thresholds */}
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
                          domain={rocYAxisDomain}
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
                        
                        <RechartsTooltip content={<RoCTooltip />} />
                        
                        {/* Glucose line overlay */}
                        <Line
                          yAxisId="glucose"
                          type="monotone"
                          data={rocGlucoseLineData}
                          dataKey="glucoseDisplay"
                          name="Glucose"
                          stroke={tokens.colorNeutralStroke1}
                          strokeWidth={1.5}
                          dot={false}
                          connectNulls
                          legendType="none"
                        />
                        
                        {/* RoC line with gradient color */}
                        <Line
                          yAxisId="roc"
                          type="monotone"
                          dataKey="roc"
                          name="Rate of Change"
                          stroke="url(#dailyBGRocLineGradient)"
                          strokeWidth={2.5}
                          dot={false}
                          connectNulls
                          activeDot={{ r: 5, stroke: tokens.colorNeutralBackground1, strokeWidth: 2 }}
                          legendType="none"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* RoC Legend */}
                  <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                      <div 
                        className={styles.legendLine} 
                        style={{ background: `linear-gradient(to right, ${ROC_COLORS.good}, ${ROC_COLORS.medium}, ${ROC_COLORS.bad})` }} 
                      />
                      <Text>Rate of Change (RoC)</Text>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendLine} style={{ backgroundColor: tokens.colorNeutralStroke1 }} />
                      <Text>Glucose</Text>
                    </div>
                  </div>
                </>
              )}

              {/* RoC Summary Bar */}
              <div className={styles.rocSummaryCard}>
                <Text className={styles.rocSummaryTitle}>
                  Time by Rate of Change Category
                </Text>
                
                <div className={styles.rocSummaryBar}>
                  {rocStats.goodPercentage > 0 && (
                    <div
                      className={styles.rocSummarySegment}
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
                      className={styles.rocSummarySegment}
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
                      className={styles.rocSummarySegment}
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
                <div className={styles.rocStandardsContainer}>
                  <div className={styles.rocStandardRow}>
                    <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.good }} />
                    <Text className={styles.rocStandardLabel}>Stable</Text>
                    <Text className={styles.rocStandardThreshold}>{medicalStandards.good.threshold}</Text>
                    <Text className={styles.rocStandardDescription}>{medicalStandards.good.description}</Text>
                  </div>
                  <div className={styles.rocStandardRow}>
                    <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.medium }} />
                    <Text className={styles.rocStandardLabel}>Moderate</Text>
                    <Text className={styles.rocStandardThreshold}>{medicalStandards.medium.threshold}</Text>
                    <Text className={styles.rocStandardDescription}>{medicalStandards.medium.description}</Text>
                  </div>
                  <div className={styles.rocStandardRow}>
                    <div className={styles.rocStandardDot} style={{ backgroundColor: ROC_COLORS.bad }} />
                    <Text className={styles.rocStandardLabel}>Rapid</Text>
                    <Text className={styles.rocStandardThreshold}>{medicalStandards.bad.threshold}</Text>
                    <Text className={styles.rocStandardDescription}>{medicalStandards.bad.description}</Text>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== Hypoglycemia Section ========== */}
          {hypoStats && (
            <>
              <Text className={styles.sectionTitle}>Hypoglycemia Analysis</Text>
              
              {/* Hypo Stats Cards */}
              <div className={styles.statsRow}>
                <FluentTooltip content="Severe hypoglycemic events (below very low threshold)" relationship="description">
                  <Card className={mergeClasses(
                    styles.statCard,
                    hypoStats.severeCount > 0 ? styles.statCardDanger : styles.statCardSuccess
                  )}>
                    <HeartPulseWarningRegular className={mergeClasses(
                      styles.statIcon,
                      hypoStats.severeCount > 0 ? styles.statIconDanger : styles.statIconSuccess
                    )} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Severe</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>{hypoStats.severeCount}</Text>
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
                
                <FluentTooltip content="Non-severe hypoglycemic events (below low threshold)" relationship="description">
                  <Card className={mergeClasses(
                    styles.statCard,
                    hypoStats.nonSevereCount > 0 ? styles.statCardWarning : styles.statCardSuccess
                  )}>
                    <WarningRegular className={mergeClasses(
                      styles.statIcon,
                      hypoStats.nonSevereCount > 0 ? styles.statIconWarning : styles.statIconSuccess
                    )} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Non-Severe</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>{hypoStats.nonSevereCount}</Text>
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
                
                <FluentTooltip content="Lowest glucose value during hypoglycemia" relationship="description">
                  <Card className={mergeClasses(
                    styles.statCard,
                    hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
                      ? styles.statCardDanger 
                      : hypoStats.lowestValue !== null ? styles.statCardWarning : styles.statCardSuccess
                  )}>
                    <ArrowTrendingDownRegular className={mergeClasses(
                      styles.statIcon,
                      hypoStats.lowestValue !== null && hypoStats.lowestValue < thresholds.veryLow 
                        ? styles.statIconDanger 
                        : hypoStats.lowestValue !== null ? styles.statIconWarning : styles.statIconSuccess
                    )} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Lowest</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>
                          {hypoStats.lowestValue !== null 
                            ? displayGlucoseValue(hypoStats.lowestValue, glucoseUnit)
                            : 'N/A'}
                        </Text>
                        {hypoStats.lowestValue !== null && (
                          <Text className={styles.statUnit}>{getUnitLabel(glucoseUnit)}</Text>
                        )}
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
                
                <FluentTooltip content="Duration of longest hypoglycemic event" relationship="description">
                  <Card className={mergeClasses(
                    styles.statCard,
                    hypoStats.totalCount > 0 ? styles.statCardWarning : styles.statCardSuccess
                  )}>
                    <TimerRegular className={mergeClasses(
                      styles.statIcon,
                      hypoStats.totalCount > 0 ? styles.statIconWarning : styles.statIconSuccess
                    )} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Longest</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>
                          {formatHypoDuration(hypoStats.longestDurationMinutes)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
                
                <FluentTooltip content="Total time spent in hypoglycemia" relationship="description">
                  <Card className={mergeClasses(
                    styles.statCard,
                    hypoStats.totalCount > 0 ? styles.statCardWarning : styles.statCardSuccess
                  )}>
                    <ClockRegular className={mergeClasses(
                      styles.statIcon,
                      hypoStats.totalCount > 0 ? styles.statIconWarning : styles.statIconSuccess
                    )} />
                    <div className={styles.statContent}>
                      <Text className={styles.statLabel}>Total Time</Text>
                      <div className={styles.statValueRow}>
                        <Text className={styles.statValue}>
                          {hypoStats.totalCount > 0 
                            ? formatHypoDuration(hypoStats.totalDurationMinutes)
                            : 'None'}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </FluentTooltip>
              </div>

              {/* Hypos Graph */}
              {hyposChartData.length > 0 && (
                <>
                  <div className={styles.hyposChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={hyposChartData} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
                        <defs>
                          {/* Day/night shading gradients */}
                          {showDayNightShading && (
                            <>
                              <linearGradient id="hyposNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1a237e" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="hyposNightGradientRight" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1a237e" stopOpacity="0" />
                                <stop offset="100%" stopColor="#1a237e" stopOpacity="0.35" />
                              </linearGradient>
                            </>
                          )}
                          {/* Glucose line gradient based on hypo status */}
                          <linearGradient id="dailyBGHyposLineGradient" x1="0" y1="0" x2="1" y2="0">
                            {hyposGradientStops.map((stop, index) => (
                              <stop key={index} offset={stop.offset} stopColor={stop.color} />
                            ))}
                          </linearGradient>
                        </defs>
                        
                        {/* Day/night shading */}
                        {showDayNightShading && (
                          <>
                            <ReferenceArea x1={0} x2={8} fill="url(#hyposNightGradientLeft)" />
                            <ReferenceArea x1={20} x2={24} fill="url(#hyposNightGradientRight)" />
                          </>
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
                        
                        <RechartsTooltip content={<HyposTooltip />} />
                        
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
                        
                        {/* Nadir dots for each hypo period */}
                        {nadirPoints.length > 0 && (
                          <Scatter
                            data={nadirPoints}
                            dataKey="value"
                            fill={HYPO_CHART_COLORS.nadirDot}
                            shape={(props: unknown) => {
                              const shapeProps = props as { cx: number; cy: number };
                              return (
                                <circle
                                  cx={shapeProps.cx}
                                  cy={shapeProps.cy}
                                  r={6}
                                  fill={HYPO_CHART_COLORS.nadirDot}
                                  stroke={tokens.colorNeutralBackground1}
                                  strokeWidth={2}
                                />
                              );
                            }}
                          />
                        )}
                        
                        {/* Glucose values line with gradient coloring */}
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="url(#dailyBGHyposLineGradient)"
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
                  
                  {/* Hypos Legend */}
                  <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                      <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.normal }} />
                      <Text>In Range</Text>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.low }} />
                      <Text>Hypoglycemia</Text>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendLine} style={{ backgroundColor: HYPO_CHART_COLORS.veryLow }} />
                      <Text>Severe Hypo</Text>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ backgroundColor: HYPO_CHART_COLORS.nadirDot }} />
                      <Text>Nadir (Lowest Point)</Text>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
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

          {/* Insulin Timeline Chart - wrapped in Card */}
          <Card className={styles.chartCard}>
            <InsulinTimeline data={timelineData} showDayNightShading={showDayNightShading} />
          </Card>
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
                {/* Day/night shading gradients */}
                {showDayNightShading && (
                  <defs>
                    <linearGradient id="iobNightGradientLeft" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1a237e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1a237e" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="iobNightGradientRight" x1="0" y1="0" x2="1" y2="0">
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
                    fill="url(#iobNightGradientLeft)"
                  />
                )}
                {/* Day/night shading - 8PM to midnight */}
                {showDayNightShading && (
                  <ReferenceArea
                    x1={20}
                    x2={24}
                    fill="url(#iobNightGradientRight)"
                  />
                )}
                
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
                
                <XAxis
                  type="number"
                  dataKey="hour"
                  domain={[0, 24]}
                  ticks={[0, 6, 12, 18, 24]}
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
                
                <RechartsTooltip content={<IOBTooltip />} />
                
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
