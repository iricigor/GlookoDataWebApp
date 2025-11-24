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
  Input,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import {
  CalendarRegular,
  BriefcaseRegular,
  HomeRegular,
  CheckmarkCircleRegular,
  DataLineRegular,
} from '@fluentui/react-icons';
import type { 
  UploadedFile, 
  GlucoseDataSource, 
  RangeCategoryMode,
  GlucoseReading,
  AGPTimeSlotStats,
  AGPDayOfWeekFilter,
  GlucoseUnit,
} from '../types';
import { extractGlucoseReadings } from '../utils/data';
import { groupByDayOfWeek, calculatePercentage, GLUCOSE_RANGE_COLORS } from '../utils/data';
import { calculateAGPStats, filterReadingsByDayOfWeek } from '../utils/visualization';
import { useGlucoseThresholds } from '../hooks/useGlucoseThresholds';
import { useDateRange } from '../hooks/useDateRange';
import { AGPGraph } from './AGPGraph';

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
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
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
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    minWidth: '100px',
  },
  datePickerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  tirCard: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
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
    marginTop: '16px',
    marginBottom: '16px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    marginTop: '16px',
  },
  statCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  targetInfo: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorBrandBackground2,
    marginTop: '16px',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
  agpCard: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  accordion: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setReadings([]);
        setAgpStats([]);
        clearDateRange();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource, dayFilter, minDate, maxDate, startDate, endDate, setDateRange, clearDateRange]);

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
      } else {
        setError(null);
        const stats = calculateAGPStats(filteredReadings);
        setAgpStats(stats);
      }
    }
  }, [startDate, endDate, readings, dayFilter]);

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
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>In Range</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('inRange') }}>
                {calculatePercentage(tirStats.inRange, tirStats.total)}%
              </Text>
              <Text className={styles.statCount}>{tirStats.inRange} readings</Text>
            </div>
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>High</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('high') }}>
                {calculatePercentage(tirStats.high, tirStats.total)}%
              </Text>
              <Text className={styles.statCount}>{tirStats.high} readings</Text>
            </div>
            <div className={styles.statCard}>
              <Text className={styles.statLabel}>Low</Text>
              <Text className={styles.statValue} style={{ color: getColorForCategory('low') }}>
                {calculatePercentage(tirStats.low, tirStats.total)}%
              </Text>
              <Text className={styles.statCount}>{tirStats.low} readings</Text>
            </div>
            {categoryMode === 5 && (
              <>
                <div className={styles.statCard}>
                  <Text className={styles.statLabel}>Very High</Text>
                  <Text className={styles.statValue} style={{ color: getColorForCategory('veryHigh') }}>
                    {calculatePercentage(tirStats.veryHigh ?? 0, tirStats.total)}%
                  </Text>
                  <Text className={styles.statCount}>{tirStats.veryHigh ?? 0} readings</Text>
                </div>
                <div className={styles.statCard}>
                  <Text className={styles.statLabel}>Very Low</Text>
                  <Text className={styles.statValue} style={{ color: getColorForCategory('veryLow') }}>
                    {calculatePercentage(tirStats.veryLow ?? 0, tirStats.total)}%
                  </Text>
                  <Text className={styles.statCount}>{tirStats.veryLow ?? 0} readings</Text>
                </div>
              </>
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
            Ambulatory Glucose Profile
          </Text>
          <AGPGraph data={agpStats} glucoseUnit={glucoseUnit} />
        </Card>
      )}

      {/* Detailed Breakdown Accordion */}
      {!loading && !error && tirStats.total > 0 && (
        <Accordion collapsible className={styles.accordion}>
          <AccordionItem value="detailed">
            <AccordionHeader>Detailed Breakdown & Reports</AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                <Button
                  appearance="subtle"
                  className={styles.linkButton}
                  onClick={() => {
                    window.location.hash = 'reports/inRange';
                  }}
                >
                  Glucose Range by Day of Week
                </Button>
                <Button
                  appearance="subtle"
                  className={styles.linkButton}
                  onClick={() => {
                    window.location.hash = 'reports/inRange';
                  }}
                >
                  Glucose Range by Week
                </Button>
                <Button
                  appearance="subtle"
                  className={styles.linkButton}
                  onClick={() => {
                    window.location.hash = 'reports/agp';
                  }}
                >
                  Detailed AGP Time Slots
                </Button>
                <Button
                  appearance="subtle"
                  className={styles.linkButton}
                  onClick={() => {
                    window.location.hash = 'reports/detailedCgm';
                  }}
                >
                  Detailed CGM Data
                </Button>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
