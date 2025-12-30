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
import type { ResponseLanguage } from '../../hooks/useResponseLanguage';
import type { AIProvider } from '../../utils/api';
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
  calculateMedianGlucose,
  calculateStandardDeviation,
  calculateQuartiles,
  countHighLowIncidents,
  countUnicorns,
  calculateFlux,
  calculateWakeupAverage,
  calculateBedtimeAverage,
} from '../../utils/data';
import { calculateAGPStats, filterReadingsByDayOfWeek } from '../../utils/visualization';
import { getActiveProvider } from '../../utils/api';
import { useGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { useDateRange } from '../../hooks/useDateRange';
import { AGPGraph } from '../AGPGraph';
import { useBGOverviewStyles } from './styles';
import { ControlBar } from './ControlBar';
import { TimeInRangeCard } from './TimeInRangeCard';
import { TimeInRangeDetailsCard } from './TimeInRangeDetailsCard';
import { HbA1cEstimateCard } from './HbA1cEstimateCard';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SugarmateStatsCard } from './SugarmateStatsCard';
import { TimeInRangeByPeriodSection } from './TimeInRangeByPeriodSection';
import { TimeInRangeByTimeOfDaySection } from './TimeInRangeByTimeOfDaySection';
import { DetailedBreakdownAccordion } from './DetailedBreakdownAccordion';
import type { TIRStats, HbA1cStats, RiskStats } from './types';

interface BGOverviewReportProps {
  selectedFile?: UploadedFile;
  glucoseUnit: GlucoseUnit;
  showGeekStats: boolean;
  // AI configuration props
  perplexityApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  deepseekApiKey?: string;
  selectedProvider?: AIProvider | null;
  responseLanguage?: ResponseLanguage;
  // Pro user props for backend AI routing
  isProUser?: boolean;
  idToken?: string | null;
  useProKeys?: boolean;
}

export function BGOverviewReport({ 
  selectedFile, 
  glucoseUnit, 
  showGeekStats,
  perplexityApiKey = '',
  geminiApiKey = '',
  grokApiKey = '',
  deepseekApiKey = '',
  selectedProvider = null,
  responseLanguage = 'english',
  isProUser = false,
  idToken = null,
  useProKeys = false,
}: BGOverviewReportProps) {
  const styles = useBGOverviewStyles();
  const { thresholds } = useGlucoseThresholds();

  // Determine which AI provider to use
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);
  const hasApiKey = activeProvider !== null;
  
  // Get the appropriate API key for the active provider
  const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : 
                  activeProvider === 'grok' ? grokApiKey :
                  activeProvider === 'deepseek' ? deepseekApiKey : geminiApiKey;

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

  // Shared helper to filter readings by date range and day of week
  const getFilteredReadings = (): GlucoseReading[] => {
    let filtered = readings;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = readings.filter(r => {
        const timestamp = r.timestamp.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
      });
    }
    
    return filterReadingsByDayOfWeek(filtered, dayFilter);
  };

  // Calculate TIR statistics from filtered readings
  const calculateTIRStats = (filteredReadings: GlucoseReading[]): TIRStats => {
    if (filteredReadings.length === 0) {
      return categoryMode === 5
        ? { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, total: 0 }
        : { low: 0, inRange: 0, high: 0, total: 0 };
    }

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

  // Calculate HbA1c estimate from filtered readings
  const calculateHbA1cStats = (filteredReadings: GlucoseReading[]): HbA1cStats => {
    if (filteredReadings.length === 0) {
      return { hba1c: null, averageGlucose: null, daysWithData: 0, cv: null };
    }

    const averageGlucose = calculateAverageGlucose(filteredReadings);
    const daysWithData = calculateDaysWithData(filteredReadings);
    const hba1c = averageGlucose !== null ? calculateEstimatedHbA1c(averageGlucose) : null;
    const cv = calculateCV(filteredReadings);

    return { hba1c, averageGlucose, daysWithData, cv };
  };

  // Calculate Risk Assessment stats from filtered readings
  const calculateRiskStats = (filteredReadings: GlucoseReading[]): RiskStats => {
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

  // Calculate Sugarmate-style stats from filtered readings and TIR stats
  const calculateSugarmateStats = (filteredReadings: GlucoseReading[], tirStats: TIRStats) => {
    if (filteredReadings.length === 0 || tirStats.total === 0) {
      return null;
    }

    return {
      averageGlucose: calculateAverageGlucose(filteredReadings),
      medianGlucose: calculateMedianGlucose(filteredReadings),
      standardDeviation: calculateStandardDeviation(filteredReadings),
      quartiles: calculateQuartiles(filteredReadings),
      incidents: countHighLowIncidents(filteredReadings, thresholds),
      flux: calculateFlux(filteredReadings),
      unicornCount: countUnicorns(filteredReadings),
      wakeupAverage: calculateWakeupAverage(filteredReadings),
      bedtimeAverage: calculateBedtimeAverage(filteredReadings),
    };
  };

  // Get filtered readings once and use for all calculations
  const filteredReadings = getFilteredReadings();
  const tirStats = calculateTIRStats(filteredReadings);
  const hba1cStats = calculateHbA1cStats(filteredReadings);
  const riskStats = calculateRiskStats(filteredReadings);
  const sugarmateStats = calculateSugarmateStats(filteredReadings, tirStats);

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
      {/* Sticky Control Bar Wrapper */}
      <div className={styles.stickyControlBarWrapper}>
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
      </div>

      {/* Loading/Error states */}
      {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
      {error && <Text className={styles.error}>{error}</Text>}

      {/* Time In Range Card */}
      {!loading && !error && tirStats.total > 0 && (
        <TimeInRangeCard 
          tirStats={tirStats} 
          categoryMode={categoryMode}
          glucoseUnit={glucoseUnit}
          thresholds={thresholds}
          showGeekStats={showGeekStats}
          dayFilter={dayFilter}
          hasApiKey={hasApiKey}
          activeProvider={activeProvider}
          apiKey={apiKey}
          responseLanguage={responseLanguage}
          isProUser={isProUser}
          idToken={idToken}
          useProKeys={useProKeys}
        />
      )}

      {/* Time In Range - Details Card */}
      {!loading && !error && tirStats.total > 0 && (
        <TimeInRangeDetailsCard />
      )}

      {/* Time in Range by Period Section */}
      {!loading && !error && periodStats.length > 0 && (
        <TimeInRangeByPeriodSection
          categoryMode={categoryMode}
          dayFilter={dayFilter}
          periodStats={periodStats}
        />
      )}

      {/* HbA1c Estimate Card */}
      {!loading && !error && (
        <HbA1cEstimateCard hba1cStats={hba1cStats} glucoseUnit={glucoseUnit} />
      )}

      {/* Risk Assessment Card */}
      {!loading && !error && (
        <RiskAssessmentCard riskStats={riskStats} />
      )}

      {/* Sugarmate Stats Card */}
      {!loading && !error && sugarmateStats && (
        <SugarmateStatsCard
          glucoseUnit={glucoseUnit}
          averageGlucose={sugarmateStats.averageGlucose}
          medianGlucose={sugarmateStats.medianGlucose}
          standardDeviation={sugarmateStats.standardDeviation}
          quartiles={sugarmateStats.quartiles}
          incidents={sugarmateStats.incidents}
          flux={sugarmateStats.flux}
          unicornCount={sugarmateStats.unicornCount}
          wakeupAverage={sugarmateStats.wakeupAverage}
          bedtimeAverage={sugarmateStats.bedtimeAverage}
        />
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

      {/* Time in Range by Time of Day Section */}
      {!loading && !error && hourlyStats.length > 0 && (
        <TimeInRangeByTimeOfDaySection
          categoryMode={categoryMode}
          dayFilter={dayFilter}
          hourlyStats={hourlyStats}
        />
      )}

      {/* Detailed Breakdown Accordion */}
      {!loading && !error && tirStats.total > 0 && showGeekStats && (
        <DetailedBreakdownAccordion
          categoryMode={categoryMode}
          glucoseUnit={glucoseUnit}
          dayFilter={dayFilter}
          hourlyStats={hourlyStats}
          dayOfWeekReports={dayOfWeekReports}
          weeklyReports={weeklyReports}
          agpStats={agpStats}
        />
      )}
    </div>
  );
}
