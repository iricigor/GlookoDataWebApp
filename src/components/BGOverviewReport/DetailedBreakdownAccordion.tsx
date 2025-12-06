/**
 * Detailed Breakdown Accordion Component
 * Contains Hourly TIR Data, Day of Week, Weekly, and AGP Time Slots
 * Note: TIR by Period graphs and Hourly TIR graphs are now in separate standalone sections
 */

import { 
  Text,
  Card,
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
import { FilterRegular, TableRegular } from '@fluentui/react-icons';
import type { 
  RangeCategoryMode, 
  GlucoseUnit,
  AGPDayOfWeekFilter,
  HourlyTIRStats,
  DayOfWeekReport,
  WeeklyReport,
  AGPTimeSlotStats,
} from '../../types';
import { 
  calculatePercentage, 
  displayGlucoseValue,
  getUnitLabel,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import type { TIRStats } from './types';

interface DetailedBreakdownAccordionProps {
  categoryMode: RangeCategoryMode;
  glucoseUnit: GlucoseUnit;
  dayFilter: AGPDayOfWeekFilter;
  hourlyStats: HourlyTIRStats[];
  dayOfWeekReports: DayOfWeekReport[];
  weeklyReports: WeeklyReport[];
  agpStats: AGPTimeSlotStats[];
}

/**
 * Render an accordion presenting detailed glucose time-in-range and AGP statistics across multiple breakdowns.
 *
 * @param categoryMode - Numeric mode that controls column layout; when equal to `5` the tables include Very Low and Very High columns.
 * @param glucoseUnit - Unit used for displaying glucose values.
 * @param dayFilter - Current day filter label; when not "All Days" a filter indicator is shown in relevant section headers.
 * @param hourlyStats - Array of hourly time-in-range statistics used to populate the hourly table.
 * @param dayOfWeekReports - Array of day-of-week reports used to populate the Glucose Range by Day of Week table.
 * @param weeklyReports - Array of weekly reports used to populate the Glucose Range by Week table.
 * @param agpStats - Array of AGP time-slot statistics used to populate the Detailed AGP Time Slots table.
 * @returns A React element containing the collapsible detailed breakdown accordion with tables for hourly TIR, day-of-week, weekly, and AGP time-slot data.
 */
export function DetailedBreakdownAccordion({
  categoryMode,
  glucoseUnit,
  dayFilter,
  hourlyStats,
  dayOfWeekReports,
  weeklyReports,
  agpStats,
}: DetailedBreakdownAccordionProps) {
  const styles = useBGOverviewStyles();
  
  // Filter AGP stats to only show time slots with data
  const agpStatsWithData = agpStats.filter(stat => stat.count > 0);

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
    <Card className={styles.sectionCard}>
      <Text className={styles.cardTitle}>
        <TableRegular className={styles.cardIcon} />
        Data Tables
      </Text>
      <Accordion collapsible className={styles.accordion} defaultOpenItems={[]}>
      {/* 24-Hour Hourly TIR Data Table (graphs are now in standalone TimeInRangeByTimeOfDaySection) */}
      {hourlyStats.length > 0 && (
        <AccordionItem value="hourlyTIR">
          <AccordionHeader>
            <span className={styles.accordionHeaderContent}>
              Time in Range - Hourly Data
              {dayFilter !== 'All Days' && (
                <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                  <FilterRegular className={styles.filterIcon} aria-label="Filter indicator" />
                </Tooltip>
              )}
            </span>
          </AccordionHeader>
          <AccordionPanel>
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
    </Accordion>
    </Card>
  );
}