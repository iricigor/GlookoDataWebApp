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
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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
  chartContainer: {
    height: '400px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
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
    '& th': {
      textAlign: 'center',
    },
  },
  centeredCell: {
    textAlign: 'center',
  },
  centeredHeaderCell: {
    textAlign: 'center',
    '& > div': {
      justifyContent: 'center',
    },
  },
});

interface IOBReportProps {
  selectedFile?: UploadedFile;
  insulinDuration?: number;
}

// Custom tooltip component for the IOB chart
const CustomTooltip = ({ active, payload }: {
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

// Format X-axis labels (show every 3 hours)
const formatXAxis = (value: string) => {
  const hour = parseInt(value.split(':')[0]);
  const timeLabels: Record<number, string> = {
    0: '12A', 3: '3A', 6: '6A', 9: '9A',
    12: '12P', 15: '3P', 18: '6P', 21: '9P'
  };
  return timeLabels[hour] || '';
};

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
    // Note: selectedDate is intentionally not in the dependency array
    // It's only used to initialize currentDateIndex when data loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

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

      {/* IOB Graph */}
      {hourlyData.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
              
              <XAxis
                dataKey="timeLabel"
                tickFormatter={formatXAxis}
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
              
              <Tooltip content={<CustomTooltip />} />
              
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
      )}

      {/* Hourly IOB Data Table in Accordion */}
      {hourlyData.length > 0 && (
        <Accordion collapsible>
          <AccordionItem value="dataTable">
            <AccordionHeader>View Hourly Data Table</AccordionHeader>
            <AccordionPanel>
              <div className={styles.tableContainer}>
                <Table size="small">
                  <TableHeader className={styles.stickyHeader}>
                    <TableRow>
                      <TableHeaderCell className={styles.centeredHeaderCell}>Time</TableHeaderCell>
                      <TableHeaderCell className={styles.centeredHeaderCell}>Basal</TableHeaderCell>
                      <TableHeaderCell className={styles.centeredHeaderCell}>Bolus</TableHeaderCell>
                      <TableHeaderCell className={styles.centeredHeaderCell}>Active IOB</TableHeaderCell>
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
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
