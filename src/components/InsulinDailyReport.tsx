/**
 * InsulinDailyReport component
 * Displays daily insulin report with navigation and timeline
 */

import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
  Card,
  Spinner,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { useState, useEffect } from 'react';
import type { UploadedFile, InsulinReading } from '../types';
import { extractInsulinReadings, prepareInsulinTimelineData } from '../utils/insulinDataUtils';
import { InsulinTimeline } from './InsulinTimeline';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    ...shorthands.padding('24px'),
  },
  navigationBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  navigationButtons: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  dateDisplay: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
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
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryUnit: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    marginLeft: '4px',
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <div className={styles.navigationBar}>
        <div className={styles.navigationButtons}>
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            onClick={handlePreviousDay}
            disabled={currentDateIndex === 0}
          >
            Previous Day
          </Button>
        </div>
        
        <Text className={styles.dateDisplay}>
          {formatDate(currentDate)}
        </Text>
        
        <div className={styles.navigationButtons}>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            iconPosition="after"
            onClick={handleNextDay}
            disabled={currentDateIndex === availableDates.length - 1}
          >
            Next Day
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summarySection}>
        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Basal</Text>
          <div>
            <Text className={styles.summaryValue}>{summary.basalTotal}</Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Bolus</Text>
          <div>
            <Text className={styles.summaryValue}>{summary.bolusTotal}</Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>Total Insulin</Text>
          <div>
            <Text className={styles.summaryValue}>{summary.totalInsulin}</Text>
            <Text className={styles.summaryUnit}>units</Text>
          </div>
        </Card>
      </div>

      {/* Timeline Chart */}
      <InsulinTimeline data={timelineData} />
    </div>
  );
}
