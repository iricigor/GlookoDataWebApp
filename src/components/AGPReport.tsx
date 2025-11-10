/**
 * AGP (Ambulatory Glucose Profile) Report component
 * Displays glucose statistics for each 5-minute period throughout the day
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
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
  Dropdown,
  Option,
} from '@fluentui/react-components';
import type { UploadedFile, GlucoseDataSource, AGPTimeSlotStats, AGPDayOfWeekFilter, GlucoseReading } from '../types';
import type { ExportFormat } from '../utils/csvUtils';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { calculateAGPStats, filterReadingsByDayOfWeek } from '../utils/agpUtils';
import { AGPGraph } from './AGPGraph';
import { CopyToCsvButton } from './CopyToCsvButton';

const useStyles = makeStyles({
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('visible'),
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  controlLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '140px',
  },
  buttonGroup: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  tableContainer: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    maxHeight: '600px',
    overflowY: 'auto',
    position: 'relative',
    '&:hover .csv-button': {
      opacity: 1,
    },
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 1,
    textAlign: 'center',
    '::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: tokens.colorNeutralStroke1,
    },
  },
  tableCell: {
    verticalAlign: 'middle',
  },
  noData: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
  loading: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  timeCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'monospace',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  valueCell: {
    textAlign: 'center',
    fontFamily: 'monospace',
    verticalAlign: 'middle',
  },
  countCell: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    verticalAlign: 'middle',
  },
  info: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('12px', '0'),
  },
  dropdown: {
    minWidth: '160px',
  },
  dateInput: {
    fontSize: tokens.fontSizeBase300,
    ...shorthands.padding('6px', '8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  dateInputGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  csvButton: {
    position: 'sticky',
    top: '8px',
    right: '8px',
    opacity: 0,
    ...shorthands.transition('opacity', '0.2s'),
    zIndex: 10,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    boxShadow: tokens.shadow4,
    float: 'right',
    marginRight: '8px',
    marginTop: '8px',
  },
});

interface AGPReportProps {
  selectedFile?: UploadedFile;
  exportFormat: ExportFormat;
}

export function AGPReport({ selectedFile, exportFormat }: AGPReportProps) {
  const styles = useStyles();

  const [dataSource, setDataSource] = useState<GlucoseDataSource>('cgm');
  const [dayFilter, setDayFilter] = useState<AGPDayOfWeekFilter>('All Days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agpStats, setAgpStats] = useState<AGPTimeSlotStats[]>([]);
  const [allReadings, setAllReadings] = useState<GlucoseReading[]>([]);

  useEffect(() => {
    if (!selectedFile) {
      setAgpStats([]);
      setAllReadings([]);
      setError(null);
      setStartDate('');
      setEndDate('');
      setMinDate('');
      setMaxDate('');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const glucoseReadings = await extractGlucoseReadings(selectedFile, dataSource);
        
        if (glucoseReadings.length === 0) {
          setError(`No ${dataSource.toUpperCase()} data found in the selected file`);
          setAgpStats([]);
          setAllReadings([]);
          setStartDate('');
          setEndDate('');
          setMinDate('');
          setMaxDate('');
        } else {
          // Find min and max dates
          const timestamps = glucoseReadings.map(r => r.timestamp.getTime());
          const minTimestamp = Math.min(...timestamps);
          const maxTimestamp = Math.max(...timestamps);
          const minDateStr = new Date(minTimestamp).toISOString().split('T')[0];
          const maxDateStr = new Date(maxTimestamp).toISOString().split('T')[0];
          
          setAllReadings(glucoseReadings);
          setMinDate(minDateStr);
          setMaxDate(maxDateStr);
          setStartDate(minDateStr);
          setEndDate(maxDateStr);
          
          // Apply day-of-week filter
          const filteredReadings = filterReadingsByDayOfWeek(glucoseReadings, dayFilter);
          
          if (filteredReadings.length === 0) {
            setError('No data matches the selected filters');
            setAgpStats([]);
          } else {
            const stats = calculateAGPStats(filteredReadings);
            setAgpStats(stats);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setAgpStats([]);
        setAllReadings([]);
        setStartDate('');
        setEndDate('');
        setMinDate('');
        setMaxDate('');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource, dayFilter]);

  // Filter readings by date range
  useEffect(() => {
    if (allReadings.length > 0 && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filteredByDate = allReadings.filter(r => {
        const timestamp = r.timestamp.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
      });
      
      // Apply day-of-week filter to date-filtered readings
      const filteredReadings = filterReadingsByDayOfWeek(filteredByDate, dayFilter);
      
      if (filteredReadings.length === 0) {
        setError('No data matches the selected filters');
        setAgpStats([]);
      } else {
        setError(null);
        const stats = calculateAGPStats(filteredReadings);
        setAgpStats(stats);
      }
    }
  }, [startDate, endDate, allReadings, dayFilter]);

  const formatValue = (value: number): string => {
    if (value === 0) return '-';
    return value.toFixed(1);
  };

  // Filter out time slots with no data
  const statsWithData = agpStats.filter(stat => stat.count > 0);

  // Day of week filter options
  const dayOfWeekOptions: AGPDayOfWeekFilter[] = [
    'All Days',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Workday',
    'Weekend',
  ];

  // Helper function to convert AGP stats to CSV format
  const convertAGPStatsToCSV = (stats: AGPTimeSlotStats[]): (string | number)[][] => {
    const headers = ['Time', 'Lowest', '10%', '25%', '50% (Median)', '75%', '90%', 'Highest', 'Count'];
    const rows = stats.map(stat => [
      stat.timeSlot,
      formatValue(stat.lowest),
      formatValue(stat.p10),
      formatValue(stat.p25),
      formatValue(stat.p50),
      formatValue(stat.p75),
      formatValue(stat.p90),
      formatValue(stat.highest),
      stat.count,
    ]);
    return [headers, ...rows];
  };

  if (!selectedFile) {
    return (
      <div className={styles.reportContainer}>
        <Accordion collapsible>
          <AccordionItem value="agp">
            <AccordionHeader>
              <Text className={styles.reportTitle}>AGP Data</Text>
            </AccordionHeader>
            <AccordionPanel>
              <Text className={styles.noData}>
                No data package selected. Please select a valid ZIP file from the Data Upload page.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return (
    <div className={styles.reportContainer}>
      <Accordion collapsible>
        <AccordionItem value="agp">
          <AccordionHeader>
            <Text className={styles.reportTitle}>AGP Data</Text>
          </AccordionHeader>
          <AccordionPanel>
            {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
            {error && <Text className={styles.error}>{error}</Text>}

            <div className={styles.container}>
              {/* Controls */}
              <div className={styles.controls}>
                <div className={styles.controlRow}>
                  <Text className={styles.controlLabel}>Data Source:</Text>
                  <div className={styles.buttonGroup}>
                    <Button
                      appearance={dataSource === 'cgm' ? 'primary' : 'secondary'}
                      onClick={() => setDataSource('cgm')}
                    >
                      CGM
                    </Button>
                    <Button
                      appearance={dataSource === 'bg' ? 'primary' : 'secondary'}
                      onClick={() => setDataSource('bg')}
                    >
                      BG
                    </Button>
                  </div>
                </div>
                <div className={styles.controlRow}>
                  <Text className={styles.controlLabel}>Day of Week:</Text>
                  <Dropdown
                    className={styles.dropdown}
                    value={dayFilter}
                    selectedOptions={[dayFilter]}
                    onOptionSelect={(_, data) => setDayFilter(data.optionValue as AGPDayOfWeekFilter)}
                    positioning="below-start"
                  >
                    {dayOfWeekOptions.map(day => (
                      <Option key={day} value={day}>
                        {day}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
                {minDate && maxDate && (
                  <div className={styles.controlRow}>
                    <Text className={styles.controlLabel}>Date Range:</Text>
                    <div className={styles.dateInputGroup}>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={startDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Text>to</Text>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={endDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AGP Graph */}
              {!loading && !error && statsWithData.length > 0 && (
                <AGPGraph data={agpStats} />
              )}

              {/* Info text */}
              {!loading && !error && statsWithData.length > 0 && (
                <Text className={styles.info}>
                  Showing statistics for {statsWithData.length} time periods with data. 
                  All values are in mmol/L. Percentiles are calculated across all days for each 5-minute time slot.
                </Text>
              )}

              {/* AGP Table */}
              {!loading && !error && statsWithData.length > 0 && (
                <div className={styles.tableContainer}>
                  <div className={`${styles.csvButton} csv-button`}>
                    <CopyToCsvButton 
                      data={convertAGPStatsToCSV(statsWithData)}
                      format={exportFormat}
                      ariaLabel={`Copy AGP data as ${exportFormat.toUpperCase()}`}
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={styles.stickyHeader}>Time</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>Lowest</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>10%</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>25%</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>50% (Median)</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>75%</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>90%</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>Highest</TableHeaderCell>
                        <TableHeaderCell className={styles.stickyHeader}>Count</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsWithData.map((stat) => (
                        <TableRow key={stat.timeSlot}>
                          <TableCell className={styles.timeCell}>{stat.timeSlot}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.lowest)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p10)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p25)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p50)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p75)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p90)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.highest)}</TableCell>
                          <TableCell className={styles.countCell}>{stat.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && !error && statsWithData.length === 0 && (
                <Text className={styles.noData}>
                  No glucose data available for the selected data source.
                </Text>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
