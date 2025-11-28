/**
 * BG Overview Report Component
 * Unified view combining Time in Range and AGP reports with modern Fluent UI design
 */

import { useState, useEffect } from 'react';
import {
  Text,
  Card,
} from '@fluentui/react-components';
import { DataLineRegular } from '@fluentui/react-icons';
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
} from '../../types';
import {
  extractGlucoseReadings,
  groupByWeek,
  groupByDayOfWeek,
  calculateTIRByTimePeriods,
  calculateHourlyTIR,
  calculateAverageGlucose,
  calculateEstimatedHbA1c,
  calculateDaysWithData,
  calculateCV,
  calculateBGRI,
  calculateJIndex,
} from '../../utils/data';
import { calculateAGPStats, filterReadingsByDayOfWeek } from '../../utils/visualization';
import { useGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { useDateRange } from '../../hooks/useDateRange';
import { AGPGraph } from '../AGPGraph';
import { useBGOverviewStyles } from './styles';
import { ControlBar } from './ControlBar';
import { TimeInRangeCard } from './TimeInRangeCard';
import { HbA1cEstimateCard } from './HbA1cEstimateCard';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { DetailedBreakdownAccordion } from './DetailedBreakdownAccordion';
import type { TIRStats, HbA1cStats, RiskStats } from './types';

interface BGOverviewReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
}

export function BGOverviewReport({ selectedFile, glucoseUnit }: BGOverviewReportProps) {
  const styles = useBGOverviewStyles();
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
  const calculateTIRStats = (): TIRStats => {
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

    const reports = groupByDayOfWeek(filteredReadings, thresholds, categoryMode);

    const totals: TIRStats = {
      veryLow: 0,
      low: 0,
      inRange: 0,
      high: 0,
      veryHigh: 0,
      total: 0,
    };

    reports
      .filter(r => r.day !== 'Workday' && r.day !== 'Weekend')
      .forEach(report => {
        totals.low += report.stats.low;
        totals.inRange += report.stats.inRange;
        totals.high += report.stats.high;
        totals.total += report.stats.total;
        if (categoryMode === 5) {
          totals.veryLow = (totals.veryLow ?? 0) + (report.stats.veryLow ?? 0);
          totals.veryHigh = (totals.veryHigh ?? 0) + (report.stats.veryHigh ?? 0);
        }
      });

    return totals;
  };

  // Calculate HbA1c estimate with current filters applied
  const calculateHbA1cStats = (): HbA1cStats => {
    if (readings.length === 0) {
      return { hba1c: null, averageGlucose: null, daysWithData: 0, cv: null };
    }

    // Filter by date range and day of week (same as TIR)
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

    if (filteredReadings.length === 0) {
      return { hba1c: null, averageGlucose: null, daysWithData: 0, cv: null };
    }

    const averageGlucose = calculateAverageGlucose(filteredReadings);
    const daysWithData = calculateDaysWithData(filteredReadings);
    const hba1c = averageGlucose !== null ? calculateEstimatedHbA1c(averageGlucose) : null;
    const cv = calculateCV(filteredReadings);

    return { hba1c, averageGlucose, daysWithData, cv };
  };

  // Calculate Risk Assessment stats (LBGI, HBGI, BGRI, J-Index) with current filters applied
  const calculateRiskStats = (): RiskStats => {
    if (readings.length === 0) {
      return { lbgi: null, hbgi: null, bgri: null, jIndex: null };
    }

    // Filter by date range and day of week (same as TIR)
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

    if (filteredReadings.length === 0) {
      return { lbgi: null, hbgi: null, bgri: null, jIndex: null };
    }

    const bgriResult = calculateBGRI(filteredReadings);
    const jIndex = calculateJIndex(filteredReadings);

    return {
      lbgi: bgriResult?.lbgi ?? null,
      hbgi: bgriResult?.hbgi ?? null,
      bgri: bgriResult?.bgri ?? null,
      jIndex,
    };
  };

  const tirStats = calculateTIRStats();
  const hba1cStats = calculateHbA1cStats();
  const riskStats = calculateRiskStats();

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
      <ControlBar
        dataSource={dataSource}
        setDataSource={setDataSource}
        categoryMode={categoryMode}
        setCategoryMode={setCategoryMode}
        dayFilter={dayFilter}
        setDayFilter={setDayFilter}
        startDate={startDate}
        endDate={endDate}
        minDate={minDate}
        maxDate={maxDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Loading/Error states */}
      {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
      {error && <Text className={styles.error}>{error}</Text>}

      {/* Time In Range Card */}
      {!loading && !error && tirStats.total > 0 && (
        <TimeInRangeCard tirStats={tirStats} categoryMode={categoryMode} />
      )}

      {/* HbA1c Estimate Card */}
      {!loading && !error && (
        <HbA1cEstimateCard hba1cStats={hba1cStats} glucoseUnit={glucoseUnit} />
      )}

      {/* Risk Assessment Card */}
      {!loading && !error && (
        <RiskAssessmentCard riskStats={riskStats} />
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
        <DetailedBreakdownAccordion
          categoryMode={categoryMode}
          glucoseUnit={glucoseUnit}
          dayFilter={dayFilter}
          periodStats={periodStats}
          hourlyStats={hourlyStats}
          dayOfWeekReports={dayOfWeekReports}
          weeklyReports={weeklyReports}
          agpStats={agpStats}
        />
      )}
    </div>
  );
}
