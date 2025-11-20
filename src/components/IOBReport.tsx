/**
 * IOBReport component
 * Displays Insulin On Board (IOB) report with date navigation and interactive graph
 */

import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Spinner,
  Card,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { UploadedFile, InsulinReading } from '../types';
import type { IOBDataPoint } from '../utils/data/iobCalculations';
import { extractInsulinReadings, calculateDailyIOB } from '../utils/data';
import { DayNavigator } from './DayNavigator';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { useInsulinDuration } from '../hooks/useInsulinDuration';

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
  graphCard: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  graphContainer: {
    width: '100%',
    height: '400px',
  },
  settingInfo: {
    marginBottom: '8px',
  },
  settingText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  settingLink: {
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  calculationInfo: {
    marginBottom: '8px',
  },
  calculationText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  dataTable: {
    marginTop: '16px',
  },
});

interface IOBReportProps {
  selectedFile?: UploadedFile;
}

export function IOBReport({ selectedFile }: IOBReportProps) {
  const styles = useStyles();
  const { selectedDate, setSelectedDate } = useSelectedDate(selectedFile?.id);
  const { insulinDuration } = useInsulinDuration();
  const [loading, setLoading] = useState(false);
  const [insulinReadings, setInsulinReadings] = useState<InsulinReading[]>([]);
  const [iobData, setIobData] = useState<IOBDataPoint[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Extract insulin data when file changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedFile) {
        setInsulinReadings([]);
        setIobData([]);
        setAvailableDates([]);
        setCurrentDateIndex(0);
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
        
        // If we have a saved date, try to use it
        if (selectedDate && dates.includes(selectedDate)) {
          setCurrentDateIndex(dates.indexOf(selectedDate));
        } else {
          // Otherwise, start with the most recent date
          setCurrentDateIndex(dates.length > 0 ? dates.length - 1 : 0);
        }
      } catch (error) {
        console.error('Failed to extract insulin data:', error);
        setInsulinReadings([]);
        setIobData([]);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, selectedDate]);

  // Calculate IOB data when date or insulin duration changes
  useEffect(() => {
    if (availableDates.length > 0 && insulinReadings.length > 0) {
      const currentDate = availableDates[currentDateIndex];
      const data = calculateDailyIOB(insulinReadings, currentDate, insulinDuration);
      setIobData(data);
    }
  }, [currentDateIndex, availableDates, insulinReadings, insulinDuration]);

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

      {/* Insulin Duration and IOB Calculation Info */}
      <div className={styles.settingInfo}>
        <Text className={styles.settingText}>
          Insulin Duration: {insulinDuration} hours (
          <a href="#settings" className={styles.settingLink}>change in Settings</a>).
          {' '}IOB calculated using linear decay: {Math.round((1 - 1/insulinDuration) * 100)}% of previous IOB carries forward each hour, plus new insulin delivered in that hour.
        </Text>
      </div>

      {/* IOB Graph */}
      <Card className={styles.graphCard}>
        <div className={styles.graphContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={iobData}
              margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeLabel"
                interval={5}  // Show every 6 hours (0, 6, 12, 18)
                label={{ value: 'Time of Day', position: 'insideBottom', offset: -25 }}
              />
              <YAxis 
                label={{ value: 'Insulin / IOB (units)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)} U`}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                dataKey="basalAmount" 
                stackId="insulin"
                fill="#2E7D32"
                name="Basal Insulin"
              />
              <Bar 
                dataKey="bolusAmount" 
                stackId="insulin"
                fill="#1976D2"
                name="Bolus Insulin"
              />
              <Line 
                type="monotone" 
                dataKey="totalIOB" 
                stroke={tokens.colorPaletteRedForeground2} 
                name="Total IOB"
                dot={false}
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Collapsible Data Table */}
      <Accordion collapsible className={styles.dataTable}>
        <AccordionItem value="dataTable">
          <AccordionHeader>View Hourly Data Table</AccordionHeader>
          <AccordionPanel>
            <Table size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Hour</TableHeaderCell>
                  <TableHeaderCell>Basal (U)</TableHeaderCell>
                  <TableHeaderCell>Bolus (U)</TableHeaderCell>
                  <TableHeaderCell>IOB at End of Hour (U)</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iobData.map((dataPoint) => (
                  <TableRow key={dataPoint.timeLabel}>
                    <TableCell>{dataPoint.timeLabel}</TableCell>
                    <TableCell>{dataPoint.basalAmount.toFixed(2)}</TableCell>
                    <TableCell>{dataPoint.bolusAmount.toFixed(2)}</TableCell>
                    <TableCell>{dataPoint.totalIOB.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
