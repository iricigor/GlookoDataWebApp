/**
 * HyposReport component
 * Displays Hypoglycemia analysis with daily glucose values graph
 * Features color-coded line (green/light red/dark red) based on glucose levels
 * and comprehensive hypo statistics including duration, nadir values, and counts
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Text } from '@fluentui/react-components';
import type { GlucoseReading, GlucoseDataSource } from '../../types';
import { 
  extractGlucoseReadings, 
  smoothGlucoseValues, 
  convertGlucoseValue, 
  getUniqueDates, 
  filterReadingsByDate,
  calculateHypoStats,
  calculateLBGI,
} from '../../utils/data';
import type { HypoStats } from '../../utils/data/hypoDataUtils';
import { useGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { DayNavigator } from '../DayNavigator';
import { useSelectedDate } from '../../hooks/useSelectedDate';
import { useHyposStyles } from './styles';
import { HyposStatsCards } from './HyposStatsCards';
import { HyposChart } from './HyposChart';
import { 
  MAX_GLUCOSE_VALUES, 
  HYPO_CHART_COLORS,
  type HyposReportProps,
  type ChartDataPoint,
  type NadirPoint,
  type GradientStop,
} from './types';

export function HyposReport({ selectedFile, glucoseUnit }: HyposReportProps) {
  const styles = useHyposStyles();
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

  // Calculate LBGI (Low Blood Glucose Index) for current day's readings
  const lbgi: number | null = useMemo(() => {
    if (currentReadings.length === 0) return null;
    return calculateLBGI(currentReadings);
  }, [currentReadings]);

  // Apply smoothing to glucose values
  const smoothedReadings = smoothGlucoseValues(currentReadings);

  // Prepare chart data with color information for each segment
  const chartData: ChartDataPoint[] = useMemo(() => {
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
  const gradientStops: GradientStop[] = useMemo(() => {
    if (chartData.length < 2) return [];
    
    const stops: GradientStop[] = [];
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
  const nadirPoints: NadirPoint[] = useMemo(() => {
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
  const handlePreviousDate = useCallback(() => {
    if (currentDateIndex > 0) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex - 1);
      // Clear loading state after a brief moment
      setTimeout(() => setDateChanging(false), 100);
    }
  }, [currentDateIndex]);

  const handleNextDate = useCallback(() => {
    if (currentDateIndex < availableDates.length - 1) {
      setDateChanging(true);
      setCurrentDateIndex(currentDateIndex + 1);
      // Clear loading state after a brief moment
      setTimeout(() => setDateChanging(false), 100);
    }
  }, [currentDateIndex, availableDates.length]);

  // Handle date selection from date picker
  const handleDateSelect = useCallback((date: string) => {
    const newIndex = availableDates.indexOf(date);
    if (newIndex !== -1) {
      setDateChanging(true);
      setCurrentDateIndex(newIndex);
      setTimeout(() => setDateChanging(false), 100);
    }
  }, [availableDates]);

  // Get min and max dates for date picker
  const minDate = availableDates.length > 0 ? availableDates[0] : undefined;
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;

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
      <HyposStatsCards 
        hypoStats={hypoStats}
        thresholds={thresholds}
        glucoseUnit={glucoseUnit}
        lbgi={lbgi}
      />

      {/* Chart */}
      <HyposChart
        chartData={chartData}
        nadirPoints={nadirPoints}
        gradientStops={gradientStops}
        maxGlucose={maxGlucose}
        setMaxGlucose={setMaxGlucose}
        glucoseUnit={glucoseUnit}
        thresholds={thresholds}
        windowWidth={windowWidth}
      />
    </div>
  );
}
