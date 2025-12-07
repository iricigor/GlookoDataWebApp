/**
 * DateRangePicker Component
 * Wrapper around RSuite DateRangePicker for consistent styling with Fluent UI
 */

import { DateRangePicker as RSuiteDateRangePicker, CustomProvider } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { makeStyles, tokens } from '@fluentui/react-components';
import { useIsDarkMode } from '../../hooks/useIsDarkMode';

const useStyles = makeStyles({
  pickerContainer: {
    display: 'flex',
    width: '100%',
    '& .rs-picker-toggle': {
      minWidth: '280px',
      borderRadius: tokens.borderRadiusMedium,
      flex: 1,
    },
    // On mobile, expand to fill available space
    '@media (max-width: 767px)': {
      '& .rs-picker-toggle': {
        minWidth: 'auto',
        width: '100%',
      },
    },
  },
});

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  minDate,
  maxDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const styles = useStyles();
  const isDarkMode = useIsDarkMode();

  const handleChange = (value: [Date, Date] | null) => {
    if (value && value[0] && value[1]) {
      const start = value[0].toISOString().split('T')[0];
      const end = value[1].toISOString().split('T')[0];
      onStartDateChange(start);
      onEndDateChange(end);
    }
  };

  const currentValue: [Date, Date] = [
    new Date(startDate),
    new Date(endDate),
  ];

  const minDateObj = new Date(minDate);
  const maxDateObj = new Date(maxDate);

  // Define preset ranges
  const ranges = [
    {
      label: '3 days',
      value: (): [Date, Date] => {
        const end = new Date(maxDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 2);
        return start >= minDateObj ? [start, end] : [minDateObj, end];
      },
    },
    {
      label: '7 days',
      value: (): [Date, Date] => {
        const end = new Date(maxDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        return start >= minDateObj ? [start, end] : [minDateObj, end];
      },
    },
    {
      label: '14 days',
      value: (): [Date, Date] => {
        const end = new Date(maxDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 13);
        return start >= minDateObj ? [start, end] : [minDateObj, end];
      },
    },
    {
      label: '28 days',
      value: (): [Date, Date] => {
        const end = new Date(maxDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 27);
        return start >= minDateObj ? [start, end] : [minDateObj, end];
      },
    },
    {
      label: '90 days',
      value: (): [Date, Date] => {
        const end = new Date(maxDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 89);
        return start >= minDateObj ? [start, end] : [minDateObj, end];
      },
    },
  ];

  return (
    <CustomProvider theme={isDarkMode ? 'dark' : 'light'}>
      <div className={styles.pickerContainer}>
        <RSuiteDateRangePicker
          format="dd/MM/yyyy"
          value={currentValue}
          onChange={handleChange}
          ranges={ranges}
          shouldDisableDate={(date) => {
            return date < minDateObj || date > maxDateObj;
          }}
          placeholder="Select date range"
          showOneCalendar={false}
        />
      </div>
    </CustomProvider>
  );
}
