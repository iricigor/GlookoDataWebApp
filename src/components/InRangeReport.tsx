/**
 * In-Range Report component
 * Displays glucose range statistics grouped by day of week and by date
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
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
  Card,
  TabList,
  Tab,
  Input,
} from '@fluentui/react-components';
import type { 
  UploadedFile, 
  GlucoseDataSource, 
  RangeCategoryMode,
  DayOfWeekReport,
  DailyReport,
  WeeklyReport,
  GlucoseReading,
  DailyInsulinSummary,
  GlucoseUnit,
} from '../types';
import type { ExportFormat } from '../hooks/useExportFormat';
import { extractGlucoseReadings } from '../utils/data';
import { extractInsulinReadings, aggregateInsulinByDate } from '../utils/data';
import { groupByDayOfWeek, groupByDate, groupByWeek, calculatePercentage, GLUCOSE_RANGE_COLORS } from '../utils/data';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { useDateRange } from '../hooks/useDateRange';
import { TableContainer } from './TableContainer';

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
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.8,
    },
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  summaryCard: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow2,
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
  datePickerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
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
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
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
  highlightedHeaderCell: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  highlightedCell: {
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface InRangeReportProps {
  selectedFile?: UploadedFile;
  exportFormat: ExportFormat;
  glucoseUnit: GlucoseUnit; // Added for future use, not implemented in display yet
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function InRangeReport({ selectedFile, exportFormat, glucoseUnit: _glucoseUnit }: InRangeReportProps) {
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
  const [insulinSummaries, setInsulinSummaries] = useState<DailyInsulinSummary[]>([]);
  const { 
    startDate, 
    endDate, 
    minDate, 
    maxDate, 
    setStartDate, 
    setEndDate, 
    setDateRange,
    clearDateRange
  } = useDateRange(selectedFile?.id);

  useEffect(() => {
    if (!selectedFile) {
      setReadings([]);
      setDayOfWeekReports([]);
      setDailyReports([]);
      setWeeklyReports([]);
      setInsulinSummaries([]);
      setError(null);
      clearDateRange();
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
          setInsulinSummaries([]);
          clearDateRange();
        } else {
          // Find min and max dates
          const timestamps = glucoseReadings.map(r => r.timestamp.getTime());
          const minTimestamp = Math.min(...timestamps);
          const maxTimestamp = Math.max(...timestamps);
          const minDateStr = new Date(minTimestamp).toISOString().split('T')[0];
          const maxDateStr = new Date(maxTimestamp).toISOString().split('T')[0];
          
          setReadings(glucoseReadings);
          
          // Set date range using the hook - it will use saved values if they exist
          // and are within the valid range, otherwise use min/max from data
          if (!minDate || !maxDate || minDate !== minDateStr || maxDate !== maxDateStr) {
            // Data range changed, update min/max and optionally preserve user selection if valid
            const currentStart = startDate || minDateStr;
            const currentEnd = endDate || maxDateStr;
            
            // Check if current selection is within new data range
            const isStartValid = currentStart >= minDateStr && currentStart <= maxDateStr;
            const isEndValid = currentEnd >= minDateStr && currentEnd <= maxDateStr;
            
            setDateRange(
              minDateStr,
              maxDateStr,
              isStartValid ? currentStart : minDateStr,
              isEndValid ? currentEnd : maxDateStr
            );
          }
          
          // Generate reports
          const dailyGlucoseReports = groupByDate(glucoseReadings, thresholds, categoryMode);
          setDayOfWeekReports(groupByDayOfWeek(glucoseReadings, thresholds, categoryMode));
          setWeeklyReports(groupByWeek(glucoseReadings, thresholds, categoryMode));
          
          // Extract and aggregate insulin data
          try {
            const insulinReadings = await extractInsulinReadings(selectedFile);
            const insulinData = aggregateInsulinByDate(insulinReadings);
            setInsulinSummaries(insulinData);
            
            // Merge insulin data with daily glucose reports
            const mergedDailyReports = dailyGlucoseReports.map(report => {
              const insulinForDate = insulinData.find(ins => ins.date === report.date);
              return {
                ...report,
                basalInsulin: insulinForDate?.basalTotal,
                bolusInsulin: insulinForDate?.bolusTotal,
                totalInsulin: insulinForDate?.totalInsulin,
              };
            });
            setDailyReports(mergedDailyReports);
          } catch (insulinErr) {
            // If insulin extraction fails, just use glucose reports without insulin data
            console.warn('Failed to extract insulin data:', insulinErr);
            setInsulinSummaries([]);
            setDailyReports(dailyGlucoseReports);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setReadings([]);
        setDayOfWeekReports([]);
        setDailyReports([]);
        setWeeklyReports([]);
        setInsulinSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource, thresholds, categoryMode, minDate, maxDate, startDate, endDate, setDateRange, clearDateRange]);

  // Recalculate stats when category mode changes
  useEffect(() => {
    if (readings.length > 0) {
      setDayOfWeekReports(groupByDayOfWeek(readings, thresholds, categoryMode));
      const dailyGlucoseReports = groupByDate(readings, thresholds, categoryMode);
      setWeeklyReports(groupByWeek(readings, thresholds, categoryMode));
      
      // Merge with insulin data
      const mergedDailyReports = dailyGlucoseReports.map(report => {
        const insulinForDate = insulinSummaries.find(ins => ins.date === report.date);
        return {
          ...report,
          basalInsulin: insulinForDate?.basalTotal,
          bolusInsulin: insulinForDate?.bolusTotal,
          totalInsulin: insulinForDate?.totalInsulin,
        };
      });
      setDailyReports(mergedDailyReports);
    }
  }, [categoryMode, readings, thresholds, insulinSummaries]);

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
      const dailyGlucoseReports = groupByDate(filteredReadings, thresholds, categoryMode);
      setWeeklyReports(groupByWeek(filteredReadings, thresholds, categoryMode));
      
      // Merge with insulin data
      const mergedDailyReports = dailyGlucoseReports.map(report => {
        const insulinForDate = insulinSummaries.find(ins => ins.date === report.date);
        return {
          ...report,
          basalInsulin: insulinForDate?.basalTotal,
          bolusInsulin: insulinForDate?.bolusTotal,
          totalInsulin: insulinForDate?.totalInsulin,
        };
      });
      setDailyReports(mergedDailyReports);
    }
  }, [startDate, endDate, readings, thresholds, categoryMode, insulinSummaries]);

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

  // Colors for glucose ranges (using shared constants)
  const getColorForCategory = (category: string): string => {
    switch (category) {
      case 'veryLow': return GLUCOSE_RANGE_COLORS.veryLow;
      case 'low': return GLUCOSE_RANGE_COLORS.low;
      case 'inRange': return GLUCOSE_RANGE_COLORS.inRange;
      case 'high': return GLUCOSE_RANGE_COLORS.high;
      case 'veryHigh': return GLUCOSE_RANGE_COLORS.veryHigh;
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

  // Render daily report row with insulin data
  const renderDailyReportRow = (report: DailyReport) => {
    // Get day of week from date
    const date = new Date(report.date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    
    if (categoryMode === 5) {
      return (
        <TableRow key={report.date}>
          <TableCell className={styles.highlightedCell}>{report.date}</TableCell>
          <TableCell className={styles.highlightedCell}>{dayOfWeek}</TableCell>
          <TableCell>{calculatePercentage(report.stats.veryLow ?? 0, report.stats.total)}% ({report.stats.veryLow ?? 0})</TableCell>
          <TableCell>{calculatePercentage(report.stats.low, report.stats.total)}% ({report.stats.low})</TableCell>
          <TableCell className={styles.inRangeCell}>{calculatePercentage(report.stats.inRange, report.stats.total)}% ({report.stats.inRange})</TableCell>
          <TableCell>{calculatePercentage(report.stats.high, report.stats.total)}% ({report.stats.high})</TableCell>
          <TableCell>{calculatePercentage(report.stats.veryHigh ?? 0, report.stats.total)}% ({report.stats.veryHigh ?? 0})</TableCell>
          <TableCell>{report.basalInsulin !== undefined ? report.basalInsulin : '-'}</TableCell>
          <TableCell>{report.bolusInsulin !== undefined ? report.bolusInsulin : '-'}</TableCell>
          <TableCell>{report.totalInsulin !== undefined ? report.totalInsulin : '-'}</TableCell>
        </TableRow>
      );
    } else {
      return (
        <TableRow key={report.date}>
          <TableCell className={styles.highlightedCell}>{report.date}</TableCell>
          <TableCell className={styles.highlightedCell}>{dayOfWeek}</TableCell>
          <TableCell>{calculatePercentage(report.stats.low, report.stats.total)}% ({report.stats.low})</TableCell>
          <TableCell className={styles.inRangeCell}>{calculatePercentage(report.stats.inRange, report.stats.total)}% ({report.stats.inRange})</TableCell>
          <TableCell>{calculatePercentage(report.stats.high, report.stats.total)}% ({report.stats.high})</TableCell>
          <TableCell>{report.basalInsulin !== undefined ? report.basalInsulin : '-'}</TableCell>
          <TableCell>{report.bolusInsulin !== undefined ? report.bolusInsulin : '-'}</TableCell>
          <TableCell>{report.totalInsulin !== undefined ? report.totalInsulin : '-'}</TableCell>
        </TableRow>
      );
    }
  };

  // Helper function to convert report data to CSV format
  const convertReportToCSV = (
    reports: Array<{ label: string; stats: { veryLow?: number; low: number; inRange: number; high: number; veryHigh?: number; total: number } }>,
    labelHeader: string
  ): (string | number)[][] => {
    const headers: (string | number)[] = [labelHeader];
    
    if (categoryMode === 5) {
      headers.push('Very Low', 'Low', 'In Range', 'High', 'Very High', 'Total');
    } else {
      headers.push('Low', 'In Range', 'High', 'Total');
    }
    
    const rows = reports.map(report => {
      const row: (string | number)[] = [report.label];
      
      if (categoryMode === 5) {
        row.push(
          `${calculatePercentage(report.stats.veryLow ?? 0, report.stats.total)}% (${report.stats.veryLow ?? 0})`,
          `${calculatePercentage(report.stats.low, report.stats.total)}% (${report.stats.low})`,
          `${calculatePercentage(report.stats.inRange, report.stats.total)}% (${report.stats.inRange})`,
          `${calculatePercentage(report.stats.high, report.stats.total)}% (${report.stats.high})`,
          `${calculatePercentage(report.stats.veryHigh ?? 0, report.stats.total)}% (${report.stats.veryHigh ?? 0})`,
          report.stats.total
        );
      } else {
        row.push(
          `${calculatePercentage(report.stats.low, report.stats.total)}% (${report.stats.low})`,
          `${calculatePercentage(report.stats.inRange, report.stats.total)}% (${report.stats.inRange})`,
          `${calculatePercentage(report.stats.high, report.stats.total)}% (${report.stats.high})`,
          report.stats.total
        );
      }
      
      return row;
    });
    
    return [headers, ...rows];
  };

  if (!selectedFile) {
    return (
      <div className={styles.reportContainer}>
        <Text className={styles.noData}>
          No data package selected. Please select a valid ZIP file from the Data Upload page.
        </Text>
      </div>
    );
  }

  // Calculate overall summary stats
  const summary = calculateOverallStats();
  
  return (
    <div className={styles.reportContainer}>
      {/* Loading/Error states */}
      {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
      {error && <Text className={styles.error}>{error}</Text>}
      
      <div className={styles.container}>
              {/* Summary bar and legend in Card */}
              {!loading && !error && dayOfWeekReports.length > 0 && (
                <Card className={styles.summaryCard}>
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

                  {/* Legend directly under summary bar */}
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
                </Card>
              )}

              {/* Controls */}
              <div className={styles.controls}>
                <div className={styles.controlRow}>
                  <Text className={styles.controlLabel}>Data Source:</Text>
                  <TabList
                    selectedValue={dataSource}
                    onTabSelect={(_, data) => setDataSource(data.value as GlucoseDataSource)}
                  >
                    <Tab value="cgm">CGM</Tab>
                    <Tab value="bg">BG</Tab>
                  </TabList>
                </div>
                <div className={styles.controlRow}>
                  <Text className={styles.controlLabel}>Categories:</Text>
                  <TabList
                    selectedValue={String(categoryMode)}
                    onTabSelect={(_, data) => setCategoryMode(Number(data.value) as RangeCategoryMode)}
                  >
                    <Tab value="3">3 Categories</Tab>
                    <Tab value="5">5 Categories</Tab>
                  </TabList>
                </div>
                {minDate && maxDate && (
                  <div className={styles.controlRow}>
                    <Text className={styles.controlLabel}>Date Range:</Text>
                    <div className={styles.datePickerGroup}>
                      <Input
                        type="date"
                        value={startDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        appearance="outline"
                      />
                      <Text>to</Text>
                      <Input
                        type="date"
                        value={endDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        appearance="outline"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Reports */}
              {!loading && !error && (dayOfWeekReports.length > 0 || weeklyReports.length > 0 || dailyReports.length > 0) && (
                <Accordion multiple collapsible defaultOpenItems={[]}>
                  {/* Day of Week Report */}
                  {dayOfWeekReports.length > 0 && (
                    <AccordionItem value="dayOfWeek">
                      <AccordionHeader>Glucose Range by Day of Week</AccordionHeader>
                      <AccordionPanel>
                        <TableContainer
                          data={convertReportToCSV(
                            dayOfWeekReports.map(r => ({ label: r.day, stats: r.stats })),
                            'Day'
                          )}
                          exportFormat={exportFormat}
                          fileName="glucose-range-by-day-of-week"
                          copyAriaLabel={`Copy glucose range by day of week as ${exportFormat.toUpperCase()}`}
                          downloadAriaLabel={`Download glucose range by day of week as ${exportFormat.toUpperCase()}`}
                        >
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell className={styles.highlightedHeaderCell}>Day</TableHeaderCell>
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
                        </TableContainer>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Weekly Report */}
                  {weeklyReports.length > 0 && (
                    <AccordionItem value="weekly">
                      <AccordionHeader>Glucose Range by Week</AccordionHeader>
                      <AccordionPanel>
                        <TableContainer
                          data={convertReportToCSV(
                            weeklyReports.map(r => ({ label: r.weekLabel, stats: r.stats })),
                            'Week'
                          )}
                          exportFormat={exportFormat}
                          fileName="glucose-range-by-week"
                          copyAriaLabel={`Copy glucose range by week as ${exportFormat.toUpperCase()}`}
                          downloadAriaLabel={`Download glucose range by week as ${exportFormat.toUpperCase()}`}
                        >
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell className={styles.highlightedHeaderCell}>Week</TableHeaderCell>
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
                        </TableContainer>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Daily Report */}
                  {dailyReports.length > 0 && (
                    <AccordionItem value="daily">
                      <AccordionHeader>Glucose Range by Date</AccordionHeader>
                      <AccordionPanel>
                        <TableContainer
                          data={convertReportToCSV(
                            dailyReports.map(r => ({ label: r.date, stats: r.stats })),
                            'Date'
                          )}
                          exportFormat={exportFormat}
                          fileName="glucose-range-by-date"
                          copyAriaLabel={`Copy glucose range by date as ${exportFormat.toUpperCase()}`}
                          downloadAriaLabel={`Download glucose range by date as ${exportFormat.toUpperCase()}`}
                          scrollable
                        >
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell className={styles.highlightedHeaderCell}>Date</TableHeaderCell>
                                <TableHeaderCell className={styles.highlightedHeaderCell}>Day of Week</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                                <TableHeaderCell>Low</TableHeaderCell>
                                <TableHeaderCell className={styles.inRangeHeader}>In Range</TableHeaderCell>
                                <TableHeaderCell>High</TableHeaderCell>
                                {categoryMode === 5 && <TableHeaderCell>Very High</TableHeaderCell>}
                                <TableHeaderCell>Basal Insulin (Units)</TableHeaderCell>
                                <TableHeaderCell>Bolus Insulin (Units)</TableHeaderCell>
                                <TableHeaderCell>Total Insulin (Units)</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dailyReports.map(report => renderDailyReportRow(report))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionPanel>
                    </AccordionItem>
                  )}
                </Accordion>
              )}
            </div>
    </div>
  );
}
