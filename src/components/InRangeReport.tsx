/**
 * In-Range Report component
 * Displays glucose range statistics grouped by day of week and by date
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Switch,
  tokens,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import type { 
  UploadedFile, 
  GlucoseDataSource, 
  RangeCategoryMode,
  DayOfWeekReport,
  DailyReport,
  GlucoseReading,
} from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { groupByDayOfWeek, groupByDate, calculatePercentage } from '../utils/glucoseRangeUtils';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';

const useStyles = makeStyles({
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
  },
  controlLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '180px',
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

  useEffect(() => {
    if (!selectedFile) {
      setReadings([]);
      setDayOfWeekReports([]);
      setDailyReports([]);
      setError(null);
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
        } else {
          setReadings(glucoseReadings);
          setDayOfWeekReports(groupByDayOfWeek(glucoseReadings, thresholds, categoryMode));
          setDailyReports(groupByDate(glucoseReadings, thresholds, categoryMode));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setReadings([]);
        setDayOfWeekReports([]);
        setDailyReports([]);
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
    }
  }, [categoryMode, readings, thresholds]);

  const renderStatsRow = (
    label: string,
    stats: { veryLow?: number; low: number; inRange: number; high: number; veryHigh?: number; total: number }
  ) => {
    if (categoryMode === 5) {
      return (
        <TableRow key={label}>
          <TableCell>{label}</TableCell>
          <TableCell>{stats.veryLow ?? 0} ({calculatePercentage(stats.veryLow ?? 0, stats.total)}%)</TableCell>
          <TableCell>{stats.low} ({calculatePercentage(stats.low, stats.total)}%)</TableCell>
          <TableCell>{stats.inRange} ({calculatePercentage(stats.inRange, stats.total)}%)</TableCell>
          <TableCell>{stats.high} ({calculatePercentage(stats.high, stats.total)}%)</TableCell>
          <TableCell>{stats.veryHigh ?? 0} ({calculatePercentage(stats.veryHigh ?? 0, stats.total)}%)</TableCell>
          <TableCell>{stats.total}</TableCell>
        </TableRow>
      );
    } else {
      return (
        <TableRow key={label}>
          <TableCell>{label}</TableCell>
          <TableCell>{stats.low} ({calculatePercentage(stats.low, stats.total)}%)</TableCell>
          <TableCell>{stats.inRange} ({calculatePercentage(stats.inRange, stats.total)}%)</TableCell>
          <TableCell>{stats.high} ({calculatePercentage(stats.high, stats.total)}%)</TableCell>
          <TableCell>{stats.total}</TableCell>
        </TableRow>
      );
    }
  };

  if (!selectedFile) {
    return (
      <div className={styles.container}>
        <Text className={styles.noData}>
          No data package selected. Please select a valid ZIP file from the Data Upload page.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>Data Source:</Text>
          <Switch
            checked={dataSource === 'bg'}
            onChange={(_, data) => setDataSource(data.checked ? 'bg' : 'cgm')}
            label={dataSource === 'cgm' ? 'CGM Data' : 'BG Data'}
          />
        </div>
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>Category Mode:</Text>
          <Switch
            checked={categoryMode === 5}
            onChange={(_, data) => setCategoryMode(data.checked ? 5 : 3)}
            label={categoryMode === 3 ? '3 Categories (Low, In Range, High)' : '5 Categories (Very Low, Low, In Range, High, Very High)'}
          />
        </div>
      </div>

      {/* Loading/Error states */}
      {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
      {error && <Text className={styles.error}>{error}</Text>}

      {/* Day of Week Report */}
      {!loading && !error && dayOfWeekReports.length > 0 && (
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Glucose Range by Day of Week</Text>
          <div className={styles.tableContainer}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Day</TableHeaderCell>
                  {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                  <TableHeaderCell>Low</TableHeaderCell>
                  <TableHeaderCell>In Range</TableHeaderCell>
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
        </div>
      )}

      {/* Daily Report */}
      {!loading && !error && dailyReports.length > 0 && (
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Glucose Range by Date</Text>
          <div className={styles.tableContainer}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                  <TableHeaderCell>Low</TableHeaderCell>
                  <TableHeaderCell>In Range</TableHeaderCell>
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
        </div>
      )}
    </div>
  );
}
