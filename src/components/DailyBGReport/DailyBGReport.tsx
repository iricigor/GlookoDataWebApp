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
  Text,
  Spinner,
} from '@fluentui/react-components';
import type { GlucoseReading, GlucoseDataSource, InsulinReading, HourlyIOBData, RoCStats, RoCDataPoint } from '../../types';
import { 
  extractGlucoseReadings, 
  smoothGlucoseValues, 
  convertGlucoseValue,
  extractInsulinReadings,
  prepareInsulinTimelineData,
  prepareHourlyIOBData,
  getUniqueDates, 
  filterReadingsByDate, 
  calculateGlucoseRangeStats,
  calculateRoC,
  calculateRoCWithInterval,
  calculateRoCStats,
  smoothRoCData,
  ROC_THRESHOLDS,
  getRoCColor,
  getLongestCategoryPeriod,
  calculateHypoStats,
} from '../../utils/data';
import type { HypoStats } from '../../utils/data/hypoDataUtils';
import { useGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { DayNavigator } from '../DayNavigator';
import { useBGColorScheme } from '../../hooks/useBGColorScheme';
import { getGlucoseColor } from '../../utils/formatting';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { InsulinSummaryCards } from '../InsulinSummaryCards';
import { InsulinTimeline } from '../InsulinTimeline';

// Import split modules
import { useStyles } from './styles';
import { ROC_INTERVAL_OPTIONS, HYPO_CHART_COLORS } from './constants';
import { GlucoseSection, RoCSection, HypoSection, IOBSection } from './sections';
import type { DailyBGReportProps, TimelineDataPoint } from './types';

/**
 * Render the daily blood glucose report view for a selected file and date.
 *
 * Renders combined visualizations and summaries for glucose (CGM or BG), rate of change (RoC),
 * hypoglycemia events, insulin delivery (timeline and summary), and hourly IOB.
 *
 * @param selectedFile - The currently selected file containing glucose and insulin data; if undefined, the component prompts to upload/select a file
 * @param glucoseUnit - Display unit for glucose values (`'mg/dL'` or `'mmol/L'`)
 * @param insulinDuration - Duration in hours used when computing hourly IOB (defaults to 5)
 * @param showDayNightShading - Whether to display day/night background shading on charts
 * @returns The JSX element containing the composed daily report UI
 */
export function DailyBGReport({ 
  selectedFile, 
  glucoseUnit, 
  insulinDuration = 5, 
  showDayNightShading,
  showGeekStats = false,
  perplexityApiKey = '',
  geminiApiKey = '',
  grokApiKey = '',
  deepseekApiKey = '',
  selectedProvider = null,
  responseLanguage = 'english',
  isProUser = false,
  idToken = null,
  useProKeys = false,
}: DailyBGReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();
  const { colorScheme, setColorScheme } = useBGColorScheme();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  
  // Determine if API key is available
  const hasApiKey = 
    (selectedProvider === 'perplexity' && perplexityApiKey !== '') ||
    (selectedProvider === 'grok' && grokApiKey !== '') ||
    (selectedProvider === 'deepseek' && deepseekApiKey !== '') ||
    (selectedProvider === 'gemini' && geminiApiKey !== '');
  
  // Glucose state
  const [loading, setLoading] = useState(false);
  const [dateChanging, setDateChanging] = useState(false);
  const [cgmReadings, setCgmReadings] = useState<GlucoseReading[]>([]);
  const [bgReadings, setBgReadings] = useState<GlucoseReading[]>([]);
  const [currentGlucoseReadings, setCurrentGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [dataSource, setDataSource] = useState<GlucoseDataSource>('cgm');
  const [maxGlucose, setMaxGlucose] = useState<number>(
    glucoseUnit === 'mg/dL' ? 396 : 22.0
  );
  
  // Insulin state
  const [allInsulinReadings, setAllInsulinReadings] = useState<InsulinReading[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [hourlyIOBData, setHourlyIOBData] = useState<HourlyIOBData[]>([]);
  const [insulinSummary, setInsulinSummary] = useState({ basalTotal: 0, bolusTotal: 0, totalInsulin: 0 });
  
  // RoC state
  const [rocStats, setRocStats] = useState<RoCStats | null>(null);
  const [rocChartData, setRocChartData] = useState<Array<RoCDataPoint & { glucoseDisplay: number }>>([]);
  const [rocGlucoseLineData, setRocGlucoseLineData] = useState<Array<{ timeDecimal: number; glucoseDisplay: number }>>([]);
  const [rocGradientStops, setRocGradientStops] = useState<Array<{ offset: string; color: string }>>([]);
  const [rocYAxisDomain, setRocYAxisDomain] = useState<[number, number]>([0, ROC_THRESHOLDS.medium * 1.2]);
  const [longestStablePeriod, setLongestStablePeriod] = useState(0);
  const [rocIntervalIndex, setRocIntervalIndex] = useState(0);
  const [rocMaxGlucose, setRocMaxGlucose] = useState<number>(
    glucoseUnit === 'mg/dL' ? 288 : 16.0
  );
  
  // Hypo state
  const [hypoStats, setHypoStats] = useState<HypoStats | null>(null);
  const [hyposChartData, setHyposChartData] = useState<Array<{
    time: string;
    timeMinutes: number;
    timeDecimal: number;
    value: number;
    originalValue: number;
    rawValue?: number;
    color: string;
    index: number;
  }>>([]);
  const [hyposGradientStops, setHyposGradientStops] = useState<Array<{ offset: string; color: string }>>([]);
  const [nadirPoints, setNadirPoints] = useState<Array<{
    timeDecimal: number;
    value: number;
    originalValue: number;
    nadir: number;
    isSevere: boolean;
  }>>([]);
  
  // Refs for tracking file changes
  const loadedFileIdRef = useRef<string | undefined>(undefined);
  const hasAppliedSavedDateRef = useRef<boolean>(false);

  // Extract glucose and insulin data when file changes
  useEffect(() => {
    if (!selectedFile) {
      setAvailableDates([]);
      setCurrentDateIndex(0);
      setCgmReadings([]);
      setBgReadings([]);
      setCurrentGlucoseReadings([]);
      setAllInsulinReadings([]);
      setTimelineData([]);
      setHourlyIOBData([]);
      setRocStats(null);
      setHypoStats(null);
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
        // Extract CGM data
        let cgm: GlucoseReading[] = [];
        try {
          cgm = await extractGlucoseReadings(selectedFile, 'cgm');
          setCgmReadings(cgm);
        } catch {
          setCgmReadings([]);
        }
        
        // Extract BG data
        let bg: GlucoseReading[] = [];
        try {
          bg = await extractGlucoseReadings(selectedFile, 'bg');
          setBgReadings(bg);
        } catch {
          setBgReadings([]);
        }
        
        // Prefer CGM data if available
        const activeReadings = cgm.length > 0 ? cgm : bg;
        setDataSource(cgm.length > 0 ? 'cgm' : 'bg');
        
        // Extract insulin data
        let insulin: InsulinReading[] = [];
        try {
          insulin = await extractInsulinReadings(selectedFile);
          setAllInsulinReadings(insulin);
        } catch {
          setAllInsulinReadings([]);
        }
        
        // Get available dates from either glucose or insulin
        const glucoseDates = activeReadings.length > 0 ? getUniqueDates(activeReadings) : [];
        const insulinDates = insulin.length > 0 ? getUniqueDates(insulin.map(r => ({ timestamp: r.timestamp, value: 0 }))) : [];
        
        // Combine and deduplicate dates
        const allDates = [...new Set([...glucoseDates, ...insulinDates])].sort();
        setAvailableDates(allDates);
        
        if (selectedDate && allDates.includes(selectedDate)) {
          setCurrentDateIndex(allDates.indexOf(selectedDate));
          hasAppliedSavedDateRef.current = true;
        } else {
          setCurrentDateIndex(allDates.length > 0 ? allDates.length - 1 : 0);
          hasAppliedSavedDateRef.current = false;
        }
        
        loadedFileIdRef.current = selectedFile.id;
      } catch (error) {
        console.error('Failed to load data:', error);
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

  // Get current interval settings for RoC calculation
  const currentInterval = ROC_INTERVAL_OPTIONS[rocIntervalIndex];

  // Filter data for current date and calculate stats
  useEffect(() => {
    if (availableDates.length === 0) return;
    
    const currentDate = availableDates[currentDateIndex];
    const activeReadings = dataSource === 'cgm' ? cgmReadings : bgReadings;
    
    // Filter glucose readings for current date
    const filteredGlucose = filterReadingsByDate(activeReadings, currentDate);
    setCurrentGlucoseReadings(filteredGlucose);
    
    // Prepare timeline data if insulin is available
    if (allInsulinReadings.length > 0) {
      const timeline = prepareInsulinTimelineData(allInsulinReadings, currentDate);
      setTimelineData(timeline);
      
      // Calculate insulin summary from timeline data
      const basalTotal = timeline.reduce((sum, d) => sum + d.basalRate, 0);
      const bolusTotal = timeline.reduce((sum, d) => sum + d.bolusTotal, 0);
      setInsulinSummary({
        basalTotal,
        bolusTotal,
        totalInsulin: basalTotal + bolusTotal,
      });
      
      // Prepare IOB data
      const iobData = prepareHourlyIOBData(allInsulinReadings, currentDate, insulinDuration);
      setHourlyIOBData(iobData);
    } else {
      setTimelineData([]);
      setInsulinSummary({ basalTotal: 0, bolusTotal: 0, totalInsulin: 0 });
      setHourlyIOBData([]);
    }
    
    // Calculate RoC stats if glucose is available
    if (filteredGlucose.length > 0) {
      // Calculate RoC based on selected interval
      let rocData: RoCDataPoint[];
      if (currentInterval.minutes === 15) {
        rocData = calculateRoC(filteredGlucose);
      } else {
        rocData = calculateRoCWithInterval(filteredGlucose, currentInterval.minutes);
      }
      
      const smoothedRoC = smoothRoCData(rocData);
      const stats = calculateRoCStats(smoothedRoC);
      setRocStats(stats);
      setLongestStablePeriod(getLongestCategoryPeriod(smoothedRoC, 'good'));
      
      // Prepare RoC chart data
      const chartData = smoothedRoC.map(point => ({
        ...point,
        glucoseDisplay: glucoseUnit === 'mg/dL' 
          ? Math.round(convertGlucoseValue(point.glucoseValue, glucoseUnit))
          : Math.round(convertGlucoseValue(point.glucoseValue, glucoseUnit) * 10) / 10,
      }));
      setRocChartData(chartData);
      
      // Prepare gradient stops for RoC line
      const gradientStops = chartData.map(point => ({
        offset: `${(point.timeDecimal / 24) * 100}%`,
        color: getRoCColor(point.roc),
      }));
      setRocGradientStops(gradientStops);
      
      // Prepare glucose line data for RoC chart
      const glucoseLineData = filteredGlucose.map(reading => {
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
      setRocGlucoseLineData(glucoseLineData);
      
      // Calculate RoC Y-axis domain
      const maxDataRoC = chartData.length > 0 ? Math.max(...chartData.map(d => d.roc)) : 0;
      const minRocYAxisMax = ROC_THRESHOLDS.medium * 1.2;
      setRocYAxisDomain([0, Math.max(maxDataRoC, minRocYAxisMax)]);
      
      // Calculate hypo stats
      const hypoStatsResult = calculateHypoStats(filteredGlucose, thresholds);
      setHypoStats(hypoStatsResult);
      
      // Prepare hypo chart data
      const smoothedReadings = smoothGlucoseValues(filteredGlucose);
      const hyposData = smoothedReadings.map((reading, index) => {
        const hour = reading.timestamp.getHours();
        const minute = reading.timestamp.getMinutes();
        const timeMinutes = hour * 60 + minute;
        const glucoseValue = convertGlucoseValue(reading.value, glucoseUnit);
        const rawValue = reading.value;
        
        // Determine color based on hypo status
        let color = HYPO_CHART_COLORS.normal;
        if (rawValue < thresholds.veryLow) {
          color = HYPO_CHART_COLORS.veryLow;
        } else if (rawValue < thresholds.low) {
          color = HYPO_CHART_COLORS.low;
        }
        
        return {
          time: reading.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMinutes,
          timeDecimal: hour + minute / 60,
          value: Math.min(glucoseValue, maxGlucose),
          originalValue: glucoseValue,
          rawValue,
          color,
          index,
        };
      });
      setHyposChartData(hyposData);
      
      // Prepare hypo gradient stops
      const hypoGradientStops = hyposData.map(point => ({
        offset: `${(point.timeDecimal / 24) * 100}%`,
        color: point.color,
      }));
      setHyposGradientStops(hypoGradientStops);
      
      // Prepare nadir points
      const nadirs = hypoStatsResult.hypoPeriods.map(period => {
        const nadirReading = smoothedReadings.find(r => 
          r.timestamp.getTime() === period.nadirTime.getTime()
        );
        if (!nadirReading) return null;
        
        const hour = nadirReading.timestamp.getHours();
        const minute = nadirReading.timestamp.getMinutes();
        const glucoseValue = convertGlucoseValue(nadirReading.value, glucoseUnit);
        
        return {
          timeDecimal: hour + minute / 60,
          value: Math.min(glucoseValue, maxGlucose),
          originalValue: glucoseValue,
          nadir: glucoseValue,
          isSevere: period.isSevere,
        };
      }).filter(Boolean) as Array<{
        timeDecimal: number;
        value: number;
        originalValue: number;
        nadir: number;
        isSevere: boolean;
      }>;
      setNadirPoints(nadirs);
    } else {
      setRocStats(null);
      setRocChartData([]);
      setRocGlucoseLineData([]);
      setRocGradientStops([]);
      setHypoStats(null);
      setHyposChartData([]);
      setHyposGradientStops([]);
      setNadirPoints([]);
    }
  }, [currentDateIndex, availableDates, cgmReadings, bgReadings, allInsulinReadings, dataSource, glucoseUnit, thresholds, currentInterval.minutes, insulinDuration, maxGlucose]);

  // Calculate glucose stats
  const glucoseStats = useMemo(() => {
    if (currentGlucoseReadings.length === 0) {
      return { low: 0, inRange: 0, high: 0, total: 0 };
    }
    return calculateGlucoseRangeStats(currentGlucoseReadings, thresholds);
  }, [currentGlucoseReadings, thresholds]);

  const belowPercentage = glucoseStats.total > 0 
    ? ((glucoseStats.low / glucoseStats.total) * 100).toFixed(1) 
    : '0.0';
  const inRangePercentage = glucoseStats.total > 0 
    ? ((glucoseStats.inRange / glucoseStats.total) * 100).toFixed(1) 
    : '0.0';
  const abovePercentage = glucoseStats.total > 0 
    ? ((glucoseStats.high / glucoseStats.total) * 100).toFixed(1) 
    : '0.0';

  // Prepare glucose chart data
  const glucoseChartData = useMemo(() => {
    const smoothedReadings = smoothGlucoseValues(currentGlucoseReadings);
    return smoothedReadings.map(reading => {
      const hour = reading.timestamp.getHours();
      const minute = reading.timestamp.getMinutes();
      const timeMinutes = hour * 60 + minute;
      const glucoseValue = convertGlucoseValue(reading.value, glucoseUnit);
      
      return {
        time: reading.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMinutes,
        timeDecimal: hour + minute / 60,
        value: Math.min(glucoseValue, maxGlucose),
        originalValue: glucoseValue,
        color: getGlucoseColor(reading.value, colorScheme),
      };
    });
  }, [currentGlucoseReadings, glucoseUnit, maxGlucose, thresholds, colorScheme]);

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

  const currentDate = availableDates[currentDateIndex] ?? '';
  const minDate = availableDates.length > 0 ? availableDates[0] : undefined;
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please upload and select a file to view the daily report
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
        <GlucoseSection
          styles={styles}
          glucoseUnit={glucoseUnit}
          thresholds={thresholds}
          glucoseStats={glucoseStats}
          belowPercentage={belowPercentage}
          inRangePercentage={inRangePercentage}
          abovePercentage={abovePercentage}
          maxGlucose={maxGlucose}
          setMaxGlucose={setMaxGlucose}
          colorScheme={colorScheme}
          setColorScheme={setColorScheme}
          glucoseChartData={glucoseChartData}
          showDayNightShading={showDayNightShading}
        />
      )}

      {/* ========== Rate of Change (RoC) Section ========== */}
      {rocStats && rocStats.totalCount > 0 && (
        <RoCSection
          styles={styles}
          glucoseUnit={glucoseUnit}
          thresholds={thresholds}
          rocStats={rocStats}
          longestStablePeriod={longestStablePeriod}
          rocChartData={rocChartData}
          rocGlucoseLineData={rocGlucoseLineData}
          rocGradientStops={rocGradientStops}
          rocYAxisDomain={rocYAxisDomain}
          rocIntervalIndex={rocIntervalIndex}
          setRocIntervalIndex={setRocIntervalIndex}
          rocMaxGlucose={rocMaxGlucose}
          setRocMaxGlucose={setRocMaxGlucose}
          showDayNightShading={showDayNightShading}
        />
      )}

      {/* ========== Hypoglycemia Section ========== */}
      {hypoStats && (
        <HypoSection
          styles={styles}
          glucoseUnit={glucoseUnit}
          thresholds={thresholds}
          hypoStats={hypoStats}
          hyposChartData={hyposChartData}
          hyposGradientStops={hyposGradientStops}
          nadirPoints={nadirPoints}
          maxGlucose={maxGlucose}
          showDayNightShading={showDayNightShading}
          currentDate={currentDate}
          currentGlucoseReadings={currentGlucoseReadings}
          hasApiKey={hasApiKey}
          activeProvider={selectedProvider}
          perplexityApiKey={perplexityApiKey}
          geminiApiKey={geminiApiKey}
          grokApiKey={grokApiKey}
          deepseekApiKey={deepseekApiKey}
          responseLanguage={responseLanguage}
          isProUser={isProUser}
          idToken={idToken}
          useProKeys={useProKeys}
          showGeekStats={showGeekStats}
        />
      )}

      {!hasGlucoseData && (
        <Text className={styles.noDataMessage}>
          No glucose data available for this date
        </Text>
      )}

      {/* ========== Insulin Section ========== */}
      {hasInsulinData && (
        <div className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>Insulin Delivery</Text>
          
          {/* Insulin Summary Cards */}
          <InsulinSummaryCards
            basalTotal={insulinSummary.basalTotal}
            bolusTotal={insulinSummary.bolusTotal}
            totalInsulin={insulinSummary.totalInsulin}
          />

          {/* Insulin Timeline Chart */}
          <div className={styles.chartCardInnerContent}>
            <InsulinTimeline data={timelineData} showDayNightShading={showDayNightShading} />
          </div>
        </div>
      )}

      {!hasInsulinData && (
        <Text className={styles.noDataMessage}>
          No insulin data available for this date
        </Text>
      )}

      {/* ========== IOB Section ========== */}
      {hasIOBData && (
        <IOBSection
          styles={styles}
          hourlyIOBData={hourlyIOBData}
          showDayNightShading={showDayNightShading}
        />
      )}
    </div>
  );
}