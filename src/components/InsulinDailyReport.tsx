/**
 * InsulinDailyReport component
 * Displays daily insulin report with navigation and timeline
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Spinner,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import type { UploadedFile, InsulinReading } from '../types';
import { extractInsulinReadings, prepareInsulinTimelineData } from '../utils/insulinDataUtils';
import { InsulinTimeline } from './InsulinTimeline';
import { InsulinDayNavigator } from './InsulinDayNavigator';
import { InsulinSummaryCards } from './InsulinSummaryCards';

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
});

interface InsulinDailyReportProps {
  selectedFile?: UploadedFile;
}

export function InsulinDailyReport({ selectedFile }: InsulinDailyReportProps) {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const [insulinReadings, setInsulinReadings] = useState<InsulinReading[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [timelineData, setTimelineData] = useState<Array<{
    hour: number;
    timeLabel: string;
    basalRate: number;
    bolusTotal: number;
  }>>([]);

  // Extract insulin data when file changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedFile) {
        setInsulinReadings([]);
        setAvailableDates([]);
        setCurrentDateIndex(0);
        setTimelineData([]);
        return;
      }

      setLoading(true);
      try {
        const readings = await extractInsulinReadings(selectedFile);
        setInsulinReadings(readings);

        // Extract unique dates from readings
        const dates = Array.from(
          new Set(
            readings.map(r => {
              const date = new Date(r.timestamp);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })
          )
        ).sort();

        setAvailableDates(dates);
        // Start with the most recent date
        setCurrentDateIndex(dates.length > 0 ? dates.length - 1 : 0);
      } catch (error) {
        console.error('Failed to extract insulin data:', error);
        setInsulinReadings([]);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile]);

  // Prepare timeline data when date changes
  useEffect(() => {
    if (availableDates.length > 0 && insulinReadings.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      const data = prepareInsulinTimelineData(insulinReadings, currentDate);
      setTimelineData(data);
    } else {
      setTimelineData([]);
    }
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
          Please upload and select a file to view insulin reports
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" />
        <Text>Loading insulin data...</Text>
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

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <InsulinDayNavigator
        currentDate={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        canGoPrevious={currentDateIndex > 0}
        canGoNext={currentDateIndex < availableDates.length - 1}
      />

      {/* Summary Cards */}
      <InsulinSummaryCards
        basalTotal={summary.basalTotal}
        bolusTotal={summary.bolusTotal}
        totalInsulin={summary.totalInsulin}
      />

      {/* Timeline Chart */}
      <InsulinTimeline data={timelineData} />
    </div>
  );
}
