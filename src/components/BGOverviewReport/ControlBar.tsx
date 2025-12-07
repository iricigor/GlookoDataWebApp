/**
 * Control Bar Component
 * Filter controls for the BG Overview Report
 */

import { 
  Text,
  Button,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  BriefcaseRegular,
  CalendarRegular,
  HomeRegular,
} from '@fluentui/react-icons';
import type { GlucoseDataSource, RangeCategoryMode, AGPDayOfWeekFilter } from '../../types';
import { DateRangePicker } from '../shared/DateRangePicker';
import { useBGOverviewStyles } from './styles';

interface ControlBarProps {
  dataSource: GlucoseDataSource;
  setDataSource: (source: GlucoseDataSource) => void;
  categoryMode: RangeCategoryMode;
  setCategoryMode: (mode: RangeCategoryMode) => void;
  dayFilter: AGPDayOfWeekFilter;
  setDayFilter: (filter: AGPDayOfWeekFilter) => void;
  startDate: string | null;
  endDate: string | null;
  minDate: string | null;
  maxDate: string | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function ControlBar({
  dataSource,
  setDataSource,
  categoryMode,
  setCategoryMode,
  dayFilter,
  setDayFilter,
  startDate,
  endDate,
  minDate,
  maxDate,
  onStartDateChange,
  onEndDateChange,
}: ControlBarProps) {
  const styles = useBGOverviewStyles();

  return (
    <div className={styles.controlBar}>
      <div className={styles.controlGrid}>
        {/* First row on wide screens: Data Source + Categories */}
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

        {/* Second row on wide screens: Date Range + Day Filter */}
        {/* Truthy checks narrow string | null to string for TypeScript */}
        {minDate && maxDate && startDate && endDate && (
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>Date Range:</Text>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              minDate={minDate}
              maxDate={maxDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
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
            className={styles.dropdownControl}
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
    </div>
  );
}
