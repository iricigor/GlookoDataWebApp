/**
 * Detailed Breakdown Accordion Component
 * Contains TIR by Period, Hourly TIR, Day of Week, Weekly, and AGP Time Slots
 */

import { 
  Text,
  Button,
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
  tokens,
} from '@fluentui/react-components';
import { FilterRegular } from '@fluentui/react-icons';
import type { 
  RangeCategoryMode, 
  GlucoseUnit,
  AGPDayOfWeekFilter,
  TimePeriodTIRStats,
  HourlyTIRStats,
  DayOfWeekReport,
  WeeklyReport,
  AGPTimeSlotStats,
} from '../../types';
import { 
  calculatePercentage, 
  GLUCOSE_RANGE_COLORS, 
  MIN_PERCENTAGE_FOR_PERIOD_BAR,
  displayGlucoseValue,
  getUnitLabel,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import type { TIRStats } from './types';

interface DetailedBreakdownAccordionProps {
  categoryMode: RangeCategoryMode;
  glucoseUnit: GlucoseUnit;
  dayFilter: AGPDayOfWeekFilter;
  periodStats: TimePeriodTIRStats[];
  hourlyStats: HourlyTIRStats[];
  dayOfWeekReports: DayOfWeekReport[];
  weeklyReports: WeeklyReport[];
  agpStats: AGPTimeSlotStats[];
}

/** Get color for a glucose range category */
function getColorForCategory(category: string): string {
  switch (category) {
    case 'veryLow': return GLUCOSE_RANGE_COLORS.veryLow;
    case 'low': return GLUCOSE_RANGE_COLORS.low;
    case 'inRange': return GLUCOSE_RANGE_COLORS.inRange;
    case 'high': return GLUCOSE_RANGE_COLORS.high;
    case 'veryHigh': return GLUCOSE_RANGE_COLORS.veryHigh;
    default: return '#000';
  }
}

export function DetailedBreakdownAccordion({
  categoryMode,
  glucoseUnit,
  dayFilter,
  periodStats,
  hourlyStats,
  dayOfWeekReports,
  weeklyReports,
  agpStats,
}: DetailedBreakdownAccordionProps) {
  const styles = useBGOverviewStyles();
  
  // Filter AGP stats to only show time slots with data
  const agpStatsWithData = agpStats.filter(stat => stat.count > 0);

  // Helper function to format tooltip content for hourly TIR
  const formatHourlyTooltipContent = (
    hourLabel: string,
    stats: TIRStats
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
    stats: TIRStats
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

  return (
    <Accordion collapsible className={styles.accordion} defaultOpenItems={[]}>
      {/* TIR by Time Period */}
      {periodStats.length > 0 && (
        <AccordionItem value="periodTIR">
          <AccordionHeader>
            <span className={styles.accordionHeaderContent}>
              Time in Range by Period
              {dayFilter !== 'All Days' && (
                <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                  <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
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
                  <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
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
                  <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
                </Tooltip>
              )}
            </span>
          </AccordionHeader>
          <AccordionPanel>
            <div className={styles.tableSection}>
              <Text className={styles.agpTableDescription}>
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
            {/* TODO: Consider using React Router navigation when available */}
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
  );
}
