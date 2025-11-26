/**
 * BG Overview Report Component
 * Unified view combining Time in Range and AGP reports with modern Fluent UI design
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  tokens,
  shorthands,
  Card,
  Button,
  Dropdown,
  Option,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Tooltip,
} from '@fluentui/react-components';
import {
  CalendarRegular,
  BriefcaseRegular,
  HomeRegular,
  CheckmarkCircleRegular,
  DataLineRegular,
  FilterRegular,
} from '@fluentui/react-icons';
import type { 
  UploadedFile, 
  GlucoseDataSource, 
  RangeCategoryMode,
  GlucoseReading,
  AGPTimeSlotStats,
  AGPDayOfWeekFilter,
  GlucoseUnit,
  DayOfWeekReport,
  WeeklyReport,
  TimePeriodTIRStats,
  HourlyTIRStats,
} from '../types';
import { extractGlucoseReadings, groupByWeek, displayGlucoseValue, getUnitLabel } from '../utils/data';
import { groupByDayOfWeek, calculatePercentage, GLUCOSE_RANGE_COLORS, calculateTIRByTimePeriods, calculateHourlyTIR, MIN_PERCENTAGE_FOR_PERIOD_BAR } from '../utils/data';
import { calculateAGPStats, filterReadingsByDayOfWeek } from '../utils/visualization';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { useDateRange } from '../hooks/useDateRange';
import { AGPGraph } from './AGPGraph';
import { DateRangePicker } from './shared/DateRangePicker';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  controlBar: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow4,
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    flexWrap: 'wrap',
  },
  controlLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '120px',
  },
  pillGroup: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  pillButton: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    minWidth: '100px',
  },
  datePickerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  tirCard: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  cardIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  tirBarContainer: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  tirBar: {
    display: 'flex',
    height: '48px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow2,
  },
  tirSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.85,
      transform: 'scale(1.02)',
    },
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    ...shorthands.gap('8px'),
    marginTop: '4px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginRight: '4px',
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  targetInfo: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorBrandBackground2,
    marginTop: '8px',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
  agpCard: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  accordion: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '0'),
  },
  linkButton: {
    justifyContent: 'flex-start',
  },
  loading: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center',
    ...shorthands.padding('24px'),
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center',
    ...shorthands.padding('24px'),
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
  tableSection: {
    marginTop: '16px',
  },
  periodBarsContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '8px',
  },
  periodBarRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  periodLabel: {
    minWidth: '70px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  periodBarWrapper: {
    flex: 1,
  },
  periodBar: {
    display: 'flex',
    height: '32px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  periodSegment: {
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
      opacity: 0.85,
    },
  },
  hourlyChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    marginTop: '8px',
  },
  hourlyChartRow: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap('2px'),
  },
  hourlyBar: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: '20px',
    maxWidth: '60px',
    height: '180px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall, tokens.borderRadiusSmall, '0', '0'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.9,
      transform: 'scaleY(1.02)',
    },
  },
  hourlySegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    minHeight: '0',
  },
  hourlyLabels: {
    display: 'flex',
    ...shorthands.gap('2px'),
  },
  hourlyLabel: {
    flex: 1,
    minWidth: '20px',
    maxWidth: '60px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    paddingTop: '4px',
  },
  chartDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    paddingTop: '8px',
  },
  filterIcon: {
    color: tokens.colorBrandForeground1,
    marginLeft: '8px',
    fontSize: '16px',
  },
  accordionHeaderContent: {
    display: 'flex',
    alignItems: 'center',
  },
});

interface BGOverviewReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
}

export function BGOverviewReport({ selectedFile, glucoseUnit }: BGOverviewReportProps) {
  const styles = useStyles();
  const { thresholds } = useGlucoseThresholds();

  // State for filters
  const [dataSource, setDataSource] = useState<GlucoseDataSource>('cgm');
  const [categoryMode, setCategoryMode] = useState<RangeCategoryMode>(3);
  const [dayFilter, setDayFilter] = useState<AGPDayOfWeekFilter>('All Days');
  
  // State for data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [agpStats, setAgpStats] = useState<AGPTimeSlotStats[]>([]);
  const [dayOfWeekReports, setDayOfWeekReports] = useState<DayOfWeekReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [periodStats, setPeriodStats] = useState<TimePeriodTIRStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyTIRStats[]>([]);

  // Date range management
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

  // Load data when file or filters change
  useEffect(() => {
    if (!selectedFile) {
      setReadings([]);
      setAgpStats([]);
      setError(null);
      setPeriodStats([]);
      setHourlyStats([]);
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
          setAgpStats([]);
          setDayOfWeekReports([]);
          setWeeklyReports([]);
          setPeriodStats([]);
          setHourlyStats([]);
          clearDateRange();
        } else {
          // Find min and max dates
          const timestamps = glucoseReadings.map(r => r.timestamp.getTime());
          const minTimestamp = Math.min(...timestamps);
          const maxTimestamp = Math.max(...timestamps);
          const minDateStr = new Date(minTimestamp).toISOString().split('T')[0];
          const maxDateStr = new Date(maxTimestamp).toISOString().split('T')[0];
          
          setReadings(glucoseReadings);
          
          // Set date range using the hook
          if (!minDate || !maxDate || minDate !== minDateStr || maxDate !== maxDateStr) {
            const currentStart = startDate || minDateStr;
            const currentEnd = endDate || maxDateStr;
            
            const isStartValid = currentStart >= minDateStr && currentStart <= maxDateStr;
            const isEndValid = currentEnd >= minDateStr && currentEnd <= maxDateStr;
            
            setDateRange(
              minDateStr,
              maxDateStr,
              isStartValid ? currentStart : minDateStr,
              isEndValid ? currentEnd : maxDateStr
            );
          }
          
          // Calculate AGP stats with filters
          const filteredReadings = filterReadingsByDayOfWeek(glucoseReadings, dayFilter);
          const stats = calculateAGPStats(filteredReadings);
          setAgpStats(stats);
          
          // Calculate day of week and weekly reports
          setDayOfWeekReports(groupByDayOfWeek(glucoseReadings, thresholds, categoryMode));
          setWeeklyReports(groupByWeek(glucoseReadings, thresholds, categoryMode));
          
          // Calculate period-based TIR and hourly TIR (apply day filter)
          setPeriodStats(calculateTIRByTimePeriods(filteredReadings, thresholds, categoryMode));
          setHourlyStats(calculateHourlyTIR(filteredReadings, thresholds, categoryMode));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setReadings([]);
        setAgpStats([]);
        setDayOfWeekReports([]);
        setWeeklyReports([]);
        setPeriodStats([]);
        setHourlyStats([]);
        clearDateRange();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource, dayFilter, minDate, maxDate, startDate, endDate, setDateRange, clearDateRange, thresholds, categoryMode]);

  // Recalculate AGP stats when date range changes
  useEffect(() => {
    if (readings.length > 0 && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filteredByDate = readings.filter(r => {
        const timestamp = r.timestamp.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
      });
      
      const filteredReadings = filterReadingsByDayOfWeek(filteredByDate, dayFilter);
      
      if (filteredReadings.length === 0) {
        setError('No data matches the selected filters');
        setAgpStats([]);
        setDayOfWeekReports([]);
        setWeeklyReports([]);
        setPeriodStats([]);
        setHourlyStats([]);
      } else {
        setError(null);
        const stats = calculateAGPStats(filteredReadings);
        setAgpStats(stats);
        
        // Recalculate day of week and weekly reports with filtered data
        setDayOfWeekReports(groupByDayOfWeek(filteredByDate, thresholds, categoryMode));
        setWeeklyReports(groupByWeek(filteredByDate, thresholds, categoryMode));
        
        // Recalculate period-based TIR and hourly TIR with day filter applied
        setPeriodStats(calculateTIRByTimePeriods(filteredReadings, thresholds, categoryMode, end));
        setHourlyStats(calculateHourlyTIR(filteredReadings, thresholds, categoryMode));
      }
    }
  }, [startDate, endDate, readings, dayFilter, thresholds, categoryMode]);

  // Calculate TIR statistics
  const calculateTIRStats = () => {
    if (readings.length === 0) {
      return categoryMode === 5
        ? { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, total: 0 }
        : { low: 0, inRange: 0, high: 0, total: 0 };
    }

    // Filter by date range and day of week
    let filteredReadings = readings;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filteredReadings = readings.filter(r => {
        const timestamp = r.timestamp.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
      });
    }

    filteredReadings = filterReadingsByDayOfWeek(filteredReadings, dayFilter);

    const dayOfWeekReports = groupByDayOfWeek(filteredReadings, thresholds, categoryMode);

    const totals = {
      veryLow: 0,
      low: 0,
      inRange: 0,
      high: 0,
      veryHigh: 0,
      total: 0,
    };

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

  // Helper function to format tooltip content for hourly TIR
  const formatHourlyTooltipContent = (
    hourLabel: string,
    stats: { veryLow?: number; low: number; inRange: number; high: number; veryHigh?: number; total: number }
  ): string => {
    const total = stats.total;
    const lowPct = calculatePercentage(stats.low, total);
    const inRangePct = calculatePercentage(stats.inRange, total);
    const highPct = calculatePercentage(stats.high, total);
    
    if (categoryMode === 5) {
      const veryLowPct = calculatePercentage(stats.veryLow ?? 0, total);
      const veryHighPct = calculatePercentage(stats.veryHigh ?? 0, total);
      return `${hourLabel}\nVery Low: ${veryLowPct}%\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nVery High: ${veryHighPct}%\nTotal: ${total}`;
    }
    return `${hourLabel}\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nTotal: ${total}`;
  };

  // Helper function to render stats row for day of week / weekly reports
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

  // Helper function to format AGP values
  const formatAGPValue = (value: number): string => {
    if (value === 0) return '-';
    return displayGlucoseValue(value, glucoseUnit);
  };

  // Filter AGP stats to only show time slots with data
  const agpStatsWithData = agpStats.filter(stat => stat.count > 0);

  const tirStats = calculateTIRStats();

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
      {/* Control Bar */}
      <div className={styles.controlBar}>
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>Data Source:</Text>
          <div className={styles.pillGroup}>
            <Button
              appearance={dataSource === 'cgm' ? 'primary' : 'outline'}
              className={styles.pillButton}
              onClick={() => setDataSource('cgm')}
            >
              CGM
            </Button>
            <Button
              appearance={dataSource === 'bg' ? 'primary' : 'outline'}
              className={styles.pillButton}
              onClick={() => setDataSource('bg')}
            >
              BG
            </Button>
          </div>
        </div>

        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>Categories:</Text>
          <div className={styles.pillGroup}>
            <Button
              appearance={categoryMode === 3 ? 'primary' : 'outline'}
              className={styles.pillButton}
              onClick={() => setCategoryMode(3)}
            >
              3 Categories
            </Button>
            <Button
              appearance={categoryMode === 5 ? 'primary' : 'outline'}
              className={styles.pillButton}
              onClick={() => setCategoryMode(5)}
            >
              5 Categories
            </Button>
          </div>
        </div>

        {minDate && maxDate && (
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>Date Range:</Text>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              minDate={minDate}
              maxDate={maxDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        )}

        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>Day Filter:</Text>
          <Dropdown
            placeholder="Select days"
            value={dayFilter}
            selectedOptions={[dayFilter]}
            onOptionSelect={(_, data) => setDayFilter(data.optionValue as AGPDayOfWeekFilter)}
            appearance="outline"
          >
            <Option text="Common Views" disabled>Common Views</Option>
            <Option value="All Days" text="All Days">
              <CalendarRegular /> All Days
            </Option>
            <Option value="Workday" text="Weekdays">
              <BriefcaseRegular /> Weekdays
            </Option>
            <Option value="Weekend" text="Weekend">
              <HomeRegular /> Weekend
            </Option>
            <Option text="Individual Days" disabled>Individual Days</Option>
            <Option value="Monday" text="Monday">Monday</Option>
            <Option value="Tuesday" text="Tuesday">Tuesday</Option>
            <Option value="Wednesday" text="Wednesday">Wednesday</Option>
            <Option value="Thursday" text="Thursday">Thursday</Option>
            <Option value="Friday" text="Friday">Friday</Option>
            <Option value="Saturday" text="Saturday">Saturday</Option>
            <Option value="Sunday" text="Sunday">Sunday</Option>
          </Dropdown>
        </div>
      </div>

      {/* Loading/Error states */}
      {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
      {error && <Text className={styles.error}>{error}</Text>}

      {/* Time In Range Card */}
      {!loading && !error && tirStats.total > 0 && (
        <Card className={styles.tirCard}>
          <Text className={styles.cardTitle}>
            <CheckmarkCircleRegular className={styles.cardIcon} />
            Time in Range
          </Text>

          <div className={styles.tirBarContainer}>
            <div className={styles.tirBar}>
              {categoryMode === 5 && (tirStats.veryLow ?? 0) > 0 && (
                <div
                  className={styles.tirSegment}
                  style={{
                    width: `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`,
                    backgroundColor: getColorForCategory('veryLow'),
                  }}
                  title={`Very Low: ${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
                >
                  {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total) >= 5 && 
                    `${calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%`}
                </div>
              )}
              {tirStats.low > 0 && (
                <div
                  className={styles.tirSegment}
                  style={{
                    width: `${calculatePercentage(tirStats.low, tirStats.total)}%`,
                    backgroundColor: getColorForCategory('low'),
                  }}
                  title={`Low: ${calculatePercentage(tirStats.low, tirStats.total)}%`}
                >
                  {calculatePercentage(tirStats.low, tirStats.total) >= 5 && 
                    `${calculatePercentage(tirStats.low, tirStats.total)}%`}
                </div>
              )}
              {tirStats.inRange > 0 && (
                <div
                  className={styles.tirSegment}
                  style={{
                    width: `${calculatePercentage(tirStats.inRange, tirStats.total)}%`,
                    backgroundColor: getColorForCategory('inRange'),
                  }}
                  title={`In Range: ${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
                >
                  {calculatePercentage(tirStats.inRange, tirStats.total) >= 5 && 
                    `${calculatePercentage(tirStats.inRange, tirStats.total)}%`}
                </div>
              )}
              {tirStats.high > 0 && (
                <div
                  className={styles.tirSegment}
                  style={{
                    width: `${calculatePercentage(tirStats.high, tirStats.total)}%`,
                    backgroundColor: getColorForCategory('high'),
                  }}
                  title={`High: ${calculatePercentage(tirStats.high, tirStats.total)}%`}
                >
                  {calculatePercentage(tirStats.high, tirStats.total) >= 5 && 
                    `${calculatePercentage(tirStats.high, tirStats.total)}%`}
                </div>
              )}
              {categoryMode === 5 && (tirStats.veryHigh ?? 0) > 0 && (
                <div
                  className={styles.tirSegment}
                  style={{
                    width: `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`,
                    backgroundColor: getColorForCategory('veryHigh'),
                  }}
                  title={`Very High: ${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
                >
                  {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total) >= 5 && 
                    `${calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%`}
                </div>
              )}
            </div>
          </div>

          <div className={styles.statsGrid}>
            {categoryMode === 5 && (
              <Tooltip content={`${tirStats.veryLow ?? 0} readings`} relationship="description" positioning="below">
                <div className={styles.statCard}>
                  <Text className={styles.statLabel}>Very Low</Text>
                  <Text className={styles.statValue} style={{ color: getColorForCategory('veryLow') }}>
                    {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%
                  </Text>
                </div>
              </Tooltip>
            )}
            <Tooltip content={`${tirStats.low} readings`} relationship="description" positioning="below">
              <div className={styles.statCard}>
                <Text className={styles.statLabel}>Low</Text>
                <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
                  {calculatePercentage(tirStats.low, tirStats.total)}%
                </Text>
              </div>
            </Tooltip>
            <Tooltip content={`${tirStats.inRange} readings`} relationship="description" positioning="below">
              <div className={styles.statCard}>
                <Text className={styles.statLabel}>In Range</Text>
                <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
                  {calculatePercentage(tirStats.inRange, tirStats.total)}%
                </Text>
              </div>
            </Tooltip>
            <Tooltip content={`${tirStats.high} readings`} relationship="description" positioning="below">
              <div className={styles.statCard}>
                <Text className={styles.statLabel}>High</Text>
                <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
                  {calculatePercentage(tirStats.high, tirStats.total)}%
                </Text>
              </div>
            </Tooltip>
            {categoryMode === 5 && (
              <Tooltip content={`${tirStats.veryHigh ?? 0} readings`} relationship="description" positioning="below">
                <div className={styles.statCard}>
                  <Text className={styles.statLabel}>Very High</Text>
                  <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                    {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%
                  </Text>
                </div>
              </Tooltip>
            )}
          </div>

          <div className={styles.targetInfo}>
            <strong>Target:</strong> 70% Time in Range (TIR) is generally considered a good target for glucose management
          </div>
        </Card>
      )}

      {/* AGP Card */}
      {!loading && !error && agpStats.length > 0 && (
        <Card className={styles.agpCard}>
          <Text className={styles.cardTitle}>
            <DataLineRegular className={styles.cardIcon} />
            Ambulatory Glucose Profile (AGP)
          </Text>
          <AGPGraph data={agpStats} glucoseUnit={glucoseUnit} />
        </Card>
      )}

      {/* Detailed Breakdown Accordion */}
      {!loading && !error && tirStats.total > 0 && (
        <Accordion collapsible className={styles.accordion} defaultOpenItems={[]}>
          {/* TIR by Time Period */}
          {periodStats.length > 0 && (
            <AccordionItem value="periodTIR">
              <AccordionHeader>
                <span className={styles.accordionHeaderContent}>
                  Time in Range by Period
                  {dayFilter !== 'All Days' && (
                    <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                      <FilterRegular className={styles.filterIcon} />
                    </Tooltip>
                  )}
                </span>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.periodBarsContainer}>
                  {periodStats.map((period) => (
                    <div key={period.period} className={styles.periodBarRow}>
                      <Text className={styles.periodLabel}>{period.period}</Text>
                      <div className={styles.periodBarWrapper}>
                        <div className={styles.periodBar}>
                          {categoryMode === 5 && (period.stats.veryLow ?? 0) > 0 && (
                            <Tooltip content={`Very Low: ${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}% (${period.stats.veryLow ?? 0})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}%`,
                                  backgroundColor: getColorForCategory('veryLow'),
                                }}
                              >
                                {calculatePercentage(period.stats.veryLow ?? 0, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                                  `${calculatePercentage(period.stats.veryLow ?? 0, period.stats.total)}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.low > 0 && (
                            <Tooltip content={`Low: ${calculatePercentage(period.stats.low, period.stats.total)}% (${period.stats.low})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${calculatePercentage(period.stats.low, period.stats.total)}%`,
                                  backgroundColor: getColorForCategory('low'),
                                }}
                              >
                                {calculatePercentage(period.stats.low, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                                  `${calculatePercentage(period.stats.low, period.stats.total)}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.inRange > 0 && (
                            <Tooltip content={`In Range: ${calculatePercentage(period.stats.inRange, period.stats.total)}% (${period.stats.inRange})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${calculatePercentage(period.stats.inRange, period.stats.total)}%`,
                                  backgroundColor: getColorForCategory('inRange'),
                                }}
                              >
                                {calculatePercentage(period.stats.inRange, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                                  `${calculatePercentage(period.stats.inRange, period.stats.total)}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.high > 0 && (
                            <Tooltip content={`High: ${calculatePercentage(period.stats.high, period.stats.total)}% (${period.stats.high})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${calculatePercentage(period.stats.high, period.stats.total)}%`,
                                  backgroundColor: getColorForCategory('high'),
                                }}
                              >
                                {calculatePercentage(period.stats.high, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                                  `${calculatePercentage(period.stats.high, period.stats.total)}%`}
                              </div>
                            </Tooltip>
                          )}
                          {categoryMode === 5 && (period.stats.veryHigh ?? 0) > 0 && (
                            <Tooltip content={`Very High: ${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}% (${period.stats.veryHigh ?? 0})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}%`,
                                  backgroundColor: getColorForCategory('veryHigh'),
                                }}
                              >
                                {calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total) >= MIN_PERCENTAGE_FOR_PERIOD_BAR && 
                                  `${calculatePercentage(period.stats.veryHigh ?? 0, period.stats.total)}%`}
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* 24-Hour Hourly TIR Breakdown */}
          {hourlyStats.length > 0 && (
            <AccordionItem value="hourlyTIR">
              <AccordionHeader>
                <span className={styles.accordionHeaderContent}>
                  Time in Range - 24-Hour Hourly Breakdown
                  {dayFilter !== 'All Days' && (
                    <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                      <FilterRegular className={styles.filterIcon} />
                    </Tooltip>
                  )}
                </span>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.hourlyChartContainer}>
                  {/* Hourly stacked bar chart */}
                  <div className={styles.hourlyChartRow}>
                    {hourlyStats.map((hourData) => {
                      const total = hourData.stats.total;
                      if (total === 0) {
                        return (
                          <Tooltip 
                            key={hourData.hour} 
                            content={`${hourData.hourLabel}: No data`} 
                            relationship="description"
                          >
                            <div className={styles.hourlyBar} style={{ backgroundColor: tokens.colorNeutralBackground3 }} />
                          </Tooltip>
                        );
                      }
                      
                      const veryLowPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryLow ?? 0, total) : 0;
                      const lowPct = calculatePercentage(hourData.stats.low, total);
                      const inRangePct = calculatePercentage(hourData.stats.inRange, total);
                      const highPct = calculatePercentage(hourData.stats.high, total);
                      const veryHighPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryHigh ?? 0, total) : 0;
                      
                      const tooltipContent = formatHourlyTooltipContent(hourData.hourLabel, hourData.stats);
                      
                      return (
                        <Tooltip key={hourData.hour} content={tooltipContent} relationship="description">
                          <div className={styles.hourlyBar}>
                            {/* Stack from bottom: veryHigh, high, inRange, low, veryLow */}
                            {categoryMode === 5 && veryHighPct > 0 && (
                              <div
                                className={styles.hourlySegment}
                                style={{
                                  height: `${veryHighPct}%`,
                                  backgroundColor: getColorForCategory('veryHigh'),
                                }}
                              />
                            )}
                            {highPct > 0 && (
                              <div
                                className={styles.hourlySegment}
                                style={{
                                  height: `${highPct}%`,
                                  backgroundColor: getColorForCategory('high'),
                                }}
                              />
                            )}
                            {inRangePct > 0 && (
                              <div
                                className={styles.hourlySegment}
                                style={{
                                  height: `${inRangePct}%`,
                                  backgroundColor: getColorForCategory('inRange'),
                                }}
                              />
                            )}
                            {lowPct > 0 && (
                              <div
                                className={styles.hourlySegment}
                                style={{
                                  height: `${lowPct}%`,
                                  backgroundColor: getColorForCategory('low'),
                                }}
                              />
                            )}
                            {categoryMode === 5 && veryLowPct > 0 && (
                              <div
                                className={styles.hourlySegment}
                                style={{
                                  height: `${veryLowPct}%`,
                                  backgroundColor: getColorForCategory('veryLow'),
                                }}
                              />
                            )}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                  {/* Hour labels */}
                  <div className={styles.hourlyLabels}>
                    {hourlyStats.map((hourData) => (
                      <Text key={hourData.hour} className={styles.hourlyLabel}>
                        {hourData.hour.toString().padStart(2, '0')}
                      </Text>
                    ))}
                  </div>
                  <Text className={styles.chartDescription}>
                    Visualize hourly glucose patterns to identify trends and optimize management strategies.
                  </Text>
                </div>
                
                {/* Hourly TIR Data Table */}
                <div className={styles.tableSection}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={styles.highlightedHeaderCell}>Hour</TableHeaderCell>
                        {categoryMode === 5 && <TableHeaderCell>Very Low</TableHeaderCell>}
                        <TableHeaderCell>Low</TableHeaderCell>
                        <TableHeaderCell className={styles.inRangeHeader}>In Range</TableHeaderCell>
                        <TableHeaderCell>High</TableHeaderCell>
                        {categoryMode === 5 && <TableHeaderCell>Very High</TableHeaderCell>}
                        <TableHeaderCell>Total</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourlyStats.map((hourData) => (
                        <TableRow key={hourData.hour}>
                          <TableCell className={styles.highlightedCell}>{hourData.hourLabel}</TableCell>
                          {categoryMode === 5 && (
                            <TableCell>{calculatePercentage(hourData.stats.veryLow ?? 0, hourData.stats.total)}% ({hourData.stats.veryLow ?? 0})</TableCell>
                          )}
                          <TableCell>{calculatePercentage(hourData.stats.low, hourData.stats.total)}% ({hourData.stats.low})</TableCell>
                          <TableCell className={styles.inRangeCell}>{calculatePercentage(hourData.stats.inRange, hourData.stats.total)}% ({hourData.stats.inRange})</TableCell>
                          <TableCell>{calculatePercentage(hourData.stats.high, hourData.stats.total)}% ({hourData.stats.high})</TableCell>
                          {categoryMode === 5 && (
                            <TableCell>{calculatePercentage(hourData.stats.veryHigh ?? 0, hourData.stats.total)}% ({hourData.stats.veryHigh ?? 0})</TableCell>
                          )}
                          <TableCell>{hourData.stats.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Glucose Range by Day of Week */}
          {dayOfWeekReports.length > 0 && (
            <AccordionItem value="dayOfWeek">
              <AccordionHeader>Glucose Range by Day of Week</AccordionHeader>
              <AccordionPanel>
                <div className={styles.tableSection}>
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
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
          
          {/* Glucose Range by Week */}
          {weeklyReports.length > 0 && (
            <AccordionItem value="weekly">
              <AccordionHeader>Glucose Range by Week</AccordionHeader>
              <AccordionPanel>
                <div className={styles.tableSection}>
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
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
          
          {/* Detailed AGP Time Slots */}
          {agpStatsWithData.length > 0 && (
            <AccordionItem value="agpTimeSlots">
              <AccordionHeader>
                <span className={styles.accordionHeaderContent}>
                  Detailed AGP Time Slots
                  {dayFilter !== 'All Days' && (
                    <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                      <FilterRegular className={styles.filterIcon} />
                    </Tooltip>
                  )}
                </span>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.tableSection}>
                  <Text className={styles.noData} style={{ padding: '8px 0', fontSize: tokens.fontSizeBase200 }}>
                    All values are in {getUnitLabel(glucoseUnit)}. Percentiles are calculated across all days for each 5-minute time slot.
                  </Text>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={styles.highlightedHeaderCell}>Time</TableHeaderCell>
                        <TableHeaderCell>Lowest</TableHeaderCell>
                        <TableHeaderCell>10%</TableHeaderCell>
                        <TableHeaderCell>25%</TableHeaderCell>
                        <TableHeaderCell className={styles.highlightedHeaderCell}>50% (Median)</TableHeaderCell>
                        <TableHeaderCell>75%</TableHeaderCell>
                        <TableHeaderCell>90%</TableHeaderCell>
                        <TableHeaderCell>Highest</TableHeaderCell>
                        <TableHeaderCell>Count</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agpStatsWithData.map((stat) => (
                        <TableRow key={stat.timeSlot}>
                          <TableCell className={`${styles.timeCell} ${styles.highlightedCell}`}>{stat.timeSlot}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.lowest)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.p10)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.p25)}</TableCell>
                          <TableCell className={`${styles.valueCell} ${styles.highlightedCell}`}>{formatAGPValue(stat.p50)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.p75)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.p90)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatAGPValue(stat.highest)}</TableCell>
                          <TableCell className={styles.countCell}>{stat.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionPanel>
            </AccordionItem>
          )}
          
          {/* Link to Detailed CGM Data */}
          <AccordionItem value="cgmLink">
            <AccordionHeader>Detailed CGM Data</AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <Text>For a complete view of all CGM readings with timestamps, please visit the Detailed CGM tab.</Text>
                <Button
                  appearance="primary"
                  onClick={() => {
                    window.location.hash = 'reports/detailedCgm';
                  }}
                  style={{ marginTop: '12px' }}
                >
                  Go to Detailed CGM
                </Button>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
