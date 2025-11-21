/**
 * IOBReport component
 * Displays Insulin On Board (IOB) report with date navigation and table
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import type { UploadedFile, InsulinReading, HourlyIOBData } from '../types';
import { extractInsulinReadings, prepareHourlyIOBData } from '../utils/data';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';

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
  graphPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'dashed', tokens.colorNeutralStroke1),
  },
  placeholderText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase400,
  },
  tableContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    position: 'relative',
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 1,
  },
  centeredCell: {
    textAlign: 'center',
  },
});

interface IOBReportProps {
  selectedFile?: UploadedFile;
  insulinDuration?: number;
}

export function IOBReport({ selectedFile, insulinDuration = 5 }: IOBReportProps) {
  const styles = useStyles();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  const [loading, setLoading] = useState(false);
  const [allReadings, setAllReadings] = useState<InsulinReading[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyIOBData[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Extract insulin data when file changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedFile) {
        setAvailableDates([]);
        setCurrentDateIndex(0);
        setAllReadings([]);
        setHourlyData([]);
        return;
      }

      setLoading(true);
      try {
        const readings = await extractInsulinReadings(selectedFile);
        setAllReadings(readings);

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
        
        // If we have a saved date, try to use it
        if (selectedDate && dates.includes(selectedDate)) {
          setCurrentDateIndex(dates.indexOf(selectedDate));
        } else {
          // Otherwise, start with the most recent date
          setCurrentDateIndex(dates.length > 0 ? dates.length - 1 : 0);
        }
      } catch (error) {
        console.error('Failed to extract insulin data:', error);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  // Calculate hourly IOB data when date or insulin duration changes
  useEffect(() => {
    if (selectedDate && allReadings.length > 0) {
      const data = prepareHourlyIOBData(allReadings, selectedDate, insulinDuration);
      setHourlyData(data);
    } else {
      setHourlyData([]);
    }
  }, [selectedDate, allReadings, insulinDuration]);

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

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noDataMessage}>
          Please upload and select a file to view IOB reports
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

      {/* Graph Placeholder */}
      <div className={styles.graphPlaceholder}>
        <Text className={styles.placeholderText}>
          IOB graph will be configured here
        </Text>
      </div>

      {/* Hourly IOB Data Table */}
      {hourlyData.length > 0 && (
        <div className={styles.tableContainer}>
          <Table size="small">
            <TableHeader className={styles.stickyHeader}>
              <TableRow>
                <TableHeaderCell className={styles.centeredCell}>Time</TableHeaderCell>
                <TableHeaderCell className={styles.centeredCell}>Basal</TableHeaderCell>
                <TableHeaderCell className={styles.centeredCell}>Bolus</TableHeaderCell>
                <TableHeaderCell className={styles.centeredCell}>Active IOB</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hourlyData.map((data) => (
                <TableRow key={data.hour}>
                  <TableCell className={styles.centeredCell}>{data.timeLabel}</TableCell>
                  <TableCell className={styles.centeredCell}>
                    {data.basalInPreviousHour.toFixed(1)} U
                  </TableCell>
                  <TableCell className={styles.centeredCell}>
                    {data.bolusInPreviousHour.toFixed(1)} U
                  </TableCell>
                  <TableCell className={styles.centeredCell}>
                    {data.activeIOB.toFixed(2)} U
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
