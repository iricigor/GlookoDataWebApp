/**
 * In-Range Report component
 * Displays glucose range statistics grouped by day of week and by date
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
} from '@fluentui/react-components';
import type { 
  UploadedFile, 
  GlucoseDataSource, 
  RangeCategoryMode,
  DayOfWeekReport,
  DailyReport,
  WeeklyReport,
  GlucoseReading,
} from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { groupByDayOfWeek, groupByDate, groupByWeek, calculatePercentage } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';

const useStyles = makeStyles({
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryBar: {
    display: 'flex',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  summarySegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.transition('all', '0.2s'),
    '&:hover': {
      opacity: 0.8,
    },
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
  dateInputGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  dateInput: {
    fontSize: tokens.fontSizeBase300,
    ...shorthands.padding('6px', '8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  tableContainer: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
  },
  summaryLegend: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '0'),
    marginTop: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  legendColor: {
    width: '20px',
    height: '20px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  legendText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  loading: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  noData: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
  inRangeCell: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  inRangeHeader: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
});

interface InRangeReportProps {
  selectedFile?: UploadedFile;
}

export function InRangeReport({ selectedFile }: InRangeReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();

  const [dataSource, setDataSource] = useState<GlucoseDataSource>('cgm');
  const [categoryMode, setCategoryMode] = useState<RangeCategoryMode>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [dayOfWeekReports, setDayOfWeekReports] = useState<DayOfWeekReport[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  useEffect(() => {
    if (!selectedFile) {
      setReadings([]);
      setDayOfWeekReports([]);
      setDailyReports([]);
      setWeeklyReports([]);
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
          setReadings([]);
          setDayOfWeekReports([]);
          setDailyReports([]);
          setWeeklyReports([]);
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
          
          setReadings(glucoseReadings);
          setMinDate(minDateStr);
          setMaxDate(maxDateStr);
          setStartDate(minDateStr);
          setEndDate(maxDateStr);
          
          setDayOfWeekReports(groupByDayOfWeek(glucoseReadings, thresholds, categoryMode));
          setDailyReports(groupByDate(glucoseReadings, thresholds, categoryMode));
          setWeeklyReports(groupByWeek(glucoseReadings, thresholds, categoryMode));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setReadings([]);
        setDayOfWeekReports([]);
        setDailyReports([]);
        setWeeklyReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource, thresholds, categoryMode]);

  // Recalculate stats when category mode changes
  useEffect(() => {
    if (readings.length > 0) {
      setDayOfWeekReports(groupByDayOfWeek(readings, thresholds, categoryMode));
      setDailyReports(groupByDate(readings, thresholds, categoryMode));
      setWeeklyReports(groupByWeek(readings, thresholds, categoryMode));
    }
  }, [categoryMode, readings, thresholds]);

  // Filter readings by date range
  useEffect(() => {
    if (readings.length > 0 && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filteredReadings = readings.filter(r => {
        const timestamp = r.timestamp.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
      });
      
      setDayOfWeekReports(groupByDayOfWeek(filteredReadings, thresholds, categoryMode));
      setDailyReports(groupByDate(filteredReadings, thresholds, categoryMode));
      setWeeklyReports(groupByWeek(filteredReadings, thresholds, categoryMode));
    }
  }, [startDate, endDate, readings, thresholds, categoryMode]);

  // Calculate overall summary stats
  const calculateOverallStats = () => {
    if (!dayOfWeekReports || dayOfWeekReports.length === 0) {
      return categoryMode === 5
        ? { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, total: 0 }
        : { low: 0, inRange: 0, high: 0, total: 0 };
    }

    const totals = {
      veryLow: 0,
      low: 0,
      inRange: 0,
      high: 0,
      veryHigh: 0,
      total: 0,
    };

    // Sum up all readings (excluding Workday and Weekend aggregations)
    dayOfWeekReports
      .filter(r => r.day !== 'Workday' && r.day !== 'Weekend')
      .forEach(report => {
        totals.low += report.stats.low;
        totals.inRange += report.stats.inRange;
        totals.high += report.stats.high;
        totals.total += report.stats.total;
        if (categoryMode === 5) {
          totals.veryLow += report.stats.veryLow ?? 0;
          totals.veryHigh += report.stats.veryHigh ?? 0;
        }
      });

    return totals;
  };

  // Colors for glucose ranges (matching Glooko style)
  const getColorForCategory = (category: string): string => {
    switch (category) {
      case 'veryLow': return '#8B0000'; // Dark red
      case 'low': return '#D32F2F'; // Red
      case 'inRange': return '#4CAF50'; // Green
      case 'high': return '#FFB300'; // Amber/Orange
      case 'veryHigh': return '#FF6F00'; // Dark orange
      default: return tokens.colorNeutralForeground1;
    }
  };

  const renderStatsRow = (
    label: string,
    stats: { veryLow?: number; low: number; inRange: number; high: number; veryHigh?: number; total: number }
  ) => {
    if (categoryMode === 5) {
      return (
        <TableRow key={label}>
          <TableCell>{label}</TableCell>
          <TableCell>{calculatePercentage(stats.veryLow ?? 0, stats.total)}% ({stats.veryLow ?? 0})</TableCell>
          <TableCell>{calculatePercentage(stats.low, stats.total)}% ({stats.low})</TableCell>
          <TableCell className={styles.inRangeCell}>{calculatePercentage(stats.inRange, stats.total)}% ({stats.inRange})</TableCell>
          <TableCell>{calculatePercentage(stats.high, stats.total)}% ({stats.high})</TableCell>
          <TableCell>{calculatePercentage(stats.veryHigh ?? 0, stats.total)}% ({stats.veryHigh ?? 0})</TableCell>
          <TableCell>{stats.total}</TableCell>
        </TableRow>
      );
    } else {
      return (
        <TableRow key={label}>
          <TableCell>{label}</TableCell>
          <TableCell>{calculatePercentage(stats.low, stats.total)}% ({stats.low})</TableCell>
          <TableCell className={styles.inRangeCell}>{calculatePercentage(stats.inRange, stats.total)}% ({stats.inRange})</TableCell>
          <TableCell>{calculatePercentage(stats.high, stats.total)}% ({stats.high})</TableCell>
          <TableCell>{stats.total}</TableCell>
        </TableRow>
      );
    }
  };

  if (!selectedFile) {
    return (
      <div className={styles.reportContainer}>
        <Accordion collapsible>
          <AccordionItem value="inRange">
            <AccordionHeader>
              <Text className={styles.reportTitle}>In Range</Text>
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

  // Calculate overall summary stats
  const summary = calculateOverallStats();
  
  return (
    <div className={styles.reportContainer}>
      <Accordion collapsible>
        <AccordionItem value="inRange">
          <AccordionHeader>
            <div className={styles.reportHeader}>
              <Text className={styles.reportTitle}>In Range</Text>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            {/* Loading/Error states */}
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
                  <Text className={styles.controlLabel}>Categories:</Text>
                  <div className={styles.buttonGroup}>
                    <Button
                      appearance={categoryMode === 3 ? 'primary' : 'secondary'}
                      onClick={() => setCategoryMode(3)}
                    >
                      3 Categories
                    </Button>
                    <Button
                      appearance={categoryMode === 5 ? 'primary' : 'secondary'}
                      onClick={() => setCategoryMode(5)}
                    >
                      5 Categories
                    </Button>
                  </div>
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

              {/* Summary Legend (collapsible) */}
              {!loading && !error && dayOfWeekReports.length > 0 && (
                <Accordion collapsible>
                  <AccordionItem value="legend">
                    <AccordionHeader>Summary Legend</AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.summaryLegend}>
                        {categoryMode === 5 && (
                          <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: getColorForCategory('veryLow') }} />
                            <Text className={styles.legendText}>
                              Very Low: {calculatePercentage(summary.veryLow ?? 0, summary.total)}% ({summary.veryLow ?? 0})
                            </Text>
                          </div>
                        )}
                        <div className={styles.legendItem}>
                          <div className={styles.legendColor} style={{ backgroundColor: getColorForCategory('low') }} />
                          <Text className={styles.legendText}>
                            Low: {calculatePercentage(summary.low, summary.total)}% ({summary.low})
                          </Text>
                        </div>
                        <div className={styles.legendItem}>
                          <div className={styles.legendColor} style={{ backgroundColor: getColorForCategory('inRange') }} />
                          <Text className={styles.legendText} style={{ fontWeight: tokens.fontWeightBold }}>
                            In Range: {calculatePercentage(summary.inRange, summary.total)}% ({summary.inRange})
                          </Text>
                        </div>
                        <div className={styles.legendItem}>
                          <div className={styles.legendColor} style={{ backgroundColor: getColorForCategory('high') }} />
                          <Text className={styles.legendText}>
                            High: {calculatePercentage(summary.high, summary.total)}% ({summary.high})
                          </Text>
                        </div>
                        {categoryMode === 5 && (
                          <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: getColorForCategory('veryHigh') }} />
                            <Text className={styles.legendText}>
                              Very High: {calculatePercentage(summary.veryHigh ?? 0, summary.total)}% ({summary.veryHigh ?? 0})
                            </Text>
                          </div>
                        )}
                        <div className={styles.legendItem}>
                          <Text className={styles.legendText} style={{ fontWeight: tokens.fontWeightSemibold }}>
                            Total Readings: {summary.total}
                          </Text>
                        </div>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Collapsible Reports */}
              {!loading && !error && (dayOfWeekReports.length > 0 || weeklyReports.length > 0 || dailyReports.length > 0) && (
                <Accordion multiple collapsible defaultOpenItems={[]}>
                  {/* Day of Week Report */}
                  {dayOfWeekReports.length > 0 && (
                    <AccordionItem value="dayOfWeek">
                      <AccordionHeader>Glucose Range by Day of Week</AccordionHeader>
                      <AccordionPanel>
                        <div className={styles.tableContainer}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Day</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                                <TableHeaderCell>Low</TableHeaderCell>
                                <TableHeaderCell className={styles.inRangeHeader}>In Range</TableHeaderCell>
                                <TableHeaderCell>High</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very High</TableHeaderCell>}
                                <TableHeaderCell>Total</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dayOfWeekReports.map(report => renderStatsRow(report.day, report.stats))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Weekly Report */}
                  {weeklyReports.length > 0 && (
                    <AccordionItem value="weekly">
                      <AccordionHeader>Glucose Range by Week</AccordionHeader>
                      <AccordionPanel>
                        <div className={styles.tableContainer}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Week</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                                <TableHeaderCell>Low</TableHeaderCell>
                                <TableHeaderCell className={styles.inRangeHeader}>In Range</TableHeaderCell>
                                <TableHeaderCell>High</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very High</TableHeaderCell>}
                                <TableHeaderCell>Total</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {weeklyReports.map(report => renderStatsRow(report.weekLabel, report.stats))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Daily Report */}
                  {dailyReports.length > 0 && (
                    <AccordionItem value="daily">
                      <AccordionHeader>Glucose Range by Date</AccordionHeader>
                      <AccordionPanel>
                        <div className={styles.tableContainer}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Date</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                                <TableHeaderCell>Low</TableHeaderCell>
                                <TableHeaderCell className={styles.inRangeHeader}>In Range</TableHeaderCell>
                                <TableHeaderCell>High</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very High</TableHeaderCell>}
                                <TableHeaderCell>Total</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dailyReports.map(report => renderStatsRow(report.date, report.stats))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  )}
                </Accordion>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      
      {/* Summary bar visible outside accordion */}
      {!loading && !error && dayOfWeekReports.length > 0 && (
        <div className={styles.summaryBar}>
          {categoryMode === 5 && (summary.veryLow ?? 0) > 0 && (
            <div
              className={styles.summarySegment}
              style={{
                width: `${calculatePercentage(summary.veryLow ?? 0, summary.total)}%`,
                backgroundColor: getColorForCategory('veryLow'),
              }}
              title={`Very Low: ${calculatePercentage(summary.veryLow ?? 0, summary.total)}%`}
            >
              {calculatePercentage(summary.veryLow ?? 0, summary.total) >= 5 && `${calculatePercentage(summary.veryLow ?? 0, summary.total)}%`}
            </div>
          )}
          {summary.low > 0 && (
            <div
              className={styles.summarySegment}
              style={{
                width: `${calculatePercentage(summary.low, summary.total)}%`,
                backgroundColor: getColorForCategory('low'),
              }}
              title={`Low: ${calculatePercentage(summary.low, summary.total)}%`}
            >
              {calculatePercentage(summary.low, summary.total) >= 5 && `${calculatePercentage(summary.low, summary.total)}%`}
            </div>
          )}
          {summary.inRange > 0 && (
            <div
              className={styles.summarySegment}
              style={{
                width: `${calculatePercentage(summary.inRange, summary.total)}%`,
                backgroundColor: getColorForCategory('inRange'),
              }}
              title={`In Range: ${calculatePercentage(summary.inRange, summary.total)}%`}
            >
              {calculatePercentage(summary.inRange, summary.total) >= 5 && `${calculatePercentage(summary.inRange, summary.total)}%`}
            </div>
          )}
          {summary.high > 0 && (
            <div
              className={styles.summarySegment}
              style={{
                width: `${calculatePercentage(summary.high, summary.total)}%`,
                backgroundColor: getColorForCategory('high'),
              }}
              title={`High: ${calculatePercentage(summary.high, summary.total)}%`}
            >
              {calculatePercentage(summary.high, summary.total) >= 5 && `${calculatePercentage(summary.high, summary.total)}%`}
            </div>
          )}
          {categoryMode === 5 && (summary.veryHigh ?? 0) > 0 && (
            <div
              className={styles.summarySegment}
              style={{
                width: `${calculatePercentage(summary.veryHigh ?? 0, summary.total)}%`,
                backgroundColor: getColorForCategory('veryHigh'),
              }}
              title={`Very High: ${calculatePercentage(summary.veryHigh ?? 0, summary.total)}%`}
            >
              {calculatePercentage(summary.veryHigh ?? 0, summary.total) >= 5 && `${calculatePercentage(summary.veryHigh ?? 0, summary.total)}%`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
