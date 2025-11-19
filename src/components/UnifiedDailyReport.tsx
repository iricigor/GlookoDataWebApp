/**
 * UnifiedDailyReport component
 * Displays daily insulin report with optional CGM data overlay
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Spinner,
  Switch,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import type { UploadedFile, InsulinReading, GlucoseReading } from '../types';
import { extractInsulinReadings, prepareInsulinTimelineData, extractGlucoseReadings, filterReadingsByDate } from '../utils/data';
import { InsulinTimeline } from './InsulinTimeline';
import { InsulinDayNavigator } from './InsulinDayNavigator';
import { InsulinSummaryCards } from './InsulinSummaryCards';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { UnifiedTimeline } from './UnifiedTimeline';
import { useBGColorScheme } from '../hooks/useBGColorScheme';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    ...shorthands.padding('24px'),
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
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  switchLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
});

interface UnifiedDailyReportProps {
  selectedFile?: UploadedFile;
}

export function UnifiedDailyReport({ selectedFile }: UnifiedDailyReportProps) {
  const styles = useStyles();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  const { colorScheme, setColorScheme } = useBGColorScheme();
  const [loading, setLoading] = useState(false);
  const [insulinReadings, setInsulinReadings] = useState<InsulinReading[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [timelineData, setTimelineData] = useState<Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>>([]);
  const [showCGM, setShowCGM] = useState(false);
  const [maxGlucose, setMaxGlucose] = useState<number>(22.0);

  // Extract insulin and glucose data when file changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedFile) {
        setInsulinReadings([]);
        setGlucoseReadings([]);
        setAvailableDates([]);
        setCurrentDateIndex(0);
        setTimelineData([]);
        return;
      }

      setLoading(true);
      try {
        // Load insulin data
        const insulinData = await extractInsulinReadings(selectedFile);
        setInsulinReadings(insulinData);

        // Try to load CGM data
        try {
          const cgmData = await extractGlucoseReadings(selectedFile, 'cgm');
          setGlucoseReadings(cgmData);
        } catch (error) {
          console.log('No CGM data available:', error);
          setGlucoseReadings([]);
        }

        // Extract unique dates from insulin readings
        const dates = Array.from(
          new Set(
            insulinData.map(r => {
              const date = new Date(r.timestamp);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })
          )
        ).sort();

        setAvailableDates(dates);
        
        // If we have a saved date, try to use it
        if (selectedDate && dates.includes(selectedDate)) {
          setCurrentDateIndex(dates.indexOf(selectedDate));
        } else {
          // Otherwise, start with the most recent date
          setCurrentDateIndex(dates.length > 0 ? dates.length - 1 : 0);
        }
      } catch (error) {
        console.error('Failed to extract data:', error);
        setInsulinReadings([]);
        setGlucoseReadings([]);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, selectedDate]);

  // Prepare timeline data when date changes
  useEffect(() => {
    if (availableDates.length > 0 && insulinReadings.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      const data = prepareInsulinTimelineData(insulinReadings, currentDate);
      setTimelineData(data);
      
      // Save current date to shared state
      if (currentDate !== selectedDate) {
        setSelectedDate(currentDate);
      }
    } else {
      setTimelineData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateIndex, availableDates, insulinReadings]);

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

  // Handle date selection from date picker
  const handleDateSelect = (date: string) => {
    const newIndex = availableDates.indexOf(date);
    if (newIndex !== -1) {
      setCurrentDateIndex(newIndex);
    }
  };

  // Get min and max dates for date picker
  const minDate = availableDates.length > 0 ? availableDates[0] : undefined;
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;

  // Calculate daily summaries
  const getDailySummary = () => {
    if (availableDates.length === 0 || timelineData.length === 0) {
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

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please upload and select a file to view unified reports
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
          No insulin data available in the selected file
        </Text>
      </div>
    );
  }

  const currentDate = availableDates[currentDateIndex];
  const summary = getDailySummary();

  // Filter glucose readings for current date if CGM is enabled
  const currentGlucoseReadings = showCGM && glucoseReadings.length > 0
    ? filterReadingsByDate(glucoseReadings, currentDate)
    : [];

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <InsulinDayNavigator
        currentDate={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        canGoPrevious={currentDateIndex > 0}
        canGoNext={currentDateIndex < availableDates.length - 1}
        onDateSelect={handleDateSelect}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* CGM Toggle Switch */}
      <div className={styles.switchContainer}>
        <Switch
          checked={showCGM}
          onChange={(e) => setShowCGM(e.currentTarget.checked)}
          label="Show CGM Data"
          labelPosition="after"
        />
        {glucoseReadings.length === 0 && (
          <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            (No CGM data available)
          </Text>
        )}
      </div>

      {/* Summary Cards */}
      <InsulinSummaryCards
        basalTotal={summary.basalTotal}
        bolusTotal={summary.bolusTotal}
        totalInsulin={summary.totalInsulin}
      />

      {/* Timeline Chart */}
      {showCGM && currentGlucoseReadings.length > 0 ? (
        <UnifiedTimeline 
          insulinData={timelineData} 
          glucoseReadings={currentGlucoseReadings}
          colorScheme={colorScheme}
          setColorScheme={setColorScheme}
          maxGlucose={maxGlucose}
          setMaxGlucose={setMaxGlucose}
        />
      ) : (
        <InsulinTimeline data={timelineData} />
      )}
    </div>
  );
}
